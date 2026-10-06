@echo off
setlocal
cd /d "%~dp0"

if not exist ".env" (
  echo [ERRO] Arquivo .env nao encontrado.
  echo Copie .env.example para .env e preencha os dados.
  pause
  exit /b 1
)

if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" worker_mop.py
) else (
  python worker_mop.py
)

pause
