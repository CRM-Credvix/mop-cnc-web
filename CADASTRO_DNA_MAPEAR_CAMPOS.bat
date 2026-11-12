@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo CREDVIX - INSPECAO DOS CAMPOS CADASTRO DNA
echo ==================================================
echo Somente leitura. Nao altera campos, perfis ou funcoes.
echo.
set "PY=.venv_cadastro_dna\Scripts\python.exe"
if not exist "%PY%" (
 echo Primeiro execute CADASTRO_DNA_PREPARAR_TESTE.bat.
 pause
 exit /b 2
)
"%PY%" -m worker.cadastro_dna.inspecao_campos --saida "diagnostico_cadastro_dna_campos.json"
if errorlevel 1 (
 echo LEITURA INCONCLUSIVA. Nenhuma gravacao realizada.
) else (
 echo Relatorio estrutural gerado na pasta principal.
)
pause
