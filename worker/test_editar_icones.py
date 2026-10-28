"""Regressao de deteccao do botao Editar e fallback manual no DNA.
Dados sinteticos. Nao acessa DNA ou Supabase.
"""
import sys,unittest,shutil
from pathlib import Path
from unittest.mock import MagicMock,patch
sys.path.insert(0,str(Path(__file__).resolve().parent))
from dna_consulta import BASE,decide_account,pesquisar_e_abrir

CPF='52998224725'
NAME='ANA TESTE SILVA'
SCRIPT=(BASE/'dna_resultados_dom.js').read_text(encoding='utf-8')

class DomEditTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  from playwright.sync_api import sync_playwright
  chrome=shutil.which('chromium') or shutil.which('chromium-browser')
  if not chrome:raise unittest.SkipTest('Chromium ausente, teste DOM disponivel no CI Linux')
  cls.playwright=sync_playwright().start()
  cls.browser=cls.playwright.chromium.launch(headless=True,executable_path=chrome,args=['--no-sandbox'])
  cls.page=cls.browser.new_page()
 @classmethod
 def tearDownClass(cls):
  cls.browser.close();cls.playwright.stop()
 def scan(self,actions):
  self.page.set_content(f'''<h1>Consulta de Usuários</h1><table>
  <thead><tr><th>Usuário</th><th>Nome</th><th>Loja</th><th>Perfil</th><th>Situação</th><th>Ações</th></tr></thead>
  <tbody><tr><td>{CPF}_2</td><td>{NAME}</td><td>Loja teste</td><td>Consultor</td><td>Ativo</td><td>{actions}</td></tr></tbody>
  </table><div>Total: 1</div>''')
  return self.page.evaluate(SCRIPT)['rows'][0]
 def test_fa_pencil_em_sete_acoes(self):
  icons=['list','ban','refresh','trash','lock','share','pencil-square-o']
  actions=''.join('<button><i class="fa fa-'+x+'"></i></button>' for x in icons)
  self.assertEqual(self.scan(actions)['editar_index'],6)
 def test_glyphicon_edit(self):
  self.assertEqual(self.scan('<button><i class="glyphicon glyphicon-edit"></i></button>')['editar_index'],0)
 def test_svg_aria(self):
  self.assertEqual(self.scan('<a><svg aria-label="Editar usuário"></svg></a>')['editar_index'],0)
 def test_nao_clica_senha(self):
  r=self.scan('<button title="Alterar senha"><i class="fa fa-pencil"></i></button><button title="Editar">✎</button>')
  self.assertEqual(r['editar_index'],1)
 def test_inconclusivo_nunca_assume_ultimo(self):
  r=self.scan('<button>▤</button><button>⟳</button><button>▣</button>')
  self.assertIsNone(r['editar_index'])
  result=decide_account([r],cpf=CPF,nome=NAME,total=1)
  self.assertEqual(result['status'],'editar_nao_identificado')
 def test_ambiguidade_bloqueada(self):
  r=self.scan('<button title="Editar">A</button><button title="Editar">B</button>')
  self.assertTrue(r['editar_ambiguo'])

class ManualFallbackTests(unittest.TestCase):
 def flow(self,login=CPF+'_2',response='',duplicate=False):
  from playwright import sync_api
  import dna_consulta
  logins=[CPF+'_2',CPF+'_3'] if duplicate else [CPF+'_2']
  rows=[{'usuario':x,'nome':NAME,'situacao':'Ativo','loja':'Demo','perfil':'Consultor',
         'editar_index':None,'editar_ambiguo':False,'row_index':i} for i,x in enumerate(logins)]
  resultRows={'resultado_identificado':True,'rows':rows,'total_resultados':len(rows),
              'table_index':0,'acoes_col_index':5}
  frame=MagicMock();frame.url='https://cadastro.help.com.br/consulta';frame.evaluate.return_value=resultRows
  maint=MagicMock();maint.url='https://cadastro.help.com.br/manutencao'
  maint.evaluate.return_value={'tela_manutencao':True,'cpf':[CPF],'nome':[NAME],'login':[login]}
  page=MagicMock();page.url='https://cadastro.help.com.br/';page.frames=[maint]
  browser=MagicMock();browser.contexts=[]
  player=MagicMock();player.chromium.connect_over_cdp.return_value=browser
  ctx=MagicMock();ctx.__enter__.return_value=player
  called=[]
  def input_fn(text):called.append(text);return response
  with patch.object(dna_consulta,'_verify_local_cdp'),patch.object(dna_consulta,'_one_frame',return_value=(page,frame,{'cpf_input_index':0,'submit_index':0})),patch.object(sync_api,'sync_playwright',return_value=ctx):
   ret=pesquisar_e_abrir('http://127.0.0.1:9222',CPF,NAME,solicitar_edicao_manual=input_fn)
  return ret,called
 def test_manual_cadastro_exato(self):
  ret,called=self.flow()
  self.assertEqual(ret['status'],'trinca_consistente_na_tela')
  self.assertEqual(len(called),1)
 def test_manual_cadastro_errado(self):
  ret,called=self.flow(login=CPF+'_9')
  self.assertEqual(ret['status'],'login_divergente_ou_ausente')
 def test_cancelamento(self):
  ret,called=self.flow(response='s')
  self.assertEqual(ret['status'],'edicao_manual_cancelada')
 def test_duplicidade_nao_escolhida(self):
  ret,called=self.flow(duplicate=True)
  self.assertEqual(ret['status'],'multiplas_contas_ativas')
  self.assertEqual(len(called),0)

if __name__=='__main__':unittest.main()
