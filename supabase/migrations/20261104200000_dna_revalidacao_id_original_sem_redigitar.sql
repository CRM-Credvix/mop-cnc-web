-- DNA: revalidacao segura a partir da identidade do primeiro lote confirmado.
-- Corrige vinculo de auditoria: revalidacao nunca sobrescreve lote original.
-- Mantem quatro modelos inativos, sem criar nova tarefa ate clique autorizado.
BEGIN;
CREATE OR REPLACE FUNCTION dna_private.dna_web_criar_lote(p_modelo text, p_itens jsonb, p_idempotencia uuid, p_confirmacao text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_admin uuid;v_key text;v_hash text;v_old record;v_lote uuid;v_item jsonb;
 v_cpf text;v_nome text;v_id uuid;v_ord int:=0;v_seen text[]:='{}';v_fp text;
 v_piloto record;v_piloto_ok boolean:=false;v_revalidacao_ok boolean:=false;v_piloto_fp text;
BEGIN
 v_admin:=auth.uid();
 IF v_admin IS NULL OR NOT dna_private.eh_administrador() THEN
  RAISE EXCEPTION 'Acesso DNA negado' USING errcode='42501';END IF;
 IF p_modelo NOT IN ('CONSULTOR_1','CONSULTOR_2','SUPERVISOR_1','SUPERVISOR_2')
  OR p_confirmacao IS DISTINCT FROM ('APLICAR '||p_modelo)
  OR p_idempotencia IS NULL OR p_itens IS NULL OR jsonb_typeof(p_itens)<>'array'
  OR jsonb_array_length(p_itens) NOT BETWEEN 1 AND 50 OR octet_length(p_itens::text)>24000
  THEN RAISE EXCEPTION 'Solicitacao invalida' USING errcode='22023';END IF;
 SELECT chave INTO STRICT v_key FROM dna_private.dna_consulta_chave WHERE id=1;
 v_hash:=encode(extensions.hmac(convert_to(p_modelo||':'||p_itens::text,'UTF8'),decode(v_key,'hex'),'sha256'),'hex');
 SELECT id,payload_hmac INTO v_old FROM public.dna_web_lotes
  WHERE solicitante=v_admin AND idempotencia=p_idempotencia;
 IF FOUND THEN
  IF v_old.payload_hmac<>v_hash THEN
   RAISE EXCEPTION 'Idempotencia conflitante' USING errcode='23505';END IF;
  RETURN v_old.id;
 END IF;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_itens) LOOP
  v_ord:=v_ord+1;
  IF jsonb_typeof(v_item)<>'object' OR (v_item-'cpf'-'nome')<>'{}'::jsonb THEN
   RAISE EXCEPTION 'Campos nao permitidos na linha %',v_ord USING errcode='22023';END IF;
  v_cpf:=regexp_replace(coalesce(v_item->>'cpf',''),'[^0-9]','','g');
  v_nome:=regexp_replace(btrim(coalesce(v_item->>'nome','')),'[[:space:]]+',' ','g');
  IF NOT dna_private.cpf_valido(v_cpf) OR length(v_nome) NOT BETWEEN 5 AND 140
   OR position(' ' IN v_nome)=0 THEN
    RAISE EXCEPTION 'Identidade invalida na linha %',v_ord USING errcode='22023';END IF;
  v_fp:=encode(extensions.hmac(convert_to(v_cpf,'UTF8'),decode(v_key,'hex'),'sha256'),'hex');
  IF v_fp=ANY(v_seen) THEN RAISE EXCEPTION 'CPF repetido' USING errcode='22023';END IF;
  v_seen:=array_append(v_seen,v_fp);
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM public.dna_web_modelos WHERE codigo=p_modelo AND ativo) THEN
  IF p_modelo<>'CONSULTOR_2' OR jsonb_array_length(p_itens)<>1 THEN
   RAISE EXCEPTION 'Modelo ainda nao habilitado' USING errcode='22023';END IF;
  SELECT solicitante,modelo,identidade_hmac,expira_em,consumido_em,lote_id,revalidacao_lote_id INTO v_piloto
   FROM dna_private.dna_web_piloto_unico WHERE id=1 FOR UPDATE;
  IF NOT FOUND OR v_piloto.solicitante IS DISTINCT FROM v_admin
   OR v_piloto.modelo IS DISTINCT FROM p_modelo THEN
   RAISE EXCEPTION 'Solicitacao nao autorizada' USING errcode='42501';END IF;
  IF v_piloto.consumido_em IS NULL THEN
    IF v_piloto.expira_em<=now() THEN
      RAISE EXCEPTION 'Autorizacao piloto expirada' USING errcode='42501';END IF;
    v_piloto_ok:=true;
  ELSIF v_piloto.revalidacao_lote_id IS NULL THEN
    IF NOT EXISTS(
      SELECT 1 FROM public.dna_web_itens prev
      WHERE prev.lote_id=v_piloto.lote_id
      AND prev.estado='confirmado'
      AND prev.resultado->>'resultado'='PADRONIZACAO_CONFIRMADA_EM_NOVA_SESSAO'
      AND prev.resultado->>'verificacao_independente'='true'
      AND prev.resultado->>'diferencas_depois'='0'
      AND prev.resultado->>'gravacao_acionada'='true'
    ) THEN
      RAISE EXCEPTION 'Revalidacao exige padronizacao anterior confirmada' USING errcode='42501';
    END IF;
    v_revalidacao_ok:=true;
  ELSE
    RAISE EXCEPTION 'Revalidacao de uso unico ja solicitada' USING errcode='42501';
  END IF;
  v_item:=p_itens->0;
  v_cpf:=regexp_replace(coalesce(v_item->>'cpf',''),'[^0-9]','','g');
  v_nome:=regexp_replace(btrim(coalesce(v_item->>'nome','')),'[[:space:]]+',' ','g');
  v_piloto_fp:=encode(extensions.hmac(convert_to(v_cpf||':'||lower(v_nome)||':CONSULTOR_2','UTF8'),
   decode(v_key,'hex'),'sha256'),'hex');
  IF v_piloto_fp IS DISTINCT FROM v_piloto.identidade_hmac THEN
   RAISE EXCEPTION 'Colaborador difere da autorizacao do piloto' USING errcode='42501';END IF;
  -- A autorizacao inicial foi consumida no primeiro lote; nao sobrescreve o vinculo.
 END IF;
 INSERT INTO public.dna_web_lotes(solicitante,modelo,total,idempotencia,payload_hmac)
  VALUES(v_admin,p_modelo,jsonb_array_length(p_itens),p_idempotencia,v_hash) RETURNING id INTO v_lote;
 v_ord:=0;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_itens) LOOP
  v_ord:=v_ord+1;
  v_cpf:=regexp_replace(v_item->>'cpf','[^0-9]','','g');
  v_nome:=regexp_replace(btrim(v_item->>'nome'),'[[:space:]]+',' ','g');
  v_fp:=encode(extensions.hmac(convert_to(v_cpf,'UTF8'),decode(v_key,'hex'),'sha256'),'hex');
  INSERT INTO public.dna_web_itens(lote_id,ordem,nome,cpf_final4,cpf_hmac)
   VALUES(v_lote,v_ord,v_nome,right(v_cpf,4),v_fp) RETURNING id INTO v_id;
  INSERT INTO dna_private.dna_web_entradas(item_id,cpf_criptografado)
   VALUES(v_id,extensions.pgp_sym_encrypt(v_cpf,v_key,'cipher-algo=aes256'));
 END LOOP;
 IF v_piloto_ok THEN
  UPDATE dna_private.dna_web_piloto_unico SET consumido_em=now(),lote_id=v_lote WHERE id=1;
 END IF;
 IF v_revalidacao_ok THEN
  UPDATE dna_private.dna_web_piloto_unico SET revalidacao_lote_id=v_lote,revalidacao_em=now() WHERE id=1 AND revalidacao_lote_id IS NULL;
 END IF;
 RETURN v_lote;
