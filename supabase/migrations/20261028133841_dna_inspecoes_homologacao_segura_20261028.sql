-- CREDVIX DNA / diagnosticos assistidos somente leitura
-- Nenhum job ativado; nenhum modelo preliminar homologado.
create table public.dna_inspecoes (
 id uuid primary key,
 administrador_id uuid not null references auth.users(id) on delete restrict,
 modelo_id uuid not null references public.dna_modelos(id) on delete restrict,
 perfil text not null check (perfil in ('CONSULTOR','SUPERVISOR')),
 referencia_versao integer not null check (referencia_versao > 0),
 capturado_em timestamptz not null,
 importado_em timestamptz not null default now(),
 controle_total smallint not null default 227 check (controle_total=227),
 divergencias_total smallint not null check (divergencias_total between 0 and 227),
 resultado text not null check (resultado in ('conforme_visual','divergencias_visuais')),
 identidade_status text not null default 'nao_verificada' check (identidade_status='nao_verificada'),
 identidade_evidencia jsonb not null default '{}'::jsonb check (jsonb_typeof(identidade_evidencia)='object'),
 captura_sha256 text not null check (captura_sha256 ~ '^[0-9a-f]{64}$'),
 evidencia_controles jsonb not null check (jsonb_typeof(evidencia_controles)='array' and jsonb_array_length(evidencia_controles)=227),
 divergencias jsonb not null default '[]'::jsonb check (jsonb_typeof(divergencias)='array'),
 lote_id uuid references public.dna_lotes(id) on delete restrict,
 constraint dna_inspecoes_contagem check (divergencias_total=jsonb_array_length(divergencias)),
 constraint dna_inspecoes_resultado check ((divergencias_total=0)=(resultado='conforme_visual'))
);
create index dna_inspecoes_admin_tempo on public.dna_inspecoes(administrador_id,importado_em desc);
create index dna_inspecoes_modelo on public.dna_inspecoes(modelo_id,importado_em desc);
create index dna_inspecoes_lote on public.dna_inspecoes(lote_id) where lote_id is not null;
alter table public.dna_inspecoes enable row level security;
revoke all on public.dna_inspecoes from public,anon,authenticated;
grant select on public.dna_inspecoes to authenticated;
grant select,insert on public.dna_inspecoes to service_role;
create policy dna_inspecoes_admin_select on public.dna_inspecoes
 for select to authenticated using ((select dna_private.eh_administrador()));
create trigger dna_inspecoes_imutaveis before update or delete on public.dna_inspecoes
 for each row execute function dna_private.bloquear_eventos();

create function dna_private.registrar_inspecao(p_relatorio jsonb)
 returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_admin uuid;
 v_modelo public.dna_modelos%rowtype;
 v_id uuid;
 v_perfil text;
 v_expected jsonb;
 v_controls jsonb;
 v_actual jsonb;
 v_ref jsonb;
 v_diffs jsonb := '[]'::jsonb;
 v_hash text;
 v_qtd integer;
 v_i integer;
 v_campo text;
 v_tempo timestamptz;
 v_identity jsonb;
