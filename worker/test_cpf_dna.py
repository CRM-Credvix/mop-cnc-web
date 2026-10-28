"""Testes unitarios de CPF e de privacidade (dados ficticios)."""
import json
import unittest
from cpf_dna import cpf_valido, comparar_cpf_login


def gerar_cpf(base='123456789'):
    seq = [int(c) for c in base]
    for length in (9,10):
        d = (sum(seq[j] * (length + 1 - j) for j in range(length)) * 10) % 11
        seq.append(0 if d == 10 else d)
    return ''.join(map(str,seq))


def scan(cpf,login):
    return {'formato':'dna-cpf-login-v1','cpf':{'valores':cpf},'login':{'valores':login}}


class TestCPF(unittest.TestCase):
    def test_valido(self):
        self.assertTrue(cpf_valido(gerar_cpf()))

    def test_invalido_repetido(self):
        self.assertFalse(cpf_valido('11111111111'))
        self.assertFalse(cpf_valido('00000000000'))

    def test_digito_verificador(self):
        original = gerar_cpf()
        self.assertFalse(cpf_valido(original[:-1] + str((int(original[-1])+1) % 10)))

    def test_duas_leituras_sao_candidatas(self):
        cpf=gerar_cpf()
        report=comparar_cpf_login([scan([cpf],[cpf]),scan([cpf],[cpf])],chave=b'x'*32)
        self.assertEqual(report['resultado'],'cpf_login_coincidem_na_tela')
        self.assertTrue(report['cpf_formato_valido'])
        self.assertTrue(report['login_corresponde_cpf'])
        self.assertEqual(len(report['cpf_hmac']),64)
        self.assertNotIn(cpf,json.dumps(report))

    def test_diferente_na_mesma_tela(self):
        a=gerar_cpf('123456789');b=gerar_cpf('987654321')
        report=comparar_cpf_login([scan([a],[b]),scan([a],[b])],chave=b'x'*32)
        self.assertEqual(report['resultado'],'cpf_login_diferentes')
        self.assertIsNone(report['cpf_hmac'])

    def test_leituras_inconsistentes(self):
        a=gerar_cpf('123456789');b=gerar_cpf('987654321')
        r=comparar_cpf_login([scan([a],[a]),scan([b],[b])],chave=b'x'*32)
        self.assertEqual(r['resultado'],'leituras_inconsistentes')

    def test_ambiguo(self):
        a=gerar_cpf('123456789');b=gerar_cpf('987654321')
        r=comparar_cpf_login([scan([a,b],[a]),scan([a,b],[a])],chave=b'x'*32)
        self.assertEqual(r['resultado'],'valores_ambiguos')

    def test_ausente(self):
        r=comparar_cpf_login([scan([],[]),scan([],[])],chave=b'x'*32)
        self.assertEqual(r['resultado'],'cpf_ou_login_ausente')

    def test_sem_chave_nao_cria_hash(self):
        r=comparar_cpf_login([scan([],[]),scan([],[])])
        self.assertIsNone(r['cpf_hmac'])

    def test_identidade_nao_verificada(self):
        from evidencia_dna import build_report,compact_controls,read_manifest
        from iniciar_assistido import read_reference
        from datetime import datetime,timezone
        from pathlib import Path
        ref=read_reference('CONSULTOR');cpf=gerar_cpf()
        items=[{'ordem':x['ordem_dom'],'secao':x['secao'],'subsecao':x['subsecao'],'rotulo':x['rotulo'],'ng_model':x['ng_model'],'marcado':x['marcado'], 'controle_global':x['ng_model']!='item.selected' and 'Marcar' in x['rotulo']} for x in compact_controls(ref)]
        raw={'itens':items,'cpf_login_observacoes':[scan([cpf],[cpf])]*2,'origem':'cadastro.help.com.br','capturado_em':datetime.now(timezone.utc).isoformat()}
        from unittest.mock import patch
        with patch('cpf_dna.obter_chave_local',return_value=b'x'*32):
            report=build_report(ref,raw,read_manifest(Path(__file__).resolve().parents[2]/'manifesto_modelos.json','CONSULTOR')['snapshot_sha256'])
        self.assertEqual(report['identidade_evidencia']['status'],'nao_verificada')
        self.assertEqual(report['identidade_evidencia']['parecer'],'cpf_login_coincidem_na_tela')
        self.assertNotIn(cpf,json.dumps(report))
        self.assertLess(len(json.dumps(report['identidade_evidencia'])),4096)
        self.assertFalse(report['gravou_no_dna'])

if __name__ == '__main__': unittest.main()