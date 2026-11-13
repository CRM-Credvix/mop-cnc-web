"""Contrato de seletores do novo Cadastro DNA. Nao altera o sistema externo.

Os identificadores concretos so podem ser homologados com inspeção do DOM;
a captura nao inclui CPF, nome, email, telefone, valor de campo nem screenshot.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

PERFIL_TO_SUBPERFIL = {"Consultor": "Consultor 2", "Supervisor": "Supervisor 2"}
ROTULOS_RECONHECIDOS = (
    "Nome:", "CPF:", "Data de Nascimento:", "E-mail:", "Telefone Celular:",
    "Perfil:", "Sub Perfil:", "Login IB Consig:", "Usuário acesso SSO",
    "Descrição uso Perfil:", "Observação:"
)
NOMES_BOTOES = ("Cadastrar",)
ATRIBUTOS_SEGUROS = ("id", "name", "ng-model", "data-ng-model", "type")
IDENTIFICADOR = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_.:-]{0,95}$")


class EstruturaInsegura(ValueError):
    pass


def atributo_publicavel(value: object) -> str:
    """Somente identificadores CSS estaticos. Nunca incluir valores dinamicos ou HTML."""
    if not isinstance(value, str) or not IDENTIFICADOR.fullmatch(value):
        return ""
    return value


def validar_inspecao(payload: dict) -> dict:
    """Valida diagnostico estrutural sem confiar em select arbitrario ou DOM antigo."""
    if not isinstance(payload, dict) or payload.get("formulario") != "manutencao_usuario_novo":
        raise EstruturaInsegura("Tela de inclusao nao identificada de forma unica.")
    if payload.get("botao_cadastrar") != 1:
        raise EstruturaInsegura("Botao Cadastrar ausente ou duplicado.")
    controls = payload.get("controles")
    if not isinstance(controls, dict):
        raise EstruturaInsegura("Estrutura de controles invalida.")
    for title in ("Nome:", "CPF:", "Data de Nascimento:", "E-mail:", "Telefone Celular:", "Perfil:", "Sub Perfil:"):
        if controls.get(title) != 1:
            raise EstruturaInsegura("Campo obrigatorio ausente ou ambiguo: "+title)
    options = payload.get("opcoes", {})
    if not isinstance(options, dict):
        raise EstruturaInsegura("Opcoes de perfil invalidas.")
    if options.get("Consultor") != "Consultor 2" or options.get("Supervisor") != "Supervisor 2":
        raise EstruturaInsegura("Mapeamento de subperfis divergente do oficial.")
    return {"situacao": "estrutura_compatível", "pode_cadastrar": False,
            "subperfis": dict(PERFIL_TO_SUBPERFIL)}
