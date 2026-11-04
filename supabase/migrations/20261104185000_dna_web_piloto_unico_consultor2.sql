-- CREDVIX DNA: autorizacao irrepetivel de UMA pessoa, Consultor 2.
-- Os quatro modelos permanecem ativo=false. CPF e nome nao sao gravados em claro.
BEGIN;
CREATE TABLE dna_private.dna_web_piloto_unico (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  solicitante uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  modelo text NOT NULL CHECK (modelo = 'CONSULTOR_2'),
  identidade_hmac text NOT NULL CHECK (identidade_hmac ~ '^[0-9a-f]{64}$'),
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL CHECK (expira_em <= criado_em + interval '30 minutes'),
  consumido_em timestamptz,
  lote_id uuid UNIQUE REFERENCES public.dna_web_lotes(id) ON DELETE RESTRICT,
  CONSTRAINT dna_web_piloto_consumo_coerente CHECK ((consumido_em IS NULL) = (lote_id IS NULL))
);
REVOKE ALL ON dna_private.dna_web_piloto_unico FROM PUBLIC, anon, authenticated, service_role;
COMMENT ON TABLE dna_private.dna_web_piloto_unico IS 'Piloto imutavel, uma identidade HMAC e uma unica solicitacao. Nao possui CPF completo em claro.';

