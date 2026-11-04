# Piloto de padronização DNA — Consultor 2, uma pessoa

## Escopo

O painel administrativo apresenta **Autorizar um colaborador para o piloto** somente para **Consultor 2**, enquanto a opção permanecer inativa no banco para uso geral.

**Não se trata de liberação global:** os quatro modelos permanecem `ativo=false` e nenhuma solicitação é criada na instalação da migration.

## Procedimento após a publicação

1. Confirme que o colaborador escolhido é **Consultor 2**, autorizado para receber a padronização e não é uma conta protegida de homologação. A troca entre Consultor e Supervisor continua proibida.
2. Abra `DNA_INICIAR_AGENTE_WEB.bat` no Windows e mantenha a janela aberta. Precisa aparecer o estado de conexão, mas isso não significa tarefa executada.
3. No site CREDVIX, Administração → Padronização DNA, selecione Consultor 2.
4. Informe **uma** linha `CPF; Nome completo` diretamente no site HTTPS. Nunca encaminhe CPF nem segredos pelo chat.
5. Digite `AUTORIZAR PILOTO CONSULTOR_2` e clique **Autorizar um colaborador para o piloto**. A autorização começa a expirar em **30 minutos**. **Ela é irrepetível**, mesmo se expirar.
6. Sem editar CPF, nome ou modelo, digite `APLICAR CONSULTOR_2` e clique **Solicitar padronização** exatamente uma vez.
7. Consulte Acompanhamento. Um status `Na fila` não equivale a sucesso; a homologação exige confirmação independente das 224 permissões após salvar quando houver mudança.

## Restrições do banco

- Tabela **privada** possui uma única linha, somente `CONSULTOR_2`, um HMAC calculado no servidor usando segredo privado, responsável autenticado, validade e lote opcional.
- A função de autorização recusa tentativas de repetição, mesmo se a autorização expirar ou tiver sido consumida.
- O servidor verifica CPF, nome e modelo por HMAC e consome a autorização **na mesma transação** que cria o lote.
- A mesma chave de idempotência devolve o mesmo lote e não grava outro; chave nova é recusada.
- O browser usa somente RPCs invoker do esquema público, que invocam funções privadas com controle explícito de administrador; `anon` não pode executar.
- A fila continua exclusiva da padronização, sem restabelecer a Conferência DNA.
- Contas protegidas e restrições de família continuam sendo verificadas pelo motor Windows V4/v5.5.16.

## Auditoria da preparação

- Migração: `supabase/migrations/20261104185000_dna_web_piloto_unico_consultor2.sql`.
- Teste transacional com **ROLLBACK** comprovou: acesso negado sem autorização, uso único, segunda execução rejeitada, autorização duplicada rejeitada, idempotência, nenhum modelo ativado.
- Não testar o robô remotamente; os arquivos Windows e sessões Edge permanecem no computador do operador.

## Pontos de atenção

Não inicie a autorização se o agente não estiver pronto. Se a autorização expirar antes de ser consumida, não há reemissão automática: é necessária revisão administrativa. Se o agente apresentar erro, inconclusão ou resultado parcial, **não clique outra vez**. Preserve log sem dados pessoais para diagnóstico.

A autorização não substitui a homologação prática do fluxo Site → Supabase → agente Windows → DNA. Não habilite todos os modelos sem essa etapa.
