@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo CREDVIX - INSPECAO DA TELA DE CADASTRO DNA
echo ==================================================
echo Requer Edge de diagnostico aberto na porta 9222.
echo Nenhum cadastro ou alteracao sera realizado.
set "PY=.venv_cadastro_dna\Scripts\python.exe"
if not exist "%PY%" (
 echo Primeiro execute CADASTRO_DNA_PREPARAR_TESTE.bat.
 pause
 exit /b 2
)
"%PY%" "worker\cadastro_dna\inspecao.py" --saida "diagnostico_cadastro_dna_estrutura.json"
if errorlevel 1 (
 echo Diagnostico inconclusivo. Confira o Edge e tente novamente.
) else (
 echo Relatorio estrutural salvo na pasta atual.
)
pause
