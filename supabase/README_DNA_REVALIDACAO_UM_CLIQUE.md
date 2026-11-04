# CREDVIX DNA | Revalidação Consultor 2 com um clique

## Comportamento visível

- O operador escolhe **Consultor 2**, informa **CPF; Nome completo** do mesmo colaborador do piloto concluído e clica **Solicitar padronização**.
- **Não existem campos para digitar `APLICAR CONSULTOR_2` ou `AUTORIZAR PILOTO CONSULTOR_2`.** A chamada atual da RPC ainda recebe `p_confirmacao` preenchido pelo próprio código para compatibilidade; isso não é um segundo fator de autorização nem concede acesso.
- O botão somente habilita quando houver exatamente **um CPF e nome válidos** e a RPC indicar uma revalidação permitida.
- A revalidação é **de uso único**. Não habilita Consultor 2 para outros colaboradores nem liga qualquer modelo globalmente.
- Após o envio, acompanhar o lote no menu Acompanhamento DNA; não reenviar manualmente se ocorrer timeout de rede.

## Regras do servidor

- Administrador autenticado obrigatório nas RPCs; navegador sem permissão para reservar/finalizar tarefas.
- O CPF e nome são verificados contra o HMAC do piloto anterior **já confirmado em nova sessão** e com zero divergências.
- O backend exige exatamente um registro, modelo `CONSULTOR_2`, evita lote duplicado por CPF pendente e usa reserva transacional `FOR UPDATE`.
- Somente uma revalidação é permitida e sua criação consome a autorização atômica; uma segunda tentativa com novo UUID é recusada.
- Um reenvio com a mesma chave de idempotência devolve o lote original, não grava outro.
- Os quatro modelos continuam `ativo=false`. Não é uma liberação de produção em massa.

## Segurança e verificação

Testes em transação revertida com dados fictícios: status correto, outro modelo recusado, solicitação aceita uma vez, replay idempotente e segunda solicitação bloqueada; nenhuma tarefa persistiu após o teste.

## Como homologar

1. Abra `DNA_INICIAR_AGENTE_WEB.bat` no computador Windows e mantenha a janela aberta.
2. No site, informe o **mesmo CPF e nome exatos** do colaborador do primeiro piloto.
3. Clique **Solicitar padronização** apenas uma vez.
4. O resultado esperado, se não houver novas divergências, é `ja_conforme` / `JA_PADRONIZADO_SEM_GRAVAR`. O robô não pode clicar em Gravar.
5. Se o resultado indicar divergências, a execução pode modificar permissões: **não repetir automaticamente** e investigar a causa.
6. Só após evidenciar o cenário `ja_conforme` sem gravação avaliar uma liberação gradual posterior.

Nunca cole CPF, segredo, arquivos de sessão ou prints com dados pessoais no chat.
