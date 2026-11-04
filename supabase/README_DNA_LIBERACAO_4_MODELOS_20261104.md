# CREDVIX DNA | Liberação dos quatro modelos de padronização — 04/11/2026

Os quatro modelos foram habilitados no Supabase por solicitação expressa do administrador:
`CONSULTOR_1`, `CONSULTOR_2`, `SUPERVISOR_1`, `SUPERVISOR_2`.

## Estado operacional

- A interface permite selecionar modelo, digitar CPF e nome, e clicar **Solicitar padronização**. Não há frase manual `APLICAR ...`.
- O frontend chama a RPC `dna_web_criar_lote`, com validação de identidade, CPF e proteção de idempotência.
- A fila só pode ser criada por usuário autenticado com permissão administrativa, e tarefas só podem ser reservadas/finalizadas pelo agente Windows autorizado.
- A gravação única, verificação em nova sessão e impedimento de mudança Consultor↔Supervisor são regras do motor local v5.5.16/V4, não da interface.
- Lotes com estado incerto ou em revisão não devem ser automaticamente reexecutados.
- Para processamento, o operador deve iniciar `DNA_INICIAR_AGENTE_WEB.bat` e manter o agente ativo.

## Evidência verificada após habilitação

Quatro registros `dna_web_modelos.ativo=true`; zero tarefas pendentes na hora da liberação; já havia uma tarefa `confirmado` e uma `ja_conforme`.

## Ressalva de homologação

**Somente Consultor 2** possui confirmação ponta a ponta por lote web e revalidação sem gravar. As outras três referências foram homologadas localmente, mas ainda precisam de execução supervisionada por modelo antes de operação em escala. Não declarar toda a família aprovada para processamento em massa baseado apenas neste toggle.

O toggle de banco não modifica arquivos no Windows nem aciona tarefas sozinho.

## Reversão operacional

Na necessidade de suspensão, desativar todos os quatro registros usando migração transacional auditável. Isso impede **novos lotes**, mas não cancela automaticamente um lote já reservado pelo worker. Conferir a fila antes de desligar o agente.
