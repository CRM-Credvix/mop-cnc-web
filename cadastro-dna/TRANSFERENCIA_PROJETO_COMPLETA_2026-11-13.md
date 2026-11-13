# DOCUMENTO DE TRANSFERÊNCIA — CADASTRO DNA / MOP-CNC
Data de corte: 13/11/2026. Fonte: conversa completa e branch GitHub confirmada.
Repositório: https://github.com/CRM-Credvix/mop-cnc-web
Branch: `feature/cadastro-colaboradores-dna-v01`
PR: https://github.com/CRM-Credvix/mop-cnc-web/pull/56

## 1. OBJETIVO
Automatizar inclusão de colaboradores no sistema DNA, por loja, via MOP-CNC.
Cadastrar Consultores/Supervisores, ativar SSO, marcar primeira Função Consig e validar CPF posteriormente.
Público: operação Credvix autorizada, com controle de acesso e auditoria.

## 2. STACK E AMBIENTE
- Windows 10, estação `CRM`, pasta `Desktop\CREDVIX - CADASTRO DNA - ETAPA 6`.
- Python 3.11 [CONFIRMAR versão local], Playwright síncrono, `requests`, `cryptography`.
- Navegador Microsoft Edge com CDP local: `http://127.0.0.1:9222`.
- DNA Web: `https://cadastro.help.com.br/`.
- MOP-CNC: HTML, CSS, JavaScript estático, GitHub Pages [CONFIRMAR hospedagem].
- Supabase: Auth, PostgreSQL, Edge Functions, SQL/RLS propostos; **não implantados**.
- GitHub: `CRM-Credvix/mop-cnc-web`, branch isolada e PR #56 em rascunho [CONFIRMAR estado atual].
- Integrações existentes de Padronização DNA: motor Python v5.5 e RPCs `dna_web_*`; não reutilizar escrita.
- Credenciais DNA, Supabase e sessões Windows: **[OCULTO]**. Nunca colocar chaves em front-end ou logs.
- Arquivos de referência recebidos: `dna_web_executor(3).py`, `dna_operacional_v5514(3).py`, `dna_replicador_v55(4).py`.
- Outras referências de projeto disponíveis na conversa: contexto Credvix, `bot_dna.py`, `integrador.py`; não presumir compatibilidade.

## 3. ESTADO ATUAL
- ✅ 45 testes offline aprovados **na execução reportada pelo usuário**; versões posteriores ainda sem execução confirmada.
- ✅ Dois JSONs reais: `consultor2.json` e `supervisor2.json`.
- ✅ IDs DNA: `#perfilVenda` e `#subPerfilVenda`; ng-models respectivos confirmados.
- ✅ Perfis oficiais: Consultor → Consultor 2; Supervisor → Supervisor 2.
- ✅ Uma tela de inclusão e um botão `Cadastrar` identificados.
- ✅ Ordem do fluxo definida; código de seleção Perfil → Subperfil preparado.
- ✅ Proteção lógica para 3º ícone entre 7, com interrupção e log.
- ✅ Motor antigo de Padronização preservado; quatro modelos intactos.
- ⚠️ `fluxo_completo.py` é orquestrador com gateway abstrato; não é robô operacional.
- ⚠️ `guarda_validar_cpf.py` não executa clique; assinatura HTML real ainda ausente.
- ⚠️ Inspetor novo identifica 7 ações por célula da tabela; depende de teste no DNA.
- ⚠️ Inspeção prévia `validar_cpf.json`: `quantidade_candidatos: 0`.
- ⚠️ SSO identificado visualmente, mas atributo ainda depende de confirmação na criação.
- ⚠️ Primeira Função Consig definida como necessária; seletor ainda não homologado.
- ⚠️ SQL, Edge Function e integração Windows não homologados nem publicados.

