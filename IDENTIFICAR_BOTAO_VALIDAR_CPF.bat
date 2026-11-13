@echo off
setlocal
cd /d "%~dp0"
title CREDVIX - MAPEAR TERCEIRO ICONE VALIDAR CPF
echo CREDVIX - INSPECAO DO TERCEIRO ICONE
echo NAO CLICA EM VALIDAR CPF.
set "PY=.venv_cadastro_dna\Scripts\python.exe"
if not exist "%PY%" (
 echo Ambiente Python ausente nesta pasta.
 echo Utilize a pasta do projeto onde os testes ja funcionaram.
 goto fim
)
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" (
 echo Microsoft Edge nao encontrado.
 goto fim
)
set "PROFILE=%LOCALAPPDATA%\Credvix\DNA_Diagnostico_Edge"
start "" "%EDGE%" --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --user-data-dir="%PROFILE%" "https://cadastro.help.com.br/"
echo Abra Usuario - Manutencao e deixe a barra com 7 icones visivel.
echo Pode ser usuario ja validado. Nao clique em nenhum icone.
pause
"%PY%" -m worker.cadastro_dna.inspecao_validar_cpf
if errorlevel 1 echo A estrutura nao foi localizada. Envie o resultado ou tela anonimizada.
echo Relatorio: RELATORIOS_CADASTRO_DNA\validar_cpf_terceiro_icone.json
:fim
pause
exit /b
