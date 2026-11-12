"""Preflight de PERFIL e SUBPERFIL DNA - somente leitura.

Validado contra relatorios de 12/11/2026. O preflight nao preenche dados,
nao altera permissoes, nao salva e nunca clica Cadastrar.
"""
from __future__ import annotations

from dataclasses import dataclass
from .contrato_formulario import EstruturaInsegura

PERFIL_ID = "perfilVenda"
SUBPERFIL_ID = "subPerfilVenda"
PERFIL_NG_MODEL = "usuario.perfilVenda.id"
SUBPERFIL_NG_MODEL = "usuario.subPerfilVenda.id"
PADRAO = {"CONSULTOR": ("Consultor", "Consultor 2"),
          "SUPERVISOR": ("Supervisor", "Supervisor 2")}


@dataclass(frozen=True)
class Preflight:
    perfil: str
    subperfil: str
    pronto_para_inspecao: bool = True
    autorizacao_cadastrar: bool = False


def verificar_relatorio(dados: dict, perfil_desejado: str) -> Preflight:
    """Analisa exclusivamente metadados estruturais capturados pelo inspetor."""
    if perfil_desejado not in PADRAO:
        raise EstruturaInsegura("Perfil fora do padrao oficial.")
    if not isinstance(dados, dict) or dados.get("situacao") != "estrutura_lida":
        raise EstruturaInsegura("Captura invalida.")
    if dados.get("formulario") != "manutencao_usuario_novo":
        raise EstruturaInsegura("Formulario de inclusao nao reconhecido.")
    estrutura = dados.get("estrutura") or {}
    if estrutura.get("botao_cadastrar") != 1:
        raise EstruturaInsegura("Botao Cadastrar ausente ou duplicado.")
    for campo in ("Nome:", "CPF:", "Data de Nascimento:", "E-mail:",
                  "Telefone Celular:", "Perfil:", "Sub Perfil:"):
        if (estrutura.get("campos") or {}).get(campo) != 1:
            raise EstruturaInsegura("Campo obrigatorio nao identificado: " + campo)
    selects = estrutura.get("selects")
    if not isinstance(selects, list) or len(selects) != 2:
        raise EstruturaInsegura("Esperados dois selects identificados.")
    por_id = {}
    for item in selects:
        identificadores = item.get("identificadores") or {}
        element_id = identificadores.get("id")
        if element_id in por_id:
            raise EstruturaInsegura("Seletor duplicado.")
        por_id[element_id] = item
    if set(por_id) != {PERFIL_ID, SUBPERFIL_ID}:
        raise EstruturaInsegura("Ids dos selects inesperados.")
    if por_id[PERFIL_ID]["identificadores"].get("ng-model") != PERFIL_NG_MODEL:
        raise EstruturaInsegura("Ng-model Perfil divergiu.")
    if por_id[SUBPERFIL_ID]["identificadores"].get("ng-model") != SUBPERFIL_NG_MODEL:
        raise EstruturaInsegura("Ng-model Subperfil divergiu.")
    perfil, subperfil = PADRAO[perfil_desejado]
    if por_id[PERFIL_ID].get("selecionado_reconhecido") != perfil:
        raise EstruturaInsegura("Perfil selecionado divergiu.")
    if por_id[SUBPERFIL_ID].get("selecionado_reconhecido") != subperfil:
        raise EstruturaInsegura("Subperfil selecionado divergiu.")
    if perfil not in (por_id[PERFIL_ID].get("opcoes_reconhecidas") or []):
        raise EstruturaInsegura("Opcao de perfil indisponivel.")
    if subperfil not in (por_id[SUBPERFIL_ID].get("opcoes_reconhecidas") or []):
        raise EstruturaInsegura("Opcao de subperfil indisponivel.")
    return Preflight(perfil, subperfil)
