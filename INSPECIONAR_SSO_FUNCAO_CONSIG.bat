@echo off
setlocal
cd /d "%~dp0"
echo =======================================================
echo CREDVIX - INSPECAO SSO E FUNCAO CONSIG - SOMENTE LEITURA
echo =======================================================
set "PY=.venv_cadastro_dna\Scripts\python.exe"
if not exist "%PY%" (
 echo Python nao encontrado. Execute CADASTRO_DNA_PREPARAR_TESTE.bat.
 pause
 exit /b 2
)
echo No Edge de diagnostico JA ABERTO, abra o formulario Cadastro DNA.
echo Deixe SSO e Funcao Consig visiveis. NAO PREENCHA dados pessoais.
echo NAO CLIQUE em Cadastrar.
pause
"%PY%" -m worker.cadastro_dna.inspecao_sso_consig --saida "RELATORIOS_CADASTRO_DNA\sso_funcao_consig.json"
set "CODIGO=%errorlevel%"
if not "%CODIGO%"=="0" echo Diagnostico inconclusivo. Nenhum cadastro realizado.
echo Confira RELATORIOS_CADASTRO_DNA\sso_funcao_consig.json
pause
exit /b %CODIGO%
