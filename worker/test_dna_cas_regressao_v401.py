"""CAS regression tests, local Chromium only. No real requests or credentials."""
import re
import shutil
import unittest
from types import SimpleNamespace
import dna_acesso as a


class CasRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        exe=shutil.which('chromium') or shutil.which('chromium-browser')
        if not exe:
            raise unittest.SkipTest('Chromium unavailable')
        from playwright.sync_api import sync_playwright
        cls.session=sync_playwright()
        cls.playwright=cls.session.__enter__()
        cls.browser=cls.playwright.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox'])
        cls.page=cls.browser.new_page()
    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.session.__exit__(None,None,None)

    def test_generic_captcha_word_is_not_interactive_challenge(self):
        self.page.set_content('<form><p>Este sistema pode utilizar CAPTCHA e token de acesso.</p></form>')
        self.assertFalse(a._page_challenge(self.page))

    def test_recaptcha_checkbox_widget_not_interactive_challenge(self):
        self.page.set_content('''<form><input name="username"><input type="password"></form>
            <iframe title="recaptcha checkbox" srcdoc="checkbox" style="width:300px;height:80px"></iframe>''')
        self.assertFalse(a._page_challenge(self.page))

    def test_interactive_recaptcha_challenge_is_blocked(self):
        self.page.set_content('''<iframe title="recaptcha challenge" srcdoc="challenge"
            style="width:380px;height:280px"></iframe>''')
        self.assertTrue(a._page_challenge(self.page))

    def test_visible_mfa_instruction_is_blocked(self):
        self.page.set_content('<p>Digite o código de verificação</p>')
        self.assertTrue(a._page_challenge(self.page))

    def test_hidden_mfa_instruction_is_not_a_challenge(self):
        self.page.set_content('<p style="display:none">Digite o código de verificação</p>')
        self.assertFalse(a._page_challenge(self.page))

    def test_generic_possible_threat_notice_not_credentials_rejected(self):
        self.page.set_content('<p>Foi detectado uma possível inconsistência no sistema.</p>')
        self.assertFalse(a._page_invalid(self.page))
        self.assertFalse(a._page_challenge(self.page))

    def test_visible_invalid_password_is_detected(self):
        self.page.set_content('<div role="alert">Usuário ou senha inválidos</div>')
        self.assertTrue(a._page_invalid(self.page))

    def test_hidden_password_error_is_ignored(self):
        self.page.set_content('<p style="display:none">Senha incorreta</p>')
        self.assertFalse(a._page_invalid(self.page))

    def test_cas_login_with_hidden_duplicate_field(self):
        self.page.set_content('''<form><input name="username" autocomplete="username">
            <input name="other" type="text" style="display:none">
            <input type="password" style="display:none"><input type="password">
            <button type="submit">Entrar</button></form>''')
        wrapper=SimpleNamespace(url=a.CAS_URL,locator=self.page.locator,get_by_role=self.page.get_by_role)
        self.assertIsNotNone(a._cas_form(wrapper))

    def test_login_confirmed_by_authenticated_portal_markers(self):
        self.page.set_content('<nav>Principal</nav><a>Sair</a><div>Bem-vindo!</div>')
        wrapper=SimpleNamespace(url='https://dnabmg.help.com.br/home',locator=self.page.locator,
                                get_by_role=self.page.get_by_role,get_by_text=self.page.get_by_text)
        mock_browser=SimpleNamespace(contexts=[SimpleNamespace(pages=[wrapper])])
        self.assertTrue(a._dna_authenticated(mock_browser))

    def test_login_not_confirmed_from_cas_menu(self):
        self.page.set_content('<nav>Principal</nav><a>Sair</a><div>Entrar</div>')
        wrapper=SimpleNamespace(url=a.CAS_URL,locator=self.page.locator,
                                get_by_role=self.page.get_by_role,get_by_text=self.page.get_by_text)
        mock_browser=SimpleNamespace(contexts=[SimpleNamespace(pages=[wrapper])])
        self.assertFalse(a._dna_authenticated(mock_browser))


if __name__=='__main__': unittest.main()