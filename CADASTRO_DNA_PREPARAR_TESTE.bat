@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo CADASTRO DNA - PREPARAR AMBIENTE ISOLADO
echo ==================================================
echo Nao modifica a versao funcional do robo e nao
echo conecta ao banco ou ao DNA.
echo.
if exist ".venv_cadastro_dna\Scripts\python.exe" goto instalar
where py >nul 2>&1
if %errorlevel%==0 (
 py -3 -m venv ".venv_cadastro_dna"
) else (
 python -m venv ".venv_cadastro_dna"
)
if errorlevel 1 goto falha
:instalar
".venv_cadastro_dna\Scripts\python.exe" -m pip install --disable-pip-version-check -r "worker\cadastro_dna\requirements.txt"
if errorlevel 1 goto falha
echo.
echo AMBIENTE PREPARADO. Proximo passo: CADASTRO_DNA_DIAGNOSTICO.bat
pause
exit /b 0
:falha
echo Falha ao preparar ambiente. Nenhum robo foi executado.
pause
exit /b 1
