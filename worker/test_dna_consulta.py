"""Testes unitarios e de DOM do fluxo de pesquisa, sem credenciais ou DNA real."""
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from dna_consulta import login_base, decide_account, check_maintenance, normalized, BASE

CPF='52998224725'  # apenas CPF sintetico matematicamente valido
NAME='ANA TESTE SILVA'

def row(login=None,name=NAME,status='Ativo',editar=0):
 return {'usuario':login or CPF,'nome':name,'loja':'UNIDADE DEMO','perfil':'Consultor','situacao':status,'editar_index':editar,'row_index':0}

class ConsultaTests(unittest.TestCase):
 def test_login_sem_sufixo(self):
  self.assertEqual(login_base('529.982.247-25'),(CPF,''))
 def test_sufixo_distinto(self):
  self.assertEqual(login_base('529982247-25_2'),(CPF,'_2'))
 def test_prefixo_nao_serve(self):
  self.assertIsNone(login_base('52998224725_foo'))
 def test_resultado_unico(self):
  x=decide_account([row()],cpf=CPF,nome=NAME,total=1)
  self.assertEqual(x['status'],'conta_unica_ativa')
 def test_duplicidade_ativa(self):
  x=decide_account([row(),row('52998224725_1')],cpf=CPF,nome=NAME,total=2)
  self.assertEqual(x['status'],'multiplas_contas_ativas')
 def test_login_exato_seleciona(self):
  x=decide_account([row(),row('52998224725_1')],cpf=CPF,login='52998224725_1',nome=NAME,total=2)
  self.assertEqual(x['status'],'conta_unica_ativa')
  self.assertEqual(x['selecionado']['usuario'],'52998224725_1')
 def test_cancelado(self):
  self.assertEqual(decide_account([row(status='Cancelado')],cpf=CPF,total=1)['status'],'somente_inativas_ou_login_ausente')
 def test_paginacao(self):
  self.assertEqual(decide_account([row()],cpf=CPF,total=5)['status'],'resultado_incompleto')
 def test_paginador_com_todos_resultados(self):
  self.assertEqual(decide_account([row()],cpf=CPF,total=1,pagination=True)['status'],'conta_unica_ativa')
 def test_nome_diferente(self):
  self.assertEqual(decide_account([row()],cpf=CPF,nome='OUTRO NOME',total=1)['status'],'nao_encontrado')
 def test_sem_botao_editar(self):
  self.assertEqual(decide_account([row(editar=None)],cpf=CPF,total=1)['status'],'editar_nao_identificado')
 def test_manutencao_trinca(self):
  doc={'tela_manutencao':True,'cpf':['529.982.247-25'],'nome':[NAME],'login':['52998224725_1']}
  self.assertEqual(check_maintenance({'usuario':'52998224725_1','nome':NAME},doc,CPF)['status'],'trinca_consistente_na_tela')
 def test_manutencao_sufixo_nao_confunde(self):
  doc={'tela_manutencao':True,'cpf':[CPF],'nome':[NAME],'login':[CPF+'_2']}
  self.assertEqual(check_maintenance({'usuario':CPF+'_1','nome':NAME},doc,CPF)['status'],'login_divergente_ou_ausente')

class DomTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  from playwright.sync_api import sync_playwright
  cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
  cls.page=cls.browser.new_page()
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop()
 def test_probe_pesquisa_tabela(self):
  self.page.set_content('''<h1>Consulta de Usuários</h1><div>Filtro de Pesquisa</div>
   <div><label for="cpf">CPF:</label><input id="cpf" name="cpf"></div><button>Pesquisar</button>
   <table><thead><tr><th>Usuário</th><th>Nome</th><th>Loja</th><th>Perfil</th><th>Situação</th><th>Ações</th></tr></thead>
   <tbody><tr><td>52998224725_2</td><td>Ana Teste Silva</td><td>Unidade Demo</td><td>Consultor</td><td>Ativo</td>
   <td><button title="Editar">✎</button></td></tr></tbody></table><div>Total: 1</div>''')
  form=self.page.evaluate((BASE/'dna_pesquisa_dom.js').read_text())
  data=self.page.evaluate((BASE/'dna_resultados_dom.js').read_text())
  self.assertTrue(form['tela_consulta']);self.assertEqual(form['cpf_input_index'],0)
  self.assertEqual(form['submit_index'],0);self.assertEqual(data['total_resultados'],1)
  self.assertEqual(data['rows'][0]['editar_index'],0)
 def test_probe_manutencao(self):
  self.page.set_content('''<h1>Manutenção de Usuário</h1><strong>Login: 52998224725_2</strong>
   <div><label for="cpf">CPF:</label><input id="cpf" value="529.982.247-25"></div>
   <div><label for="nome">Nome:</label><input id="nome" value="ANA TESTE SILVA"></div>''')
  data=self.page.evaluate((BASE/'dna_manutencao_identidade.js').read_text())
  self.assertEqual(data['cpf'],['529.982.247-25']);self.assertEqual(data['login'],['52998224725_2'])
  self.assertEqual(data['nome'],['ANA TESTE SILVA'])
 def test_login_cpf_com_sufixo(self):
  from cpf_dna import comparar_cpf_login
  js=(BASE/'dna_cpf_login_probe.js').read_text()
  self.page.set_content('<h1>Manutenção de Usuário</h1><strong>Login: 52998224725_2</strong><div><label>CPF:</label><input value="529.982.247-25"></div>')
  raw=self.page.evaluate(js)
  result=comparar_cpf_login([raw,raw],b'2'*32)
  self.assertEqual(result['resultado'],'cpf_login_base_coincidem_na_tela')
  self.assertNotIn('52998224725_2',str(result))

if __name__=='__main__':unittest.main()