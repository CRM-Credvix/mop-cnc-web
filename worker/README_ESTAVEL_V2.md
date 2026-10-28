# MOP-CNC / DNA - versao estavel do leitor 2.0

## Correcao de causa raiz
- Os antigos 227 checkboxes precisavam estar todos VISIVEIS, embora o estado
  `checked` de um checkbox ja montado seja legivel mesmo dentro de um acordeao fechado.
- Agora sao aceitos 227 controles integralmente carregados no DOM, ainda que ocultos,
  desde que os tipos, etiquetas e estados do modelo coincidam.
- Duas leituras independentes verificam que nomes, posicoes e `checked` nao mudaram.
- Quando o DNA carrega controles apenas depois de expandir, tenta-se somente clicar
  em expansores com rotulos exatos de Funcoes help, Funcoes Consig, Funcoes para
  Utilizacao do Sistema e Acesso a Telas. Nunca se tenta clicar em inputs ou Gravar.
- Se o DOM continuar incompleto ou ambiguo, o robô interrompe o diagnostico.

## Frontend (projeto GitHub Pages)
- `js/dna-dashboard.js`: consulta real de `dna_inspecoes` e `dna_lotes` com RLS,
  estatisticas e tabelas de diagnosticos em Gestao / Acompanhamento.
- `js/dna-relatorios.js`: mantém importacao v2, inclui busca, filtros e CSV de
  metadados restritos. Nenhum CPF, codigo tecnico, HMAC ou estado das 227 caixas
  é incluido no CSV.
- `perfis-dna.html`: adiciona scripts e habilita filtros da Auditoria.

## Limites de seguranca
- Nao aprova identidade automaticamente: CPF=Login e verificacao interna da tela.
- Modelos inativos; nenhuma gravacao no DNA e nenhum lote liberado.
- Nenhuma chave de Supabase service_role no navegador ou no pacote local.
- Testes em Chromium sao sinteticos; os seletores reais para acordeoes carregados
  sob demanda precisam ser homologados no proprio DNA antes de garantir automacao.