END;
$function$
;
CREATE FUNCTION dna_private.dna_web_revalidar_piloto(p_idempotencia uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $reval$
DECLARE
 v_admin uuid:=auth.uid();
 v_piloto record;
 v_old uuid;
 v_nome text;
 v_cpf text;
 v_key text;
 v_lote uuid;
BEGIN
 IF v_admin IS NULL OR NOT dna_private.eh_administrador() THEN
  RAISE EXCEPTION 'Acesso DNA negado' USING errcode='42501';
 END IF;
 IF p_idempotencia IS NULL THEN
  RAISE EXCEPTION 'Idempotencia obrigatoria' USING errcode='22023';
 END IF;
 SELECT solicitante,modelo,lote_id,consumido_em,revalidacao_lote_id
 INTO v_piloto FROM dna_private.dna_web_piloto_unico WHERE id=1 FOR UPDATE;
 IF NOT FOUND OR v_piloto.solicitante IS DISTINCT FROM v_admin
  OR v_piloto.modelo IS DISTINCT FROM 'CONSULTOR_2'
  OR v_piloto.consumido_em IS NULL OR v_piloto.lote_id IS NULL THEN
  RAISE EXCEPTION 'Piloto de revalidacao nao autorizado' USING errcode='42501';
 END IF;
 -- Retentativa idempotente apos resposta de rede perdida: devolve o mesmo lote.
 SELECT id INTO v_old FROM public.dna_web_lotes
  WHERE solicitante=v_admin AND idempotencia=p_idempotencia;
 IF v_old IS NOT NULL THEN
  IF v_piloto.revalidacao_lote_id IS DISTINCT FROM v_old THEN
   RAISE EXCEPTION 'Idempotencia nao pertence a esta revalidacao' USING errcode='23505';
  END IF;
  RETURN v_old;
 END IF;
 IF v_piloto.revalidacao_lote_id IS NOT NULL THEN
  RAISE EXCEPTION 'Revalidacao ja solicitada' USING errcode='42501';
 END IF;
 IF EXISTS(SELECT 1 FROM public.dna_web_modelos WHERE codigo='CONSULTOR_2' AND ativo) THEN
  RAISE EXCEPTION 'Revalidacao restrita exige modelo desativado globalmente' USING errcode='22023';
 END IF;
 IF NOT EXISTS(
  SELECT 1 FROM public.dna_web_itens i
  WHERE i.lote_id=v_piloto.lote_id AND i.estado='confirmado'
   AND i.resultado->>'resultado'='PADRONIZACAO_CONFIRMADA_EM_NOVA_SESSAO'
   AND i.resultado->>'verificacao_independente'='true'
   AND i.resultado->>'gravacao_acionada'='true'
   AND i.resultado->>'diferencas_depois'='0'
 ) THEN
  RAISE EXCEPTION 'Padronizacao original ainda nao confirmada' USING errcode='42501';
 END IF;
 SELECT chave INTO STRICT v_key FROM dna_private.dna_consulta_chave WHERE id=1;
 SELECT extensions.pgp_sym_decrypt(e.cpf_criptografado,v_key),i.nome
 INTO STRICT v_cpf,v_nome
 FROM public.dna_web_itens i
 JOIN dna_private.dna_web_entradas e ON e.item_id=i.id
 WHERE i.lote_id=v_piloto.lote_id;
 -- Somente o mesmo CPF/nome do lote original; nunca recebidos novamente do navegador.
 v_lote:=dna_private.dna_web_criar_lote(
   'CONSULTOR_2',jsonb_build_array(jsonb_build_object('cpf',v_cpf,'nome',v_nome)),
   p_idempotencia,'APLICAR CONSULTOR_2');
 IF NOT EXISTS(
  SELECT 1 FROM dna_private.dna_web_piloto_unico p
  WHERE p.id=1 AND p.lote_id=v_piloto.lote_id
    AND p.revalidacao_lote_id=v_lote AND p.revalidacao_em IS NOT NULL
 ) THEN
  RAISE EXCEPTION 'Vinculo da revalidacao nao confirmado';
 END IF;
 RETURN v_lote;
END;
$reval$;
REVOKE ALL ON FUNCTION dna_private.dna_web_revalidar_piloto(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION dna_private.dna_web_revalidar_piloto(uuid) TO authenticated;
CREATE FUNCTION public.dna_web_revalidar_piloto(p_idempotencia uuid)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path='' AS $wrapper$
 SELECT dna_private.dna_web_revalidar_piloto(p_idempotencia);
$wrapper$;
REVOKE ALL ON FUNCTION public.dna_web_revalidar_piloto(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.dna_web_revalidar_piloto(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
