"""Autenticacao CAS e navegacao DNA observadas nos robos CREDVIX existentes.

Nunca escreve permissoes. Envia usuario/senha somente ao CAS de hostname exato.
Reutiliza a sessao Edge dedicada. Sem CAPTCHA bypass, sem print de segredos.
"""
from __future__ import annotations

from getpass import getpass
from pathlib import Path
import json
import os
import re
import subprocess
import time
from urllib.parse import urlsplit

from dna_diagnostico import _verify_local_cdp, allowed_url

CAS_HOST = "portalfranqueado.help.com.br"
PORTAL_HOST = "dnabmg.help.com.br"
CADASTRO_HOST = "cadastro.help.com.br"
TRUSTED_HOSTS = {CAS_HOST, PORTAL_HOST, CADASTRO_HOST}
CAS_URL = ("https://portalfranqueado.help.com.br/cas/login"
           "?service=https%3A%2F%2Fdnabmg.help.com.br%2Flogin%2Fcas#/proposta/prospeccao")
KEYRING_SERVICE = "CREDVIX_DNA_CADASTRO_LOGIN_V1"  # preserva credencial WinVault v3.2
WORKER = Path(__file__).resolve().parent
LEGACY_READER = WORKER / "ler_credencial_dna.ps1"


class LoginBloqueado(RuntimeError):
    """Nao e seguro prosseguir sem operacao humana."""


def host(url: str) -> str:
    try:
        u = urlsplit(url)
        return u.hostname.lower() if u.scheme == 'https' and not u.username and not u.password and u.hostname else ''
    except ValueError:
        return ''


def trusted(url: str) -> bool:
    return host(url) in TRUSTED_HOSTS


def is_cas(url: str) -> bool:
    return host(url) == CAS_HOST and urlsplit(url).path.startswith('/cas/')


def _vault():
    if os.name != 'nt':
        return None
    try:
        from keyring.backends.Windows import WinVaultKeyring
        vault = WinVaultKeyring()
        return vault if vault.priority > 0 else None
    except (ImportError, RuntimeError, OSError):
        return None


