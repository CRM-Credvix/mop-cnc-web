
-- CREDVIX: DNA - Etapa 1 (schema/fila de diagnostico, sem alteracao no portal DNA)
create schema if not exists dna_private;
revoke all on schema dna_private from public, anon, authenticated;
grant usage on schema dna_private to authenticated, service_role;
create table dna_private.administradores(
 usuario_id uuid primary key references auth.users(id) on delete restrict,
 email text not null unique check (email=lower(btrim(email))),
 criado_em timestamptz not null default now()
);
alter table dna_private.administradores enable row level security;
revoke all on dna_private.administradores from public,anon,authenticated;
insert into dna_private.administradores(usuario_id,email)
 select id,lower(email) from auth.users
 where lower(email)='crm@credvix.com' and email_confirmed_at is not null
 and (banned_until is null or banned_until < now());
do $$ begin
 if (select count(*) from dna_private.administradores)<>1 then
  raise exception 'Conta administrativa nao confirmada; abortar migracao';
 end if;
end $$;
create function dna_private.eh_administrador()
returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce(exists(
  select 1 from dna_private.administradores a
  join auth.users u on u.id=a.usuario_id
  where a.usuario_id=(select auth.uid()) and lower(u.email)=a.email
  and u.email_confirmed_at is not null
  and (u.banned_until is null or u.banned_until<now())
 ),false);
$$;
revoke all on function dna_private.eh_administrador() from public,anon,authenticated;
grant execute on function dna_private.eh_administrador() to authenticated;

create table public.dna_modelos(
 id uuid primary key default gen_random_uuid(),
 perfil text not null check(perfil in ('CONSULTOR','SUPERVISOR')),
 subperfil text not null check(
  (perfil='CONSULTOR' and subperfil='Consultor 2') or
  (perfil='SUPERVISOR' and subperfil='Supervisor 1')),
 versao integer not null check(versao>0),
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
 snapshot_sha256 text not null check(snapshot_sha256 ~ '^[0-9a-f]{64}$'),
 validado_em timestamptz,
 ativo boolean not null default false,
 criado_em timestamptz not null default now(),
 constraint dna_modelo_hash check(snapshot_sha256=encode(sha256(convert_to(snapshot::text,'UTF8')),'hex')),
 constraint dna_modelo_ativacao check(not ativo or (
  validado_em is not null and
  case when jsonb_typeof(snapshot->'permissoes')='array'
   then jsonb_array_length(snapshot->'permissoes')=224 else false end)),
 unique(perfil,versao)
);
create unique index dna_modelos_um_ativo on public.dna_modelos(perfil) where ativo;

create table public.dna_lotes(
 id uuid primary key default gen_random_uuid(),
 solicitante_id uuid not null references auth.users(id) on delete restrict,
 modelo_id uuid not null references public.dna_modelos(id) on delete restrict,
 modelo_snapshot jsonb not null,
 modelo_sha256 text not null check(modelo_sha256 ~ '^[0-9a-f]{64}$'),
 chave_idempotencia uuid not null,
 payload_sha256 text not null check(payload_sha256 ~ '^[0-9a-f]{64}$'),
 modo text not null default 'diagnostico' check(modo='diagnostico'),
 status text not null default 'na_fila'
  check(status in ('na_fila','conferindo','processando','concluido','revisao','erro')),
 trabalhador text,
 token_reserva uuid,
 reserva_ate timestamptz,
 tentativas smallint not null default 0 check(tentativas between 0 and 3),
 criado_em timestamptz not null default now(),
 iniciado_em timestamptz,
 finalizado_em timestamptz,
 atualizado_em timestamptz not null default now(),
 unique(solicitante_id,chave_idempotencia),
 constraint dna_lote_reserva_par check((token_reserva is null)=(reserva_ate is null)),
 constraint dna_lote_hash check(modelo_sha256=encode(sha256(convert_to(modelo_snapshot::text,'UTF8')),'hex'))
);
create index dna_lotes_fila on public.dna_lotes(status,reserva_ate,criado_em)
 where status in ('na_fila','conferindo');
create index dna_lotes_solicitante on public.dna_lotes(solicitante_id,criado_em desc);

