# CREDVIX DNA — piloto integrado v4.0.1

## Abrangência

O projeto original v3.2.1 foi **preservado** (modelos e validações). A nova
camada `dna_acesso.py` foi baseada no código de login com CAS + DPAPI de
`bot_boletos_dna(5).py` e no fluxo gravado pelo Recorder. A navegação segue:

`portalfranqueado.help.com.br/cas/login?service=dnabmg...`
→ `dnabmg.help.com.br` → **Sistemas → Módulo Cadastro**
→ `cadastro.help.com.br` → **Usuário → Manutenção**
→ **Consulta de Usuários** → filtro CPF → Pesquisar → Editar seguro
→ conferência de CPF/Nome/Login → leitura dos 227 controles.

## Credenciais

O cofre `CREDVIX_DNA_CADASTRO_LOGIN_V1` do Windows já configurado pela v3.2
será usado automaticamente. Se não existir, o robô pergunta usuário e senha
no terminal (não ecoa), guardando no WinVault apenas quando o DNA confirma
que a sessão está autenticada.

Para reaproveitar o arquivo DPAPI **já existente** de `bot_boletos_dna`,
localize `sessao/credencial_dna.json` no computador **sem enviá-lo** a terceiros;
copie-o para `sessao/credencial_dna.json` ao lado de `INICIAR_ROBO_DNA.bat`.
O BAT detecta esse arquivo e informa seu caminho apenas ao processo local.
O script `ler_credencial_dna.ps1` descriptografa somente no mesmo usuário
Windows em que a credencial foi criada. Nunca ponha senha no `.py`, `.bat` ou ZIP.

**Troque a senha que aparece em arquivos Recorder enviados**, caso ainda seja
válida. Os arquivos Recorder não foram incluídos no pacote.

## Fila Supabase

A opção 3 reserva itens via `dna_reservar_consulta`, executa consulta somente
leitura e registra resultado via `dna_finalizar_consulta`. Não usa a fila de
configuração de permissões; nenhum modelo foi habilitado para aplicação.

A Secret API Key do worker é fornecida localmente na primeira execução e
salva no WinVault depois que o Supabase confirmar a primeira atualização.
Na execução em que a fila está vazia, a chave não é persistida (sem validação).
Pode-se também disponibilizá-la apenas no ambiente do processo Windows como
`DNA_SUPABASE_WORKER_KEY`. Nunca colocar a chave nos arquivos públicos.

## Limites

O diagnóstico anterior só foi homologado em uma consulta real conhecida.
Os novos passos CAS/navegação/worker ainda dependem de teste com o Edge do
operador. A gravação **não** foi implementada ou autorizada. Antes de habilitá-la:
homologar referencial dos 227 controles, distinguir `Download → Seguros`
repetido, conferir permissões atuais, verificar mudança de perfil/subperfil,
implementar log de auditoria antes/depois, autorização pontual por conta,
rollback e releitura após gravação.

Nenhum código desta entrega clica em **Gravar**, **Confirmar** ou modifica
permissões. Testes não acessam o DNA real ou dados de produção.

## Ajuste v4.0.1: login CAS e diagnostico de sessao
Presenca de texto CAPTCHA/token ou widget recaptcha passivo na pagina nao cancela automaticamente o login. O robo so exige conclusao manual quando observa um desafio interativo real. Se nao confirmar a sessao, mostra apenas a etapa (CAS, portal ou Cadastro), sem URL ou dados pessoais. Leia CHANGELOG_v4_0_1.md para detalhes. Nao habilita alteracoes de permissoes.