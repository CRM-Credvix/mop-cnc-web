# DNA – Conferência de Usuários integrada ao Supabase

Esta atualização conecta **Gestão → Conferência → Acompanhamento** à fila de *consulta somente leitura*, separada do fluxo de **alteração de permissões**. A nova fila opera sem modelo ativo de aplicação: não configura nada no DNA.

## Operação no site
1. Login com a conta administrativa autorizada no MOP-CNC.
2. Em Gestão, informar de 1 a 50 linhas no formato `CPF; Nome completo; Login opcional`. O Login exato resolve duplicidades quando conhecido.
3. Selecionar o perfil de referência e clicar **Conferir usuários**.
4. Revisar e clicar **Registrar conferência na fila**.
5. Em Acompanhamento, consultar os estados reais. A fila exibirá **Aguardando robô local** enquanto nenhum serviço worker estiver conectado.

## Segurança e privacidade
- CPF passa ao Supabase por HTTPS, é validado no servidor e criptografado com AES-256 no schema privado.
- A tabela pública contém somente nome, os 4 últimos dígitos do CPF e hash HMAC com chave privada; nenhuma chave de criptografia fica no HTML/JS.
- Credenciais e chave do worker não são colocadas no GitHub Pages, no browser ou no ZIP público.
- Apenas `crm@credvix.com`, conferido por ID de auth e RLS, pode criar e visualizar solicitações.
- A RPC pública cria lotes por idempotência; a RPC de reserva só concede acesso ao papel `service_role`.
- Nenhuma permissão é alterada no DNA. Modelos continuam inativos.
- A fila do Supabase está pronta, mas **nenhum worker contínuo foi instalado ou configurado no computador do operador**. Os pedidos só serão executados quando essa conexão segura for estabelecida.

## Verificação
Migração validada em transação SQL com ROLLBACK: criação, criptografia, reserva, conclusão, estados e ausência de registros após o teste. Cinco testes em Chromium para validação de CPF, duplicidades, envio e renderização sem CPF. Homologação do frontend em sessão real ainda necessária.

## Arquivos
`supabase/migrations/*dna_consulta_fila*.sql` — estrutura SQL.
`js/dna-consulta-fila.js` — envio e acompanhamento.
`js/perfis-dna.js` e `perfis-dna.html` — formulário, prévia e roteiro.
