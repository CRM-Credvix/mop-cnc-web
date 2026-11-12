"""Mapeamento OFICIAL exclusivo do NOVO Cadastro DNA.

Os quatro modelos do modulo de padronizacao existente nao sao modificados.
A escolha e derivada do perfil, nunca informada livremente pelo operador.
"""
from __future__ import annotations

from enum import Enum


class Perfil(str, Enum):
    CONSULTOR = "CONSULTOR"
    SUPERVISOR = "SUPERVISOR"


SUBPERFIL_OFICIAL = {
    Perfil.CONSULTOR: "CONSULTOR_2",
    Perfil.SUPERVISOR: "SUPERVISOR_1",
}

ROTULO_DNA = {
    "CONSULTOR_2": "Consultor 2",
    "SUPERVISOR_1": "Supervisor 1",
}


def subperfil_oficial(perfil: str) -> str:
    """Falha fechada para Caixa, SAF, Consultor 1/3/B2C/Hibrido e Supervisor 2."""
    try:
        return SUBPERFIL_OFICIAL[Perfil(perfil)]
    except (ValueError, KeyError, TypeError) as exc:
        raise ValueError("Perfil não autorizado para Cadastro DNA.") from exc


def verificar_subperfil(perfil: str, subperfil: str) -> bool:
    """Verifica correspondencia exata, sem conversao silenciosa."""
    return subperfil_oficial(perfil) == subperfil
