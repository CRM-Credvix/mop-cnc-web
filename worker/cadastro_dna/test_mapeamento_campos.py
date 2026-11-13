"""Teste de leitura: apenas metadados, sem acessar valores do formulario."""
import unittest
from .mapeamento_campos import mapear_campos, ROTULOS


class FakeLocator:
    def __init__(self, attributes=None, count=1):
        self.attributes=attributes or {}
        self._count=count
    def count(self):
        return self._count
    def evaluate(self, _js):
        return self.attributes


class FakeFrame:
    def get_by_label(self, label, exact=False):
        assert exact is True and label in ROTULOS
        return FakeLocator({"tag":"input","type":"text","id":"nome","name":"campoNome","ng_model":"usuario.nome"})
    def locator(self, selector):
        assert selector == '[ng-model="usuario.acessoSso"], [data-ng-model="usuario.acessoSso"]'
        return FakeLocator({"tag":"input","type":"checkbox","id":"sso"},1)


class MapeamentoTests(unittest.TestCase):
    def test_mapeia_apenas_atributos(self):
        result=mapear_campos(FakeFrame())
        self.assertTrue(result["sem_valores_pessoais"])
        self.assertTrue(result["sem_escrita"])
        self.assertEqual(result["sso_ng_model"]["quantidade"],1)
        self.assertEqual(result["campos"]["Nome:"]["identificadores"]["ng_model"],"usuario.nome")
        self.assertNotIn("value",str(result).lower())


if __name__=="__main__":
    unittest.main()
