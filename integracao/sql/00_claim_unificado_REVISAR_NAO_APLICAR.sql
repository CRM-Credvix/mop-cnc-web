-- PREPARACAO / NAO EXECUTAR NO SUPABASE DE PRODUCAO SEM CUTOVER CONTROLADO.
-- Esta rotina e usada SOMENTE pelo worker unificado (service_role).
-- O worker CNC antigo precisa ser parado ANTES de habilitar a nova rotina.
--
-- Mantem as tabelas e as RPCs existentes intactas. Nao reabre pedidos antigos.
-- Ordenacao global: timestamp de criacao; desempate CNC / Multi / id.
-- Requer EXATAMENTE UM worker ativo em toda a infraestrutura para
-- garantir conclusao sequencial (a transacao so protege a reivindicacao).

create or replace function public.claim_next_unificado_mop(p_worker_id text)
returns table (origem text, pedido jsonb)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_origem text;
  v_id bigint;
  v_pedido jsonb;
begin
  if p_worker_id is null or length(btrim(p_worker_id)) < 3 then
    raise exception 'WORKER_ID_INVALIDO';
  end if;

  -- Serializa reivindicacoes feitas POR ESTA FUNCAO; nao bloqueia os
  -- antigos claims CNC/Multi, motivo pelo qual e obrigatorio o cutover.
  if not pg_catalog.pg_try_advisory_xact_lock(20261023, 146) then
    return;
  end if;

  select c.origem, c.id
    into v_origem, v_id
    from (
      select 'cnc'::text as origem, p.id, p.criado_em, 0 as desempate
      from public.pedidos_mop p
      where p.status = 'na_fila'
        and mop_private.pedido_autorizado(p.id)
      union all
      select 'multi'::text, p.id, p.criado_em, 1
      from public.pedidos_extracoes_mop p
      where p.status = 'na_fila'
        and mop_private.extracao_autorizada(p.id)
    ) c
   order by c.criado_em asc, c.desempate asc, c.id asc
   limit 1;

  if v_id is null then
    return;
  end if;

  if v_origem = 'cnc' then
    update public.pedidos_mop p
       set status = 'emitindo',
           iniciado_em = pg_catalog.now(),
           tentativas = p.tentativas + 1,
           worker_id = p_worker_id,
           erro = null
     where p.id = v_id
       and p.status = 'na_fila'
       and mop_private.pedido_autorizado(p.id)
    returning pg_catalog.to_jsonb(p) into v_pedido;
  else
    update public.pedidos_extracoes_mop p
       set status = 'extraindo',
           iniciado_em = pg_catalog.now(),
           tentativas = 1,
           worker_id = p_worker_id
     where p.id = v_id
       and p.status = 'na_fila'
       and mop_private.extracao_autorizada(p.id)
    returning pg_catalog.to_jsonb(p) into v_pedido;
  end if;

  -- Se houver corrida com algum componente legado, falha fechada.
  -- O worker so executa quando a reivindicacao retornar um registro.
  if v_pedido is null then
    return;
  end if;
  return query select v_origem, v_pedido;
end;
$function$;

revoke all on function public.claim_next_unificado_mop(text)
  from public, anon, authenticated;
grant execute on function public.claim_next_unificado_mop(text)
  to service_role;

-- Verificacao manual apos instalacao:
-- select has_function_privilege('anon','public.claim_next_unificado_mop(text)','EXECUTE') as anon,
--        has_function_privilege('authenticated','public.claim_next_unificado_mop(text)','EXECUTE') as authenticated,
--        has_function_privilege('service_role','public.claim_next_unificado_mop(text)','EXECUTE') as worker;
--
-- A rotina de teste acima nao reivindica pedidos. Nao chamar a RPC real
-- ate o worker multi estar pronto, com o executor antigo desligado.
