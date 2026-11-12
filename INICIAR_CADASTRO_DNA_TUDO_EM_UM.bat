@echo off
setlocal
cd /d "%~dp0"
title CREDVIX - CADASTRO DNA - HOMOLOGACAO UNIFICADA
echo ============================================================
echo CREDVIX - CADASTRO DNA - TUDO EM UMA EXECUCAO
echo ============================================================
echo SOMENTE DIAGNOSTICO - NENHUM CADASTRO SERA REALIZADO.
echo.
set "PY=.venv_cadastro_dna\Scripts\python.exe"
if exist "%PY%" goto ambiente_pronto
echo [1/3] Preparando ambiente isolado pela primeira vez...
where py >nul 2>&1
if %errorlevel%==0 (
 py -3 -m venv ".venv_cadastro_dna"
) else (
 python -m venv ".venv_cadastro_dna"
)
if errorlevel 1 goto erro
"%PY%" -m pip install --disable-pip-version-check -r "worker\cadastro_dna\requirements.txt"
if errorlevel 1 goto erro
:ambiente_pronto
echo [2/3] Executando testes offline...
"%PY%" -m worker.cadastro_dna.agente --testes
if errorlevel 1 goto erro
echo.
echo [3/3] Abrindo Edge e mapeando Consultor 2 + Supervisor 2...
"%PY%" -m worker.cadastro_dna.homologacao_unificada
if errorlevel 1 goto erro
echo.
echo SUCESSO: Abra a pasta RELATORIOS_CADASTRO_DNA.
echo Envie os arquivos consultor2.json e supervisor2.json.
pause
exit /b 0
:erro
echo.
echo DIAGNOSTICO INTERROMPIDO. NAO CADASTRAR NINGUEM.
echo Se a pasta .venv foi criada parcialmente, execute este BAT novamente.
pause
exit /b 2
