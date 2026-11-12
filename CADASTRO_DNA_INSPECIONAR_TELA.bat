@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo CREDVIX - INSPECAO DA TELA DE CADASTRO DNA
echo ==================================================
echo REQUISITO: Edge ja aberto na tela Cadastro DNA,
echo com depuracao local ativada na porta 9222.
echo Nenhum cadastro ou alteracao sera realizado.
echo.
where py >nul 2>&1
if %errorlevel%==0 (
 py -3 worker\cadastro_dna\inspecao.py --saida diagnostico_cadastro_dna_estrutura.json
) else (
 python worker\cadastro_dna\inspecao.py --saida diagnostico_cadastro_dna_estrutura.json
)
echo.
echo Se o resultado for REVISAO, confira a janela do Edge.
echo O relatorio NAO inclui CPF, nome ou senha.
pause
