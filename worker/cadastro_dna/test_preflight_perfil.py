"""Preflight validado com estrutura reduzida dos dois relatorios DNA."""
import unittest
from copy import deepcopy
from .preflight_perfil import verificar_relatorio
from .contrato_formulario import EstruturaInsegura


def exemplo(perfil):
    consulta = perfil == "CONSULTOR"
    nome = "Consultor" if consulta else "Supervisor"
    sub = "Consultor 2" if consulta else "Supervisor 2"
    opcoes = (["Consultor 1", "Consultor 2", "Consultor 3", "Consultor B2C",
                "Consultor Híbrido"] if consulta else ["Supervisor 1", "Supervisor 2"])
    return {
      "situacao":"estrutura_lida","formulario":"manutencao_usuario_novo",
      "estrutura":{
        "botao_cadastrar":1,
        "campos":{key:1 for key in ("Nome:","CPF:","Data de Nascimento:","E-mail:",
                  "Telefone Celular:","Perfil:","Sub Perfil:")},
        "selects":[
            {"identificadores":{"id":"perfilVenda","ng-model":"usuario.perfilVenda.id"},
             "opcoes_reconhecidas":["Caixa","Consultor","SAF","Supervisor"],
             "selecionado_reconhecido":nome},
            {"identificadores":{"id":"subPerfilVenda","ng-model":"usuario.subPerfilVenda.id"},
             "opcoes_reconhecidas":opcoes,"selecionado_reconhecido":sub}
        ]}}


class PreflightTest(unittest.TestCase):
    def test_consultor(self):
        report=verificar_relatorio(exemplo("CONSULTOR"),"CONSULTOR")
        self.assertEqual(report.subperfil,"Consultor 2")
        self.assertFalse(report.autorizacao_cadastrar)

    def test_supervisor(self):
        report=verificar_relatorio(exemplo("SUPERVISOR"),"SUPERVISOR")
        self.assertEqual(report.subperfil,"Supervisor 2")
        self.assertFalse(report.autorizacao_cadastrar)

    def test_troca_de_perfil(self):
        with self.assertRaises(EstruturaInsegura):
            verificar_relatorio(exemplo("CONSULTOR"),"SUPERVISOR")

    def test_ng_model_divergente(self):
        dado=exemplo("CONSULTOR")
        dado["estrutura"]["selects"][0]["identificadores"]["ng-model"]="outro"
        with self.assertRaises(EstruturaInsegura):
            verificar_relatorio(dado,"CONSULTOR")

    def test_nao_aceita_duplo_cadastrar(self):
        dado=exemplo("SUPERVISOR")
        dado["estrutura"]["botao_cadastrar"]=2
        with self.assertRaises(EstruturaInsegura):
            verificar_relatorio(dado,"SUPERVISOR")


if __name__=="__main__":
    unittest.main()
