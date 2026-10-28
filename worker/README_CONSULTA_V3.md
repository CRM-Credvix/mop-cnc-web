# DNA v3 — consulta automatica segura

Ao selecionar **1** no assistente Python, o operador entra no DNA em janela Edge
isolada, acessa Consulta de Usuarios, fornece CPF + nome + login opcional. O
robo preenche o CPF, tenta executar uma busca com rotulo semantico, verifica se
a tabela e unica e se toda a paginacao foi lida, filtra apenas status **Ativo**, e
preserva integralmente os sufixos de Login.

Somente com candidato unico (ou Login exato informado), o robo tenta
abrir o botao **Editar** semanticamente identificado (texto, acessibilidade
ou icones de bibliotecas comuns). Se o icone nao for reconhecivel, nao
clica por posicao. Nesse caso, o operador pode clicar manualmente em
Editar **na mesma execucao**, e o robo confirma novamente CPF, Nome e
Login na manutencao antes de qualquer diagnostico. Le CPF, nome e login duas
vezes, compara com a consulta e somente entao le as 227 permissoes.

## Limites de seguranca

- Sem salvamento, alteracao ou exclusao de usuarios.
- Sem contas canceladas ou bloqueadas, sem selecao arbitraria em duplicidades.
- Sem CPF e Login em claro nos JSONs de diagnostico. O HMAC e apenas para
  correlacao local, nao uma prova externa de identidade.
- Modelos ainda nao homologados no Supabase. Nenhum lote executavel.
- Nao usa chave service_role nem credenciais do DNA em arquivos.
- Se os seletores do DNA forem diferentes (botao sem aria-label/title, pagina
  sem total, etc.), o fluxo automatico **recusa** escolher e permite clicar manualmente em Editar somente apos selecionar conta unica ativa; a identidade do formulario sera novamente validada.

## Homologacao pendente no DNA real

Testar busca CPF, multiplos resultados, pagina com mais resultados, botoes Editar,
manutencao em cada perfil, logs de acesso, e depois homologar seletores de
permissoes duplicadas e confirmacao persistente apos gravacao.