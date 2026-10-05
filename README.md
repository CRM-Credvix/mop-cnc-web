# MOP - CNC Web — protótipo v0.1

Protótipo desktop-first em HTML/CSS/JS puro para validar a interface do sistema de solicitação de emissões do MOP - CNC.

## O que já funciona
- Login visual de demonstração.
- Tela de nova solicitação.
- Combobox pesquisável por código/nome.
- Validação básica do WhatsApp no formato `55DDDNÚMERO`.
- Bloqueio de pedido duplicado quando a mesma franquia está `na_fila` ou `emitindo`.
- Métricas por status.
- Histórico com busca e filtro.
- Tela de detalhes do pedido.
- Simulação de mudança de status.
- Persistência local via `localStorage`.

## O que ainda NÃO é produção
- Login é apenas visual e não autentica em backend.
- Pedidos não saem do navegador.
- Não há Supabase/fila real.
- Não há worker nem ligação com `run_mop.py`.
- Não há ClickChat no front-end.
- Não há segredos no projeto.

## Franquias
O protótipo contém as 17 franquias observadas no teste em lote disponível nesta conversa. Antes da produção, substituir/completar `data/franquias.json` pela lista oficial de 33 franquias do robô.

## Executar localmente
Como o protótipo usa apenas arquivos estáticos, pode ser aberto diretamente. Para comportamento mais próximo do GitHub Pages, use um servidor HTTP local, por exemplo:

```bash
python -m http.server 8080
```

Abra `http://localhost:8080`.

## GitHub Pages
A estrutura já é compatível com GitHub Pages. A publicação será feita depois da aprovação visual.