create table public.dna_itens(
 id uuid primary key default gen_random_uuid(),
 lote_id uuid not null references public.dna_lotes(id) on delete restrict,
 ordem smallint not null check(ordem between 1 and 50),
 nome_informado text not null check(length(nome_informado) between 5 and 140),
 nome_chave text not null,
 dna_usuario_id text,
 identidade text not null default 'pendente'
  check(identidade in ('pendente','unica','ambigua','nao_encontrada')),
 status text not null default 'na_fila'
  check(status in ('na_fila','conferindo','processando','ja_configurado','concluido','revisao','erro')),
 antes jsonb, depois jsonb, diferencas jsonb,
 verificado_em timestamptz,
 erro_publico text,
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now(),
 unique(lote_id,ordem),
 unique(lote_id,nome_chave),
 unique(id,lote_id),
 constraint dna_item_identificado check(
  status <> 'processando' or (identidade='unica' and dna_usuario_id is not null)),
 constraint dna_item_conferido check(
  status not in ('concluido','ja_configurado') or verificado_em is not null)
);
create index dna_itens_lote_status on public.dna_itens(lote_id,status);
create unique index dna_itens_usuario_lote on public.dna_itens(lote_id,dna_usuario_id)
 where dna_usuario_id is not null;

create table public.dna_eventos(
 id bigint generated always as identity primary key,
 lote_id uuid not null references public.dna_lotes(id) on delete restrict,
 item_id uuid,
 tipo text not null check(length(tipo) between 3 and 80),
 ator text not null check(length(ator) between 3 and 160),
 detalhes jsonb not null default '{}'::jsonb check(jsonb_typeof(detalhes)='object'),
 criado_em timestamptz not null default now(),
 constraint dna_eventos_item_lote foreign key(item_id,lote_id)
  references public.dna_itens(id,lote_id) on delete restrict
);
create index dna_eventos_lote_tempo on public.dna_eventos(lote_id,criado_em,id);
create index dna_eventos_item_tempo on public.dna_eventos(item_id,criado_em)
 where item_id is not null;
create function dna_private.bloquear_eventos()
returns trigger language plpgsql set search_path = '' as $$
 begin raise exception 'Auditoria DNA imutavel: UPDATE e DELETE proibidos'; end;
$$;
create trigger dna_eventos_append_only before update or delete on public.dna_eventos
for each row execute function dna_private.bloquear_eventos();
create function dna_private.proteger_modelos()
returns trigger language plpgsql set search_path = '' as $$
begin
 if tg_op='DELETE' then
  raise exception 'Modelo DNA versionado nao pode ser excluido';
 end if;
 if new.perfil is distinct from old.perfil
  or new.subperfil is distinct from old.subperfil
  or new.versao is distinct from old.versao
  or new.snapshot is distinct from old.snapshot
  or new.snapshot_sha256 is distinct from old.snapshot_sha256 then
   raise exception 'Conteudo de modelo DNA imutavel; crie nova versao';
 end if;
 return new;
end;
$$;
create trigger dna_modelos_versionados before update or delete on public.dna_modelos
for each row execute function dna_private.proteger_modelos();
alter table public.dna_modelos enable row level security;
alter table public.dna_lotes enable row level security;
alter table public.dna_itens enable row level security;
alter table public.dna_eventos enable row level security;
revoke all on table public.dna_modelos,public.dna_lotes,public.dna_itens,public.dna_eventos
 from public,anon,authenticated;
grant select on public.dna_modelos,public.dna_lotes,public.dna_itens,public.dna_eventos
 to authenticated;
grant select on public.dna_modelos to service_role;
grant select,insert,update on public.dna_lotes,public.dna_itens to service_role;
grant select,insert on public.dna_eventos to service_role;
grant usage,select on sequence public.dna_eventos_id_seq to service_role;
create policy dna_modelos_admin_select on public.dna_modelos for select to authenticated
 using((select dna_private.eh_administrador()));
create policy dna_lotes_admin_select on public.dna_lotes for select to authenticated
 using((select dna_private.eh_administrador()));
create policy dna_itens_admin_select on public.dna_itens for select to authenticated
 using((select dna_private.eh_administrador()));
create policy dna_eventos_admin_select on public.dna_eventos for select to authenticated
 using((select dna_private.eh_administrador()));

