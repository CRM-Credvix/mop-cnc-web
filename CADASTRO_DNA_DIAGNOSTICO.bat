@echo off
setlocal
cd /d "%~dp0"
echo =======================================================
echo CREDVIX - CADASTRO DNA - DIAGNOSTICO SEM ENVIO
echo =======================================================
echo Nenhum cadastro sera criado e nenhuma fila sera reservada.
set "PY=.venv_cadastro_dna\Scripts\python.exe"
if not exist "%PY%" (
 echo Primeiro execute CADASTRO_DNA_PREPARAR_TESTE.bat nesta pasta.
 pause
 exit /b 2
)
"%PY%" -m worker.cadastro_dna.agente --testes
if errorlevel 1 goto falha
"%PY%" -m worker.cadastro_dna.agente --diagnostico
if errorlevel 1 goto falha
echo.
echo DIAGNOSTICO FINALIZADO - SEM ALTERACOES PRODUTIVAS.
pause
exit /b 0
:falha
echo TESTES FALHARAM - NAO INSTALAR EM PRODUCAO.
pause
exit /b 1
