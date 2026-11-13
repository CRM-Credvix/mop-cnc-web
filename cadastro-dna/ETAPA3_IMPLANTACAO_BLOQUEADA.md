# Cadastro DNA — etapa 3: fila segura e endpoint (NAO IMPLANTADOS)

## Estado
Arquivos versionados **somente na branch de desenvolvimento**. Nao existe fila de cadastro instalada no Supabase nem agente Windows autorizado a cadastrar.

## Componentes
- `cadastro-dna/schema_seguro_v02.sql`: proposta SQL completa para a fila inicial, isolamento de dados cifrados, RLS por solicitante, eventos append-only, idempotencia, reserva atomica por `FOR UPDATE SKIP LOCKED`.
- `supabase/functions/cadastro-dna-criar/index.ts`: endpoint autenticado. Valida permissao administrativa por lista de UUID no ambiente do servidor, confere CPF/lojas, cifra JSON usando AES-256-GCM e cria pedido via RPC protegida.
- `cadastro-colaboradores.html` permanece com envio desabilitado. A interface nao chama a Edge Function.
- `worker/cadastro_dna/estado.py` e `test_estado.py`: classificacao offline do resultado. **Nao executa cadastro**.

## Secrets necessarios (configurar SOMENTE quando for autorizado implantar)

| Nome | Uso | Local |
|---|---|---|
| DNA_CADASTRO_ALLOWED_USER_IDS | UUIDs dos administradores permitidos, separados por virgula | Secrets Edge Function |
| DNA_CADASTRO_ALLOWED_ORIGIN | URL HTTPS EXATA do site publicado | Secrets Edge Function |
| DNA_CADASTRO_AES_KEY_HEX | Chave aleatoria de 32 bytes em hexadecimal | Secrets Edge Function + cofre Windows do worker |
| DNA_CADASTRO_HMAC_KEY_HEX | Chave independente de 32 bytes em hexadecimal | Secrets Edge Function; nao precisa no worker para descriptografar |

Para gerar **duas chaves distintas**, executar localmente no Windows Python (nao copiar os resultados para chats ou GitHub):
```bat
python -c "import secrets; print(secrets.token_hex(32)); print(secrets.token_hex(32))"
```
Armazenar os segredos em cofre seguro com backup e plano de rotacao. Perder a chave AES impossibilita ler cadastros pendentes. Nao inserir nenhuma chave no frontend, RAR, ZIP ou repositório.

## Funcionamento pretendido

1. Usuario autenticado preenche e pede cadastro; novo botao somente apos homologacao.
2. Edge Function valida token via Supabase Auth, checa UUID em allowlist de servidor e valida campos.
3. Edge Function cifra o payload integral (nome, CPF, nascimento, email, telefone, perfil e lojas), registra HMAC do CPF e envia so dados cifrados ao SQL.
4. RPC `dna_cadastro_criar` valida lojas existentes e insere em transacao. Mesma idempotencia retorna o mesmo pedido; CPF em aberto impede novo pedido.
5. Worker Windows usara a RPC `dna_cadastro_reservar` e cofre Windows para obter chave AES; precisa consultar usuario existente ANTES de incluir.
6. Erro apos envio de `Cadastrar` leva a revisao; nao repetir inclusao. O status `ativo` so sera aceito apos evidencia inequívoca de tela.
7. RPC `dna_cadastro_finalizar` conclui a reserva. Monitor de validacao posterior ainda deve ser implementado.

## Itens bloqueadores antes de deploy

- Verificar a compatibilidade do SQL e Edge Function contra Supabase local de testes (nao validado ainda).
- Criar worker real, incluindo decriptacao AES-GCM com AAD/versao, concorrencia, controle de armazenamento seguro, retry apenas de leitura, e evidencia definitiva do status Ativo.
- Implementar monitorizacao de `aguardando_validacao` e transicao segura ate `ativo`; no estado atual essa transicao nao existe sem reserva nova, portanto nao usar producao.
- Validar autorizacao de cada loja atribuida pelo solicitante. Allowlist de UUID e cadastro de lojas ativas nao substituem politica final de vinculos permitidos.
- Conferir limite de Supervisor por loja e rotas DNA na automacao final.
- Revisar expiracao de reservas e processo operacional de conciliacao manual.
- Revisar protecao da tabela publica, permissoes, indexes, audit logs e vazamento de dados por excecoes.
- Testes unitarios do modulo Python e E2E da funcao e SQL em staging.
- Garantir que a URL de origem do GitHub Pages corresponde exatamente ao secret permitido.

## Instalar e executar?
**Nao instalar, nao aplicar SQL, nao publicar a Edge Function, nao liberar botao.**
Todos os arquivos ainda sao propostas, apenas para revisao na branch `feature/cadastro-colaboradores-dna-v01`.

## Proximo marco
Homologar a automacao de cadastro em Windows sobre ambiente de teste, identificar o marcador oficial de ativacao DNA, implementar monitor de 5-10 minutos, executar testes com CPF ficticio ou conta de teste autorizada, revisar seguranca e somente entao considerar implantacao por etapas.