create function public.dna_criar_lote(p_perfil text,p_nomes text[],p_chave_idempotencia uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
 v_modelo public.dna_modelos%rowtype;
 v_nomes text[];
 v_fingerprint text;
 v_id uuid;
 v_anterior text;
begin
 if (select auth.uid()) is null or not dna_private.eh_administrador() then
  raise exception 'Acesso administrativo DNA negado' using errcode='42501';
 end if;
 if p_perfil not in ('CONSULTOR','SUPERVISOR')
  or p_chave_idempotencia is null or p_nomes is null
  or cardinality(p_nomes) not between 1 and 50 then
   raise exception 'Perfil, chave ou lista invalidos' using errcode='22023';
 end if;
 select array_agg(regexp_replace(btrim(x),'[[:space:]]+',' ','g') order by ord)
 into v_nomes from unnest(p_nomes) with ordinality as t(x,ord);
 if exists(select 1 from unnest(v_nomes) as t(n)
   where n is null or length(n) not between 5 and 140 or position(' ' in n)=0)
  or (select count(*) from unnest(v_nomes)) <>
     (select count(distinct lower(n)) from unnest(v_nomes) as t(n)) then
  raise exception 'Nomes incompletos ou duplicados' using errcode='22023';
 end if;
 select * into v_modelo from public.dna_modelos
 where perfil=p_perfil and ativo and validado_em is not null
 for share;
 if not found then
  raise exception 'Modelo DNA ainda nao homologado; lote nao criado' using errcode='22023';
 end if;
 v_fingerprint:=encode(sha256(convert_to(
  p_perfil||'|'||array_to_string(v_nomes,E'\n'),'UTF8')),'hex');
 insert into public.dna_lotes(solicitante_id,modelo_id,modelo_snapshot,modelo_sha256,
  chave_idempotencia,payload_sha256)
 values(auth.uid(),v_modelo.id,v_modelo.snapshot,v_modelo.snapshot_sha256,
  p_chave_idempotencia,v_fingerprint)
 on conflict(solicitante_id,chave_idempotencia) do nothing returning id into v_id;
 if v_id is null then
  select id,payload_sha256 into v_id,v_anterior from public.dna_lotes
   where solicitante_id=auth.uid() and chave_idempotencia=p_chave_idempotencia;
  if v_anterior is distinct from v_fingerprint then
   raise exception 'Idempotencia reutilizada com conteudo diferente' using errcode='23505';
  end if;
  return v_id;
 end if;
 insert into public.dna_itens(lote_id,ordem,nome_informado,nome_chave)
 select v_id,ord::smallint,n,lower(n)
 from unnest(v_nomes) with ordinality as t(n,ord);
 insert into public.dna_eventos(lote_id,tipo,ator,detalhes)
 values(v_id,'lote_criado','admin:'||auth.uid()::text,
  jsonb_build_object('modo','diagnostico','quantidade',cardinality(v_nomes),'perfil',p_perfil));
 return v_id;
end;
$$;
revoke all on function public.dna_criar_lote(text,text[],uuid) from public,anon,authenticated;
grant execute on function public.dna_criar_lote(text,text[],uuid) to authenticated;

create function public.dna_reivindicar_lote(p_trabalhador text)
returns table(lote_id uuid,token_reserva uuid,modo text)
language plpgsql security invoker set search_path = '' as $$
begin
 if p_trabalhador is null or length(btrim(p_trabalhador)) not between 3 and 100 then
  raise exception 'Trabalhador invalido' using errcode='22023';
 end if;
 return query
 with candidato as (
  select l.id from public.dna_lotes l
  where l.modo='diagnostico' and l.tentativas<3 and
   (l.status='na_fila' or (l.status='conferindo' and l.reserva_ate<now()))
  order by l.criado_em,l.id limit 1 for update skip locked
 ), alterado as (
  update public.dna_lotes l
  set status='conferindo',trabalhador=p_trabalhador,
   token_reserva=gen_random_uuid(),reserva_ate=now()+interval '10 minutes',
   iniciado_em=coalesce(l.iniciado_em,now()),atualizado_em=now(),
   tentativas=l.tentativas+1
  from candidato c where l.id=c.id
  returning l.id,l.token_reserva,l.modo
 )
 select a.id,a.token_reserva,a.modo from alterado a;
end;
$$;
revoke all on function public.dna_reivindicar_lote(text) from public,anon,authenticated;
grant execute on function public.dna_reivindicar_lote(text) to service_role;
comment on table public.dna_lotes is 'Fila DNA restrita a modo diagnostico ate homologacao futura.';
comment on table public.dna_eventos is 'Auditoria append-only com bloqueio de UPDATE/DELETE.';
