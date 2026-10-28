"""Testes de seguranca/consistencia sem arquivos privados ou navegador autenticado."""
from __future__ import annotations

import unittest

from dna_diagnostico import UnsafePage, _verify_local_cdp, allowed_url, norm_name, row_matches_name
from validar_referencias import SnapshotInvalid, compare_snapshots


def fixture() -> dict:
    controls = []
    for i in range(1, 225):
        controls.append({"ordem_dom": i, "secao": "Funções Consig", "subsecao": "Acesso a Telas",
                         "rotulo": f"Permissão fictícia {i}", "ocorrencia": 1,
                         "ng_model": "item.selected", "marcado": i % 3 == 0})
    return {"total_controles": 227, "permissoes": controls,
            "controle_sso_e_globais": [
                {"ordem_dom": i, "secao": "Controles", "subsecao": "", "rotulo": f"Control {i}",
                 "ocorrencia": 1, "ng_model": "ssocheck", "marcado": False}
                for i in range(225, 228)]}


class ReadOnlySecurityTests(unittest.TestCase):
    def test_origem_exata(self):
        self.assertTrue(allowed_url("https://cadastro.help.com.br/#/usuario/manutencao/123"))
        for url in ("https://cadastro.help.com.br.evil.test/", "http://cadastro.help.com.br/",
                    "https://dns.help.com.br/", "https://cadastro.help.com.br@evil.test/"):
            self.assertFalse(allowed_url(url))

    def test_cdp_apenas_localhost(self):
        _verify_local_cdp("http://127.0.0.1:9222")
        for url in ("https://127.0.0.1:9222", "http://192.168.1.1:9222", "http://127.0.0.1"):
            with self.assertRaises(UnsafePage):
                _verify_local_cdp(url)

    def test_nome_exato(self):
        self.assertEqual(norm_name("José Maria"), norm_name(" JOSE  MARIA "))
        self.assertTrue(row_matches_name(["José Maria", "123"], "JOSE MARIA"))
        self.assertFalse(row_matches_name(["José Maria Silva"], "José Maria"))

    def test_snapshot_falha_fechada(self):
        ref = fixture()
        other = fixture()
        self.assertEqual(compare_snapshots(ref,other), [])
        other["permissoes"][0]["rotulo"] = "Outro nome"
        with self.assertRaises(SnapshotInvalid):
            compare_snapshots(ref,other)

    def test_diferencas_detectadas(self):
        ref,other = fixture(),fixture()
        other["permissoes"][10]["marcado"] = not other["permissoes"][10]["marcado"]
        self.assertEqual(len(compare_snapshots(ref,other)),1)


if __name__ == "__main__":
    unittest.main()