begin
 v_admin := auth.uid();
 if v_admin is null or not dna_private.eh_administrador() then
  raise exception 'Acesso DNA negado' using errcode='42501';
 end if;
 if p_relatorio is null or jsonb_typeof(p_relatorio)<>'object'
    or octet_length(p_relatorio::text)>180000 then
  raise exception 'Relatorio ausente ou excessivo' using errcode='22023';
 end if;
 if p_relatorio->>'versao_relatorio'<>'2'
    or p_relatorio->>'gravou_no_dna'<>'false'
    or p_relatorio->>'origem_leitura'<>'edge_cdp_somente_leitura' then
  raise exception 'Relatorio nao e captura DNA v2 somente leitura' using errcode='22023';
 end if;
 v_perfil:=p_relatorio->>'perfil';
 if v_perfil is null or v_perfil not in ('CONSULTOR','SUPERVISOR') then
  raise exception 'Perfil invalido' using errcode='22023';
 end if;
 select * into v_modelo from public.dna_modelos
  where perfil=v_perfil and versao=1;
 if not found then raise exception 'Modelo de referencia nao encontrado'; end if;
 if p_relatorio->>'modelo_sha256' is distinct from v_modelo.snapshot_sha256 then
  raise exception 'Hash do modelo nao confere com o banco' using errcode='22023';
 end if;
 if jsonb_typeof(p_relatorio->'controles_evidencia') <> 'array'
   or jsonb_array_length(p_relatorio->'controles_evidencia') <> 227 then
  raise exception 'Evidencia de 227 controles obrigatoria' using errcode='22023';
 end if;
 v_controls:=p_relatorio->'controles_evidencia';
 select jsonb_agg(x order by (x->>'ordem_dom')::integer) into v_expected
 from (
  select value as x from jsonb_array_elements(v_modelo.snapshot->'permissoes')
  union all
  select value as x from jsonb_array_elements(v_modelo.snapshot->'controle_sso_e_globais')
 ) q;
 if jsonb_array_length(v_expected)<>227 then raise exception 'Modelo incompleto'; end if;
 for v_i in 0..226 loop
  v_ref:=v_expected->v_i; v_actual:=v_controls->v_i;
  if jsonb_typeof(v_actual)<>'object' or jsonb_typeof(v_actual->'marcado')<>'boolean' then
   raise exception 'Controle ausente ou sem marcado na posicao %',v_i+1;
  end if;
  foreach v_campo in array array['ordem_dom','secao','subsecao','rotulo','ocorrencia','ng_model'] loop
   if v_actual->v_campo is distinct from v_ref->v_campo then
    raise exception 'Identidade do controle diferente em posicao %, campo %',v_i+1,v_campo;
   end if;
  end loop;
  if (v_actual->'marcado') is distinct from (v_ref->'marcado') then
   v_diffs:=v_diffs||jsonb_build_array(jsonb_build_object(
    'ordem_dom',v_ref->'ordem_dom','rotulo',v_ref->'rotulo',
    'esperado',v_ref->'marcado','atual',v_actual->'marcado'));
  end if;
 end loop;
 v_qtd:=jsonb_array_length(v_diffs);
 v_hash:=encode(sha256(convert_to(v_controls::text,'UTF8')),'hex');
 v_identity:=coalesce(p_relatorio->'identidade_evidencia','{}'::jsonb);
 if jsonb_typeof(v_identity)<>'object' or octet_length(v_identity::text)>4096
   or coalesce(v_identity->>'status','')<>'nao_verificada' then
  raise exception 'Identidade deve permanecer nao verificada ate homologacao' using errcode='22023';
 end if;
 v_tempo:=(p_relatorio->>'capturado_em')::timestamptz;
 if v_tempo is null or v_tempo<now()-interval '30 days'
  or v_tempo>now()+interval '10 minutes' then
  raise exception 'Data da captura fora da janela' using errcode='22023';
 end if;
 v_id:=(p_relatorio->>'id_relatorio')::uuid;
 if v_id is null then raise exception 'ID do relatorio ausente' using errcode='22023'; end if;
 insert into public.dna_inspecoes(
  id,administrador_id,modelo_id,perfil,referencia_versao,capturado_em,
  divergencias_total,resultado,identidade_evidencia,captura_sha256,
  evidencia_controles,divergencias)
 values(v_id,v_admin,v_modelo.id,v_perfil,1,v_tempo,
  v_qtd,case when v_qtd=0 then 'conforme_visual' else 'divergencias_visuais' end,
  v_identity,v_hash,v_controls,v_diffs)
 on conflict(id) do nothing;
 if not found then
  if not exists(select 1 from public.dna_inspecoes
    where id=v_id and administrador_id=v_admin and captura_sha256=v_hash
      and perfil=v_perfil and modelo_id=v_modelo.id) then
   raise exception 'ID de relatorio reutilizado com outra evidencia' using errcode='23505';
  end if;
 end if;
 return v_id;
end;
$$;
revoke all on function dna_private.registrar_inspecao(jsonb) from public,anon,authenticated;
grant execute on function dna_private.registrar_inspecao(jsonb) to authenticated;
create function public.dna_registrar_inspecao(p_relatorio jsonb)
 returns uuid language sql security invoker set search_path='' as $$
 select dna_private.registrar_inspecao(p_relatorio);
$$;
revoke all on function public.dna_registrar_inspecao(jsonb) from public,anon,authenticated;
grant execute on function public.dna_registrar_inspecao(jsonb) to authenticated;
comment on table public.dna_inspecoes is 'Evidencias de diagnosticos visuais, sem confirmacao de identidade e sem gravacao de permissoes DNA.';