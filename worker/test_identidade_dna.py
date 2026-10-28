"""Unit tests for candidate identification only. No request to real DNA."""
import hashlib
import json
import unittest
from datetime import datetime, timezone
from pathlib import Path

from identidade_dna import analyze_identity
from evidencia_dna import build_report, compact_controls, read_manifest
from iniciar_assistido import read_reference


def probe(*candidates):
    return {'formato': 'dna-id-candidatos-v1', 'candidatos': list(candidates)}


def item(kind='id', value='abc123', source='ng-model:usuario.id'):
    return {'tipo': kind, 'valor': value, 'fonte': source}


class TestIdentityProbe(unittest.TestCase):
    def test_repeated_user_id_is_stable_but_not_verified(self):
        reading = probe(item())
        out = analyze_identity([reading, reading])
        self.assertEqual(out['status'], 'nao_verificada')
        self.assertEqual(out['parecer'], 'candidato_estavel_na_tela')
        self.assertEqual(len(out['candidatos_tecnicos']), 1)
        self.assertNotIn('abc123', json.dumps(out))

    def test_changes_between_reads_are_not_accepted(self):
        out = analyze_identity([probe(item(value='123')), probe(item(value='456'))])
        self.assertEqual(out['parecer'], 'leituras_inconsistentes')
        self.assertEqual(out['candidatos_tecnicos'], [])

    def test_conflicting_sources_not_accepted(self):
        both = probe(item(value='abc',source='ng-model:usuario.id'),
                     item(value='def',source='url:usuarioId'))
        out = analyze_identity([both,both])
        self.assertEqual(out['parecer'], 'identificadores_conflitantes')

    def test_same_id_two_sources_accepted_as_candidate(self):
        both = probe(item(value='abc',source='ng-model:usuario.id'),
                     item(value='abc',source='url:usuarioId'))
        out = analyze_identity([both,both])
        self.assertEqual(out['parecer'], 'candidato_estavel_na_tela')
        self.assertEqual(len(out['candidatos_tecnicos']), 2)

    def test_absent_id_fails_closed(self):
        out = analyze_identity([probe(),probe()])
        self.assertEqual(out['parecer'], 'identificador_ausente')
        self.assertEqual(out['status'], 'nao_verificada')

    def test_sensitive_source_never_passes(self):
        bad = probe(item(value='supersecret',source='ng-model:usuario.senha'),
                    item(value='foo@bar.com',source='ng-model:usuario.login'))
        out = analyze_identity([bad,bad])
        self.assertEqual(out['parecer'], 'identificador_ausente')
        self.assertNotIn('supersecret',json.dumps(out))

    def test_only_code_does_not_claim_unique_id(self):
        reads = probe(item(kind='codigo',value='555',source='ng-model:usuario.codigo'))
        out = analyze_identity([reads,reads])
        self.assertEqual(out['parecer'], 'codigo_ou_matricula_candidato')
        self.assertEqual(out['status'],'nao_verificada')

    def test_report_v2_remains_compatible_and_contains_no_raw_id(self):
        root = Path(__file__).resolve().parents[2]
        ref = read_reference('CONSULTOR')
        fields = []
        for c in compact_controls(ref):
            fields.append({'ordem':c['ordem_dom'],'secao':c['secao'],
              'subsecao':c['subsecao'],'rotulo':c['rotulo'],
              'marcado':c['marcado'],'ng_model':c['ng_model'],
              'controle_global':c['ng_model']!='item.selected' and 'Marcar' in c['rotulo']})
        scans=probe(item(value='USER_ABC_987'))
        raw={'itens':fields,'identidade_observacoes':[scans,scans],
             'capturado_em':datetime.now(timezone.utc).isoformat(),
             'perfil_referencia':'CONSULTOR','origem':'cadastro.help.com.br'}
        manifest=read_manifest(root/'manifesto_modelos.json','CONSULTOR')
        report=build_report(ref,raw,manifest['snapshot_sha256'])
        self.assertEqual(report['versao_relatorio'],2)
        self.assertEqual(report['controles_verificados'],227)
        self.assertEqual(report['divergencias_total'],0)
        self.assertFalse(report['gravou_no_dna'])
        self.assertEqual(report['identidade_evidencia']['status'],'nao_verificada')
        self.assertNotIn('USER_ABC_987',json.dumps(report))
        self.assertLess(len(json.dumps(report['identidade_evidencia'])),4096)


if __name__ == '__main__':
    unittest.main()