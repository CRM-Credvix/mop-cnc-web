"""Testes sem acesso a DNA/Supabase. Executar com:
python -m unittest worker.cadastro_dna.test_estado -v
"""
import unittest
from .estado import Evidencia, Status, classificar, nova_tentativa_autorizada


class EstadoTests(unittest.TestCase):
    def test_ativo_exige_identidade(self):
        self.assertEqual(classificar(Evidencia.ATIVACAO_CONFIRMADA, identidade_confirmada=False).status, Status.REVISAO)

    def test_ativo_apenas_com_evidencia(self):
        self.assertEqual(classificar(Evidencia.ATIVACAO_CONFIRMADA, identidade_confirmada=True).status, Status.ATIVO)

    def test_salvar_nao_e_suficiente(self):
        self.assertEqual(classificar(Evidencia.VALIDACAO_SOLICITADA, identidade_confirmada=True).status, Status.AGUARDANDO_VALIDACAO)

    def test_estado_incerto_nao_reexecuta(self):
        self.assertEqual(classificar(Evidencia.ESTADO_INCERTO, identidade_confirmada=True).status, Status.REVISAO)
        self.assertFalse(nova_tentativa_autorizada(confirmado_existente=False, estado_incerto=True))

    def test_cadastro_existente_nao_reexecuta(self):
        self.assertFalse(nova_tentativa_autorizada(confirmado_existente=True, estado_incerto=False))


if __name__ == "__main__":
    unittest.main()
