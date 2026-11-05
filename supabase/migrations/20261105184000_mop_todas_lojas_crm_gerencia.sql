-- MOP-CNC: opcao "Todas as lojas" restrita a crm@credvix.com e gerencia@credvix.com.
-- Mantem o fluxo existente: cria uma solicitacao normal por loja autorizada.

create or replace function public.enforce_mop_rate_limit()
returns trigger
language plpgsql
set search_path to 'public','pg_catalog'
as $function$
begin
  if current_setting('mop.bulk_all_uid', true) = new.user_id::text
     and (select auth.uid()) = new.user_id
     and lower(coalesce((select auth.jwt()->>'email'), '')) in ('crm@credvix.com','gerencia@credvix.com') then
    return new;
  end if;

  if exists (
    select 1
    from public.pedidos_mop p
    where p.user_id = new.user_id
      and p.criado_em > now() - interval '60 seconds'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'RATE_LIMIT_MOP';
  end if;

  return new;
end;
$function$;

create or replace function public.criar_pedidos_todas_lojas_mop(p_whatsapp text)
returns jsonb
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(coalesce((select auth.jwt()->>'email'), ''));
  v_total integer := 0;
  v_criados integer := 0;
begin
  if v_uid is null then
    raise exception using errcode='42501', message='ACESSO_NEGADO';
  end if;

  if v_email not in ('crm@credvix.com','gerencia@credvix.com') then
    raise exception using errcode='42501', message='ACESSO_NEGADO_TODAS_LOJAS';
  end if;

  if p_whatsapp is null or p_whatsapp !~ '^55[0-9]{10,11}$' then
    raise exception using errcode='22023', message='WHATSAPP_INVALIDO';
  end if;

  select count(*)
    into v_total
  from public.franquias_mop;

  if v_total = 0 then
    raise exception using errcode='42501', message='SEM_LOJAS_AUTORIZADAS';
  end if;

  perform set_config('mop.bulk_all_uid', v_uid::text, true);

  with inseridos as (
    insert into public.pedidos_mop (
      user_id,
      franquia_codigo,
      franquia_nome,
      whatsapp
    )
    select
      v_uid,
      f.codigo,
      f.nome,
      p_whatsapp
    from public.franquias_mop f
    order by f.codigo
    on conflict do nothing
    returning id
  )
  select count(*) into v_criados from inseridos;

  return jsonb_build_object(
    'criados', v_criados,
    'ignorados', greatest(v_total - v_criados, 0),
    'total_autorizadas', v_total
  );
end;
$function$;

revoke all on function public.criar_pedidos_todas_lojas_mop(text) from public;
revoke all on function public.criar_pedidos_todas_lojas_mop(text) from anon;
grant execute on function public.criar_pedidos_todas_lojas_mop(text) to authenticated;
