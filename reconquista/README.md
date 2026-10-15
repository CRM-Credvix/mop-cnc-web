# Reconquista — solicitação por webhook

Página estática sem frameworks: `index.html`, `styles.css`, `script.js`. Adaptada ao Credvix Design System v0.2 e à referência visual do dashboard.

## Acessar no GitHub Pages

Após integrar esta branch ao `main` e com Pages publicado a partir da raiz:
`https://crm-credvix.github.io/mop-cnc-web/reconquista/`

## Configuração obrigatória

1. No topo de `script.js`, altere `WEBHOOK_URL` para a URL HTTPS real.
2. Em `index.html`, substitua/complete o conjunto de opções de `<select id="franquia">`. Somente a franquia de exemplo 51545 está presente; não foram inventadas outras.
3. Configure o serviço receptor para aceitar `POST` JSON e responder com `2xx` após **registrar o pedido**. O navegador necessita CORS (incluindo preflight OPTIONS, Authorization não é enviado).
4. O JSON enviado é `{"franquia":"51545","solicitado_em":"2026-10-15T12:00:00.000Z"}`, com timestamp ISO real em UTC.
5. Proteja o webhook no servidor (autorização de requisições, limitação de taxa, prevenção de duplicidade e origem permitida). **Não coloque credenciais no frontend**.

## Integração com bot_reconquista.py

O bot fornecido é um **processo Python local Windows**, com Power BI/Playwright e Google Sheets. O CLI oferece `run`, `export-only`, `setup-session`, entre outros. O comando `python bot_reconquista.py run` faz a extração e sincronização, mas **não recebe argumento `franquia`**. O campo é somente metadado para o webhook neste MVP.

**GitHub Pages não executa o Python**. Um receptor separado, hospedado e autenticado, precisa validar/enfileirar a solicitação e despachar um trabalhador Windows configurado com `config.json`, sessão Microsoft, dependências e credenciais Google **fora do repositório público**. Não execute automaticamente solicitações anônimas sobre o robô ou sobre dados internos.

A confirmação visual **Solicitação recebida** só significa HTTP 2xx do webhook, não a conclusão real da extração. Para progresso real é necessário backend com identificador da execução e endpoint de consulta de status.

## Teste

- Abra `index.html` no navegador (ou use Pages), teste seleção vazia.
- Configure webhook de teste que responda 200 e tenha CORS; valide o payload na aplicação receptora.
- Teste webhook retornando 500, offline, timeout e clique repetido.
- Confirme funcionamento mobile e navegação por teclado.

Não alterar o `main` ou o robô até validar URL, serviço receptor e a regra de uso do campo franquia.
