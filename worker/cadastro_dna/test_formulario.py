"""Teste da politica de leitura e das garantias de fail-closed (offline)."""
import unittest
from .contrato_formulario import atributo_publicavel, validar_inspecao, EstruturaInsegura


class FormularioContratoTests(unittest.TestCase):
    def setUp(self):
        self.payload={"formulario":"manutencao_usuario_novo","botao_cadastrar":1,
                      "controles":{name:1 for name in (
                          "Nome:", "CPF:", "Data de Nascimento:", "E-mail:",
                          "Telefone Celular:", "Perfil:", "Sub Perfil:")},
                      "opcoes":{"Consultor":"Consultor 2","Supervisor":"Supervisor 2"}}

    def test_estrutura_correta_nao_libera_escrita(self):
        result=validar_inspecao(self.payload)
        self.assertFalse(result["pode_cadastrar"])

    def test_cadastrar_duplicado_bloqueado(self):
        self.payload["botao_cadastrar"]=2
        with self.assertRaises(EstruturaInsegura):
            validar_inspecao(self.payload)

    def test_campo_ausente_bloqueado(self):
        self.payload["controles"]["CPF:"]=0
        with self.assertRaises(EstruturaInsegura):
            validar_inspecao(self.payload)

    def test_supervisor_1_bloqueado(self):
        self.payload["opcoes"]["Supervisor"]="Supervisor 1"
        with self.assertRaises(EstruturaInsegura):
            validar_inspecao(self.payload)

    def test_identificador_dinamico_nao_publicado(self):
        self.assertEqual(atributo_publicavel("usuario.acessoSso"),"usuario.acessoSso")
        self.assertEqual(atributo_publicavel("CPF: 12345678909"),"")
        self.assertEqual(atributo_publicavel("a\" onclick=\"test"),"")


if __name__=="__main__":
    unittest.main()
