"""Testa a filtragem privada e as regras do novo inspetor de 7 icones."""
import unittest

from .inspecao_validar_cpf import _safe_ident, _safe_classes, ler_barras


class FrameFalso:
    def evaluate(self, script):
        assert "querySelectorAll" in script
        icons=[{"tag":"button","id":"","ng_model":"","ng_click_funcao":"",
                "classe_icone":"fa fa-square","rotulo_validar_cpf":False,
                "visivel":True,"desabilitado":False} for _ in range(7)]
        icons[2].update({"ng_click_funcao":"usuario.validarCpf",
                         "classe_icone":"fa fa-refresh",
                         "desabilitado":True})
        return {"quantidade_barras":1,"barras":[{"icones":icons}]}


class InspetorTerceiroIconeTests(unittest.TestCase):
    def test_sete_icones_e_terceiro(self):
        result=ler_barras(FrameFalso())
        self.assertEqual(result["quantidade_barras"],1)
        self.assertEqual(result["barras"][0]["terceiro_indice"],2)
        self.assertEqual(result["barras"][0]["icones"][2]["ng_click_funcao"],"usuario.validarCpf")
        self.assertTrue(result["barras"][0]["icones"][2]["desabilitado"])
        self.assertTrue(result["nenhum_clique"])

    def test_rejeita_conteudo_dinamico(self):
        self.assertEqual(_safe_ident("usuario.validarCpf"),"usuario.validarCpf")
        self.assertEqual(_safe_ident("cpf=12345678909;"),"")
        self.assertEqual(_safe_classes("fa fa-refresh cpf=12345678909;"),["fa","fa-refresh"])


if __name__=="__main__":
    unittest.main()
