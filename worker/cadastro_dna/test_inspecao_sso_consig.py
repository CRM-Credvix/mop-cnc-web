"""Testes offline de salvaguardas do inspetor SSO/Consig."""
import unittest
from .inspecao_sso_consig import SCRIPT, resumir_estrutura


class TesteInspecaoSsoConsig(unittest.TestCase):
    def test_sem_candidatos_bloqueia(self):
        r = resumir_estrutura({"candidatos": [], "candidatos_total": 0})
        self.assertEqual(r["situacao"], "revisao")
        self.assertFalse(r["seletores_homologados"])
        self.assertFalse(r["cadastro_liberado"])
        self.assertFalse(r["clicou"])

    def test_candidatos_nao_liberam_execucao(self):
        r = resumir_estrutura({"candidatos": [
            {"atributos": {"ng-model": "usuario.acessoSso"}},
            {"atributos": {"name": "funcaoConsig"}}
        ]})
        self.assertEqual(r["sso_candidatos"], 1)
        self.assertEqual(r["funcao_consig_candidatos"], 1)
        self.assertFalse(r["seletores_homologados"])
        self.assertFalse(r["cadastro_liberado"])
        self.assertFalse(r["leu_dados_pessoais"])

    def test_script_nao_executa_mutacoes(self):
        for forbidden in (".click(", ".fill(", ".dispatchEvent(", ".setAttribute(",
                          "fetch(", "localStorage", "sessionStorage", "textContent",
                          "outerHTML", "innerHTML"):
            self.assertNotIn(forbidden, SCRIPT)


if __name__ == "__main__":
    unittest.main()
