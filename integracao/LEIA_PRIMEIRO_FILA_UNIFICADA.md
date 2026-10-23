# Worker único CNC + MultiExtrações — preparação para implantação

**Status:** proposta em branch, sem implantação. Não substituir o CNC atual agora.

## Objetivo

Ao receber pedidos em `pedidos_mop` (CNC) ou `pedidos_extracoes_mop` (Multi), o
único worker ativo reivindica o mais antigo entre ambas as tabelas. O worker
aguarda o término do pedido anterior antes de reivindicar o seguinte.

Desempate em timestamps idênticos: CNC antes de Multi, seguido do ID.
Para FIFO absolutamente auditável em empates simultâneos, adicionar um
sequenciador global na migração futura.

## Preservação e segurança

- O CNC legado `worker/worker_mop.py`, `run_worker.bat`, tabelas e RPCs
  antigos permanecem inalterados.
- `worker_unificado.py` **não executa nada** sem `--execute` e
  `ENABLE_UNIFIED_WORKER=SIM`.
- Mesmo ativo, ele não é seguro para dois computadores simultaneamente:
  o bloqueio de processo vale apenas para uma máquina. A RPC usa bloqueio
  transacional para claims, mas isso não impede extrações simultâneas após
  o claim em máquinas diferentes.
- Nunca executar o antigo `worker_mop.py` e `worker_unificado.py`
  simultaneamente. A ordem global seria quebrada.
- Nenhum pedido é recuperado/reprocessado automaticamente após falha.
  Pedidos já em `emitindo`/`extraindo` exigem reconciliação manual.

## Arquivos preparados, ainda não instalados

- `integracao/sql/00_claim_unificado_REVISAR_NAO_APLICAR.sql`:
  claim atômico em uma das duas tabelas, com grants apenas para service_role.
- `integracao/sql/01_storage_multi_REVISAR_NAO_APLICAR.sql`:
  arquivos de MultiExtrações, RLS e política de leitura do Storage privado.
- `worker/worker_unificado.py`: dispatcher único, CNC legado e Multi,
  controle de execução e validação antes da publicação.
- `worker/.env.unificado.example`: parâmetros, sem credenciais.
- `worker/PREFLIGHT_UNIFICADO_SEM_EXECUCAO.bat`: verifica arquivos
  e variáveis localmente, sem consultar filas.

## Contrato necessário do extrator MultiExtrações

`RUN_MULTI_PATH` deve apontar para um Python **real** e já testado que aceite:

```text
--pedido-id <int> --franquia <codigo> --produto <codigo>
--diretorio-saida <pasta> --resultado-json <caminho>
```

Ele deve produzir `arquivo.xlsx` dentro da pasta fornecida e escrever
`resultado.json` UTF-8 com:

```json
{
  "pedido_id": 123,
  "franquia_codigo": "51545",
  "produto": "FGTS",
  "registros": 20,
  "arquivo": "arquivo.xlsx"
}
```

O worker validará correspondência do pedido, produto, franquia, arquivo
XLSX legível, tamanho máximo e contagem positiva, fará upload privado,
gravará metadados, então finalizará o pedido em `validado`.

**Adaptador preparado:** `worker/run_multiextracoes_adapter.py` chama o
`diagnostico_local.py` já existente (`--tipo/--loja`), exige o marcador
`DIAGNOSTICO_VALIDADO`, valida o XLSX local recém-criado em `runtime/samples`,
copia-o para a pasta do pedido e escreve o JSON do contrato. Configurar
`DIAGNOSTICO_LOCAL_PATH`, `PYTHON_MULTI_EXE` e, se necessário,
`DIAGNOSTICO_SAMPLES_DIR`. Isso ainda precisa ser ensaiado no Windows com
a configuração dos sete produtos e permissão real no Power BI.

**A v0.1.46 entregue é EXCLUSIVAMENTE OFFLINE.** Seus sete arquivos
sintéticos não constituem implementação desse extrator real. Sem a configuração do caminho para o diagnóstico operacional, o preflight do novo worker não garante capacidade real e nenhum processamento deve ser habilitado.

## Cutover controlado (ainda NÃO executar)

1. Obter cópia/backup da instalação atual e confirmar o caminho de
   `run_mop.py` CNC e do extrator Multi real.
2. Homologar o extrator Multi e publicação privada dos XLSX com dados
   autorizados, fora da produção.
3. Revisar/aplicar SQL, conferir grants (anon/authenticated sem EXECUTE),
   políticas RLS, arquivos privados e validação por usuário/franquia.
4. Encerrar o worker CNC antigo e qualquer worker Multi independente;
   garantir um único Windows executor.
5. Preflight com ENABLE_UNIFIED_WORKER=NAO; conferir fila sem executar.
6. Liberar **explicitamente** ENABLE_UNIFIED_WORKER=SIM, fazer
   um teste `--execute --once` autorizado e supervisionado.
7. Se aprovado, iniciar modo `--execute --loop` pelo mesmo executor,
   sem iniciar o worker CNC legado; verificar logs/status/histórico.
8. Em falhas, encerrar o unificado e reconciliar pedidos em andamento.
   Só então avaliar retorno controlado do legado, nunca em paralelo.

**Não foi executado nenhum destes passos em ambiente real.**
