@echo off
setlocal
cd /d "%~dp0"
echo ===========================================================
echo MOP CNC + MULTIEXTRACOES - PREFLIGHT SEM EXECUCAO REAL
echo NAO CONSULTA FILAS E NAO ABRE O POWER BI
echo ===========================================================
if not exist ".env" (
  echo [BLOQUEADO] Configure worker\.env para executar o preflight.
  exit /b 2
)
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" worker_unificado.py --preflight
) else (
  py -3 worker_unificado.py --preflight
)
set "MOP_RC=%ERRORLEVEL%"
echo CODIGO_DE_SAIDA=%MOP_RC%
exit /b %MOP_RC%
