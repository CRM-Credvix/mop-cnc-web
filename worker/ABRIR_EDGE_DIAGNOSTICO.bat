@echo off
setlocal
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" (echo Microsoft Edge nao encontrado & exit /b 1)
set "PROFILE=%LOCALAPPDATA%\Credvix\DNA_Diagnostico_Edge"
start "" "%EDGE%" --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --user-data-dir="%PROFILE%" "https://cadastro.help.com.br/"
echo Use SOMENTE a nova janela do Edge. Faca login manualmente.