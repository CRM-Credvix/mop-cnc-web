"""Regressoes de navegacao externa e duplicacao de login. Dados simulados."""
import unittest
from types import SimpleNamespace
from unittest.mock import patch
import dna_login

DNA='https://cadastro.help.com.br/login'
SSO='https://login.exemplo.invalid/signin?token=NAO_COLETAR'
LOGIN={'login':True,'authenticated':False,'invalid':False,'challenge':False,
       'fields_ambiguous':False,'username_index':0,'password_index':1,'submit_index':0}
AUTH={'login':False,'authenticated':True}
class Frame:
    def __init__(self,url,ret):self.url=url;self.ret=ret;self.calls=0
    def evaluate(self,script):self.calls+=1;return self.ret
def page(url,*frames):return SimpleNamespace(url=url,frames=list(frames))
def browser(*pages):return SimpleNamespace(contexts=[SimpleNamespace(pages=list(pages))])
class RedirectTests(unittest.TestCase):
    def test_external_is_manual_not_exception(self):
        s=Frame(SSO,LOGIN)
        self.assertEqual(dna_login._login_frame(browser(page(SSO,s)),'test')[0],'external')
        self.assertEqual(s.calls,0)
    def test_edge_tab_does_not_block_dna(self):
        a=Frame(DNA,LOGIN);other=Frame('edge://newtab/',LOGIN)
        self.assertEqual(dna_login._login_frame(browser(page('edge://newtab/',other),page(DNA,a)),'test')[0],'login')
        self.assertEqual(other.calls,0)
    def test_external_does_not_block_authenticated_dna(self):
        self.assertEqual(dna_login._login_frame(browser(page(SSO),page(DNA,Frame(DNA,AUTH))),'test')[0],'authenticated')
    def test_iframe_external_not_read(self):
        ex=Frame(SSO,LOGIN)
        p=page(DNA,ex,Frame(DNA,{'login':False,'authenticated':False}))
        self.assertEqual(dna_login._login_frame(browser(p),'test')[0],'external')
        self.assertEqual(ex.calls,0)
    def test_external_does_not_access_vault(self):
        b=browser(page(SSO))
        with patch.object(dna_login,'_await_state',return_value=('external',None,None,None)):
            r=dna_login._perform(b,'test',lambda x:self.fail(),lambda x:self.fail(),
                       lambda:self.fail('vault'),2,.01)
        self.assertEqual(r,'manual')
    def test_duplicate_forms_request_manual_instead_of_crash(self):
        b=browser(page(DNA,Frame(DNA,LOGIN)),page(DNA,Frame(DNA,LOGIN)))
        r=dna_login.login_auto('http://127.0.0.1:9222',browser_factory=lambda:b,
             input_fn=lambda x:self.fail(),password_fn=lambda x:self.fail(),
             vault_factory=lambda:self.fail('vault'))
        self.assertEqual(r,'manual')
if __name__=='__main__':unittest.main()
