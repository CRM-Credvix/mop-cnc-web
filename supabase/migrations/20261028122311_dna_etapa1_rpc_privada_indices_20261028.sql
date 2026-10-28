
-- Endurecimento da API DNA e indices (somente objetos novos deste modulo).
create function dna_private.criar_lote(
 p_perfil text,p_nomes text[],p_chave_idempotencia uuid
) returns uuid language plpgsql security definer set search_path = '' as $$
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
revoke all on function dna_private.criar_lote(text,text[],uuid)
 from public,anon,authenticated;
grant execute on function dna_private.criar_lote(text,text[],uuid) to authenticated;

create or replace function public.dna_criar_lote(
 p_perfil text,p_nomes text[],p_chave_idempotencia uuid
) returns uuid language sql security invoker set search_path = '' as $$
 select dna_private.criar_lote(p_perfil,p_nomes,p_chave_idempotencia);
$$;
revoke all on function public.dna_criar_lote(text,text[],uuid)
 from public,anon,authenticated;
grant execute on function public.dna_criar_lote(text,text[],uuid) to authenticated;
create index dna_lotes_modelo_fk on public.dna_lotes(modelo_id);
create index dna_eventos_item_lote_fk on public.dna_eventos(item_id,lote_id);
