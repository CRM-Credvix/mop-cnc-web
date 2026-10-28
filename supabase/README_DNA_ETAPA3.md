# DNA - Etapa 3: auditoria assistida com evidencias, sem execucao automatica

**Seguranca:** os usuarios no DNA nao foram identificados de modo inequivoco.
A evidência v2 registra campos ng-model predefinidos apenas como candidatos,
sem afirmar ser uma identidade unica nem permitir operacoes de escrita.

## Dados
- `dna_inspecoes` (public): RLS + somente leitura para administrador Supabase Auth.
- `dna_registrar_inspecao(jsonb)`: wrapper invoker, exige administrador no servidor.
- Log imutavel: banco recalcula diferenças entre 227 controles e o modelo
  v1 no banco, verifica rotulo/secao/ordem/ocorrencia, hash da evidencia
  calculado no servidor, modelo SHA256, idempotencia por UUID de execucao.
- Nenhum status ou modelo DNA foi ativado. A fila nao realiza operacoes.

## Operação
1. `INICIAR_ROBO_DNA.bat` gera `diagnostico_...json` com v2.
2. Na pagina do MOP-CNC, va para Administracao > Auditoria DNA.
3. Em **Importar diagnosticos visuais**, escolha os arquivos e clique registrar.
4. O browser usa sua sessao Supabase normal; a chave de service_role nao existe
   no frontend, no pacote ou no GitHub.
5. A listagem mostra apenas os ultimos diagnosticos reais com identidade nao
   confirmada. Um mesmo usuario pode ter varias leituras sem confundir id.

## Limitacoes deliberadas
- Os 4 arquivos de diagnostico v1 anteriores nao possuem os estados originais e
  portanto nao podem ser importados como evidencia v2. Necessario recapturar.
- A integracao desta fase e de **auditoria preliminar**, vinculavel futuramente a
  lotes pelo `lote_id`, mas nao habilita automaticamente a fila de tarefas.
- Nao resolvemos ainda os IDs das permissoes duplicadas nem o caminho de busca
  do usuario no DNA. Ambos devem ser homologados antes de qualquer aplicacao.
- RPA roda localmente com operador presente. O navegador deve ter a aba unica do
  DNA em manutencao; nao e um worker autonomo.