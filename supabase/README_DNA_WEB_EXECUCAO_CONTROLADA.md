# Integração web DNA — implantação controlada

Status: **estrutura Supabase aplicada em 03/11/2026**, execução web **DESATIVADA** até homologação do agente Windows.

## O que foi feito

- Migração Supabase: `dna_web_execucao_controlada_desativada_20261103`.
- Endurecimento de privilégios: `dna_web_rpc_publica_invoker_20261103`.
- Tabelas `public.dna_web_modelos`, `public.dna_web_lotes`, `public.dna_web_itens`, `dna_private.dna_web_entradas`.
- RPCs `dna_web_criar_lote` (administrador), `dna_web_reservar` e `dna_web_finalizar` (somente service_role).
- `RLS` aplicada às tabelas públicas e à tabela privada.
- Painel web de quatro modelos na página `perfis-dna.html`.

## Regras de segurança

1. **Não ative os modelos** antes de instalar e validar o agente Windows.
2. A fila antiga de consulta permanece separada; nunca usar `dna_consulta_*` para gravação.
3. O worker deve executar o motor local **v5.5.16** com a mesma conta Windows do cofre de credenciais.
4. A troca de família Consultor ↔ Supervisor permanece bloqueada.
5. Uma tarefa pode ser gravada **uma única vez**. Após timeout, apenas uma nova leitura; nunca repetir `Gravar`.
6. Permissões, SSO, situação da conta e identidade devem ser validados no DNA e verificados em nova sessão.
7. A chave secreta Supabase **nunca** deve entrar no GitHub, HTML, logs ou frontend.

## Agente Windows

Instale o pacote local `CREDVIX_DNA_INTEGRACAO_SITE_WORKER_SUPABASE_V1.zip` na raiz do robô homologado.

Execute `INSTALAR_AGENTE_WEB_DNA.bat` e depois `DNA_INICIAR_AGENTE_WEB.bat`.

Na primeira execução, forneça a Secret API Key exclusivamente no computador Windows; ela ficará no Credential Manager. Verifique que a instalação contém os quatro modelos JSON com SHA-256 aprovados pelo operador.

> **Não é possível instalar ou iniciar o agente no PC do operador a partir do GitHub Pages.**

## Etapas de aceite

- [ ] Repositório e interface revisados na branch.
- [ ] Pacote Windows instalado e hash dos modelos conferido.
- [ ] Chave do worker configurada no Windows sem exposição.
- [ ] Conectividade RPC testada sem executar tarefas.
- [ ] Teste ponta a ponta em conta exclusiva de homologação.
- [ ] Verificação independente após escrita: zero diferenças, família e controles globais preservados.
- [ ] Modelo(s) liberados no banco **somente após** aceite operacional.
- [ ] Implantação pública e observabilidade verificadas.

## Auditoria automatizada

O Supabase Security Advisor confirmou a correção do aviso de `SECURITY DEFINER` da nova RPC pública. Permanecem avisos gerais preexistentes do projeto (proteção de senhas vazadas desabilitada e algumas tabelas privadas com RLS sem política intencionalmente inacessíveis por cliente).

Não declare o site pronto para gravar até que os itens acima estejam completos.
