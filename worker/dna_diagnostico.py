"""Credvix | Diagnostico DNA somente leitura (v0.2).

Sem logins ou senhas embutidos. O operador abre a tela do usuario no Edge
configurado com CDP localhost, e o robo captura os controles exibidos.
NENHUM comando do script preenche campos, clica em Gravar, ou altera permissoes.
"""
from __future__ import annotations

import argparse
import json
import os
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

from validar_referencias import SnapshotInvalid, compare_snapshots, make_snapshot, normalized_counts, read_capture

ALLOWED_HOSTS = frozenset({"cadastro.help.com.br"})
DEFAULT_JS = Path(__file__).with_name("dna_inspecao_dom.js")
DEFAULT_ID_JS = Path(__file__).with_name("dna_identidade_probe.js")
DEFAULT_MODELS = Path(__file__).resolve().parent / "dna_local_references"


class UnsafePage(RuntimeError):
    pass


def allowed_url(url: str) -> bool:
    """Only the exact DNA maintenance host may be inspected."""
    try:
        parsed = urlsplit(url)
        return parsed.scheme == "https" and parsed.hostname in ALLOWED_HOSTS and parsed.username is None and parsed.password is None
    except ValueError:
        return False


def _verify_local_cdp(uri: str) -> None:
    p = urlsplit(uri)
    if p.scheme != "http" or p.hostname not in ("127.0.0.1", "localhost") or not p.port:
        raise UnsafePage("CDP exige HTTP localhost com porta explicita (ex.: http://127.0.0.1:9222)")


def inspect_live(cdp_uri: str, profile: str) -> dict:
    """Read current tab. No navigation, clicks or form operations at all."""
    _verify_local_cdp(cdp_uri)
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError("Instale playwright e o navegador Edge localmente") from exc
    script = DEFAULT_JS.read_text(encoding="utf-8")
    id_script = DEFAULT_ID_JS.read_text(encoding="utf-8")
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(cdp_uri)
        try:
            candidates = []
            for context in browser.contexts:
                for page in context.pages:
                    if allowed_url(page.url):
                        for frame in page.frames:
                            if not allowed_url(frame.url):
                                continue
                            result = frame.evaluate(script)
                            if result.get("total_dom") == 227:
                                candidates.append((page.url, result, frame))
            if len(candidates) != 1:
                raise UnsafePage(f"Esperada 1 pagina DNA com 227 controles; encontradas {len(candidates)}. Selecione um unico cadastro aberto.")
            url, data, frame = candidates[0]
            # Two independent DOM reads. No navigation or click. A stable value
            # still remains an unverified candidate until DNA IDs are homologated.
            identity_a = frame.evaluate(id_script)
            page.wait_for_timeout(350)
            identity_b = frame.evaluate(id_script)
            data["identidade_observacoes"] = [identity_a, identity_b]
            data.update({"versao_formato": 1,
                         "capturado_em": datetime.now(timezone.utc).isoformat(),
                         "perfil_referencia": profile, "origem": urlsplit(url).hostname,
                         "frame_indice": 0, "avisos": []})
            return data
        finally:
            # CDP close disconnects Playwright. Does not close the user's Edge process.
            browser.close()


def audit(reference: dict, captured: dict) -> dict:
    if reference["perfil"] != captured["perfil"]:
        raise SnapshotInvalid("Perfis diferentes")
    diffs = compare_snapshots(reference, captured)
    return {"perfil": reference["perfil"], "subperfil": reference["subperfil"],
            "controles_verificados": reference["total_controles"],
            "divergencias": diffs,
            "divergencias_total": len(diffs),
            "resultado": "permissoes_coincidem_na_tela" if not diffs else "divergencias_detectadas",
            "gravou_no_dna": False,
            "aviso": "Comparacao somente leitura. Identidade unica do cadastro deve ser verificada separadamente."}



def norm_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    return " ".join("".join(ch for ch in value if not unicodedata.combining(ch)).casefold().split())


def read_name_list(path: Path) -> list[str]:
    names = [" ".join(x.strip().split()) for x in path.read_text(encoding="utf-8-sig").splitlines() if x.strip()]
    if not 1 <= len(names) <= 50:
        raise SnapshotInvalid("Informe 1 a 50 nomes")
    if any(len(x) < 5 or len(x) > 140 or " " not in x for x in names):
        raise SnapshotInvalid("Nomes incompletos ou excessivamente longos")
    if len(set(map(norm_name,names))) != len(names):
        raise SnapshotInvalid("Lista possui nomes duplicados")
    return names


def row_matches_name(cells: list[str], name: str) -> bool:
    """Só considera célula exatamente igual ao nome completo, não substring."""
    target = norm_name(name)
    return bool(target) and any(norm_name(v) == target for v in cells)


