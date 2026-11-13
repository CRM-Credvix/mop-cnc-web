# Validar CPF — protecao contra clicar no icone errado

## Evidencia visual do operador (13/11/2026)
- Barra exibida com **sete icones**.
- A opcao **Validar CPF** corresponde ao **terceiro icone da esquerda para a direita**, ou indice 2 (base zero).
- A primeira imagem e um recorte do icone; as imagens **nao revelam atributos HTML, ng-click, seletor nem destino da acao**.
- Diagnostico anterior `validar_cpf.json`: zero candidatos com texto/titulo acessivel; portanto o seletor ainda **nao foi homologado**.

## Politica obrigatoria
O robo nao pode clicar apenas no terceiro icone por posicao. Antes de qualquer clique deve:
1. Confirmar a **linha do colaborador** por identificadores independentes; em caso de ambiguidades, BLOQUEAR.
2. Confirmar exatamente **sete controles de acao** na barra da linha, sem controles extras.
3. Confirmar que **o terceiro** esta visivel e habilitado.
4. Comparar o atributo de acao `ng-click` / `data-ng-click` ou `id` com uma **assinatura REAL homologada** da opcao Validar CPF — nunca inferida por imagem.
5. Confirmar que a assinatura e unica na linha e pertence ao terceiro controle.
6. Se qualquer item divergir, **nao clicar**, parar e emitir log local JSONL com motivo. O log nao deve conter nome, CPF ou credenciais.
7. Se CPF ja estiver validado, nao tentar novo clique; registrar resultado confirmado da propria interface.
8. Em resultado incerto depois de clicar, nao repetir automaticamente.

## Implementacao atual
`worker/cadastro_dna/guarda_validar_cpf.py` implementa a verificacao fail-closed, mas NAO clica. Seus testes cobrem troca de posicao, botao desabilitado, quantidade de controles diferente, falta de identidade e log. Os testes sao offline e ainda nao substituem homologacao no DNA.

## Pendente
Identificar assinatura HTML exata do **terceiro controle** na barra de sete (sem clicar ou expor dados pessoais) e associar ao gateway Playwright. O robô completo permanece bloqueado para escrita. Modulo antigo de padronizacao preservado.
