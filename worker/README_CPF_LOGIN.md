# Robô DNA v1.3 — comparação CPF + Login

A página de Manutenção de Usuário do DNA exibe CPF e Login. O worker
consulta **somente** esses dois campos no formulário aberto, valida os
dígitos verificadores, compara os números e exige resultados estáveis em
duas leituras no mesmo frame.

## Privacidade e limites
- Nenhum clique/alteração/gravação no DNA.
- CPF/Login completos não são gravados no JSON nem enviados ao MOP-CNC.
- O worker só registra resultado, flags e HMAC-SHA256 do CPF, usando
  uma chave aleatória local persistente em `%LOCALAPPDATA%`.
- O HMAC é pseudônimo, não anonimização completa; trate o relatório como
  dado pessoal sob controle de acesso e não compartilhe publicamente.
- `CPF=Login` **não prova a identidade independente**, sobretudo se o
  login é definido pelo próprio CPF. Ainda é necessário validar a
  correspondência/ausência de duplicidade na fonte autorizada.
- `dna_inspecoes.identidade_status` permanece `nao_verificada`;
  modelos não são ativados e não se cria lote automaticamente.
- Se os controles não puderem ser localizados no DNA real, a leitura
  informa a ausência em vez de presumir sucesso.

## Operação
O instalador privado `Credvix_DNA_ROBO_UM_CLIQUE_v1_3_CPF_LOGIN.zip`
contém os dois snapshots das permissões e `INICIAR_ROBO_DNA.bat`.
Extrair ZIP, executar `.bat`, selecionar perfil, autenticar manualmente
no Edge, abrir Manutenção de Usuário e expandir permissões. Pressione
Enter no CMD do robô. Depois importe `diagnostico_*.json` na seção
Auditoria DNA do MOP-CNC.

## Testes
32 casos Python aprovados; 3 cenários DOM sintéticos em Chromium.
É indispensável homologar na tela real do DNA antes de usar a leitura
para vinculação de pessoas; os testes simulados não garantem o DOM real.