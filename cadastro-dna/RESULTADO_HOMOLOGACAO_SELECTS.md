# Homologacao estrutural — Consultor 2 e Supervisor 2

Evidencias: dois JSONs gerados em 12/11/2026 pelo diagnostico unificado de navegador, sem dados pessoais e sem escrita.

## Identificadores confirmados nos dois relatorios

| Item | Identificador DOM | ng-model | Resultado |
|---|---|---|---|
| Perfil | `#perfilVenda` | `usuario.perfilVenda.id` | seletor unico |
| Sub Perfil | `#subPerfilVenda` | `usuario.subPerfilVenda.id` | seletor unico |
| Cadastrar | nome do botao `Cadastrar` | - | exatamente 1 |

### Captura Consultor
- Campo Perfil selecionado: `Consultor`
- Campo Sub Perfil selecionado: `Consultor 2`
- Opcoes de subperfil reconhecidas: Consultor 1, Consultor 2, Consultor 3, Consultor B2C, Consultor Hibrido.

### Captura Supervisor
- Campo Perfil selecionado: `Supervisor`
- Campo Sub Perfil selecionado: `Supervisor 2`
- Opcoes de subperfil reconhecidas: Supervisor 1, Supervisor 2.

### Campos identificados
Nome, CPF, Data de Nascimento, E-mail, Telefone Celular, Perfil, Sub Perfil, Login IB Consig, Descricao uso Perfil e Observacao foram detectados uma vez em ambos os relatórios.

O rotulo **Usuario acesso SSO** nao foi localizado pelo metodo `get_by_label`. Nao interpretar como inexistencia do controle; inspecionar o `ng-model` em etapa separada.

## Implementacao
`worker/cadastro_dna/preflight_perfil.py` usa IDs e ng-model estaveis comprovados. Sua funcao `verificar_relatorio` avalia as capturas em memoria, impede ambiguidade e devolve `autorizacao_cadastrar=False` invariavelmente. O modulo NAO preenche, seleciona nem clica em nenhum elemento.

## Regra de cadastro e Funcoes Consig
- Consultor -> Consultor 2
- Supervisor -> Supervisor 2
- As Funcoes Consig sao iguais para ambos e nao serao alteradas por este robô.
- O motor v5.5 de padronizacao dos quatro modelos e seus controles de permissao continuam intactos.

## Bloqueios restantes para o robo real
1. Confirmar o codigo da loja escolhida ANTES do `+` e na Manutencao de Usuario.
2. Homologar seletores estaveis para DDD, telefone, nascimento, Nome, CPF e Email, e regras especificas de SSO/Login IB Consig.
3. Confirmar comportamento dos campos obrigatorios com teste sem salvar.
4. Validar um unico cadastro controlado, com permissao expressa e sem reenvio se resultado incerto.
5. Descobrir prova verificavel da validacao CPF e do estado ATIVO em nova consulta.
6. Homologar toda a cadeia Windows/Supabase em ambiente separado de producao.

Nenhum SQL foi aplicado, nenhuma funcao publicada, nenhuma conta criada e nenhum merge realizado neste passo.
