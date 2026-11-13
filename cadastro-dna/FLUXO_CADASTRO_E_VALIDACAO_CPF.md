# Cadastro DNA — fluxo operacional v0.1 (na branch isolada)

## Ordem oficial confirmada
1. Encontrar loja pelo codigo e abrir `+`.
2. Preencher dados do colaborador.
3. Selecionar **Perfil Consultor ou Supervisor**.
4. Esperar carregamento dependente do dropdown **Sub Perfil**.
5. Selecionar **Consultor 2** para Consultor, ou **Supervisor 2** para Supervisor.
6. Garantir checkbox **Usuario acesso SSO** marcado.
7. Garantir exclusivamente **a primeira Funcao Consig** marcada, sem mexer nas demais.
8. Clicar **Cadastrar uma unica vez**, apos validacao da loja e dados.
9. Depois da confirmacao do cadastro, abrir **Usuario -> Manutencao**.
10. Pesquisar pelo **nome completo** cadastrado, confirmar identidade univoca.
11. Acionar **Validar CPF uma unica vez** e consultar resposta. Nao confundir clicar com sucesso.

## O que ja existe
- `worker/cadastro_dna/fluxo_completo.py`: orquestrador da ordem oficial com gateway injetavel, proposito de evitar chamadas fora de ordem. **Nao e integracao real no browser**.
- `worker/cadastro_dna/test_fluxo_completo.py`: testes de simulacao offline e de bloqueio de escrita por padrao.
- `worker/cadastro_dna/inspecao_validar_cpf.py`: inspecao somente leitura de atributos do botao/acao.
- `IDENTIFICAR_BOTAO_VALIDAR_CPF.bat`: captura pontual, nao pede novamente as duas leituras de Perfis/Subperfis.

## Faltas para execucao real
- DOM exato do link/botao Validar CPF na manutencao, inclusive eventual menu de Acoes e confirmacao;
- DOM da lista de franquias e identificacao exclusiva da linha por codigo;
- seletores de todos os campos pessoais e das Funcoes Consig;
- comprovacao da mensagem apos Cadastrar e apos Validar CPF;
- adaptador Playwright real com garantia de submissao unica (sem reexecutar automaticamente quando resposta for incerta).
- homologacao segura de conta de teste com autorizacao para escrita.

## Uma unica captura pendente — sem repetir capturas de perfil
Dentro da **mesma pasta de desenvolvimento** execute `IDENTIFICAR_BOTAO_VALIDAR_CPF.bat` com Edge de diagnostico aberto.
Abra manualmente `Usuario -> Manutencao`, pesquise um cadastro de teste/autorizado e **deixe a opcao Validar CPF visivel, sem clicar**.
O arquivo `RELATORIOS_CADASTRO_DNA/validar_cpf.json` contem somente metadados tecnicos da acao.
Se a opcao for um icone sem texto/aria-label/title relacionados a validar CPF, o diagnostico retorna revisao; nesse caso sera necessaria uma referencia visual anonimizada desse trecho.

## Garantias
Nao realizar merge da branch de homologacao no main, nao alterar o motor de padronizacao e nao ativar SQL/Edge Function neste passo.
