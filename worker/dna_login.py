"""Login DNA assistido e automatico, SEM CAPTCHA bypass ou logs de senha.

- Reutiliza sessao Edge da versao anterior quando ativa.
- Credenciais ficam SOMENTE no Windows Credential Manager (WinVault).
- Ate 2 envios por inicializacao; erros de credencial/challenge nao sao retentados.
- Em layout desconhecido, entrega o login ao operador; sem clicar em campos arbitrarios.
"""
from __future__ import annotations

from getpass import getpass
from pathlib import Path
from time import monotonic, sleep
from typing import Callable

from dna_diagnostico import _verify_local_cdp, allowed_url, UnsafePage

SERVICE = 'CREDVIX_DNA_CADASTRO_LOGIN_V1'
PROBE = Path(__file__).with_name('dna_login_probe.js')
MAX_ATTEMPTS = 2


class LoginNeedsUser(RuntimeError):
    """Login nao pode ser automatizado com confianca."""


class CredentialsRejected(LoginNeedsUser):
    """O DNA recusou a credencial. Nunca repetir com a mesma senha."""


def windows_vault():
    import os
    if os.name != 'nt':
        raise LoginNeedsUser('Credenciais automaticas exigem o Gerenciador de Credenciais do Windows.')
    try:
        from keyring.backends.Windows import WinVaultKeyring
        vault = WinVaultKeyring()
        if vault.priority <= 0:
            raise LoginNeedsUser('Gerenciador de Credenciais do Windows indisponivel.')
        return vault
    except (ImportError, RuntimeError, OSError) as exc:
        raise LoginNeedsUser('Nao foi possivel usar o cofre de senhas do Windows.') from exc


def credentials(vault, input_fn: Callable[[str], str] = input,
                password_fn: Callable[[str], str] = getpass) -> tuple[str, str, bool]:
    """Recupera cofre ou coleta localmente; credenciais novas so salvas APOS sucesso."""
    existing = vault.get_credential(SERVICE, None)
    if existing and existing.username and existing.password:
        return existing.username, existing.password, True
    print('\nPRIMEIRO ACESSO: configure seu login DNA uma unica vez.')
    print('O usuario e a senha serao guardados no Gerenciador de Credenciais do Windows.')
    user = input_fn('Usuario do DNA: ').strip()
    if not user or len(user) > 160:
        raise LoginNeedsUser('Usuario vazio ou invalido.')
    pw = password_fn('Senha do DNA (nao aparece no CMD): ')
    if not pw:
        raise LoginNeedsUser('Senha vazia. Login automatico cancelado.')
    return user, pw, False


def _login_frame(browser, script):
    """Read ONLY trusted DNA pages; unrelated Edge tabs and SSO never receive credentials."""
    login_frames = []
    auth_seen = False
    outside_seen = False
    for ctx in browser.contexts:
        for page in ctx.pages:
            if page.url == 'about:blank':
                continue
            if not allowed_url(page.url):
                outside_seen = True
                continue
            for frame in page.frames:
                if not allowed_url(frame.url):
                    outside_seen = True
                    continue
                try:
                    observed = frame.evaluate(script)
                except Exception:
                    continue
                if observed.get('login'):
                    login_frames.append((page, frame, observed))
                if observed.get('authenticated'):
                    auth_seen = True
    if len(login_frames) > 1:
        raise LoginNeedsUser('Mais de uma tela de login do DNA encontrada. Feche as abas duplicadas.')
    if len(login_frames) == 1:
        return ('login', *login_frames[0])
    if auth_seen:
        return ('authenticated', None, None, None)
    if outside_seen:
        return ('external', None, None, None)
    return ('unknown', None, None, None)


def _await_state(browser, script, seconds: float, delay=0.35, accept_login=False):
    deadline=monotonic()+seconds
    state=_login_frame(browser,script)
    while monotonic()<deadline:
        if state[0]=='authenticated' or (accept_login and state[0]=='login') or (state[0]=='login' and state[3].get('invalid')) or (state[0]=='login' and state[3].get('challenge')):
            return state
        sleep(delay)
        state=_login_frame(browser,script)
    return state


def _send_login(frame, probe, username, password):
    if probe.get('fields_ambiguous') or probe.get('username_index') is None or probe.get('password_index') is None or probe.get('submit_index') is None:
        raise LoginNeedsUser('Campos de login nao identificados com seguranca. Faca login manualmente.')
    # The indices are relative to DOM order; never use text or field values in logs.
    form_user=frame.locator('input').nth(probe['username_index'])
    form_password=frame.locator('input').nth(probe['password_index'])
    submit=frame.locator('button,input[type="submit"],input[type="button"],a[role="button"]').nth(probe['submit_index'])
    if not form_user.is_visible() or not form_password.is_visible() or not submit.is_visible():
        raise LoginNeedsUser('Campos de login mudaram durante a leitura.')
    form_user.fill(username,timeout=8000)
    form_password.fill(password,timeout=8000)
    submit.click(timeout=8000)


