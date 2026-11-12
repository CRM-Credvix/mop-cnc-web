# Cadastro DNA — Funcoes Consig e reaproveitamento do motor v5.5

## Evidencias analisadas (12/11/2026)
- Captura da tela de inclusao com Perfil **Consultor**, Sub Perfil **Consultor 2**.
- Operador confirmou que as **Funcoes Consig sao iguais para Consultor e Supervisor** e nao serao alteradas no fluxo de cadastro.
- Arquivos de referencia locais enviados: `dna_web_executor.py`, `dna_operacional_v5514.py`, `dna_replicador_v55.py`.

## Regra de negocio confirmada
Na **inclusao de novos usuarios**, o robo nao devera marcar/desmarcar nem fazer replicacao integral das Funcoes Consig. A tela pode apresentar funcoes ja carregadas de acordo com o subperfil; a identidade e os controles precisam ser lidos de novo imediatamente antes de Cadastrar, sem tentar corrigir mudancas inesperadas automaticamente.

**Os quatro modelos do modulo existente de padronizacao sao preservados**. O novo cadastro usa apenas:
- CONSULTOR -> CONSULTOR_2 (Consultor 2)
- SUPERVISOR -> SUPERVISOR_2 (Supervisor 2)

## Nao confundir dois fluxos
1. **Cadastro**: escolher loja pela linha e icone `+`, preencher os dados, definir perfil/subperfil oficiais, conferir regras de formulario e a submissao unica; nao editar permissoes.
2. **Padronizacao**: ja possui motor separado com leitura de **224 permissoes** e tres controles especiais de SSO/globais, planos de diferencas, autorizacao e verificacao independente. Nao chamar o motor de gravacao da padronizacao como substituto do botao Cadastrar.

## Resultados importantes dos arquivos existentes
- O executor web exige integridade local, quatro modelos com hash e operador Windows homologado; suas RPCs atuais sao `dna_web_reservar_v2` e `dna_web_finalizar`, exclusivas da **padronizacao**.
- O operador `dna_operacional_v5514.py` primeiro consulta/valida e so grava mudancas de permissao quando autorizado; bloqueia o reenvio em caso de gravacao incerta.
- O replicador `dna_replicador_v55.py` identifica os selects do subperfil por opcoes e atributos estaveis, aguarda atualizacao Angular e preserva SSO/globais quando padroniza. Esses procedimentos **somente leitura e verificacao** sao referencias para desenvolver o cadastro.
- Nenhum desses tres arquivos demonstra de forma suficiente os seletores e o retorno definitivo da acao **Cadastrar** ou a **validacao do CPF** apos a inclusao; a nova automacao segue bloqueada.

## O que falta homologar antes de escrita
- Confirmar valores padrao dos campos SSO, Login IB Consig, Descricao uso Perfil, perfil e subperfil, tanto no Consultor 2 como no Supervisor 2.
- Manter as Funcoes Consig inalteradas nos dois perfis, conforme regra confirmada; interromper se uma alteracao automatica inesperada ocorrer.
- Mapear o botao Cadastrar e os modais de confirmacao somente para **um teste autorizado**, com uma unica tentativa.
- Confirmar se o DNA considera cadastro criado, CPF validado e conta Ativa como eventos distintos; nao deduzir sucesso pelo clique.
- Validar limite de Supervisor por loja e ausencia de conta existente, em especial se houver varios vinculos de franquia.
- Revisar seletores estaveis, obter evidencias de nova sessao somente leitura e executar testes integrados.

## Seguranca
Nao executar `dna_operacional_v5514.process` ou `dna_replicador_v55.execute` no fluxo de criacao. Nao copiar chaves Supabase nem credenciais DNA. O codigo da branch segue **nao produtivo**, e a feature flag de escrita permanece desligada. Nunca enviar CPF, senha ou tokens em relatorios de diagnostico.
