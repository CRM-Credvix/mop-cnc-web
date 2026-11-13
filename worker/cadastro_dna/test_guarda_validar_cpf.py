"""Testes offline: nao permitir clique baseado apenas na posicao do icone."""
import tempfile
import unittest
from pathlib import Path

from .guarda_validar_cpf import (
    AssinaturaValidada, CliqueBloqueado, validar_alvo,
)


class MockBotao:
    def __init__(self, signature=None, enabled=True):
        self.signature=signature
        self.enabled=enabled
    def is_visible(self): return True
    def is_enabled(self): return self.enabled
    def get_attribute(self,name): return self.signature if name=="ng-click" else None
    def element_handle(self): return self
    def evaluate(self,code,other): return self is other


class MockLocators:
    def __init__(self, buttons):
        self.buttons=buttons
    def count(self): return len(self.buttons)
    def nth(self,index): return self.buttons[index]
    @property
    def first(self): return self.buttons[0]


class MockLinha:
    def __init__(self,buttons): self.buttons=buttons
    def count(self): return 1
    def locator(self,selector):
        if selector.startswith("button, a"):
            return MockLocators(self.buttons)
        return MockLocators([x for x in self.buttons if x.signature=="validarCpf()"])


class GuardaTests(unittest.TestCase):
    def setUp(self):
        self.botoes=[MockBotao() for _ in range(7)]
        self.botoes[2].signature="validarCpf()"
        self.linha=MockLinha(self.botoes)
        self.assinatura=AssinaturaValidada("ng-click","validarCpf()",True)

    def test_indice_tres_confirmado_com_assinatura(self):
        alvo=validar_alvo(self.linha,self.assinatura,identidade_confirmada=True)
        self.assertIs(alvo,self.botoes[2])

    def test_nao_homologado_bloqueia(self):
        with self.assertRaises(CliqueBloqueado):
            validar_alvo(self.linha,AssinaturaValidada("ng-click","validarCpf()"),
                         identidade_confirmada=True)

    def test_identidade_ambigua_bloqueia(self):
        with self.assertRaises(CliqueBloqueado):
            validar_alvo(self.linha,self.assinatura,identidade_confirmada=False)

    def test_icone_trocou_de_posicao_bloqueia(self):
        self.botoes[2].signature=None
        self.botoes[3].signature="validarCpf()"
        with self.assertRaises(CliqueBloqueado):
            validar_alvo(self.linha,self.assinatura,identidade_confirmada=True)

    def test_icone_desabilitado_bloqueia(self):
        self.botoes[2].enabled=False
        with self.assertRaises(CliqueBloqueado):
            validar_alvo(self.linha,self.assinatura,identidade_confirmada=True)

    def test_somente_seis_icones_bloqueia(self):
        self.botoes.pop()
        with self.assertRaises(CliqueBloqueado):
            validar_alvo(self.linha,self.assinatura,identidade_confirmada=True)

    def test_registra_log_sem_dados_pessoais(self):
        with tempfile.TemporaryDirectory() as td:
            log=Path(td)/"guard.jsonl"
            with self.assertRaises(CliqueBloqueado):
                validar_alvo(self.linha,None,identidade_confirmada=True,arquivo_log=log)
            txt=log.read_text(encoding="utf-8")
            self.assertIn("assinatura_nao_homologada",txt)
            self.assertIn('"clique_executado": false',txt)


if __name__=="__main__":
    unittest.main()