def login_auto(cdp_uri: str, *, input_fn=input, password_fn=getpass,
               browser_factory=None, vault_factory=windows_vault,
               max_attempts=MAX_ATTEMPTS, time_limit=18):
    """Return 'authenticated' or 'manual'; unrecognized layouts never crash the assistant."""
    _verify_local_cdp(cdp_uri)
    script=PROBE.read_text(encoding='utf-8')
    def safe_perform(browser):
        try:
            return _perform(browser,script,input_fn,password_fn,vault_factory,max_attempts,time_limit)
        except LoginNeedsUser as exc:
            print('A autenticacao precisa de intervencao: '+str(exc))
            return 'manual'
    if browser_factory is None:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as playwright:
            browser=playwright.chromium.connect_over_cdp(cdp_uri)
            try:
                return safe_perform(browser)
            finally:
                browser.close()
    return safe_perform(browser_factory())


def _perform(browser,script,input_fn,password_fn,vault_factory,max_attempts,time_limit):
    state=_await_state(browser,script,seconds=12,accept_login=True)
    if state[0]=='authenticated':
        print('Sessao do DNA ja esta ativa. Login desnecessario.')
        return 'authenticated'
    if state[0] != 'login':
        if state[0] == 'external':
            print('O Edge abriu outra aba ou uma pagina externa de autenticacao.')
            print('Por seguranca, nunca envio credenciais automaticamente a dominios desconhecidos.')
        else:
            print('A tela de login ainda nao foi reconhecida com seguranca.')
        print('Conclua o login no Edge; o assistente continuara apos a confirmacao.')
        return 'manual'
    if state[3].get('challenge'):
        print('O DNA exige CAPTCHA/verificacao adicional. Conclua manualmente.')
        return 'manual'
    try:
        vault=vault_factory()
        user,pw,stored=credentials(vault,input_fn,password_fn)
    except LoginNeedsUser as e:
        print(str(e))
        return 'manual'
    for attempt in range(1,min(2,max_attempts)+1):
        state=_login_frame(browser,script)
        if state[0]=='authenticated':
            return 'authenticated'
        if state[0]!='login':
            state=_await_state(browser,script,seconds=4)
            if state[0]=='authenticated':return 'authenticated'
            if state[0]!='login':break
        page,frame,probe=state[1:]
        if probe.get('invalid'):
            print('DNA indica credenciais invalidas. Nao repetirei para evitar bloqueio.')
            if stored:
                try:vault.delete_password(SERVICE,user)
                except Exception:pass
            return 'manual'
        if probe.get('challenge'):
            print('O DNA solicitou verificacao adicional. Login manual necessario.')
            return 'manual'
        print(f'Login automatico: tentativa {attempt}/2.')
        try:
            _send_login(frame,probe,user,pw)
        except LoginNeedsUser as e:
            print(str(e))
            return 'manual'
        except Exception:
            # Input/DOM changed or navigation timeout; bounded retry only.
            pass
        state=_await_state(browser,script,seconds=time_limit)
        if state[0]=='authenticated':
            if not stored:
                try:
                    vault.set_password(SERVICE,user,pw)
                    print('Credencial protegida e salva no Gerenciador do Windows.')
                except Exception:
                    print('Login concluido, mas o cofre do Windows recusou o salvamento. Configure novamente na proxima execucao.')
            print('Login automatico confirmado no DNA.')
            return 'authenticated'
        if state[0]=='login' and state[3].get('invalid'):
            if stored:
                try:vault.delete_password(SERVICE,user)
                except Exception:pass
            print('DNA recusou a credencial. Apaguei o registro antigo do cofre; nao repetirei a senha.')
            return 'manual'
        if state[0]=='login' and state[3].get('challenge'):
            print('O DNA pediu CAPTCHA ou segunda verificacao. Complete manualmente.')
            return 'manual'
        if attempt<min(2,max_attempts):
            print('Login ainda nao confirmado. Nova tentativa breve apos conferir a tela...')
            sleep(2)
    print('Login nao confirmado apos duas tentativas. Conclua manualmente.')
    return 'manual'


def session_confirmed(cdp_uri: str) -> bool:
    """Consulta sem preencher nada, para depois de login manual/MFA."""
    _verify_local_cdp(cdp_uri)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as playwright:
        browser=playwright.chromium.connect_over_cdp(cdp_uri)
        try:
            state=_await_state(browser,PROBE.read_text(encoding='utf-8'),seconds=5)
            return state[0]=='authenticated'
        finally:
            browser.close()