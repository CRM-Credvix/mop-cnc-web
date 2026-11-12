"""Testes offline de validacao das duas capturas estruturais."""
import unittest
from .homologacao_unificada import confirmar_opcoes, DiagnosticoInconclusivo


def exemplo(perfil="Consultor",subperfil="Consultor 2"):
    return {
        "situacao":"estrutura_lida",
        "estrutura":{"botao_cadastrar":1,"selects":[
            {"opcoes_reconhecidas":["Consultor","Supervisor","Caixa","SAF"],
             "selecionado_reconhecido":perfil},
            {"opcoes_reconhecidas":[subperfil,"Supervisor 1" if subperfil=="Supervisor 2" else "Consultor 1"],
             "selecionado_reconhecido":subperfil}
        ]}
    }


class TesteUnificada(unittest.TestCase):
    def test_consultor(self):
        confirmar_opcoes(exemplo(),"Consultor","Consultor 2")

    def test_supervisor(self):
        confirmar_opcoes(exemplo("Supervisor","Supervisor 2"),"Supervisor","Supervisor 2")

    def test_perfil_errado(self):
        with self.assertRaises(DiagnosticoInconclusivo):
            confirmar_opcoes(exemplo("Supervisor","Consultor 2"),"Consultor","Consultor 2")

    def test_subperfil_errado(self):
        with self.assertRaises(DiagnosticoInconclusivo):
            confirmar_opcoes(exemplo("Supervisor","Supervisor 1"),"Supervisor","Supervisor 2")

    def test_botao_duplo(self):
        data=exemplo()
        data["estrutura"]["botao_cadastrar"]=2
        with self.assertRaises(DiagnosticoInconclusivo):
            confirmar_opcoes(data,"Consultor","Consultor 2")


if __name__=="__main__":
    unittest.main()
