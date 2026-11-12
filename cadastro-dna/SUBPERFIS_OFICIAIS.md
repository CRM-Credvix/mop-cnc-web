# Cadastro DNA — Padrão oficial de perfil e subperfil

**Decisão do administrador (12/11/2026)**

| Perfil DNA | Subperfil definitivo de CADASTRO | Rótulo do DNA |
|---|---|---|
| CONSULTOR | CONSULTOR_2 | Consultor 2 |
| SUPERVISOR | SUPERVISOR_1 | Supervisor 1 |

## Escopo estrito
Esta definição vale **somente para a inclusão de novos colaboradores** na futura funcionalidade Cadastro DNA do MOP-CNC. Os modelos de padronização de permissões `CONSULTOR_1`, `CONSULTOR_2`, `SUPERVISOR_1` e `SUPERVISOR_2` **continuam existentes e não são modificados**. A escolha do perfil no cadastro determina o subperfil automaticamente, sem opção de edição pelo operador.

O DNA também apresenta Consultor 1, Consultor 3, Consultor B2C, Consultor Híbrido e Supervisor 2, mas esses não são aceitos para NOVOS cadastros através deste fluxo.

## Controles implementados na branch
- `cadastro-colaboradores.html`: campo de subperfil de **somente leitura**, associado ao Perfil.
- `js/cadastro-colaboradores.js`: cálculo do subperfil e verificação da correspondência antes do envio.
- `supabase/functions/cadastro-dna-criar/index.ts`: dedução independente do subperfil no servidor; ignora escolhas visuais e rejeita subperfil divergente quando fornecido. Apenas `CONSULTOR` ou `SUPERVISOR` são admitidos.
- `cadastro-dna/schema_seguro_v02.sql`: coluna `subperfil`, restrição de correspondência entre perfil e subperfil e cálculo do valor na própria RPC SQL. A reserva futura do worker retorna o subperfil persistido para conferir a seleção no DNA.
- `worker/cadastro_dna/perfis.py`: contrato Python que rejeita combinações não oficiais.
- `worker/cadastro_dna/test_perfis.py` e `test_sql_invariantes.py`: testes de regressão.

## Regras para o futuro robô Playwright
1. Selecionar a loja pela linha correta e botão `+` (confirmar o identificador da franquia).
2. Na tela Manutenção de Usuário, escolher Perfil Consultor ou Supervisor.
3. **Esperar o DNA atualizar a lista Sub Perfil**; selecionar o rótulo exato "Consultor 2" ou "Supervisor 1".
4. Ler novamente Perfil, Sub Perfil e Loja; bloquear a execução se qualquer um divergir.
5. Conferir SSO, limites de Supervisor por loja e permissões aplicáveis. Ainda não presumir seus valores.
6. Só cadastrar após autorização e homologação específica dos controles. Se a resposta for incerta, nunca repetir automaticamente.
7. A situação "Ativo" exige comprovação da validação de CPF além da situação do usuário.

## Produção continua bloqueada
- SQL de cadastro ainda não implantado no Supabase; `cadastro_ativo=false` por padrão na proposta.
- Endpoint de criação ainda não implantado.
- Agente do Windows ainda sem homologação para clicar no botão Cadastrar.
- Nenhum dos quatro modelos de padronização foi desabilitado ou alterado.
- Não realizar merge no `main` até concluir testes integrados, a verificação do status final do CPF e revisão de segurança.
