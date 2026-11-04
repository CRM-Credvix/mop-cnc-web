-- CREDVIX DNA | Liberacao explicita dos quatro modelos para o administrador.
-- Nao dispara tarefas. A fila permanece protegida, somente admin pode criar lote.
-- O motor Windows continua responsavel pelas restricoes de familia/loja, leitura
-- anterior, gravacao unica, nova sessao e interrupcao em estado incerto.
BEGIN;
DO $checks$
DECLARE
  v_total integer;
  v_pendentes integer;
BEGIN
  LOCK TABLE public.dna_web_modelos IN SHARE ROW EXCLUSIVE MODE;
  SELECT count(*) INTO v_total FROM public.dna_web_modelos
    WHERE codigo IN ('CONSULTOR_1','CONSULTOR_2','SUPERVISOR_1','SUPERVISOR_2');
  IF v_total<>4 OR (SELECT count(*) FROM public.dna_web_modelos)<>4 THEN
    RAISE EXCEPTION 'Catalogo inesperado de modelos DNA: esperado exatamente quatro';
  END IF;
  SELECT count(*) INTO v_pendentes FROM public.dna_web_itens
    WHERE estado IN ('aguardando_worker','em_execucao','revisao','falha_estado_desconhecido');
  IF v_pendentes<>0 THEN
    RAISE EXCEPTION 'Existem solicitacoes pendentes ou em revisao; liberacao interrompida';
  END IF;
  IF has_function_privilege('anon','public.dna_web_criar_lote(text,jsonb,uuid,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.dna_web_reservar(text)','EXECUTE')
     OR has_function_privilege('authenticated','public.dna_web_finalizar(uuid,uuid,text,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'Permissoes de criacao/execucao da fila nao estao protegidas';
  END IF;
  IF (SELECT prosecdef FROM pg_proc
      WHERE oid='public.dna_web_criar_lote(text,jsonb,uuid,text)'::regprocedure) THEN
    RAISE EXCEPTION 'Wrapper publica nao pode ser SECURITY DEFINER';
  END IF;
END
$checks$;
UPDATE public.dna_web_modelos SET ativo=true
 WHERE codigo IN ('CONSULTOR_1','CONSULTOR_2','SUPERVISOR_1','SUPERVISOR_2')
   AND ativo IS DISTINCT FROM true;
DO $verify$
BEGIN
  IF (SELECT count(*) FROM public.dna_web_modelos WHERE ativo)<>4 THEN
    RAISE EXCEPTION 'Falha ao habilitar todos os quatro modelos';
  END IF;
END
$verify$;
COMMIT;
