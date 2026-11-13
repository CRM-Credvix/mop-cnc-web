"""Mapeia identificadores tecnicos do formulario DNA, sem ler valores.

Nao executa acao sobre campos: apenas conta correspondencias e atributos
estaticos de controles vinculados aos rotulos permitidos.
"""
from __future__ import annotations

from .contrato_formulario import atributo_publicavel

ROTULOS = (
    "Nome:", "CPF:", "Data de Nascimento:", "E-mail:",
    "Telefone Celular:", "Login IB Consig:", "Descrição uso Perfil:",
    "Observação:", "Perfil:", "Sub Perfil:",
)
SSO_NG_MODEL = "usuario.acessoSso"


def mapear_campos(frame) -> dict:
    """Nao chama input_value, text_content, screenshot, fill nem click."""
    campos = {}
    for rotulo in ROTULOS:
        locator = frame.get_by_label(rotulo, exact=True)
        quantidade = locator.count()
        item = {"quantidade": quantidade}
        if quantidade == 1:
            static = locator.evaluate("""el => ({
              tag: el.tagName.toLowerCase(),
              type: el.getAttribute('type') || '',
              id: el.getAttribute('id') || '',
              name: el.getAttribute('name') || '',
              ng_model: el.getAttribute('ng-model') || el.getAttribute('data-ng-model') || ''
            })""")
            item["identificadores"] = {
                k: atributo_publicavel(static.get(k)) for k in
                ("tag", "type", "id", "name", "ng_model")
            }
        campos[rotulo] = item
    sso = frame.locator('[ng-model="usuario.acessoSso"], [data-ng-model="usuario.acessoSso"]')
    quantidade = sso.count()
    controle_sso = {"quantidade": quantidade}
    if quantidade == 1:
        static = sso.evaluate("""el => ({
            tag: el.tagName.toLowerCase(),
            type: el.getAttribute('type') || '',
            id: el.getAttribute('id') || ''
        })""")
        controle_sso.update({
            "tag": atributo_publicavel(static.get("tag")),
            "tipo": atributo_publicavel(static.get("type")),
            "id": atributo_publicavel(static.get("id")),
        })
    return {
        "campos": campos,
        "sso_ng_model": controle_sso,
        "sem_valores_pessoais": True,
        "sem_escrita": True,
    }
