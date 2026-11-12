-- CADASTRO DNA V0.2: proposta transacional, NAO APLICAR em producao sem testes.
-- Integracao separada de dna_web_*; dados sensiveis cifrados na Edge Function.
-- Chaves AES/HMAC jamais sao armazenadas no banco.
begin;

create schema if not exists mop_private;
revoke all on schema mop_private from public, anon, authenticated;
grant usage on schema mop_private to service_role;

create table if not exists public.dna_cadastro_solicitacoes (
 id uuid primary key default gen_random_uuid(),
 solicitante_id uuid not null references auth.users(id),
 idempotencia uuid not null,
 cpf_hmac text not null check(cpf_hmac ~ '^[0-9a-f]{64}$'),
 cpf_final4 text not null check(cpf_final4 ~ '^[0-9]{4}$'),
 lojas text[] not null check(array_length(lojas,1) between 1 and 100),
 perfil text not null check(perfil in ('CONSULTOR','SUPERVISOR')),
 status text not null default 'na_fila'
   check(status in ('na_fila','processando','aguardando_validacao','ativo','erro','revisao')),
 etapa text not null default 'fila',
 motivo_publico text,
 worker text,
 token_reserva uuid,
 reserva_ate timestamptz,
 tentativas smallint not null default 0 check(tentativas between 0 and 3),
 dna_usuario_id text,
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now(),
 unique(solicitante_id,idempotencia)
);
-- Evitar pedidos concorrentes para mesmo CPF, independentemente de solicitante.
create unique index if not exists dna_cadastro_um_pendente_cpf
on public.dna_cadastro_solicitacoes(cpf_hmac)
where status in ('na_fila','processando','aguardando_validacao','revisao');

create table if not exists mop_private.dna_cadastro_payloads (
 solicitacao_id uuid primary key references public.dna_cadastro_solicitacoes(id),
 cifra_base64 text not null check(length(cifra_base64) between 40 and 20000),
 criado_em timestamptz not null default now()
);

create table if not exists public.dna_cadastro_eventos (
 id bigint generated always as identity primary key,
 solicitacao_id uuid not null references public.dna_cadastro_solicitacoes(id),
 tipo text not null check(length(tipo) between 3 and 80),
 detalhe_publico text,
 criado_em timestamptz not null default now()
);

alter table public.dna_cadastro_solicitacoes enable row level security;
alter table public.dna_cadastro_eventos enable row level security;
alter table mop_private.dna_cadastro_payloads enable row level security;

revoke all on public.dna_cadastro_solicitacoes from public, anon, authenticated;
revoke all on public.dna_cadastro_eventos from public, anon, authenticated;
revoke all on mop_private.dna_cadastro_payloads from public, anon, authenticated;
grant select on public.dna_cadastro_solicitacoes to authenticated;
grant select on public.dna_cadastro_eventos to authenticated;
grant all on public.dna_cadastro_solicitacoes to service_role;
grant all on public.dna_cadastro_eventos to service_role;
grant usage,select on sequence public.dna_cadastro_eventos_id_seq to service_role;
grant all on mop_private.dna_cadastro_payloads to service_role;

drop policy if exists dna_cadastro_ver_proprias on public.dna_cadastro_solicitacoes;
create policy dna_cadastro_ver_proprias on public.dna_cadastro_solicitacoes
for select to authenticated using (solicitante_id = (select auth.uid()));

drop policy if exists dna_cadastro_eventos_ver_proprios on public.dna_cadastro_eventos;
create policy dna_cadastro_eventos_ver_proprios on public.dna_cadastro_eventos
for select to authenticated using (
 exists(select 1 from public.dna_cadastro_solicitacoes s
 where s.id=solicitacao_id and s.solicitante_id=(select auth.uid()))
);

