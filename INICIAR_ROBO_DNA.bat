@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title CREDVIX DNA - Piloto integrado v4.0 - SOMENTE LEITURA
cd /d "%~dp0"

echo.
echo =============================================================
echo  CREDVIX - DNA - PILOTO INTEGRADO v4.0 SOMENTE LEITURA
echo =============================================================
echo  Nao grava, altera ou exclui usuarios no DNA.
echo.

set "WORKER=%~dp0dna_etapa2\worker"
set "FIXTURES=%~dp0dna_etapa2\fixtures"
if exist "%~dp0sessao\credencial_dna.json" set "DNA_LEGACY_CREDENTIAL_FILE=%~dp0sessao\credencial_dna.json"
if not exist "%WORKER%\iniciar_assistido.py" goto faltando_arquivos
if not exist "%FIXTURES%\modelo_consultor_v1.json" goto faltando_arquivos
if not exist "%FIXTURES%\modelo_supervisor_v1.json" goto faltando_arquivos

set "PY_COMMAND="
py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)" >nul 2>&1
if not errorlevel 1 set "PY_COMMAND=py -3"
if defined PY_COMMAND goto python_encontrado
python -c "import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)" >nul 2>&1
if not errorlevel 1 set "PY_COMMAND=python"
if not defined PY_COMMAND goto falta_python

:python_encontrado
set "VENV=%WORKER%\.venv"
if not exist "%VENV%\Scripts\python.exe" (
    echo [1/3] Preparando Python automaticamente...
    %PY_COMMAND% -m venv "%VENV%"
    if errorlevel 1 goto falha_ambiente
)
"%VENV%\Scripts\python.exe" -c "import playwright, keyring, requests" >nul 2>&1
if errorlevel 1 (
    echo [2/3] Instalando Playwright, requests e cofre Windows...
    "%VENV%\Scripts\python.exe" -m pip install --disable-pip-version-check -r "%WORKER%\requirements_dna.txt"
    if errorlevel 1 goto falha_dependencia
) else (
    echo [2/3] Dependencia ja instalada.
)

echo [3/3] Iniciando o assistente DNA...
echo.
"%VENV%\Scripts\python.exe" "%WORKER%\iniciar_assistido.py"
set "STATUS=%ERRORLEVEL%"
if not "%STATUS%"=="0" echo O assistente foi interrompido ou encontrou uma pendencia.
echo.
pause
exit /b %STATUS%

:faltando_arquivos
echo ERRO: Arquivos incompletos. Extraia TODO o ZIP antes de abrir este BAT.
goto parar
:falta_python
echo ERRO: Python 3.11 ou superior nao encontrado.
echo Instale Python pelo site python.org e abra este arquivo novamente.
goto parar
:falha_ambiente
echo ERRO: Nao foi possivel criar o ambiente Python. Confira se ha espaco em disco.
goto parar
:falha_dependencia
echo ERRO: Nao foi possivel instalar o Playwright. Confira a internet.
goto parar
:parar
echo.
pause
exit /b 1