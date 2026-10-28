-- DNA consultation queue | read-only, separate from permission-application queue.
-- No CPF plaintext in public tables; browser uses TLS -> private encrypted payload.
create table dna_private.dna_consulta_chave (
 id smallint primary key default 1 check(id=1),
 chave text not null check(length(chave)=64)
);
insert into dna_private.dna_consulta_chave(id,chave)
values (1,encode(extensions.gen_random_bytes(32),'hex'));
revoke all on dna_private.dna_consulta_chave from public,anon,authenticated,service_role;

create table public.dna_consulta_lotes (
 id uuid primary key default gen_random_uuid(),
 administrador_id uuid not null references auth.users(id) on delete restrict,
 perfil text not null check(perfil in ('CONSULTOR','SUPERVISOR')),
 modo text not null default 'diagnostico' check(modo='diagnostico'),
 status text not null default 'aguardando_worker' check(status in ('aguardando_worker','em_consulta','concluido','revisao')),
 total smallint not null check(total between 1 and 50),
 idempotencia uuid not null,
 payload_hash text not null check(payload_hash ~ '^[0-9a-f]{64}$'),
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now(),
 unique(administrador_id,idempotencia)
);
create index dna_consulta_lotes_tempo on public.dna_consulta_lotes(criado_em desc);

create table public.dna_consulta_itens (
 id uuid primary key default gen_random_uuid(),
 lote_id uuid not null references public.dna_consulta_lotes(id) on delete restrict,
 ordem smallint not null check(ordem between 1 and 50),
 nome text not null check(char_length(nome) between 5 and 140),
 cpf_final4 text not null check(cpf_final4 ~ '^[0-9]{4}$'),
 cpf_digest text not null check(cpf_digest ~ '^[0-9a-f]{64}$'),
 login_indicado boolean not null default false,
 status text not null default 'aguardando_worker' check(status in ('aguardando_worker','em_consulta','consulta_confirmada','duplicidade','nao_encontrado','revisao','erro')),
 observacao text,
 tentativa smallint not null default 0 check(tentativa between 0 and 3),
 token_reserva uuid,
 reserva_ate timestamptz,
 trabalhador text,
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now(),
 unique(lote_id,ordem),
 constraint dna_consulta_reserva_par check((token_reserva is null)=(reserva_ate is null))
);
create index dna_consulta_itens_claim on public.dna_consulta_itens(status,reserva_ate,criado_em)
 where status in ('aguardando_worker','em_consulta');
create index dna_consulta_itens_lote on public.dna_consulta_itens(lote_id,ordem);

create table dna_private.dna_consulta_entradas (
 item_id uuid primary key references public.dna_consulta_itens(id) on delete restrict,
 cpf_cifrado bytea not null,
 login_cifrado bytea
);
revoke all on dna_private.dna_consulta_entradas from public,anon,authenticated,service_role;

alter table public.dna_consulta_lotes enable row level security;
alter table public.dna_consulta_itens enable row level security;
revoke all on public.dna_consulta_lotes,public.dna_consulta_itens from public,anon,authenticated;
grant select on public.dna_consulta_lotes,public.dna_consulta_itens to authenticated;
grant select on public.dna_consulta_lotes,public.dna_consulta_itens to service_role;
create policy dna_consulta_lotes_admin on public.dna_consulta_lotes
for select to authenticated using((select dna_private.eh_administrador()));
create policy dna_consulta_itens_admin on public.dna_consulta_itens
for select to authenticated using((select dna_private.eh_administrador()));

create function dna_private.cpf_valido(p_cpf text)
returns boolean language plpgsql immutable set search_path='' as $$
declare d int[]; i int; s int; c1 int; c2 int;
begin
 if p_cpf is null or p_cpf !~ '^[0-9]{11}$' or p_cpf ~ '^([0-9])\1{10}$' then return false; end if;
 d:=array[]::int[];
 for i in 1..11 loop d:=array_append(d,substring(p_cpf,i,1)::int); end loop;
 s:=0;for i in 1..9 loop s:=s+d[i]*(11-i);end loop;
 c1:=((s*10)%11)%10;
 s:=0;for i in 1..10 loop s:=s+d[i]*(12-i);end loop;
 c2:=((s*10)%11)%10;
 return d[10]=c1 and d[11]=c2;
end; $$;
revoke all on function dna_private.cpf_valido(text) from public,anon,authenticated;