-- Ponto unico de criacao, chamado somente pelo service_role no endpoint seguro.
create or replace function public.dna_cadastro_criar(
 p_solicitante uuid, p_idempotencia uuid, p_cpf_hmac text, p_cpf_final4 text,
 p_lojas text[], p_perfil text, p_cifra_base64 text
) returns uuid language plpgsql security invoker set search_path = ''
as $$
declare v_id uuid; v_count integer; v_distinct_count integer;
begin
 if p_solicitante is null or p_idempotencia is null
    or p_cpf_hmac !~ '^[0-9a-f]{64}$' or p_cpf_final4 !~ '^[0-9]{4}$'
    or p_perfil not in ('CONSULTOR','SUPERVISOR')
    or length(p_cifra_base64) not between 40 and 20000
    or coalesce(array_length(p_lojas,1),0) not between 1 and 100 then
   raise exception using errcode='22023',message='PARAMETROS_INVALIDOS';
 end if;
 select count(distinct codigo) into v_count from public.franquias_mop
 where codigo=any(p_lojas) and ativo=true;
 select count(distinct x) into v_distinct_count from unnest(p_lojas) x
 where x ~ '^[0-9]+$';
 if v_count<>array_length(p_lojas,1) or v_distinct_count<>array_length(p_lojas,1) then
   raise exception using errcode='42501',message='LOJA_INVALIDA';
 end if;
 -- NUNCA fazer ON CONFLICT por CPF. Conflito gera revisao/consulta, nao nova inclusao.
 insert into public.dna_cadastro_solicitacoes
 (solicitante_id,idempotencia,cpf_hmac,cpf_final4,lojas,perfil)
 values(p_solicitante,p_idempotencia,p_cpf_hmac,p_cpf_final4,p_lojas,p_perfil)
 on conflict(solicitante_id,idempotencia) do nothing returning id into v_id;
 if v_id is null then
   select id into v_id from public.dna_cadastro_solicitacoes
   where solicitante_id=p_solicitante and idempotencia=p_idempotencia
     and cpf_hmac=p_cpf_hmac and lojas=p_lojas and perfil=p_perfil;
   if v_id is null then
     raise exception using errcode='23505',message='IDEMPOTENCIA_CONFLITANTE';
   end if;
   return v_id;
 end if;
 insert into mop_private.dna_cadastro_payloads(solicitacao_id,cifra_base64)
 values(v_id,p_cifra_base64);
 insert into public.dna_cadastro_eventos(solicitacao_id,tipo,detalhe_publico)
 values(v_id,'criado','Solicitacao recebida; sem cadastro realizado no DNA.');
 return v_id;
end;
$$;

-- Reservar apenas novos itens. NUNCA reassumir processando expirado:
-- apos queda do Windows, escrita pode ter ocorrido e exige conciliacao manual.
create or replace function public.dna_cadastro_reservar(p_worker text)
returns table(id uuid, token uuid, cifra_base64 text, perfil text, lojas text[])
language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_token uuid := gen_random_uuid();
begin
 if length(coalesce(p_worker,'')) not between 3 and 100 then
  raise exception using errcode='22023',message='WORKER_INVALIDO';
 end if;
 select s.id into v_id from public.dna_cadastro_solicitacoes s
 where s.status='na_fila' order by s.criado_em
 for update skip locked limit 1;
 if v_id is null then return; end if;
 update public.dna_cadastro_solicitacoes s set status='processando',
  etapa='reservado',worker=p_worker,token_reserva=v_token,
  reserva_ate=now()+interval '20 minutes',tentativas=s.tentativas+1,
  atualizado_em=now()
 where s.id=v_id;
 insert into public.dna_cadastro_eventos(solicitacao_id,tipo)
 values(v_id,'reservado');
 return query select s.id,v_token,p.cifra_base64,s.perfil,s.lojas
 from public.dna_cadastro_solicitacoes s
 join mop_private.dna_cadastro_payloads p on p.solicitacao_id=s.id
 where s.id=v_id;
end;
$$;

create or replace function public.dna_cadastro_finalizar(
 p_id uuid, p_token uuid, p_status text, p_etapa text, p_motivo_publico text default null
) returns boolean language plpgsql security invoker set search_path='' as $$
declare v_old text;
begin
 if p_status not in ('aguardando_validacao','ativo','erro','revisao')
 or length(coalesce(p_etapa,'')) not between 3 and 80
 or length(coalesce(p_motivo_publico,''))>240 then
   raise exception using errcode='22023',message='FINALIZACAO_INVALIDA';
 end if;
 select status into v_old from public.dna_cadastro_solicitacoes
 where id=p_id and token_reserva=p_token and status='processando' for update;
 if v_old is null then return false; end if;
 update public.dna_cadastro_solicitacoes set
 status=p_status,etapa=p_etapa,motivo_publico=p_motivo_publico,
 atualizado_em=now(),reserva_ate=null,token_reserva=null where id=p_id;
 insert into public.dna_cadastro_eventos(solicitacao_id,tipo,detalhe_publico)
 values(p_id,'finalizado',p_status);
 return true;
end;
$$;

-- O worker nao deve aceitar ATIVO sem verificacao independente do DNA.
-- O banco nao verifica a evidencia; esse gate adicional deve existir no worker
-- e ser testado antes da implantacao.
revoke all on function public.dna_cadastro_criar(uuid,uuid,text,text,text[],text,text) from public,anon,authenticated;
revoke all on function public.dna_cadastro_reservar(text) from public,anon,authenticated;
revoke all on function public.dna_cadastro_finalizar(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.dna_cadastro_criar(uuid,uuid,text,text,text[],text,text) to service_role;
grant execute on function public.dna_cadastro_reservar(text) to service_role;
grant execute on function public.dna_cadastro_finalizar(uuid,uuid,text,text,text) to service_role;

commit;
