# Gestão de Perfis DNA — Etapa 2: diagnóstico SOMENTE LEITURA

O worker é uma ferramenta local de auditoria assistida, ainda **não integrada à fila do Supabase**. Não clica em "Gravar", não cria, exclui ou modifica usuários e nunca redefine senhas.

## Pré-requisitos

- Windows com Microsoft Edge e Python 3.11+.
- Playwright instalado no ambiente (`pip install playwright==1.56.0`).
- Arquivo do modelo obtido em **canal privado**, na pasta local `worker/dna_local_references/`. Não publique no GitHub Pages.
- Edge em sessão CDP isolada, somente localhost. Fazer login manualmente no DNA e navegar até a tela de manutenção de um usuário autorizado.

## Execução

```bat
python worker\dna_diagnostico.py validar --perfil CONSULTOR
python worker\dna_diagnostico.py capturar --perfil CONSULTOR --saida resultados\conferencia.json
python worker\dna_diagnostico.py comparar --perfil SUPERVISOR --captura captura_supervisor.json
python worker\dna_diagnostico.py consultar-nomes --perfil CONSULTOR --lista nomes.txt --saida resultados\buscas.json
```

A captura exige uma aba única `https://cadastro.help.com.br` mostrando **227 controles**. Para `consultar-nomes`, navegue manualmente até **Consulta de Usuários**: a automação só pesquisa e coleta possíveis correspondências visíveis, não abre cadastros e não conclui identidade. Sem paginação conhecida, qualquer dúvida vai para revisão.

## Limitações e bloqueios

1. A permissão “Download → Seguros” aparece duas vezes sem IDs únicos; a posição é apenas referência de comparação, não seletor para editar.
2. **Nomes idênticos não provam identidade única.** O robô de diagnóstico nunca escolhe um candidato para editar.
3. O resultado “permissões coincidem na tela” é visual, não prova de gravação persistida nem de identidade.
4. Os modelos no banco estão **inativos**; criação de lotes pela API segue bloqueada.
5. Na etapa seguinte, homologaremos o caminho de busca e os identificadores técnicos; só depois integraremos resultados à fila e ao painel.

## Segurança

Não colocar credenciais em scripts, GitHub, JSONs de referência ou frontend. A pasta `dna_local_references` e os resultados de captura devem permanecer fora de commits. O worker não utiliza `service_role` nesta etapa.