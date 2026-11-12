# Etapa 5 — Mapeamento seguro do formulario de inclusao

## Status
Fase de homologacao somente leitura. Nenhum programa desta etapa faz click, preenche campo, altera Funcao Consig, executa Cadastrar ou reserva fila.

## Decisoes oficiais
- Perfil Consultor -> Sub Perfil Consultor 2.
- Perfil Supervisor -> Sub Perfil Supervisor 2.
- Funcoes Consig iguais em ambos os perfis e nao devem ser modificadas no cadastro.
- A fila Supabase e o botao de cadastro permanecem bloqueados ate homologacao.

## Para mapear os selects sem expor dados pessoais

1. Baixe uma **nova copia** da branch `feature/cadastro-colaboradores-dna-v01` pelo GitHub > Code > Download ZIP.
2. Extraia em `Area de Trabalho/PROJETOS MOP-CNC/HOMOLOGACAO CADASTRO DNA ETAPA 5`, separada da pasta do robo funcional.
3. Execute `CADASTRO_DNA_PREPARAR_TESTE.bat` e `CADASTRO_DNA_DIAGNOSTICO.bat`. A segunda execucao inclui os testes atualizados.
4. Abra `worker/ABRIR_EDGE_DIAGNOSTICO.bat`, faca o login e abra a tela de inclusao pela pesquisa da loja e icone `+`.
5. Com Perfil **Consultor** e Sub Perfil **Consultor 2** selecionados (SEM preencher os dados pessoais), execute `CADASTRO_DNA_MAPEAR_CAMPOS.bat`.
6. Renomeie o relatorio gerado `diagnostico_cadastro_dna_campos.json` para `diagnostico_cadastro_dna_consultor2.json`.
7. Na mesma tela escolha **Supervisor** e Sub Perfil **Supervisor 2**. Espere a lista carregar e execute novamente `CADASTRO_DNA_MAPEAR_CAMPOS.bat`.
8. Renomeie o segundo arquivo para `diagnostico_cadastro_dna_supervisor2.json`.
9. Envie apenas esses dois JSONs para a revisao. Eles contem somente contagens e rótulos autorizados, sem CPF, nome, telefone, senha ou screenshot.

## O que avaliar nos JSONs
- Identificacao de uma unica tela com botao Cadastrar.
- Metadados de identificacao de selects (id, name, ng-model) e rótulos de opcoes predefinidas.
- Consistencia dos controles entre os dois subperfis.
- Campos obrigatorios como Nome, CPF, Data de Nascimento, E-mail, Telefone Celular, Perfil, Sub Perfil.

## Limites
Esta etapa NAO verifica valores digitados, login IB Consig, SSO ou o resultado final da validacao CPF.
O diagnóstico confirma apenas estrutura — nao que os selects sejam editaveis ou tenham sido gravados.
A selecao da loja pelo `+` deve ser validada por codigo da franquia antes de futura automacao.

## Próxima implementação
Depois de confirmar os seletores estaveis, implementar a rotina Python de preenchimento e **preflight sem Cadastrar**, com:
- conferência da loja;
- CPF valido e dados obrigatorios;
- escolha exata Perfil e Sub Perfil;
- nenhuma alteracao das Funcoes Consig;
- interrupcao em qualquer ambiguidade;
- nenhum cadastro real ate teste controlado do sinal oficial de CPF validado.

Nao realizar merge da branch, nao aplicar SQL e nao implantar Edge Function nesta fase.
