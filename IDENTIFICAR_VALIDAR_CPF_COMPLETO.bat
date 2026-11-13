@echo off
setlocal
cd /d "%~dp0"
title CREDVIX - IDENTIFICAR VALIDAR CPF
echo CREDVIX - INSPECAO VALIDAR CPF
echo Somente leitura. Nao clica no sistema.
set "PY=%~dp0.venv_cadastro_dna\Scripts\python.exe"
if not exist "%PY%" set "PY=python"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" (
 echo ERRO - Edge nao encontrado.
 goto fim
)
set "PROFILE=%LOCALAPPDATA%\Credvix\DNA_Diagnostico_Edge"
start "" "%EDGE%" --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --user-data-dir="%PROFILE%" "https://cadastro.help.com.br/"
echo No Edge aberto, faca login. Entre em Usuario - Manutencao.
echo Deixe a opcao Validar CPF visivel, mas NAO clique nela.
pause
"%PY%" -c "import pathlib,sys;p=pathlib.Path(sys.argv[1]);s=p.read_text(encoding='utf-8-sig').splitlines();exec(compile(chr(10).join(s[s.index('::PYTHON_START')+1:]),str(p),'exec'))" "%~f0"
if errorlevel 1 echo Diagnostico nao concluido. Envie uma foto desta janela.
:fim
pause
exit /b
::PYTHON_START
import json, pathlib, re, sys
from urllib.parse import urlsplit
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("ERRO: Playwright ausente. Execute o BAT unificado de preparacao primeiro.")
    raise SystemExit(2)

def allowed(url):
    u=urlsplit(url)
    return u.scheme=="https" and u.hostname=="cadastro.help.com.br"

js=r"""() => {
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  return [...document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')]
    .filter(el=>[el.textContent,el.getAttribute('title'),el.getAttribute('aria-label'),
      el.getAttribute('data-original-title'),el.matches('input')?el.getAttribute('value'):null]
      .some(s=>{const t=norm(s);return t.length<80 && t.includes('validar') && t.includes('cpf');}))
    .slice(0,20).map(el=>({
       tag:el.tagName.toLowerCase(), id:el.getAttribute('id')||'',
       name:el.getAttribute('name')||'',
       ng_click:el.getAttribute('ng-click')||el.getAttribute('data-ng-click')||'',
       visivel:!!el.getClientRects().length,desabilitado:!!el.disabled
    }));
}"""
try:
    with sync_playwright() as pw:
        browser=pw.chromium.connect_over_cdp("http://127.0.0.1:9222",timeout=10000)
        try:
            frames=[f for ctx in browser.contexts for page in ctx.pages for f in page.frames if allowed(f.url)]
            if len(frames)!=1:
                print("ERRO: esperada uma tela DNA, encontradas:",len(frames))
                raise SystemExit(2)
            found=frames[0].evaluate(js)
        finally:
            browser.close()
    safe=lambda s: str(s) if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_.:-]{0,95}",str(s)) else ""
    items=[{k:safe(x[k]) for k in ("tag","id","name","ng_click")} |
           {"visivel":x["visivel"],"desabilitado":x["desabilitado"]} for x in found]
    result={"situacao":"acao_candidata" if len(items)==1 else "revisao",
            "acao":"validar_cpf","quantidade_candidatos":len(items),
            "candidatos":items,"clicou":False,"leu_dados_pessoais":False}
    path=pathlib.Path(sys.argv[1]).resolve().parent/"RELATORIOS_CADASTRO_DNA"
    path.mkdir(exist_ok=True)
    dest=path/"validar_cpf.json"
    dest.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    print("Relatorio salvo:",dest)
    print("Acoes candidatas:",len(items))
except Exception as exc:
    print("ERRO na inspecao:",type(exc).__name__)
    print("Confira o Edge de diagnostico e a opcao Validar CPF.")
    raise SystemExit(2)
