"""Teste offline: ordem das etapas e veto a qualquer gravacao por padrao."""
import unittest
from .fluxo_completo import Pedido, Etapa, PASSOS, planejar, executar_controlado, ExecucaoBloqueada


def pedido(perfil="CONSULTOR"):
    return Pedido("53743","Nome Exemplo","12345678909","01/01/2000",
                  "exemplo@example.org","27","999999999",perfil)


class GatewayFake:
    def __init__(self):
        self.calls=[]
    def __getattr__(self,name):
        def call(*a):
            self.calls.append(name)
            return "nao_confirmado"
        return call


class FluxoTests(unittest.TestCase):
    def test_ordem_perfil_antes_subperfil(self):
        etapas=planejar(pedido()).etapas
        self.assertLess(etapas.index(Etapa.PERFIL),etapas.index(Etapa.SUBPERFIL))
        self.assertLess(etapas.index(Etapa.SSO),etapas.index(Etapa.CADASTRAR))
        self.assertLess(etapas.index(Etapa.CADASTRAR),etapas.index(Etapa.VALIDAR))

    def test_padrao_supervisor(self):
        plano=planejar(pedido("SUPERVISOR"))
        self.assertEqual((plano.perfil,plano.subperfil),("Supervisor","Supervisor 2"))
        self.assertFalse(plano.autorizado_escrever)

    def test_bloqueio_por_padrao(self):
        gateway=GatewayFake()
        with self.assertRaises(ExecucaoBloqueada):
            executar_controlado(pedido(),gateway)
        self.assertEqual(gateway.calls,[])

    def test_ordem_com_gateway_falso(self):
        gateway=GatewayFake()
        executar_controlado(pedido(),gateway,autorizado=True)
        esperado=["abrir_loja_por_codigo","preencher_dados","selecionar_perfil",
                  "aguardar_subperfis","selecionar_subperfil","confirmar_perfil_subperfil",
                  "garantir_sso_marcado","garantir_primeira_funcao_consig_marcada",
                  "confirmar_loja","cadastrar_uma_vez","confirmar_cadastro_concluido",
                  "abrir_usuario_manutencao","pesquisar_nome_completo",
                  "confirmar_identidade_inequivoca","validar_cpf_uma_vez",
                  "consultar_situacao_cpf"]
        self.assertEqual(gateway.calls,esperado)


if __name__=="__main__":
    unittest.main()
