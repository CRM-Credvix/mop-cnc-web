@echo off
setlocal
cd /d "%~dp0"
echo =======================================================
echo CREDVIX - CADASTRO DNA - DIAGNOSTICO SEM ENVIO
echo =======================================================
echo Nenhum cadastro sera criado e nenhuma fila sera reservada.
where py >nul 2>&1
if %errorlevel%==0 (
  py -3 -m worker.cadastro_dna.agente --testes
  if errorlevel 1 goto falha
  py -3 -m worker.cadastro_dna.agente --diagnostico
) else (
  python -m worker.cadastro_dna.agente --testes
  if errorlevel 1 goto falha
  python -m worker.cadastro_dna.agente --diagnostico
)
echo.
echo DIAGNOSTICO FINALIZADO - SEM ALTERACOES PRODUTIVAS.
pause
exit /b 0
:falha
echo TESTES FALHARAM - NAO INSTALAR EM PRODUCAO.
pause
exit /b 1
