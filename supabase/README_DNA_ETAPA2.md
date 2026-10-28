# Gestão de Perfis DNA — Etapa 2 (28/10/2026)

## Status

- **Banco**: 2 referências preliminares importadas na tabela `public.dna_modelos` do projeto `ijcqgitluzefphomkkmo`.
- **Consultor / Consultor 2**: 227 controles capturados; 224 permissões individuais, 1 controle SSO, 2 controles globais.
- **Supervisor / Supervisor 1**: mesmos 227 controles; 6 diferenças de estado em relação a Consultor.
- **Uma duplicidade real**: `Funções Consig → Acesso a Telas → Download -> Seguros` aparece duas vezes. Ambos os registros foram preservados por `ordem_dom` e `ocorrencia`, mas **não possuem identificador técnico estável**: não usar posição de DOM para alterar permissões.
- **Ativação**: os 2 modelos seguem `ativo=false`, `validado_em=null`. Nenhuma fila poderá ser criada pela RPC antes da homologação.
- **Segurança**: frontend inalterado; nenhuma credencial ou snapshot de permissões está no GitHub Pages.

## O que foi desenvolvido

- `worker/validar_referencias.py`: valida cada captura, conserva duplicidades e compara 227 estados com falha fechada.
- `worker/dna_diagnostico.py`: inspeciona a aba DNA já aberta no Edge via CDP local, compara com o modelo privado e pode pesquisar nomes na tela de consulta sem abrir fichas nem salvar.
- `worker/dna_inspecao_dom.js`: leitura do DOM a partir do inspetor original.
- `worker/ABRIR_EDGE_DIAGNOSTICO.bat`: abre Edge separado com debugger local.
- `worker/test_dna_diagnostico.py`: testes sintéticos sem dados reais.

## Modelos confidenciais

A carga de `dna_modelos` foi aplicada com a migração privada do Supabase denominada `dna_etapa2_modelos_preliminares_inativos_20261028`. O conteúdo integral foi mantido **apenas no Supabase e no pacote local privado**; não foi adicionado como fixture estático à pasta do GitHub Pages.

Para usar a comparação no computador de execução, guardar `modelo_consultor_v1.json` e `modelo_supervisor_v1.json` na pasta local ignorada `worker/dna_local_references/`.

## Limites atuais

A ferramenta foi testada **offline** com capturas e fixtures. O login real e os seletores de resultados da busca ainda exigem validação com a interface do DNA. O comando `consultar-nomes` devolve possíveis candidatos **na página visível**, nunca identidade confirmada. A comparação de permissões depende de o operador chegar à ficha de um usuário autorizado; não implementa processamento autônomo de lotes nem atualiza o Supabase. Não foi autorizada alteração de permissões nesta etapa.

## Próximo marco

Homologar identificadores técnicos das permissões repetidas; validar captura de DOM em perfil real (read-only); mapear o resultado de busca e a paginação; conectar o worker à fila `dna_lotes/dna_itens` e aos estados reais do painel. Gravação no DNA só após piloto específico com conferência pós-gravação.