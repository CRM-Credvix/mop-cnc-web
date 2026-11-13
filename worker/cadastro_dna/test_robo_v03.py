"""Testes de invariantes e consolidacao offline da v0.3."""
import unittest
from .robo_v03 import consolidar, PASSOS


class RoboV03Tests(unittest.TestCase):
    def test_sem_evidencia_tudo_bloqueado_ou_revisao(self):
        resultado = consolidar(formulario=None, permissoes=None, manutencao=None)
        self.assertEqual(resultado["etapas"]["tela_cadastro"], "revisao")
        self.assertEqual(resultado["etapas"]["cadastrar"], "bloqueado")
        self.assertFalse(resultado["autorizado_escrever"])
        self.assertFalse(resultado["clicou"])
        self.assertFalse(resultado["gravou_no_dna"])

    def test_candidatos_nao_homologam_permissoes(self):
        resultado = consolidar(
            formulario={"botao_cadastrar": 1, "campos": {}, "selects": [{}, {}]},
            permissoes={"sso_candidatos": 1, "funcao_consig_candidatos": 2},
            manutencao={"quantidade_barras": 10},
        )
        self.assertEqual(resultado["etapas"]["perfil_subperfil"], "candidatos")
        self.assertEqual(resultado["etapas"]["sso"], "candidatos")
        self.assertEqual(resultado["etapas"]["funcao_consig"], "candidatos")
        self.assertEqual(resultado["etapas"]["terceiro_icone_cpf"], "candidatos")
        for passo in ("cadastrar", "validar_cpf", "fila_supabase"):
            self.assertEqual(resultado["etapas"][passo], "bloqueado")
        self.assertFalse(resultado["autorizado_escrever"])

    def test_passos_nao_excluem_bloqueios(self):
        self.assertTrue({"cadastrar", "validar_cpf", "fila_supabase"} <= set(PASSOS))


if __name__ == "__main__":
    unittest.main()