create function dna_private.criar_consulta_lote(p_perfil text,p_itens jsonb,p_idempotencia uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_admin uuid; v_key text; v_item jsonb; v_cpf text; v_nome text; v_login text;
 v_hash text; v_existing record; v_id uuid; v_item_id uuid; v_ord int:=0; v_seen text[]:='{}'; v_fprint text;
begin
 v_admin:=auth.uid();
 if v_admin is null or not dna_private.eh_administrador() then raise exception 'Acesso DNA negado' using errcode='42501'; end if;
 if p_perfil not in('CONSULTOR','SUPERVISOR') or p_idempotencia is null or p_itens is null
    or jsonb_typeof(p_itens)<>'array' or jsonb_array_length(p_itens) not between 1 and 50
    or octet_length(p_itens::text)>25000 then raise exception 'Solicitacao invalida' using errcode='22023'; end if;
 select chave into strict v_key from dna_private.dna_consulta_chave where id=1;
 v_hash:=encode(extensions.hmac(convert_to(p_perfil||':'||p_itens::text,'UTF8'),decode(v_key,'hex'),'sha256'),'hex');
 select id,payload_hash into v_existing from public.dna_consulta_lotes where administrador_id=v_admin and idempotencia=p_idempotencia;
 if found then
  if v_existing.payload_hash<>v_hash then raise exception 'Chave de repeticao usada para dados diferentes' using errcode='23505';end if;
  return v_existing.id;
 end if;
 -- Validate every item before first INSERT; fails transaction atomically.
 for v_item in select value from jsonb_array_elements(p_itens) loop
  v_ord:=v_ord+1;
  if jsonb_typeof(v_item)<>'object' or (v_item - 'cpf' - 'nome' - 'login')<>'{}'::jsonb then
   raise exception 'Campos nao permitidos no item %',v_ord using errcode='22023';end if;
  v_cpf:=regexp_replace(coalesce(v_item->>'cpf',''),'[^0-9]','','g');
  v_nome:=regexp_replace(btrim(coalesce(v_item->>'nome','')),'[[:space:]]+',' ','g');
  v_login:=nullif(btrim(coalesce(v_item->>'login','')),'');
  if not dna_private.cpf_valido(v_cpf) or char_length(v_nome) not between 5 and 140
     or position(' ' in v_nome)=0 or (v_login is not null and (length(v_login)>42 or v_login !~ '^[0-9A-Za-z._-]+$')) then
    raise exception 'CPF, nome ou Login invalido no item %',v_ord using errcode='22023';end if;
  v_fprint:=encode(extensions.hmac(convert_to(v_cpf||':'||lower(coalesce(v_login,'')),'UTF8'),decode(v_key,'hex'),'sha256'),'hex');
  if v_fprint=any(v_seen) then raise exception 'CPF e Login repetidos no lote' using errcode='22023';end if;
  v_seen:=array_append(v_seen,v_fprint);
 end loop;
 insert into public.dna_consulta_lotes(administrador_id,perfil,total,idempotencia,payload_hash)
 values(v_admin,p_perfil,jsonb_array_length(p_itens),p_idempotencia,v_hash) returning id into v_id;
 v_ord:=0;
 for v_item in select value from jsonb_array_elements(p_itens) loop
  v_ord:=v_ord+1;
  v_cpf:=regexp_replace(v_item->>'cpf','[^0-9]','','g');
  v_nome:=regexp_replace(btrim(v_item->>'nome'),'[[:space:]]+',' ','g');
  v_login:=nullif(btrim(coalesce(v_item->>'login','')),'');
  v_fprint:=encode(extensions.hmac(convert_to(v_cpf||':'||lower(coalesce(v_login,'')),'UTF8'),decode(v_key,'hex'),'sha256'),'hex');
  insert into public.dna_consulta_itens(lote_id,ordem,nome,cpf_final4,cpf_digest,login_indicado)
   values(v_id,v_ord,v_nome,right(v_cpf,4),v_fprint,v_login is not null) returning id into v_item_id;
  insert into dna_private.dna_consulta_entradas(item_id,cpf_cifrado,login_cifrado)
   values(v_item_id,extensions.pgp_sym_encrypt(v_cpf,v_key,'cipher-algo=aes256'),
          case when v_login is not null then extensions.pgp_sym_encrypt(v_login,v_key,'cipher-algo=aes256') end);
 end loop;
 return v_id;
end; $$;
revoke all on function dna_private.criar_consulta_lote(text,jsonb,uuid) from public,anon,authenticated;
grant execute on function dna_private.criar_consulta_lote(text,jsonb,uuid) to authenticated;
create function public.dna_criar_consulta_lote(p_perfil text,p_itens jsonb,p_idempotencia uuid)
returns uuid language sql security invoker set search_path='' as $$
 select dna_private.criar_consulta_lote(p_perfil,p_itens,p_idempotencia);
$$;
revoke all on function public.dna_criar_consulta_lote(text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.dna_criar_consulta_lote(text,jsonb,uuid) to authenticated;

-- Lease one readonly item: not permission-application queue.
create function dna_private.reservar_consulta(p_worker text)
returns table(item_id uuid,lote_id uuid,cpf text,nome text,login text,perfil text,token uuid)
language plpgsql security definer set search_path='' as $$
declare v_key text;
begin
 if length(btrim(coalesce(p_worker,''))) not between 3 and 90 then
  raise exception 'Worker invalido' using errcode='22023'; end if;
 select chave into strict v_key from dna_private.dna_consulta_chave where id=1;
 return query
 with candidate as(
  select i.id from public.dna_consulta_itens i
  where (i.status='aguardando_worker' or (i.status='em_consulta' and i.reserva_ate<now()))
    and i.tentativa<3 order by i.criado_em,i.id limit 1 for update skip locked
 ), claimed as(
  update public.dna_consulta_itens i
  set status='em_consulta',trabalhador=p_worker,token_reserva=gen_random_uuid(),
  reserva_ate=now()+interval '10 minutes',tentativa=i.tentativa+1,atualizado_em=now()
  from candidate c where i.id=c.id returning i.id,i.lote_id,i.nome,i.token_reserva
 )
 select c.id,c.lote_id,extensions.pgp_sym_decrypt(p.cpf_cifrado,v_key),c.nome,
  case when p.login_cifrado is null then null else extensions.pgp_sym_decrypt(p.login_cifrado,v_key) end,
  l.perfil,c.token_reserva
 from claimed c join dna_private.dna_consulta_entradas p on p.item_id=c.id
 join public.dna_consulta_lotes l on l.id=c.lote_id;
 update public.dna_consulta_lotes l set status='em_consulta',atualizado_em=now()
 where exists(select 1 from public.dna_consulta_itens i where i.lote_id=l.id and i.status='em_consulta')
 and l.status='aguardando_worker';
end; $$;
revoke all on function dna_private.reservar_consulta(text) from public,anon,authenticated,service_role;
grant execute on function dna_private.reservar_consulta(text) to service_role;
create function public.dna_reservar_consulta(p_worker text)
returns table(item_id uuid,lote_id uuid,cpf text,nome text,login text,perfil text,token uuid)
language sql security invoker set search_path='' as $$ select * from dna_private.reservar_consulta(p_worker); $$;
revoke all on function public.dna_reservar_consulta(text) from public,anon,authenticated,service_role;
grant execute on function public.dna_reservar_consulta(text) to service_role;

create function dna_private.finalizar_consulta(p_item uuid,p_token uuid,p_resultado text,p_observacao text default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_lote uuid;
begin
 if p_resultado not in ('consulta_confirmada','duplicidade','nao_encontrado','revisao','erro')
 or length(coalesce(p_observacao,''))>200 then raise exception 'Resultado invalido' using errcode='22023';end if;
 update public.dna_consulta_itens
 set status=p_resultado,observacao=p_observacao,token_reserva=null,reserva_ate=null,atualizado_em=now()
 where id=p_item and token_reserva=p_token and reserva_ate>now() and status='em_consulta'
 returning lote_id into v_lote;
 if v_lote is null then raise exception 'Reserva ausente ou expirada' using errcode='42501';end if;
 update public.dna_consulta_lotes l
 set status=case when exists(select 1 from public.dna_consulta_itens i where i.lote_id=v_lote and i.status in('aguardando_worker','em_consulta'))
 then 'em_consulta' when exists(select 1 from public.dna_consulta_itens i where i.lote_id=v_lote and i.status in('duplicidade','nao_encontrado','revisao','erro'))
 then 'revisao' else 'concluido' end,atualizado_em=now() where l.id=v_lote;
 return true;
end; $$;
revoke all on function dna_private.finalizar_consulta(uuid,uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function dna_private.finalizar_consulta(uuid,uuid,text,text) to service_role;
create function public.dna_finalizar_consulta(p_item uuid,p_token uuid,p_resultado text,p_observacao text default null)
returns boolean language sql security invoker set search_path='' as $$
 select dna_private.finalizar_consulta(p_item,p_token,p_resultado,p_observacao);
$$;
revoke all on function public.dna_finalizar_consulta(uuid,uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function public.dna_finalizar_consulta(uuid,uuid,text,text) to service_role;
comment on table public.dna_consulta_lotes is 'Solicitacoes de conferencia DNA, nao configuracao de permissoes.';
comment on table public.dna_consulta_itens is 'CPF so em payload criptografado privado; leitura publica limitada a admin por RLS.';