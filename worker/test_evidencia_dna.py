import sys
import json
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parent))
import iniciar_assistido as launcher
from evidencia_dna import compact_controls, read_manifest, build_report
from validar_referencias import SnapshotInvalid

BASE=Path(__file__).resolve().parents[2]

class EvidenceTests(unittest.TestCase):
    def test_manifest_integro(self):
        for p in ['CONSULTOR','SUPERVISOR']:
            self.assertEqual(len(read_manifest(BASE/'manifesto_modelos.json',p)['snapshot_sha256']),64)

    def test_perfil_original_227(self):
        for p in ['CONSULTOR','SUPERVISOR']:
            reference=launcher.read_reference(p)
            self.assertEqual(len(compact_controls(reference)),227)

    def test_relatorio_possui_evidencias_sem_identidade_automatica(self):
        ref=launcher.read_reference('CONSULTOR')
        from datetime import datetime,timezone
        raw={'perfil_referencia':'CONSULTOR','capturado_em':datetime.now(timezone.utc).isoformat(), 'identidade_candidatos':[{'campo':'usuario.id','valor':'123'},{'campo':'usuario.password','valor':'private'}], 'origem':'cadastro.help.com.br', 'itens':[]}
        counts={}; specials=[]
        from validar_referencias import make_snapshot
        for item in compact_controls(ref):
            raw['itens'].append({'ordem':item['ordem_dom'],'secao':item['secao'],'subsecao':item['subsecao'],'rotulo':item['rotulo'],'marcado':item['marcado'],'ng_model':item['ng_model'],'controle_global':item['ng_model']!='item.selected' and 'Marcar' in item['rotulo']})
        report=build_report(ref,raw,read_manifest(BASE/'manifesto_modelos.json','CONSULTOR')['snapshot_sha256'])
        self.assertEqual(len(report['controles_evidencia']),227)
        self.assertEqual(report['divergencias_total'],0)
        self.assertEqual(report['identidade_evidencia']['status'],'nao_verificada')
        self.assertNotIn('password',json.dumps(report))
        self.assertFalse(report['gravou_no_dna'])
        self.assertEqual(report['versao_relatorio'],2)

    def test_diferenca_real(self):
        ref=launcher.read_reference('CONSULTOR')
        from datetime import datetime,timezone
        raw={'capturado_em':datetime.now(timezone.utc).isoformat(), 'origem':'cadastro.help.com.br', 'itens':[]}
        for item in compact_controls(ref):
            raw['itens'].append({'ordem':item['ordem_dom'],'secao':item['secao'],'subsecao':item['subsecao'],'rotulo':item['rotulo'],'marcado':item['marcado'],'ng_model':item['ng_model'],'controle_global':False})
        raw['itens'][10]['marcado']=not raw['itens'][10]['marcado']
        r=build_report(ref,raw,read_manifest(BASE/'manifesto_modelos.json','CONSULTOR')['snapshot_sha256'])
        self.assertEqual(r['divergencias_total'],1)

if __name__=='__main__':unittest.main()