# Cadastro DNA | Guia Windows de homologacao (sem cadastros)

**Estado:** branch de testes; NAO implantar em producao.

## A. Baixar e extrair
1. Abra https://github.com/CRM-Credvix/mop-cnc-web/tree/feature/cadastro-colaboradores-dna-v01
2. Na pagina da branch, clique **Code > Download ZIP** (nao baixe a branch `main`).
3. No Windows, crie esta pasta: `%USERPROFILE%\Desktop\PROJETOS MOP-CNC\HOMOLOGACAO CADASTRO DNA`
4. Mova o ZIP para essa pasta, clique com botao direito > **Extrair Tudo**.
5. Abra a pasta extraida que contem os arquivos `CADASTRO_DNA_PREPARAR_TESTE.bat` e `CADASTRO_DNA_DIAGNOSTICO.bat`.

**Nao extrair sobre o MOP-CNC atual.** Nao copie nem altere `.env`, Windows Vault, arquivos de sessao ou o worker funcional.

## B. Testes offline
1. Execute **`CADASTRO_DNA_PREPARAR_TESTE.bat`**. Cria apenas a pasta local `.venv_cadastro_dna` e instala dependencias fixadas nesse ambiente. Requer conexao de rede para baixar pacotes Python.
2. Execute **`CADASTRO_DNA_DIAGNOSTICO.bat`**.
3. Resultado esperado: testes unitarios aprovados; `Cadastro no DNA: BLOQUEADO`; `Reserva no Supabase: NAO EXECUTADA`.
4. Se surgir `TESTES FALHARAM`, pare. **Nao instale nada no robo ativo.**

## C. Inspecionar a estrutura real do DNA (sem enviar cadastro)
1. Na pasta extraida, execute o arquivo original ja existente **`worker\ABRIR_EDGE_DIAGNOSTICO.bat`**. Ele abre um Edge separado com perfil especifico de diagnostico e depuracao local na porta 9222.
2. Nessa janela, conclua o login manual no DNA.
3. No DNA, navegue manualmente ate a tela de **novo cadastro de usuario** (sem preencher dados pessoais).
4. Com a tela aberta, execute **`CADASTRO_DNA_INSPECIONAR_TELA.bat`** da raiz extraida.
5. Localize **`diagnostico_cadastro_dna_estrutura.json`** na mesma pasta.
6. O relatorio inclui somente contagens dos campos/controles reconhecidos, sem CPF, nome, senha ou cookies. Envie somente esse JSON para a revisao tecnica.

Se o Edge de diagnostico nao abrir ou o relatorio marcar `revisao`, interrompa sem trocar o perfil do Edge de producao.

## D. Evidencia do status CPF
O Recorder existente termina no clique de **Salvar** com observacao `cpf`, sem comprovar o sinal oficial de validacao concluida.
Para homologar, precisamos observar **qual elemento do DNA apresenta o status final da validacao do CPF**, apos a operacao em uma conta de teste autorizada. Um usuario listado como Ativo nao basta. A evidencia visual deve ocultar nome, CPF, telefone, email e dados de login.

## E. Restricoes antes de producao
- NAO executar `cadastro-dna/schema_seguro_v02.sql` no Supabase de producao.
- NAO publicar `supabase/functions/cadastro-dna-criar` antes de teste integrado.
- NAO ativar a chave `dna_cadastro_config.cadastro_ativo`.
- NAO executar um cadastro real automatizado; o adaptador para acao Cadastrar permanece nao homologado.
- NAO armazenar a secret API key, chave AES, HMAC, CPF ou senha em GitHub, ZIP, chat ou `.env` do site publico.
- O arquivo Recorder anteriormente fornecido contem credencial em texto claro: ALTERAR a senha do DNA antes de qualquer implantacao.

## F. Pos-homologacao
1. Testar SQL em projeto Supabase separado de producao e validar RLS/grants/advisors.
2. Configurar segredo AES no Edge Function e no WinVault Windows. Usar chaves distintas AES e HMAC.
3. Validar permissoes de lojas e limite de Supervisor por loja.
4. Homologar preflight de seletores, escrita unica, retorno real do DNA e conciliacao de operacao incerta.
5. Confirmar que o ambiente Windows consegue executar o agente e que a confirmacao 'Ativo' tem evidencia independente.
6. Fazer liberacao gradual, com o banco inicialmente `cadastro_ativo=false`.

## Nota sobre origem HTTPS
Para `DNA_CADASTRO_ALLOWED_ORIGIN`, usar apenas a **origin** do navegador (protocolo + host + porta, se houver); nao incluir caminho `/mop-cnc-web/`. Verificar a origin real na barra de enderecos do site publicado.

Nenhum passo deste guia exige compartilhar dados pessoais.
