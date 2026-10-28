"""QA do login: testes simulados. NAO acessa DNA real nem usa credenciais reais."""
from __future__ import annotations
import sys
import shutil
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

sys.path.insert(0,str(Path(__file__).parent))
import dna_login


class FakeVault:
    def __init__(self, username=None, password=None):
        self.username=username
        self.password=password
        self.saved=[]
        self.removed=[]
    def get_credential(self, service, username):
        if self.username:
            return SimpleNamespace(username=self.username,password=self.password)
        return None
    def set_password(self, service, username, password):
        self.username,self.password=username,password
        self.saved.append((service,username,password))
    def delete_password(self, service, username):
        self.removed.append((service,username))
        self.username,self.password=None,None


class CredentialTests(unittest.TestCase):
    def test_stored_credentials_do_not_prompt(self):
        v=FakeVault('usuario_teste','senha_fake')
        self.assertEqual(dna_login.credentials(v,lambda q:self.fail('prompt'),lambda q:self.fail('password')),
                         ('usuario_teste','senha_fake',True))
    def test_first_use_is_in_memory_only(self):
        v=FakeVault()
        user,pw,stored=dna_login.credentials(v,lambda q:'usuario_teste',lambda q:'senha_fake')
        self.assertEqual((user,pw,stored),('usuario_teste','senha_fake',False))
        self.assertEqual(v.saved,[])
    def test_no_empty_password(self):
        with self.assertRaises(dna_login.LoginNeedsUser):
            dna_login.credentials(FakeVault(),lambda q:'teste',lambda q:'')


class FakeFrame:
    url='https://cadastro.help.com.br/'
    def __init__(self,states,after_click=None):
        self.states=states
        self.mode=0
        self.after_click=after_click or []
        self.clicks=0
        self.calls=[]
    def evaluate(self,script):
        return self.states[min(self.mode,len(self.states)-1)]
    def locator(self,selector):
        field=MagicMock()
        def nth(i):
            el=MagicMock()
            el.is_visible.return_value=True
            def click(**kwargs):
                self.clicks+=1
                if self.after_click:
                    self.mode=self.after_click[min(self.clicks-1,len(self.after_click)-1)]
            el.click.side_effect=click
            return el
        field.nth.side_effect=nth
        return field


class FakeBrowser:
    def __init__(self,frame):
        self.contexts=[SimpleNamespace(pages=[SimpleNamespace(url=frame.url,frames=[frame])])]


LOGIN={'login':True,'authenticated':False,'invalid':False,'challenge':False,
       'fields_ambiguous':False,'username_index':0,'password_index':1,'submit_index':0}
AUTH={'login':False,'authenticated':True,'invalid':False,'challenge':False}
INVALID={**LOGIN,'invalid':True}
CAPTCHA={**LOGIN,'challenge':True}
AMBIG={**LOGIN,'fields_ambiguous':True,'username_index':None}


