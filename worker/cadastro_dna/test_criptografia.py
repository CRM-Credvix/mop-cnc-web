"""Testes de contrato criptografico sem usar CPF ou chave real."""
import base64
import json
import unittest
from .criptografia import decifrar, DadosProtegidosInvalidos


class TestCifra(unittest.TestCase):
    def setUp(self):
        try:
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        except ImportError:
            self.skipTest("Dependencia cryptography nao instalada")
        self.chave=bytes(range(32))
        self.data={"nome":"Pessoa Exemplo","cpf":"12345678909","nascimento":"1990-01-01",
                   "email":"exemplo@invalid.test","telefone":"27999999999","perfil":"CONSULTOR",
                   "lojas":["51545"],"idempotencia":"00000000-0000-4000-8000-000000000000"}
        self.iv=b"abcdefghijkl"
        raw=self.iv+AESGCM(self.chave).encrypt(self.iv,json.dumps(self.data).encode(),None)
        self.payload=base64.b64encode(raw).decode()

    def test_decifra(self):
        self.assertEqual(decifrar(self.payload,self.chave.hex()),self.data)

    def test_chave_incorreta(self):
        with self.assertRaises(DadosProtegidosInvalidos):
            decifrar(self.payload,(b"x"*32).hex())

    def test_adulteracao(self):
        raw=bytearray(base64.b64decode(self.payload))
        raw[-1]^=1
        with self.assertRaises(DadosProtegidosInvalidos):
            decifrar(base64.b64encode(raw).decode(),self.chave.hex())

    def test_payload_corrompido(self):
        with self.assertRaises(DadosProtegidosInvalidos):
            decifrar("%%%invalid%%%",self.chave.hex())


if __name__=="__main__":
    unittest.main()
