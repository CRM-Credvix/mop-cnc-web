"""Entrada do agente Windows para diagnostico e testes SEGUROS.

Proibido reservar filas enquanto o cadastro e a validacao CPF nao forem
homologados em uma conta de teste autorizada.
"""
from __future__ import annotations

import argparse
import os
import sys
import unittest
from pathlib import Path


def diagnostico() -> int:
    print("CREDVIX | CADASTRO DNA | DIAGNOSTICO SEM ESCRITA")
    print("Plataforma Windows:", "SIM" if os.name=="nt" else "NAO")
    try:
        import playwright.sync_api  # noqa: F401
        print("Playwright:", "INSTALADO")
    except ImportError:
        print("Playwright:", "NAO INSTALADO")
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM  # noqa: F401
        print("AES-GCM:", "DISPONIVEL")
    except ImportError:
        print("AES-GCM:", "NAO DISPONIVEL")
    try:
        import requests  # noqa: F401
        print("Requests:", "INSTALADO")
    except ImportError:
        print("Requests:", "NAO INSTALADO")
    print("Cadastro no DNA: BLOQUEADO (homologacao pendente)")
    print("Reserva no Supabase: NAO EXECUTADA")
    return 0


def main() -> int:
    ap=argparse.ArgumentParser(description="Agente Cadastro DNA (modo seguro)")
    ap.add_argument("--diagnostico",action="store_true")
    ap.add_argument("--testes",action="store_true")
    ap.add_argument("--executar",action="store_true")
    args=ap.parse_args()
    if args.testes:
        # -m unittest worker.cadastro_dna.test_* funciona na raiz do repositorio.
        root=Path(__file__).resolve().parents[2]
        sys.path.insert(0,str(root))
        suite=unittest.defaultTestLoader.loadTestsFromNames([
            "worker.cadastro_dna.test_estado",
            "worker.cadastro_dna.test_monitor",
            "worker.cadastro_dna.test_criptografia",
            "worker.cadastro_dna.test_perfis",
            "worker.cadastro_dna.test_sql_invariantes",
            "worker.cadastro_dna.test_formulario",
            "worker.cadastro_dna.test_homologacao_unificada",
        ])
        result=unittest.TextTestRunner(verbosity=2).run(suite)
        return 0 if result.wasSuccessful() else 1
    if args.executar:
        print("BLOQUEADO: falta homologar seletores do cadastro, lojas e retorno CPF.")
        print("Nenhuma reserva criada; nenhum usuario alterado.")
        return 3
    return diagnostico()


if __name__=="__main__":
    raise SystemExit(main())
