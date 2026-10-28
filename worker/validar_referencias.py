"""Validacao dos snapshots capturados no DNA, sem interacao com o sistema.

O snapshot conserva ordem do DOM e ocorrencia de rotulos repetidos, mas a ordem
NAO e considerada identificador persistente: nao habilitar aplicacao automatica
ate homologacao de seletores estaveis por permissao.
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

EXPECTED_COUNT = 227
EXPECTED_PERMISSION_COUNT = 224
EXPECTED_GLOBAL = 2
EXPECTED_SSO = 1
PROFILES = {"CONSULTOR": "Consultor 2", "SUPERVISOR": "Supervisor 1"}


class SnapshotInvalid(ValueError):
    pass


def read_capture(path: str | Path, profile: str) -> dict:
    raw = json.loads(Path(path).read_text(encoding="utf-8-sig"))
    items = raw.get("itens")
    if raw.get("perfil_referencia") != profile or not isinstance(items, list) or len(items) != EXPECTED_COUNT:
        raise SnapshotInvalid(f"Perfil ou contagem divergente para {profile}")
    if raw.get("avisos"):
        raise SnapshotInvalid(f"Captura possui avisos para {profile}")
    if raw.get("total_dom") != EXPECTED_COUNT or raw.get("total_visiveis") != EXPECTED_COUNT:
        raise SnapshotInvalid("Alguns controles nao estavam visiveis")
    if sum(x.get("controle_global") is True for x in items) != EXPECTED_GLOBAL:
        raise SnapshotInvalid("Controles globais inesperados")
    if sum(x.get("ng_model") == "usuario.acessoSso" for x in items) != EXPECTED_SSO:
        raise SnapshotInvalid("Controle SSO inesperado")
    controls = [x for x in items if x.get("ng_model") == "item.selected" and x.get("controle_global") is False]
    if len(controls) != EXPECTED_PERMISSION_COUNT:
        raise SnapshotInvalid("Quantidade de permissoes individuais inesperada")
    expected_orders = list(range(1, EXPECTED_COUNT + 1))
    if [x.get("ordem") for x in items] != expected_orders:
        raise SnapshotInvalid("Ordem original do DOM incompleta")
    if not all(x.get("rotulo_identificado") and x.get("visivel") and not x.get("desabilitado") for x in items):
        raise SnapshotInvalid("Ha controle sem rotulo, invisivel ou desabilitado")
    return raw


def make_snapshot(raw: dict, profile: str) -> dict:
    itens = raw["itens"]
    counts: defaultdict[tuple[str, str, str], int] = defaultdict(int)
    permissions = []
    special = []
    for x in itens:
        key = (x["secao"], x["subsecao"], x["rotulo"])
        counts[key] += 1
        item = {
            "ordem_dom": x["ordem"],
            "secao": x["secao"],
            "subsecao": x["subsecao"],
            "rotulo": x["rotulo"],
            "ocorrencia": counts[key],
            "ng_model": x["ng_model"],
            "marcado": bool(x["marcado"]),
        }
        if x["ng_model"] == "item.selected" and not x["controle_global"]:
            permissions.append(item)
        else:
            special.append(item)
    repeats = sorted([{"secao": s, "subsecao": sub, "rotulo": text, "quantidade": n}
                      for (s, sub, text), n in counts.items() if n > 1],
                     key=lambda x: (x["secao"], x["rotulo"]))
    return {
        "formato": "credvix-dna-referencia-v1",
        "perfil": profile,
        "subperfil": PROFILES[profile],
        "origem": raw["origem"],
        "capturado_em": raw["capturado_em"],
        "total_controles": 227,
        "controle_sso_e_globais": special,
        "permissoes": permissions,
        "rotulos_duplicados": repeats,
        "homologacao": {
            "status": "pendente",
            "motivo": "Rotulos repetidos sem identificadores individuais; ordem DOM nao e seletor estavel."
        },
    }


def assert_pair(a: dict, b: dict) -> list[dict]:
    keys = ("ordem_dom", "secao", "subsecao", "rotulo", "ocorrencia", "ng_model")
    x, y = a["permissoes"], b["permissoes"]
    if len(x) != 224 or len(y) != 224:
        raise SnapshotInvalid("Quantidade de permissoes diferente")
    if any(tuple(m[k] for k in keys) != tuple(n[k] for k in keys) for m, n in zip(x, y)):
        raise SnapshotInvalid("Listas do Consultor e Supervisor nao correspondem")
    changes = []
    for m, n in zip(x, y):
        if m["marcado"] != n["marcado"]:
            changes.append({"ordem_dom": m["ordem_dom"], "rotulo": m["rotulo"],
                            "consultor": m["marcado"], "supervisor": n["marcado"]})
    return changes


def compare_snapshots(reference: dict, observed: dict) -> list[dict]:
    """Compara todos os controles: falha fechada se a identidade DOM divergir.

    A ordem do DOM so vale nesta leitura comparativa, nunca para clicar ou gravar.
    """
    if reference["total_controles"] != observed["total_controles"]:
        raise SnapshotInvalid("Quantidade de controles mudou")
    keys = ("ordem_dom", "secao", "subsecao", "rotulo", "ocorrencia", "ng_model")
    result = []
    for name in ("controle_sso_e_globais", "permissoes"):
        a, b = reference[name], observed[name]
        if len(a) != len(b):
            raise SnapshotInvalid("Controles divergentes em " + name)
        for expected, actual in zip(a, b):
            if tuple(expected[k] for k in keys) != tuple(actual[k] for k in keys):
                raise SnapshotInvalid("Identificacao de controle divergente na ordem " + str(expected["ordem_dom"]))
            if bool(expected["marcado"]) != bool(actual["marcado"]):
                result.append({"ordem_dom": expected["ordem_dom"], "secao": expected["secao"],
                               "rotulo": expected["rotulo"], "esperado": expected["marcado"],
                               "atual": actual["marcado"], "tipo": "sso_ou_global" if name != "permissoes" else "permissao"})
    return result


def normalized_counts(snapshot: dict) -> dict:
    return {"controles": snapshot["total_controles"], "permissoes": len(snapshot["permissoes"]),
            "globais_e_sso": len(snapshot["controle_sso_e_globais"]),
            "duplicados": snapshot["rotulos_duplicados"]}