CREATE FUNCTION dna_private.dna_web_autorizar_piloto(p_cpf text,p_nome text,p_confirmacao text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $piloto$
DECLARE
  v_admin uuid:=auth.uid();
  v_nome text:=regexp_replace(btrim(coalesce(p_nome,'')),'[[:space:]]+',' ','g');
  v_cpf text:=regexp_replace(coalesce(p_cpf,''),'[^0-9]','','g');
  v_key text;v_fp text;v_id smallint;
BEGIN
  IF v_admin IS NULL OR NOT dna_private.eh_administrador() THEN
    RAISE EXCEPTION 'Administrador nao autorizado' USING errcode='42501';
  END IF;
  IF p_confirmacao IS DISTINCT FROM 'AUTORIZAR PILOTO CONSULTOR_2'
    OR NOT dna_private.cpf_valido(v_cpf)
    OR length(v_nome) NOT BETWEEN 5 AND 140 OR position(' ' IN v_nome)=0 THEN
    RAISE EXCEPTION 'Autorizacao piloto invalida' USING errcode='22023';
  END IF;
  IF EXISTS(SELECT 1 FROM public.dna_web_modelos WHERE codigo='CONSULTOR_2' AND ativo) THEN
    RAISE EXCEPTION 'Piloto exige modelo desativado no acesso geral' USING errcode='22023';
  END IF;
  SELECT chave INTO STRICT v_key FROM dna_private.dna_consulta_chave WHERE id=1;
  v_fp:=encode(extensions.hmac(convert_to(v_cpf||':'||lower(v_nome)||':CONSULTOR_2','UTF8'),
    decode(v_key,'hex'),'sha256'),'hex');
  INSERT INTO dna_private.dna_web_piloto_unico
    (id,solicitante,modelo,identidade_hmac,expira_em)
    VALUES(1,v_admin,'CONSULTOR_2',v_fp,now()+interval '30 minutes')
    ON CONFLICT(id) DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Piloto unico ja preparado ou consumido; nao reemitir' USING errcode='23505';
  END IF;
  RETURN jsonb_build_object('preparado',true,'modelo','CONSULTOR_2',
    'uso_unico',true,'prazo_minutos',30);
END;
$piloto$;
REVOKE ALL ON FUNCTION dna_private.dna_web_autorizar_piloto(text,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION dna_private.dna_web_autorizar_piloto(text,text,text) TO authenticated;

CREATE FUNCTION public.dna_web_autorizar_piloto(p_cpf text,p_nome text,p_confirmacao text)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $wrapper$
 SELECT dna_private.dna_web_autorizar_piloto(p_cpf,p_nome,p_confirmacao);
$wrapper$;
REVOKE ALL ON FUNCTION public.dna_web_autorizar_piloto(text,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.dna_web_autorizar_piloto(text,text,text) TO authenticated;

CREATE FUNCTION dna_private.dna_web_status_piloto()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $status$
DECLARE v_admin uuid:=auth.uid();v_row record;
BEGIN
  IF v_admin IS NULL OR NOT dna_private.eh_administrador() THEN
    RAISE EXCEPTION 'Acesso DNA negado' USING errcode='42501';
  END IF;
  SELECT solicitante,expira_em,consumido_em INTO v_row
    FROM dna_private.dna_web_piloto_unico WHERE id=1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('pode_preparar',true,'pode_enviar',false,
      'modelo','CONSULTOR_2','estado','nao_preparado');
  END IF;
  RETURN jsonb_build_object('pode_preparar',false,
    'pode_enviar',(v_row.solicitante=v_admin AND v_row.consumido_em IS NULL AND v_row.expira_em>now()),
    'modelo','CONSULTOR_2',
    'estado',CASE WHEN v_row.consumido_em IS NOT NULL THEN 'consumido'
      WHEN v_row.expira_em<=now() THEN 'expirado' ELSE 'preparado' END,
    'expira_em',v_row.expira_em);
END;
$status$;
REVOKE ALL ON FUNCTION dna_private.dna_web_status_piloto() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION dna_private.dna_web_status_piloto() TO authenticated;

CREATE FUNCTION public.dna_web_status_piloto()
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $wrapper$
 SELECT dna_private.dna_web_status_piloto();
$wrapper$;
REVOKE ALL ON FUNCTION public.dna_web_status_piloto() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.dna_web_status_piloto() TO authenticated;

-- A RPC publica dna_web_criar_lote continua SECURITY INVOKER.
-- Substitui SOMENTE a implementacao privada para exigir consumo atomico do piloto.
CREATE OR REPLACE FUNCTION dna_private.dna_web_criar_lote(
  p_modelo text,p_itens jsonb,p_idempotencia uuid,p_confirmacao text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $lote$
DECLARE
 v_admin uuid;v_key text;v_hash text;v_old record;v_lote uuid;v_item jsonb;
 v_cpf text;v_nome text;v_id uuid;v_ord int:=0;v_seen text[]:='{}';v_fp text;
 v_piloto record;v_piloto_ok boolean:=false;v_piloto_fp text;
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
  SELECT solicitante,modelo,identidade_hmac,expira_em,consumido_em INTO v_piloto
   FROM dna_private.dna_web_piloto_unico WHERE id=1 FOR UPDATE;
  IF NOT FOUND OR v_piloto.solicitante IS DISTINCT FROM v_admin
   OR v_piloto.modelo IS DISTINCT FROM p_modelo
   OR v_piloto.consumido_em IS NOT NULL OR v_piloto.expira_em<=now() THEN
   RAISE EXCEPTION 'Autorizacao piloto inexistente, vencida ou consumida' USING errcode='42501';END IF;
  v_item:=p_itens->0;
  v_cpf:=regexp_replace(coalesce(v_item->>'cpf',''),'[^0-9]','','g');
  v_nome:=regexp_replace(btrim(coalesce(v_item->>'nome','')),'[[:space:]]+',' ','g');
  v_piloto_fp:=encode(extensions.hmac(convert_to(v_cpf||':'||lower(v_nome)||':CONSULTOR_2','UTF8'),
   decode(v_key,'hex'),'sha256'),'hex');
  IF v_piloto_fp IS DISTINCT FROM v_piloto.identidade_hmac THEN
   RAISE EXCEPTION 'Colaborador difere da autorizacao do piloto' USING errcode='42501';END IF;
  v_piloto_ok:=true;
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
 RETURN v_lote;
END;
$lote$;
REVOKE ALL ON FUNCTION dna_private.dna_web_criar_lote(text,jsonb,uuid,text) FROM PUBLIC,anon;
NOTIFY pgrst, 'reload schema';
COMMIT;