def _legacy_credenciais():
    """Opcional: utiliza o DPAPI de outro robo, sem copiar credencial para o ZIP."""
    path = os.environ.get('DNA_LEGACY_CREDENTIAL_FILE', '').strip()
    if not path or os.name != 'nt':
        return None
    p = Path(os.path.expandvars(path)).expanduser()
    if not p.is_file() or not LEGACY_READER.is_file():
        raise LoginBloqueado('Credencial legada/leitora nao localizada no computador.')
    ps = Path(os.environ.get('SystemRoot', r'C:\Windows')) / r'System32\WindowsPowerShell\v1.0\powershell.exe'
    try:
        command = [str(ps),'-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass',
                   '-File',str(LEGACY_READER),'-CredentialFile',str(p)]
        out = subprocess.run(command, capture_output=True, text=True,
                             encoding='utf-8', errors='replace', timeout=20,
                             creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
        if out.returncode:
            raise LoginBloqueado('O Windows nao conseguiu recuperar a credencial DPAPI.')
        parsed = json.loads(out.stdout.lstrip('\ufeff'))
        if parsed.get('username') and parsed.get('password'):
            return str(parsed['username']), str(parsed['password']), True
    except (OSError, subprocess.SubprocessError, ValueError, TypeError) as e:
        raise LoginBloqueado('Falha ao abrir credencial DPAPI local.') from e
    raise LoginBloqueado('Credencial DPAPI sem usuario/senha.')


def _obter_credenciais():
    vault = _vault()
    if vault:
        existing = vault.get_credential(KEYRING_SERVICE, None)
        if existing and existing.username and existing.password:
            return existing.username, existing.password, True, vault
    legacy = _legacy_credenciais()
    if legacy:
        return legacy[0], legacy[1], True, vault
    print('Primeiro login: informe as credenciais apenas no computador local.')
    print('A senha nao aparecera no terminal; so sera salva no cofre Windows apos sucesso.')
    username = input('Usuario DNA: ').strip()
    password = getpass('Senha DNA: ')
    if not username or not password or len(username)>160:
        raise LoginBloqueado('Usuario/senha ausentes ou invalidos.')
    return username, password, False, vault


def _visible(locator) -> bool:
    try:
        return locator.count() == 1 and locator.first.is_visible(timeout=250)
    except Exception:
        return False


def _safe_locator(scope, selectors):
    """Exige candidato unico visivel por seletor; nunca escolhe .first arbitrario entre muitos."""
    for selector in selectors:
        loc = scope.locator(selector)
        if _visible(loc):
            return loc.first
    return None


def _cas_form(page):
    if not is_cas(page.url):
        return None
    user = _safe_locator(page,[
        'input[autocomplete="username"]',
        'input[name="username"]',
        'input[placeholder*="Usuário" i]',
        'input[aria-label*="Usuário" i]',
        'input[type="text"]'
    ])
    if page.locator('input[type="password"]:visible').count() > 1:
        return None  # nao escolher arbitrariamente em tela com multiplas senhas
    password = _safe_locator(page,[
        'input[type="password"]',
        'input[autocomplete="current-password"]',
        'input[aria-label*="Caps Lock" i]'
    ])
    submit = _safe_locator(page,[
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Entrar")',
    ])
    if password is None:
        # O Recorder real da CREDVIX nomeia o campo da senha como
        # "Tecla Caps Lock ativada" em alguns layouts do CAS.
        alt = page.get_by_role('textbox',name=re.compile(r'^(?:Tecla Caps Lock ativada|Senha)$',re.I))
        if _visible(alt):
            password=alt.first
    if not (user and password and submit):
        return None
    if user == password:
        return None
    return user, password, submit


def _page_challenge(page) -> bool:
    try:
        body = (page.locator('body').inner_text(timeout=1000) or '').lower()
        if re.search(r'captcha|mfa|autentica[cç][aã]o de dois fatores|c[oó]digo de verifica[cç][aã]o|\btoken\b|acesso bloqueado',body):
            return True
        return bool(page.locator('iframe[src*="recaptcha"],iframe[src*="hcaptcha"]').count())
    except Exception:
        return False


def _page_invalid(page) -> bool:
    try:
        txt=(page.locator('body').inner_text(timeout=1000) or '').lower()
        return bool(re.search(r'(usu[aá]rio ou senha|senha incorreta|senha inv[aá]lida|credenciais inv[aá]lidas|muitas tentativas)',txt))
    except Exception:
        return False


def _dna_authenticated(browser) -> bool:
    """Sinais fortes, nao apenas texto principal da pagina CAS."""
    for ctx in browser.contexts:
        for page in ctx.pages:
            if not trusted(page.url) or is_cas(page.url):
                continue
            try:
                if page.locator('input[type="password"]:visible').count():
                    continue
                if host(page.url) == CADASTRO_HOST:
                    for fr in page.frames:
                        if not allowed_url(fr.url):
                            continue
                        # A rota de consulta e o menu de usuario sao evidencias de sessao.
                        if fr.locator('#menu-usuario-manutencao').count() or fr.locator('#usuario-nome').count():
                            return True
                        txt = (fr.locator('body').inner_text(timeout=800) or '')[:5000]
                        if 'Manutenção de Usuário' in txt or 'Consulta de Usuários' in txt:
                            return True
                if page.get_by_role('link',name=re.compile('M[oó]dulo Cadastro',re.I)).count():
                    return True
                if page.get_by_role('link',name=re.compile('^Sistemas$',re.I)).count():
                    return True
                if host(page.url) == PORTAL_HOST and page.get_by_text(re.compile('Voc[eê] est[aá] logado com o usu[aá]rio',re.I)).count():
                    return True
            except Exception:
                pass
    return False


def _wait_authenticated(browser, seconds=22):
    deadline=time.monotonic()+seconds
    while time.monotonic()<deadline:
        if _dna_authenticated(browser):
            return True
        time.sleep(.4)
    return False


def _login_cas(browser, page):
    """Realiza no maximo 2 tentativas, somente no dominio CAS explicitamente validado."""
    if not is_cas(page.url):
        raise LoginBloqueado('Endereco CAS nao corresponde ao formulario homologado.')
    cred=None
    for attempt in (1,2):
        if not is_cas(page.url):
            return _wait_authenticated(browser,6)
        if _page_challenge(page) or _page_invalid(page):
            raise LoginBloqueado('CAPTCHA, verificacao adicional ou credencial recusada. Login manual necessario.')
        form=_cas_form(page)
        if not form:
            raise LoginBloqueado('Formulario CAS mudou: nao vou preencher campos ambiguos.')
        if cred is None:
            cred=_obter_credenciais()
        username,password,stored,vault=cred
        print(f'Autenticando no CAS: tentativa {attempt}/2')
        form[0].fill(username,timeout=7000)
        form[1].fill(password,timeout=7000)
        form[2].click(timeout=8000)
        if _wait_authenticated(browser,18):
            if not stored and vault:
                try:
                    vault.set_password(KEYRING_SERVICE,username,password)
                    print('Credenciais guardadas no Gerenciador de Credenciais do Windows.')
                except Exception:
                    print('Sessao aberta; falhou apenas o salvamento opcional no cofre Windows.')
            return True
        if _page_invalid(page):
            if stored and vault:
                try:vault.delete_password(KEYRING_SERVICE,username)
                except Exception:pass
            raise LoginBloqueado('Senha recusada no CAS. Nao repetir para evitar bloqueio.')
        if _page_challenge(page):
            raise LoginBloqueado('O CAS pediu verificacao adicional. Complete manualmente.')
        if not is_cas(page.url):
            raise LoginBloqueado('CAS mudou para pagina nao confirmada; valide login manualmente.')
        if attempt==1:time.sleep(2)
    raise LoginBloqueado('Login nao confirmado apos duas tentativas; finalize manualmente.')


def _all_pages(browser):
    for ctx in browser.contexts:
        for page in ctx.pages:
            if trusted(page.url):
                yield page


def _find_page(browser, host_value):
    pages=[p for p in _all_pages(browser) if host(p.url)==host_value]
    return pages[-1] if pages else None


def _unique_link(page, name):
    loc=page.get_by_role('link',name=name)
    valid=[]
    for i in range(loc.count()):
        x=loc.nth(i)
        if x.is_visible(timeout=300):valid.append(x)
    if len(valid)>1:
        raise LoginBloqueado('Mais de um link de navegacao igual no menu DNA.')
    return valid[0] if valid else None


def _click_link(page, pattern, label, seconds=10):
    loc=_unique_link(page,pattern)
    if not loc:
        return False
    loc.click(timeout=seconds*1000)
    return True


def _consulta_pronta(browser) -> bool:
    """O formulario de Consulta de Usuarios deve ser encontrado em uma aba autorizada."""
    script=(WORKER/'dna_pesquisa_dom.js').read_text(encoding='utf-8')
    found=0
    for p in _all_pages(browser):
        if host(p.url)!=CADASTRO_HOST:continue
        for fr in p.frames:
            if not allowed_url(fr.url):continue
            try:
                if fr.evaluate(script).get('tela_consulta'):
                    found+=1
            except Exception:pass
    if found>1:raise LoginBloqueado('Mais de uma Consulta de Usuarios aberta.')
    return found==1


def _navegar_para_consulta(browser):
    if _consulta_pronta(browser):return True
    deadline=time.monotonic()+36
    portal=_find_page(browser, PORTAL_HOST)
    if portal:
        if not _unique_link(portal,re.compile('M[oó]dulo Cadastro',re.I)):
            _click_link(portal,re.compile('^Sistemas$',re.I),'Sistemas')
            portal.wait_for_timeout(400)
        if not _click_link(portal,re.compile('M[oó]dulo Cadastro',re.I),'Módulo Cadastro'):
            raise LoginBloqueado('Link Módulo Cadastro nao apareceu no portal BMG.')
    while time.monotonic()<deadline:
        if _consulta_pronta(browser):return True
        cadastro=_find_page(browser,CADASTRO_HOST)
        if cadastro:
            def visible_menu():
                found=[]
                for fr in cadastro.frames:
                    if not allowed_url(fr.url):continue
                    try:
                        control=fr.locator('#menu-usuario-manutencao')
                        for i in range(control.count()):
                            node=control.nth(i)
                            if node.is_visible(timeout=100):found.append(node)
                    except Exception:pass
                if len(found)>1:
                    raise LoginBloqueado('Menu Manutencao duplicado; nao clicar ambiguamente.')
                return found
            matches=visible_menu()
            if not matches:
                try:
                    if _click_link(cadastro,re.compile('^Usu[aá]rio$',re.I),'Usuário',2):
                        cadastro.wait_for_timeout(250)
                except LoginBloqueado:raise
                except Exception:pass
                matches=visible_menu()
            if len(matches)==1:
                matches[0].click(timeout=6000)
                cadastro.wait_for_timeout(400)
                if _consulta_pronta(browser):return True
        time.sleep(.5)
    raise LoginBloqueado('Nao foi possivel abrir automaticamente Consulta de Usuarios. Verifique o menu do DNA.')


def preparar_acesso(cdp_uri: str, *, manual_callback=input) -> str:
    _verify_local_cdp(cdp_uri)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as playwright:
        browser=playwright.chromium.connect_over_cdp(cdp_uri)
        try:
            if not _dna_authenticated(browser):
                page=_find_page(browser,CAS_HOST)
                if page is None:
                    ctx=browser.contexts[0]
                    page=next((p for p in ctx.pages if p.url=='about:blank'),None) or ctx.new_page()
                    # Este endereco CAS foi reproduzido da gravacao Playwright do operador.
                    page.goto(CAS_URL,wait_until='domcontentloaded',timeout=30000)
                if _dna_authenticated(browser):pass
                elif is_cas(page.url):
                    try:
                        _login_cas(browser,page)
                    except LoginBloqueado as exc:
                        print('Autenticacao automatica indisponivel:',exc)
                if not _dna_authenticated(browser):
                    print('Conclua a autenticacao no Edge (CAPTCHA/MFA, se aparecer).')
                    manual_callback('Depois do login, pressione ENTER para continuar: ')
                    if not _wait_authenticated(browser,7):
                        raise LoginBloqueado('Sessao nao confirmada no DNA; operacao interrompida sem alteracoes.')
            print('Sessao autenticada. Abrindo modulo Cadastro e Consulta de Usuarios...')
            _navegar_para_consulta(browser)
            print('Consulta de Usuarios aberta automaticamente.')
            return 'consulta_pronta'
        finally:
            browser.close()


def voltar_consulta(cdp_uri: str) -> None:
    """Depois de ler manutencao, retorno conservador ao modulo de consulta."""
    _verify_local_cdp(cdp_uri)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as playwright:
        browser=playwright.chromium.connect_over_cdp(cdp_uri)
        try:
            if _consulta_pronta(browser):return
            cadastro=_find_page(browser,CADASTRO_HOST)
            if cadastro:
                for fr in cadastro.frames:
                    if not allowed_url(fr.url):continue
                    buttons=fr.get_by_role('button',name=re.compile(r'^Voltar$',re.I))
                    if buttons.count()==1 and buttons.first.is_visible(timeout=250):
                        buttons.first.click(timeout=6000)
                        cadastro.wait_for_timeout(500)
                        if _consulta_pronta(browser):return
            _navegar_para_consulta(browser)
        finally:
            browser.close()