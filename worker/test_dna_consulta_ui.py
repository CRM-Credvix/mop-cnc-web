from pathlib import Path
import unittest
from playwright.sync_api import sync_playwright

JS=(Path(__file__).parent/'dna-consulta-fila.js').read_text()

HTML='''<!doctype html><html><body>
<div id="dnaShell">
<section class="dna-stage active" data-stage="gestao"><div class="dna-stepper"></div></section>
<section class="dna-stage" data-stage="acompanhamento"><div class="dna-stepper"></div></section>
<textarea id="dnaNames"></textarea><button id="dnaQueueCreate">Enviar</button><p id="dnaQueueMessage"></p>
<input type="radio" name="dnaProfile" value="CONSULTOR" checked>
<button data-target="acompanhamento">Acompanhamento</button>
</div>
<script>
window.calls=[];
window.crypto.randomUUID = ()=>'11111111-2222-4333-8444-555555555555';
const state={data:[]};
window.MOP_SUPABASE={
 rpc:async (name,params)=>{calls.push({name,params});return {data:'abc12345-0000-4000-8000-000000000000',error:null};},
 from:(table)=>({select:()=>({order:()=>({limit:async()=>({data:[],error:null})}),in:()=>({order:async()=>({data:[],error:null})})})})
};
</script></body></html>'''

class QueueUi(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.p=sync_playwright().start()
  cls.browser=cls.p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop()
 def setUp(self):
  self.page=self.browser.new_page(viewport={'width':1280,'height':900})
  self.page.set_content(HTML)
  self.page.evaluate(JS)
 def tearDown(self):self.page.close()
 def test_masked_queue_and_no_plaintext_in_dom(self):
  self.page.fill('#dnaNames','529.982.247-25; ANA TESTE SILVA; 52998224725_2')
  self.page.click('#dnaQueueCreate')
  self.page.wait_for_function('window.calls.length===1')
  obj=self.page.evaluate('window.calls[0]')
  self.assertEqual(obj['name'],'dna_criar_consulta_lote')
  self.assertEqual(obj['params']['p_itens'][0]['cpf'],'52998224725')
  self.assertTrue(self.page.locator('#dnaQueueMessage').inner_text().startswith('Lote'))
  self.assertEqual(self.page.locator('#dnaNames').input_value(),'')
  self.assertNotIn('52998224725',self.page.locator('body').inner_text())
 def test_duplicate_rejected_no_remote_call(self):
  self.page.fill('#dnaNames','52998224725; ANA TESTE SILVA\n529.982.247-25; ANA TESTE SILVA')
  self.page.click('#dnaQueueCreate')
  self.assertEqual(self.page.evaluate('window.calls.length'),0)
  self.assertIn('repetidos',self.page.locator('#dnaQueueMessage').inner_text())
 def test_invalid_cpf_rejected(self):
  self.page.fill('#dnaNames','00000000000; ANA TESTE SILVA')
  self.page.click('#dnaQueueCreate')
  self.assertEqual(self.page.evaluate('window.calls.length'),0)
  self.assertIn('CPF inválido',self.page.locator('#dnaQueueMessage').inner_text())
 def test_different_suffix_accepted(self):
  self.page.fill('#dnaNames','52998224725; ANA TESTE SILVA; 52998224725_1\n52998224725; ANA TESTE SILVA; 52998224725_2')
  self.page.click('#dnaQueueCreate')
  self.page.wait_for_function('window.calls.length===1')
  self.assertEqual(len(self.page.evaluate('window.calls[0].params.p_itens')),2)
 def test_table_readonly_and_no_cpf(self):
  self.page.wait_for_timeout(150)
  self.assertEqual(self.page.locator('table.dna-table').count(),2)
  self.assertIn('Nenhuma solicitação',self.page.locator('body').inner_text())

if __name__=='__main__':unittest.main()