def consultar_nomes(cdp_uri: str, names: list[str]) -> dict:
    """Pesquisa em página já aberta; não entra na manutenção, não altera cadastros.

    Resultado único é apenas um candidato *nesta página*, não prova de identidade.
    Páginas com paginação, seletores não identificados ou timeout vão para revisão.
    """
    _verify_local_cdp(cdp_uri)
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
    status = []
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(cdp_uri)
        try:
            pages = [page for ctx in browser.contexts for page in ctx.pages if allowed_url(page.url)]
            if len(pages) != 1:
                raise UnsafePage(f"Esperada uma aba de cadastro.help.com.br; encontradas {len(pages)}")
            page = pages[0]
            field = page.locator("#usuario-nome")
            if field.count() != 1:
                raise UnsafePage("Campo de pesquisa #usuario-nome não identificado; não prosseguir")
            button = page.get_by_role("button", name="Pesquisar", exact=True)
            if button.count() != 1:
                raise UnsafePage("Botão Pesquisar não identificado de forma única")
            for name in names:
                try:
                    field.fill(name)
                    button.click(timeout=10000)  # Pesquisa somente leitura.
                    page.wait_for_load_state("domcontentloaded", timeout=12000)
                    if not allowed_url(page.url):
                        raise UnsafePage("Navegação para domínio diferente; consulta interrompida")
                    rows = page.locator("table tbody tr")
                    values = []
                    for i in range(min(rows.count(), 300)):
                        row = rows.nth(i)
                        cells = row.locator("td").all_inner_texts(timeout=5000)
                        if row_matches_name(cells, name):
                            values.append(i)
                    # Mesmo 1 resultado na página pode ter homônimos em outras páginas.
                    pagination_visible = page.get_by_text("Próxima", exact=True).count()>0 or page.locator(".pagination").count()>0
                    if len(values)>1:
                        verdict="multiplos_candidatos"
                    elif len(values)==1 and not pagination_visible:
                        verdict="um_candidato_na_pagina_identidade_nao_confirmada"
                    else:
                        verdict="revisao_consulta_inconclusiva"
                    status.append({"nome":name,"candidatos_na_pagina":len(values),"status":verdict})
                except (PlaywrightTimeout, UnsafePage) as exc:
                    status.append({"nome":name,"status":"revisao_erro_consulta","motivo":str(exc)[:200]})
                    break
        finally:
            browser.close()
    return {"tipo":"busca_somente_leitura","resultados":status,"alterou_usuario":False,
            "aviso":"Nenhum resultado representa confirmação de identidade. Não abriu fichas, não salvou dados."}

def main() -> int:
    parser = argparse.ArgumentParser(description="Diagnostico DNA: leitura e comparacao, nunca altera usuarios")
    parser.add_argument("modo", choices=["capturar", "comparar", "validar", "consultar-nomes"])
    parser.add_argument("--perfil", choices=["CONSULTOR", "SUPERVISOR"], required=True)
    parser.add_argument("--cdp", default=os.getenv("DNA_CDP_URL", "http://127.0.0.1:9222"))
    parser.add_argument("--captura", type=Path, help="Arquivo bruto JSON do inspetor para comparar")
    parser.add_argument("--lista", type=Path, help="Arquivo TXT com nomes completos, um por linha (consultar-nomes)")
    parser.add_argument("--modelo", type=Path, help="JSON privado do modelo; nunca hospedar no GitHub Pages")
    parser.add_argument("--saida", type=Path, help="Arquivo local para salvar resultado; nao contem credenciais")
    args = parser.parse_args()
    try:
        if args.modo == "consultar-nomes":
            if not args.lista:
                parser.error("--lista obrigatoria para consultar-nomes")
            result = consultar_nomes(args.cdp, read_name_list(args.lista))
        else:
            reference_path = args.modelo or DEFAULT_MODELS / f"modelo_{args.perfil.lower()}_v1.json"
            target = json.loads(reference_path.read_text(encoding="utf-8"))
            if target.get("perfil") != args.perfil or len(target.get("permissoes", [])) != 224:
                raise SnapshotInvalid("Modelo local incompleto ou perfil diferente")
            if args.modo == "validar":
                result = {"referencia": target["perfil"], "contagens": normalized_counts(target), "ativo": False}
            else:
                if args.modo == "capturar":
                    raw = validate_live_capture(inspect_live(args.cdp, args.perfil), args.perfil)
                else:
                    if not args.captura:
                        parser.error("--captura obrigatoria no modo comparar")
                    raw = read_capture(args.captura, args.perfil)
                observed = make_snapshot(raw, args.perfil)
                result = audit(target, observed)
    except (SnapshotInvalid, UnsafePage, RuntimeError, FileNotFoundError, json.JSONDecodeError) as error:
        result = {"resultado": "revisao", "erro": str(error), "gravou_no_dna": False}
    serialized = json.dumps(result, ensure_ascii=False, indent=2)
    if args.saida:
        args.saida.parent.mkdir(parents=True, exist_ok=True)
        args.saida.write_text(serialized + "\n", encoding="utf-8")
    print(serialized)
    return 0 if result.get("resultado") not in ("revisao", "divergencias_detectadas") else 2


def validate_live_capture(raw: dict, profile: str) -> dict:
    """Validate a live capture without creating temporary files."""
    # Validation in memory; nunca cria capturas temporarias na unidade de disco.
    if raw.get("perfil_referencia") != profile or raw.get("avisos"):
        raise SnapshotInvalid("Perfil ou captura invalida")
    if raw.get("total_dom") != 227 or raw.get("total_visiveis") != 227:
        raise SnapshotInvalid("A tela nao contem exatamente 227 controles visiveis")
    items = raw.get("itens") or []
    if len(items) != 227 or len([x for x in items if x.get("ng_model") == "item.selected" and not x.get("controle_global")]) != 224:
        raise SnapshotInvalid("Quantidade de permissoes inesperada")
    if [x.get("ordem") for x in items] != list(range(1,228)) or not all(x.get("rotulo_identificado") and x.get("visivel") and not x.get("desabilitado") for x in items):
        raise SnapshotInvalid("Controles incompletos")
    if sum(bool(x.get("controle_global")) for x in items) != 2 or sum(x.get("ng_model") == "usuario.acessoSso" for x in items) != 1:
        raise SnapshotInvalid("Controles globais/SSO invalidos")
    return raw


if __name__ == "__main__":
    raise SystemExit(main())