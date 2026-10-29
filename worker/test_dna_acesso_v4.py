"""Teste sem abrir DNA real: validacao de domínios, CAS e fila."""
import shutil
import unittest
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace
import dna_acesso as a
import dna_fila_worker as q


class DomainSafetyTests(unittest.TestCase):
    def test_whitelist_exact_only(self):
        for u in [a.CAS_URL,'https://dnabmg.help.com.br/','https://cadastro.help.com.br/consulta']:
            self.assertTrue(a.trusted(u))
        for u in ['http://portalfranqueado.help.com.br/','https://portalfranqueado.help.com.br.evil.invalid/',
                  'https://sub.cadastro.help.com.br/','https://other.help.com.br/',
                  'file:///C:/test','about:blank','javascript:alert(1)',
                  'https://x:pass@cadastro.help.com.br/']:
            self.assertFalse(a.trusted(u),u)
    def test_cas_exact_path_only(self):
        self.assertTrue(a.is_cas(a.CAS_URL))
        self.assertFalse(a.is_cas('https://portalfranqueado.help.com.br/foo'))
        self.assertFalse(a.is_cas('https://portalfranqueado.help.com.br.evil.invalid/cas/login'))
    def test_worker_key_fails_publishable(self):
        for s in ['', 'sb_publishable_123456789','service_role','not-a-real-key']:
            with self.assertRaises(q.FilaError):q.validate_key(s)
    def test_status_failclosed(self):
        self.assertEqual(q._status({'status':'trinca_consistente_na_tela'}),'consulta_confirmada')
        self.assertEqual(q._status({'status':'multiplas_contas_ativas'}),'duplicidade')
        self.assertEqual(q._status({'status':'nao_encontrado'}),'nao_encontrado')
        self.assertEqual(q._status({'status':'erro_qualquer'}),'revisao')
    def test_rpc_nonapproved_denied_before_network(self):
        with self.assertRaises(q.FilaError):q._post_rpc('sb_secret_any','dna_criar_consulta_lote',{})
    def test_explicit_rpc_no_redirect(self):
        class Resp:
            status_code=200
            def json(self):return [{'item_id':'ok'}]
        class FakeSession:
            def post(self,url,**kw):
                self.url=url;self.kw=kw
                return Resp()
        fake=FakeSession()
        r=q._post_rpc('sb_secret_TEST','dna_reservar_consulta',{'p_worker':'worker'},session=fake)
        self.assertEqual(r,[{'item_id':'ok'}])
        self.assertFalse(fake.kw['allow_redirects'])
        self.assertEqual(fake.kw['headers']['apikey'],'sb_secret_TEST')
        self.assertNotIn('Authorization',fake.kw['headers'])
    def test_legacy_jwt_authorization_only_server(self):
        class R:
            status_code=200
            def json(self):return True
        class S:
            def post(self, url, **kw):
                self.headers=kw['headers']; return R()
        s=S(); q._post_rpc('eyJ'+'X'*100,'dna_finalizar_consulta',{},session=s)
        self.assertTrue(s.headers['Authorization'].startswith('Bearer '))


class ChromiumLoginSelectors(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        exe=shutil.which('chromium') or shutil.which('chromium-browser')
        if not exe:raise unittest.SkipTest('Chromium nao instalado')
        from playwright.sync_api import sync_playwright
        cls.session=sync_playwright(); cls.p=cls.session.__enter__()
        cls.browser=cls.p.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox'])
        cls.page=cls.browser.new_page()
        cls.form_html = """<html><body><form>
        <label for="username">Usuário</label><input id="username" autocomplete="username" />
        <label for="password">Senha</label><input id="password" type="password" />
        <button type="submit">Entrar</button></form></body></html>"""
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.session.__exit__(None,None,None)
    def test_recorded_cas_form_matches(self):
        self.page.set_content(self.form_html)
        form=a._cas_form(SimpleNamespace(url=a.CAS_URL, locator=self.page.locator))
        self.assertEqual(len(form),3)
        self.assertTrue(form[0].is_visible())
    def test_cas_never_uses_other_domain(self):
        self.page.set_content(self.form_html)
        self.assertIsNone(a._cas_form(SimpleNamespace(url='https://example.invalid/cas/login',locator=self.page.locator)))
    def test_multiple_password_inputs_refused(self):
        self.page.set_content(self.form_html)
        self.page.evaluate("document.querySelector('form').insertAdjacentHTML('beforeend','<input type=password>')")
        self.assertIsNone(a._cas_form(SimpleNamespace(url=a.CAS_URL,locator=self.page.locator)))

if __name__=='__main__':unittest.main()