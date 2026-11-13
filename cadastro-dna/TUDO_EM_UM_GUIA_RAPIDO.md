# Cadastro DNA — UMA PASTA, UM ARQUIVO PARA INICIAR

Esta e a forma mais simples de obter os **dois relatorios de homologacao**.
Ela NAO cadastra usuarios, NAO altera Funcoes Consig e NAO grava no Supabase.

## Instalacao inicial: uma unica vez
1. No GitHub, abra a branch `feature/cadastro-colaboradores-dna-v01` em
   https://github.com/CRM-Credvix/mop-cnc-web/tree/feature/cadastro-colaboradores-dna-v01
2. Clique `Code > Download ZIP`.
3. Na Area de Trabalho, crie uma pasta chamada `CREDVIX - CADASTRO DNA`.
4. Extraia o ZIP **dentro dessa pasta**, sem copiar nada sobre os robos que ja funcionam.
5. Abra a pasta extraida que contem o arquivo
   **`INICIAR_CADASTRO_DNA_TUDO_EM_UM.bat`**.

## Operacao: iniciar apenas esse BAT
1. Clique duas vezes em `INICIAR_CADASTRO_DNA_TUDO_EM_UM.bat`.
2. Na primeira vez ele instala as dependencias em `.venv_cadastro_dna`.
   Nas vezes seguintes reutiliza esse ambiente.
3. Executa os testes unitarios offline. Se falharem, nao prossegue.
4. Abre o Edge separado de diagnostico. Faca login normalmente.
5. Na loja autorizada, clique `+` para abrir Manutencao de Usuario.
   Escolha Perfil **Consultor** e Sub Perfil **Consultor 2**.
   **Nao preencha dados pessoais e nao clique Cadastrar.**
6. Volte ao prompt e pressione ENTER. O primeiro JSON e salvo automaticamente.
7. Na mesma tela, mude para Perfil **Supervisor** e Sub Perfil **Supervisor 2**.
   Volte ao prompt e pressione ENTER.
8. A execucao gera a pasta `RELATORIOS_CADASTRO_DNA` com:
   - `consultor2.json`
   - `supervisor2.json`
9. Envie somente esses dois JSONs na conversa. Eles contêm estrutura e nomes de opcoes de lista preaprovada, nao CPF, nome, telefone ou senha.

## Se der erro
- Nao clique em Cadastrar; o programa fecha sem alterar o DNA.
- Confira se so existe um formulario aberto no Edge de diagnostico e a escolha do perfil/subperfil esta correta.
- Se falhar na instalacao por rede, execute o mesmo BAT novamente.
- Nao copie nenhum arquivo para dentro do motor operacional que ja funciona.

## Garantias e limites
- Nenhum click ou preenchimento realizado pelo script de inspecao.
- O operador faz login, escolhe a loja e muda os dois selects MANUALMENTE.
- Nao reserva tarefas no banco nem chama RPC de gravacao.
- A leitura usa somente DOM e lista permitida de opcoes; identifica selecionados por rotulo nao pessoal.
- A etapa NAO implanta o robô nem comprova ativacao definitiva do CPF.
- Os modelos da padronizacao antiga ficam intactos.

**Producao continua BLOQUEADA.**

## Atualizacao: identificadores dos demais campos
O mesmo BAT agora inclui em cada JSON o campo `estrutura.mapeamento_campos`, que registra somente identificadores tecnicos (`id`, `name`, `ng-model`, `type`) dos controles obrigatorios e a contagem do controle SSO. Nao captura valores digitados. Os dois relatórios antigos nao incluem esse detalhe: para fechar essa etapa, execute novamente o BAT da branch atualizada e envie os dois JSONs novos. Continuam bloqueados cadastro e alteracao de permissoes.
