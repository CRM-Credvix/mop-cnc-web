@echo off
setlocal
cd /d "%~dp0"
echo CREDVIX - IDENTIFICAR BOTAO VALIDAR CPF
echo SOMENTE LEITURA. Nenhum click sera feito.
set "PY=.venv_cadastro_dna\Scripts\python.exe"
if not exist "%PY%" (
 echo Ambiente ausente. Execute uma vez INICIAR_CADASTRO_DNA_TUDO_EM_UM.bat
 pause
 exit /b 2
)
echo No Edge de diagnostico JA ABERTO, abra Usuario - Manutencao.
echo Localize manualmente um usuario autorizado e deixe visivel a opcao Validar CPF.
echo NAO CLIQUE nessa opcao.
pause
"%PY%" -m worker.cadastro_dna.inspecao_validar_cpf
if errorlevel 1 (
 echo Nao foi encontrado um unico candidato; envie o relatorio para revisao.
)
echo Relatorio: RELATORIOS_CADASTRO_DNA\validar_cpf.json
pause
