"""Selecao real do Perfil e Sub Perfil, isolada do envio do cadastro.

Integra apenas os dois campos ja confirmados pelos diagnosticos. Nao clica
em Cadastrar nem modifica Funcoes Consig. Requer aba autorizada e aberta.
"""
from __future__ import annotations

from .contrato_formulario import EstruturaInsegura
from .preflight_perfil import (
    PADRAO, PERFIL_ID, SUBPERFIL_ID, PERFIL_NG_MODEL, SUBPERFIL_NG_MODEL,
)


def _select_unico(frame, selector: str, expected_model: str):
    locator=frame.locator(selector)
    if locator.count()!=1:
        raise EstruturaInsegura("Campo de perfil ausente ou duplicado.")
    current=locator.get_attribute("ng-model") or locator.get_attribute("data-ng-model")
    if current!=expected_model:
        raise EstruturaInsegura("Contrato ng-model divergente: "+selector)
    if locator.evaluate("el => el.tagName.toLowerCase()")!="select":
        raise EstruturaInsegura("Controle nao e select.")
    return locator


def _selecionado(locator) -> str:
    return locator.evaluate("el => (el.selectedOptions[0]?.textContent||'').trim()")


def selecionar_perfil_subperfil(frame, perfil: str) -> tuple[str,str]:
    if perfil not in PADRAO:
        raise EstruturaInsegura("Perfil nao autorizado.")
    rotulo_perfil,rotulo_subperfil=PADRAO[perfil]
    principal=_select_unico(frame,"#"+PERFIL_ID,PERFIL_NG_MODEL)
    principal.select_option(label=rotulo_perfil,timeout=10000)
    if _selecionado(principal)!=rotulo_perfil:
        raise EstruturaInsegura("Perfil nao confirmado.")
    # A aplicacao Angular recarrega as opcoes do subperfil apos mudar Perfil.
    sub=_select_unico(frame,"#"+SUBPERFIL_ID,SUBPERFIL_NG_MODEL)
    sub.locator("option").filter(has_text=rotulo_subperfil).first.wait_for(state="attached",timeout=10000)
    opcoes=sub.locator("option").all_text_contents()
    if sum(1 for t in opcoes if t.strip()==rotulo_subperfil)!=1:
        raise EstruturaInsegura("Subperfil oficial ausente ou duplicado.")
    sub.select_option(label=rotulo_subperfil,timeout=10000)
    if _selecionado(principal)!=rotulo_perfil or _selecionado(sub)!=rotulo_subperfil:
        raise EstruturaInsegura("Perfil e subperfil nao confirmados.")
    return rotulo_perfil,rotulo_subperfil
