# CREDVIX DNA — Homologação do agente web V4 (04/11/2026)

## Estado da implantação

O site usa **somente a fila `dna_web_*`** para solicitações de padronização. O fluxo antigo de conferência foi retirado da interface no PR #47, mas seus dados históricos foram preservados no Supabase.

**O serviço Windows ainda requer a validação local V4 e um teste real autorizado**. Não declare a gravação pela web homologada com base apenas em `CONEXAO_CONFIRMADA`.

## Pacote incremental de Windows

Distribuição: `CREDVIX_DNA_AGENTE_WEB_V4_HOMOLOGACAO_SEGURA.zip` (anexo entregue no ChatGPT).

SHA-256 do ZIP: `7c8b768311db7722732c648007f51f9f7a7d8f184d263d298e880e584ff7e2d3`.

SHA-256 do módulo `v4_payload/dna_web_executor.py`: `aca2f49696544fd61df477d546bba68fc4c127b7105b5e09af5d7f8b3c9f2b1c`.

Instalação permitida **somente** sobre o módulo V3 conhecido (`c2579f71885657d7c5daf0a89365e0a7d83e02a4ad2016f87006013acf3c242a`); caso contrário, falha fechada com backup intacto. O script de instalação não muda o motor, os modelos, o cofre WinVault, o banco de dados ou os arquivos de log preexistentes.

### Como homologar sem reservar tarefas

1. No Windows, feche a janela antiga `DNA_INICIAR_AGENTE_WEB.bat`.
2. Extraia o ZIP na pasta raiz do robô.
3. Execute somente `DNA_ATUALIZAR_E_VALIDAR_AGENTE_V4.bat`.
4. Resultado esperado: `MOTOR_VALIDADO`, `CONEXAO_CONFIRMADA` e `HOMOLOGACAO_TECNICA_V4_APROVADA`.

O teste verifica, sem abrir Edge: hashes do motor v5.5.16, quatro referências JSON, dependências Python, chave do Supabase guardada no Windows e leitura autorizada da tabela `dna_web_modelos`. **Não chama `dna_web_reservar` nem `dna_web_finalizar`**.

### Comportamento do agente V4

- Valida motor e modelos **antes de cada reserva** de tarefa; código adulterado não consome trabalho pendente.
- Uma reserva de fila gera **uma** execução no operador local homologado.
- O status `confirmado` exige retorno de êxito, zero diferenças, gravação acionada e verificação em nova sessão; dados inconsistentes são enviados para revisão.
- O status `ja_conforme` exige retorno de êxito, zero diferenças e nenhuma tentativa de gravação.
- Nenhum erro ou resposta não confiável dispara nova gravação automática.
- Trocas entre Consultor e Supervisor continuam bloqueadas, incluindo limite de um Supervisor por loja.
- A reexecução após resultado final seguro cria **nova solicitação autorizada**, que primeiro compara e só grava se houver divergências; estados incertos ou de revisão impedem novas tarefas simultâneas pelo índice do banco.

## Verificações independentes concluídas

- Dez testes offline para classificação dos resultados, ausência de repetição, rejeição de modelo imprevisto e bloqueio antes da reserva.
- Conferência independente do SHA-256 do operador v5.5.16 do instalador oficial.
- Conferência de privilégios de `dna_web_reservar` e `dna_web_finalizar`: `service_role` autorizado, `authenticated` não autorizado.
- Quatro modelos `ativo=false`; não há fila com tarefas de padronização até a presente verificação.

## Critério para habilitar o botão de padronização

**Ainda pendente:** execução controlada completa em **conta autorizada que não seja cadastrada como conta protegida de homologação**, sempre respeitando as restrições de família e loja. Uma simples leitura do Supabase não atende ao critério. Na execução completa, validar em nova sessão as 224 permissões, subperfil, SSO/controles globais, situação e status de gravação. Registrar o resultado sem CPF nem segredo em texto claro.

Não libere todos os modelos antes de obter evidência técnica suficiente, incluindo comportamento de falhas. Não contorne o bloqueio da conta de homologação nem a regra de Supervisor.

**Nota:** o site e o Supabase não podem instalar ou inspecionar automaticamente os arquivos do Windows do operador. A validação local acima é indispensável.
