"""Regressao do padrao oficial de subperfis de cadastro."""
import unittest
from .perfis import SUBPERFIL_OFICIAL, Perfil, ROTULO_DNA, subperfil_oficial, verificar_subperfil


class TestPerfisCadastro(unittest.TestCase):
    def test_consultor(self):
        self.assertEqual(subperfil_oficial("CONSULTOR"), "CONSULTOR_2")
        self.assertEqual(ROTULO_DNA["CONSULTOR_2"], "Consultor 2")

    def test_supervisor(self):
        self.assertEqual(subperfil_oficial("SUPERVISOR"), "SUPERVISOR_1")
        self.assertEqual(ROTULO_DNA["SUPERVISOR_1"], "Supervisor 1")

    def test_so_duas_opcoes(self):
        self.assertEqual(set(SUBPERFIL_OFICIAL), {Perfil.CONSULTOR, Perfil.SUPERVISOR})

    def test_nao_aceita_subperfis_alternativos(self):
        for profile, sub in [
            ("CONSULTOR","CONSULTOR_1"),("CONSULTOR","CONSULTOR_3"),
            ("CONSULTOR","CONSULTOR_B2C"),("CONSULTOR","CONSULTOR_HIBRIDO"),
            ("SUPERVISOR","SUPERVISOR_2")
        ]:
            with self.subTest(profile=profile, sub=sub):
                self.assertFalse(verificar_subperfil(profile,sub))

    def test_outros_perfis_rejeitados(self):
        for profile in ("CAIXA","SAF","",None,"consultor","SUPERVISOR_2"):
            with self.subTest(profile=profile):
                with self.assertRaises(ValueError):
                    subperfil_oficial(profile)


if __name__ == "__main__":
    unittest.main()
