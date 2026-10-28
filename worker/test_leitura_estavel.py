import sys, unittest, copy
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from dna_diagnostico import same_dom_reading, validate_live_capture
from validar_referencias import SnapshotInvalid
from iniciar_assistido import read_reference
from evidencia_dna import compact_controls

class TestLeituraEstavel(unittest.TestCase):
 def make(self, hidden=80):
  reference=read_reference('CONSULTOR')
  raw=[]
  for i,x in enumerate(compact_controls(reference)):
   raw.append({'ordem':x['ordem_dom'],'rotulo':x['rotulo'],'secao':x['secao'],'subsecao':x['subsecao'], 'ng_model':x['ng_model'], 'marcado':x['marcado'],'controle_global':x['ng_model']!='item.selected' and 'marcar' in x['rotulo'].lower(),'rotulo_identificado':True,'visivel':i>=hidden,'desabilitado':False})
  return {'perfil_referencia':'CONSULTOR','total_dom':227,'total_visiveis':227-hidden,'itens':raw,'avisos':[]}
 def test_ler_controles_ocultos_carregados(self):
  self.assertEqual(validate_live_capture(self.make(hidden=120),'CONSULTOR')['total_dom'],227)
 def test_dom_oculto_e_visivel_equivalente(self):
  a=self.make(hidden=120);b=self.make(hidden=40)
  self.assertTrue(same_dom_reading(a,b))
 def test_marcacao_mudou_falha(self):
  a=self.make();b=copy.deepcopy(a);b['itens'][44]['marcado']=not b['itens'][44]['marcado']
  self.assertFalse(same_dom_reading(a,b))
 def test_falta_um_elemento_falha(self):
  a=self.make();b=copy.deepcopy(a);b['itens'].pop();b['total_dom']=226
  self.assertFalse(same_dom_reading(a,b))
  with self.assertRaises(SnapshotInvalid):validate_live_capture(b,'CONSULTOR')
 def test_elemento_oculto_desabilitado_falha(self):
  a=self.make();a['itens'][77]['desabilitado']=True
  with self.assertRaises(SnapshotInvalid):validate_live_capture(a,'CONSULTOR')
 def test_controles_todos_ocultos_falha(self):
  a=self.make(hidden=227)
  with self.assertRaises(SnapshotInvalid):validate_live_capture(a,'CONSULTOR')

if __name__=='__main__':unittest.main()