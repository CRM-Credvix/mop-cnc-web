"""Testes offline do assistente (nenhuma conexao ao DNA)."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import iniciar_assistido as launcher
from validar_referencias import SnapshotInvalid


class TestAssistente(unittest.TestCase):
    def test_modelos_incluidos_e_validos(self):
        for profile in ('CONSULTOR', 'SUPERVISOR'):
            reference = launcher.read_reference(profile)
            self.assertEqual(len(reference['permissoes']), 224)
            self.assertEqual(len(reference['controle_sso_e_globais']), 3)

    def test_menu_aceita_opcoes_e_sair(self):
        for option, profile in [('1', 'CONSULTOR'), ('2', 'SUPERVISOR')]:
            self.assertEqual(launcher.choose_profile(lambda _: option)[0], profile)
        self.assertIsNone(launcher.choose_profile(lambda _: '0'))

    def test_relatorio_com_captura_original_consultor(self):
        orig = Path('/mnt/data/dna_consultor_20261022_102711_015259.json')
        if not orig.exists():
            self.skipTest('fixture externa nao existe no ambiente')
        raw = json.loads(orig.read_text(encoding='utf-8'))
        raw['perfil_referencia'] = 'CONSULTOR'
        from datetime import datetime,timezone
        raw['capturado_em'] = datetime.now(timezone.utc).isoformat()
        with patch.object(launcher, 'inspect_live', return_value=raw):
            report = launcher.make_report(launcher.read_reference('CONSULTOR'), 'http://127.0.0.1:9222')
        self.assertEqual(report['controles_verificados'], 227)
        self.assertEqual(report['divergencias_total'], 0)
        self.assertFalse(report['gravou_no_dna'])

    def test_relatorio_gera_arquivo_local(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(launcher, 'RESULTADOS', Path(tmp)):
                path = launcher.save_report({'resultado': 'ok', 'gravou_no_dna': False}, 'CONSULTOR')
            self.assertTrue(path.exists())
            self.assertFalse(json.loads(path.read_text(encoding='utf-8'))['gravou_no_dna'])

    def test_modelo_invalido_falha_fechada(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'modelo_consultor_v1.json'
            source.write_text('{}', encoding='utf-8')
            with patch.object(launcher, 'FIXTURES', Path(tmp)):
                with self.assertRaises((SnapshotInvalid, KeyError)):
                    launcher.read_reference('CONSULTOR')


if __name__ == '__main__':
    unittest.main()