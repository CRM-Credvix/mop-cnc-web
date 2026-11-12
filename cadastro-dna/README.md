# Cadastro de colaboradores DNA — integração isolada v0.1

## Escopo deste commit
Fundação **não produtiva** para cadastro de colaboradores no DNA, separada do módulo existente de padronização de perfis.

- Nenhuma alteração em `perfis-dna.html`, `dna_web_*`, `worker_mop.py` ou no agente de padronização.
- Nenhuma migração foi aplicada no Supabase.
- Nenhum colaborador foi cadastrado no DNA.
- O formulário de prototipação é **somente validação local**: não envia CPF, e-mail ou dados pessoais à rede.
- A migração SQL é um rascunho versionado a revisar antes da aplicação.

## Arquitetura-alvo
1. Site estático HTML/CSS/JS e autenticação Supabase já existente.
2. RPC autenticada e autorizada em backend para cadastro de pedidos e proteção de dados.
3. PostgreSQL com solicitações, estados e trilha de eventos (separado das tabelas `dna_web_*`).
4. Worker Python Windows com identidade de serviço, controle de concorrência, verificação de existência no DNA e navegação Playwright.
5. Monitoramento por leitura periódica do status; `ATIVO` apenas quando confirmado na interface DNA.

## Segurança e impedimentos
- CPF, nascimento, telefone e e-mail não devem ser gravados em colunas públicas nem aparecer em logs.
- Implementar armazenamento criptografado em esquema privado, com gerenciamento de chave fora do banco e acesso restrito ao worker/backend. Nunca inserir payload sensível em `localStorage`.
- Login, administração, vínculo de loja e autorização de criação devem ser verificadas no servidor, não apenas no JavaScript.
- Um cadastro com confirmação incerta deve ir para `revisao`; não clicar novamente em Cadastrar.
- Fluxo de perfis SUPERVISOR precisa respeitar o limite operacional já existente e as lojas autorizadas.
- O vídeo/Recorder mostra o clique em Salvar, **não** o indicador definitivo de ativação.

## Próximas etapas de homologação
1. Revisar telas atuais e regras de loja, perfil, permissões, CPF e colaboradores existentes.
2. Implementar RPC/Edge Function de criação autorizada com payload criptografado e idempotência.
3. Criar agente isolado no Windows e testar somente consulta antes de liberar escrita.
4. Homologar um cadastro controlado, a validação CPF e o sinal inequívoco de ATIVO.
5. Testar queda de rede após Cadastrar, duplicidade, sessão expirada, reinício do Windows e usuário sem permissão.
6. Somente então aprovar migração e conectar CTA do formulário.

## Teste rápido do protótipo (sem escrita)
Abra `cadastro-dna/formulario.html` via um servidor HTTP local. O botão é de validação local e não insere solicitações. Não use dados reais nos testes do protótipo.

## Instalação no Windows
Por enquanto **nenhum arquivo precisa ser instalado ou executado no Windows**. O código está na branch de testes no GitHub e ainda não constitui pacote do agente.

## Etapa 2 — Interface integrada na branch

- `/cadastro-colaboradores.html`: página administrativa com o mesmo menu do MOP-CNC.
- `js/mop-shell.js`: link administrativo "Cadastro de colaboradores", mantendo as três rotas de padronização existentes.
- `js/cadastro-colaboradores.js`: autenticação Supabase, seleção de lojas do catálogo e validação local. O botão "Solicitar cadastro" fica permanentemente desabilitado.
- Acompanhamento tenta consultar `dna_cadastro_solicitacoes` por RLS e exibe indisponibilidade quando a tabela não existe.
- `worker/cadastro_dna/estado.py`: contrato sem efeitos colaterais para classificar os estados, impedindo `ATIVO` sem evidência real.
- `worker/cadastro_dna/test_estado.py`: testes unitários de transições e de bloqueio contra duplicidade.

A migração `schema_proposta.sql` permanece incompleta e **não deve ser executada**. O frontend não possui chamada de criação, e nenhuma autenticação de backend para recebimento de CPF foi implementada.

### Checagens de integração

- Comparar a branch com `main`: nenhum arquivo do robô MOP-CNC ou de padronização foi removido.
- Conferir que o menu "Cadastro de colaboradores" é link de outra página mesmo dentro de `perfis-dna.html`.
- Confirmar abertura da página somente por usuário administrador autenticado. A verificação por e-mail é de interface: **não substitui a autorização RLS/RPC**.
- Testar no Windows os cenários de cadastro incerto e falha após salvar antes de liberar escrita.
- A lista atual exibe todas as franquias ativas do catálogo apenas para visualização; a autorização para vínculos precisa ser validada na camada segura futura.

### Execução dos testes de estado

A partir da raiz do repositório, com Python instalado:
```bat
python -m unittest worker.cadastro_dna.test_estado -v
```

Nenhum script de cadastro precisa ser iniciado no Windows nesta etapa.