## 4. PENDÊNCIAS E ERROS
- Obter atributos reais do **3º ícone** na barra de **7** ações; nunca clicar por posição isoladamente.
- Confirmar a barra vinculada à linha correta e identidade única do colaborador.
- Identificar primeira Função Consig; marcar apenas se desmarcada.
- Validar seletor SSO `usuario.acessoSso` na tela de inclusão.
- Homologar seleção da loja pelo código e botão `+`, campos obrigatórios e datas.
- Homologar sucesso de `Cadastrar`, eventual modal, busca por nome, estado de CPF e resposta final.
- Implementar gateway Playwright real e tratamento de submissão única, sem repetição em estado incerto.
- Executar testes integrados com usuário de teste autorizado antes de liberar escrita.
- Erro BAT registrado: `'IDENTIFICAR' não é reconhecido como um comando interno ou externo, um programa operável ou um arquivo em lotes.`
- Causa: `echo CREDVIX | IDENTIFICAR...`; pipe interpretado pelo CMD. Corrigido com hífen.
- Outro erro: BAT anterior não abria Edge; corrigido no BAT de inspeção atualizado.
- Diagnóstico antigo retornou zero candidatos; procurava texto/tooltip `Validar CPF` em ícone sem rótulo.
- Não repetir mapeamento Consultor 2/Supervisor 2. Usuário fez esse trabalho duas vezes.
- [CONFIRMAR] O inspetor atualizado encontra a estrutura correta na sessão real.
- [CONFIRMAR] Se existem ícones ocultos ou elementos aninhados, revisar contagem por célula.

## 5. DECISÕES TÉCNICAS
- **Python + Playwright:** automação Windows compatível com robôs existentes.
- **CDP local Edge:** aproveitar login manual sem expor credenciais.
- **Perfil primeiro:** subperfil Angular depende da seleção do perfil.
- **Consultor 2 / Supervisor 2:** decisão definitiva exclusiva do Cadastro DNA.
- **SSO marcado:** exigência explícita na inclusão.
- **Primeira Função Consig:** mínimo necessário para permitir `Cadastrar`; preservar demais.
- **Validar CPF depois:** caminho `Usuário → Manutenção → pesquisar nome → Validar CPF`.
- **Terceiro entre sete:** evidência visual auxiliar; requer atributo técnico único.
- **Fail-closed:** divergência, ambiguidade ou desabilitação impedem clique e geram log.
- **Clique único:** proibir reenvio automático de cadastro e validação.
- **Separação de módulos:** nunca modificar o motor de Padronização DNA nem seus quatro modelos.
- **Branch isolada:** sem merge, deploy ou SQL em produção antes de homologar.

## 6. REGRAS E PREFERÊNCIAS
- Responder em português brasileiro, **muito resumidamente**, com instruções diretas.
- Não solicitar dados ou diagnósticos já fornecidos.
- Uma pasta definitiva; atualizar somente arquivos necessários, sem downloads integrais recorrentes.
- Entregar BAT/arquivos prontos; conferir sintaxe e dependências antes.
- Distinguir **implementado**, **testado offline**, **testado no DNA** e **não homologado**.
- Nunca declarar conclusão de cadastro/CPF por um clique sem confirmação no DNA.
- Segurança rigorosa de loja, identidade, ícone e ações irreversíveis.
- Sem CPF, credenciais, dados pessoais ou tokens em logs/diagnósticos.
- Nunca executar cadastro real nem alterações de produção sem autorização específica.
- Não alterar arquivos de Padronização nem seus quatro modelos existentes.
- Nos documentos de transferência, preservar somente versões atuais completas.

## 7. CÓDIGO ATUAL
**Fonte de verdade:** branch acima, na data de corte.
**Escopo:** todos os arquivos ativos do módulo novo, com texto integral.
**Exclusões conscientes:** `cadastro-dna/schema_proposta.sql` (substituído pela proposta v02), protótipo `cadastro-dna/formulario.*`, BATs antigos de diagnóstico duplicado e arquivos do motor legado.
**Cuidado:** arquivos Python de guarda e inspeção são preparatórios; não autorizam clique real.

