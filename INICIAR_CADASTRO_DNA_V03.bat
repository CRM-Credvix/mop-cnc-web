@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo CREDVIX - CADASTRO DNA v0.3 - HOMOLOGACAO SEM GRAVACAO
echo ============================================================
set "PY=%~dp0.venv_cadastro_dna\Scripts\python.exe"
if not exist "%PY%" (
 echo Ambiente Python ausente. Execute CADASTRO_DNA_PREPARAR_TESTE.bat.
 pause
 exit /b 2
)
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" (
 echo Microsoft Edge nao encontrado.
 pause
 exit /b 2
)
set "PROFILE=%LOCALAPPDATA%\Credvix\DNA_Diagnostico_Edge"
if not exist "%PROFILE%" mkdir "%PROFILE%"
start "" "%EDGE%" --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --user-data-dir="%PROFILE%" "https://cadastro.help.com.br/"
echo.
echo No Edge de diagnostico, faca login manualmente.
echo Abra MANUTENCAO DE USUARIO + FORMULARIO ou USUARIO - MANUTENCAO.
echo NAO preencha dados pessoais, NAO CLIQUE em Cadastrar ou Validar CPF.
echo Apos abrir a tela desejada, volte aqui.
pause
"%PY%" -m worker.cadastro_dna.robo_v03 --saida "RELATORIOS_CADASTRO_DNA\cadastro_dna_v03.json"
set "RESULTADO=%errorlevel%"
echo.
echo Relatorio: RELATORIOS_CADASTRO_DNA\cadastro_dna_v03.json
if not "%RESULTADO%"=="0" echo Inspecao inconclusiva. Nao houve cadastro.
pause
exit /b %RESULTADO%
