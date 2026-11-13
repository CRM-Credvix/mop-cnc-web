"""Testes offline para validar sem executar cadastro real."""
import unittest
from datetime import datetime, timedelta, timezone
from .monitor import Sinal, Observacao, decidir, observacao_de_consulta_identidade

NOW = datetime(2026, 11, 12, 12, 0, tzinfo=timezone.utc)
LIMITE = NOW + timedelta(minutes=10)


class MonitorTest(unittest.TestCase):
    def test_ativo_exige_prova_cpf(self):
        obs=Observacao(True,True,False,Sinal.ATIVO)
        self.assertEqual(decidir(obs,limite=LIMITE,agora=NOW)[0], "aguardando_validacao")

    def test_ativo_com_todas_as_provas(self):
        obs=Observacao(True,True,True,Sinal.ATIVO)
        self.assertEqual(decidir(obs,limite=LIMITE,agora=NOW)[0], "ativo")

    def test_conta_ativa_nao_prova_validacao_cpf(self):
        obs=observacao_de_consulta_identidade({"status":"trinca_consistente_na_tela","contas_mesmo_cpf":1})
        self.assertFalse(obs.validacao_cpf_confirmada)
        self.assertEqual(decidir(obs,limite=LIMITE,agora=NOW)[0], "aguardando_validacao")

    def test_ambiguo_exige_revisao(self):
        self.assertEqual(decidir(Observacao(False,False,False,Sinal.AMBIGUO),
                                limite=LIMITE,agora=NOW)[0],"revisao")

    def test_prazo_expirado_revisao_sem_nova_escrita(self):
        self.assertEqual(decidir(Observacao(True,True,False,Sinal.PENDENTE),
                                limite=LIMITE,agora=LIMITE)[0],"revisao")

    def test_erro_so_dna_confirmado(self):
        self.assertEqual(decidir(Observacao(True,False,False,Sinal.ERRO,"CPF recusado"),
                                limite=LIMITE,agora=NOW)[0],"erro")

    def test_nao_aceita_data_ingenua(self):
        with self.assertRaises(ValueError):
            decidir(Observacao(True,False,False,Sinal.PENDENTE),
                    limite=datetime(2026,11,12),agora=NOW)


if __name__ == "__main__":
    unittest.main()