class FlowTests(unittest.TestCase):
    def run_flow(self,states,clicks,vault=None,time_limit=0.005):
        f=FakeFrame(states,clicks)
        v=vault or FakeVault('usuario','senha_teste')
        with patch.object(dna_login,'sleep',lambda n:None):
            output=dna_login._perform(FakeBrowser(f),'fake-script',lambda q:'usuario',lambda q:'senha_teste',lambda:v,2,time_limit)
        return output,f,v
    def test_session_reused_without_vault_or_click(self):
        f=FakeFrame([AUTH])
        result=dna_login._perform(FakeBrowser(f),'fake',lambda q:self.fail(),lambda q:self.fail(),lambda:self.fail(),2,.01)
        self.assertEqual(result,'authenticated')
        self.assertEqual(f.clicks,0)
    def test_one_attempt_success_and_save_only_after_success(self):
        out,f,v=self.run_flow([LOGIN,AUTH],[1],FakeVault())
        self.assertEqual(out,'authenticated')
        self.assertEqual(f.clicks,1)
        self.assertEqual(v.saved[0][1:3],('usuario','senha_teste'))
    def test_retry_transient_once(self):
        out,f,v=self.run_flow([LOGIN,AUTH],[0,1])
        self.assertEqual(out,'authenticated')
        self.assertEqual(f.clicks,2)
    def test_invalid_password_never_retried(self):
        out,f,v=self.run_flow([LOGIN,INVALID],[1])
        self.assertEqual(out,'manual')
        self.assertEqual(f.clicks,1)
        self.assertTrue(v.removed)
    def test_captcha_never_submitted(self):
        out,f,v=self.run_flow([CAPTCHA],[])
        self.assertEqual(out,'manual')
        self.assertEqual(f.clicks,0)
    def test_ambiguous_fields_never_submitted(self):
        out,f,v=self.run_flow([AMBIG],[])
        self.assertEqual(out,'manual')
        self.assertEqual(f.clicks,0)
    def test_no_login_no_false_success(self):
        f=FakeFrame([{'login':False,'authenticated':False,'invalid':False,'challenge':False}])
        with patch.object(dna_login,'sleep',lambda n:None):
            with patch.object(dna_login,'_await_state',return_value=('unknown',None,None,None)):
                out=dna_login._perform(FakeBrowser(f),'fake',lambda q:'',lambda q:'',lambda:FakeVault(),2,.01)
        self.assertEqual(out,'manual')


class DomTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        exe=shutil.which('chromium') or shutil.which('chromium-browser')
        if not exe:raise unittest.SkipTest('Chromium unavailable')
        from playwright.sync_api import sync_playwright
        cls.context=sync_playwright()
        cls.p=cls.context.__enter__()
        cls.browser=cls.p.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox'])
        cls.page=cls.browser.new_page()
        cls.script=dna_login.PROBE.read_text(encoding='utf-8')
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.context.__exit__(None,None,None)
    def test_normal_login(self):
        self.page.set_content('''<h1>Acesso ao DNA</h1><form>
        <label for="a">Usuário</label><input id="a" name="username" autocomplete="username">
        <label for="b">Senha</label><input id="b" type="password" autocomplete="current-password">
        <button type="submit">Entrar</button></form>''')
        x=self.page.evaluate(self.script)
        self.assertEqual((x['login'],x['username_index'],x['password_index'],x['submit_index']), (True,0,1,0))
        self.assertFalse(x['fields_ambiguous'])
    def test_ambiguous_username(self):
        self.page.set_content('''<form><input type="text"><input type="text"><input type="password"><button>Entrar</button></form>''')
        x=self.page.evaluate(self.script)
        self.assertTrue(x['fields_ambiguous'])
    def test_captcha(self):
        self.page.set_content('''<form><input name="username"><input type="password"><button>Entrar</button></form>
        <div>Selecione todas as imagens</div>''')
        x=self.page.evaluate(self.script)
        self.assertTrue(x['challenge'])
    def test_no_secret_in_probe_output(self):
        self.page.set_content('''<form><input name="username" value="USUARIO_SECRETO">
        <input type="password" value="SENHA_SECRETA"><button>Entrar</button></form>''')
        x=self.page.evaluate(self.script)
        self.assertNotIn('USUARIO_SECRETO',str(x))
        self.assertNotIn('SENHA_SECRETA',str(x))
    def test_session_home_without_password(self):
        self.page.set_content('<header>Principal</header><nav>Cadastro de Usuários</nav><main>Home</main>')
        x=self.page.evaluate(self.script)
        self.assertTrue(x['authenticated'])
        self.assertFalse(x['login'])
    def test_maintenance_password_change_is_not_login(self):
        self.page.set_content('''<h1>Manutenção de Usuário</h1><form>
            <input name="username"><input type="password"><button type="submit">Entrar</button></form>''')
        x=self.page.evaluate(self.script)
        self.assertFalse(x['login'])
        self.assertTrue(x['authenticated'])
    def test_authenticated_detection(self):
        self.page.set_content('<div>Você está logado com o usuário</div><a>Sair</a>')
        x=self.page.evaluate(self.script)
        self.assertTrue(x['authenticated'])
        self.assertFalse(x['login'])

if __name__=='__main__':unittest.main()