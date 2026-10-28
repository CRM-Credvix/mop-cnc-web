# DNA v1.2 — identificador técnico como candidato (não homologado)

## Objetivo e segurança
O robô segue **somente leitura**. A ferramenta coleta metadados estritamente permitidos no formulário de manutenção ativo, realiza duas leituras da mesma aba e compara os resultados. Não grava IDs em texto puro no JSON. Os hashes SHA-256 facilitam correlacionar evidências, mas **não são provas de identidade e não são anonimização forte**.

## Limites
- Somente `usuario.id`, `usuario.codigo`, `usuario.matricula`, `usuario.uuid` em campos de formulário e parâmetros/atributos explicitamente permitidos pelo inspetor.
- Não coleta senhas, cookies, armazenamento do navegador, HTML integral nem URLs completas.
- Se houver valores conflitantes ou alteração entre leituras, registra inconclusivo.
- Se a estrutura real do DNA não expuser ID técnico nessas fontes, retorna `identificador_ausente`. Não inventa IDs.
- Status persistido permanece **`nao_verificada`**. Nunca vincula automaticamente a `dna_itens.dna_usuario_id` ou a um lote.
- O banco continua com modelos inativos; a fila não executa alterações.

## Execução
O pacote privado `Credvix_DNA_ROBO_UM_CLIQUE_v1_2.zip` substitui o antigo. O operador extrai todos os arquivos, dá duplo clique em `INICIAR_ROBO_DNA.bat`, escolhe o perfil, entra no Edge e abre o cadastro autorizado. Ao pressionar Enter, a leitura registra o parecer técnico no relatório JSON v2. Na tela `perfis-dna.html#auditoria`, a importação continua autenticada e o parecer aparece como **candidato técnico não confirmado**.

Os modelos privados NÃO estão no repositório público nem em `GitHub Pages`.

## Homologação futura
Confirmar, em duas sessões com cadastros conhecidos e diferentes, que o mesmo campo técnico representa inequivocamente o ID persistente do usuário no DNA. Só depois avaliar alterações adicionais no esquema e operação de fila. Não habilitar escrita sem essa verificação.

## QA
22 testes Python offline (incluindo relatórios v2 com 227 controles e ausência de identificadores em texto puro); teste JS isolado de allowlist e leitura de DOM. Teste SQL com ROLLBACK: o Supabase aceita metadados técnicos sem mudar `nao_verificada`. Sem teste no DNA real ou Windows nesta execução.
