"""Cadastro DNA v0.3: diagnostico integrado de tela, somente leitura.

O operador abre manualmente a tela no Edge isolado. Sem fill, click,
login automatizado, reserva no Supabase ou capturas de dados pessoais.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
RELATORIO = RAIZ / "RELATORIOS_CADASTRO_DNA" / "cadastro_dna_v03.json"

PASSOS = ("edge_cdp", "dominio_dna", "tela_cadastro", "perfil_subperfil",
          "sso", "funcao_consig", "terceiro_icone_cpf", "cadastrar",
          "validar_cpf", "fila_supabase")


def consolidar(*, formulario: dict | None, permissoes: dict | None,
               manutencao: dict | None) -> dict:
    """Consolida evidencias, sem promover candidatos a seletores homologados."""
    etapas = {
        "edge_cdp": "ok",
        "dominio_dna": "ok",
        "tela_cadastro": "ok" if formulario is not None else "revisao",
        "perfil_subperfil": "revisao",
        "sso": "revisao",
        "funcao_consig": "revisao",
        "terceiro_icone_cpf": "revisao",
        "cadastrar": "bloqueado",
        "validar_cpf": "bloqueado",
        "fila_supabase": "bloqueado",
    }
    if formulario is not None:
        campos = formulario.get("campos", {})
        # Encontrar o formulario nao homologa dependencias Angular.
        if formulario.get("botao_cadastrar") != 1:
            etapas["tela_cadastro"] = "revisao"
        if len(formulario.get("selects") or []) >= 2:
            etapas["perfil_subperfil"] = "candidatos"
    if permissoes is not None:
        if permissoes.get("sso_candidatos", 0):
            etapas["sso"] = "candidatos"
        if permissoes.get("funcao_consig_candidatos", 0):
            etapas["funcao_consig"] = "candidatos"
    if manutencao is not None and manutencao.get("quantidade_barras", 0):
        etapas["terceiro_icone_cpf"] = "candidatos"
    return {
        "versao": "0.3.0",
        "momento_utc": datetime.now(timezone.utc).isoformat(),
        "modo": "somente_leitura",
        "situacao": "homologacao_parcial",
        "etapas": etapas,
        "evidencias": {
            "formulario": formulario,
            "sso_funcao_consig": permissoes,
            "acoes_manutencao": manutencao,
        },
        "gravou_no_dna": False,
        "clicou": False,
        "leu_dados_pessoais": False,
        "autorizado_escrever": False,
        "aviso": "Nenhum candidato e homologacao. Cadastro e CPF bloqueados."
    }


def executar(cdp: str = "http://127.0.0.1:9222") -> dict:
    # A importacao so ocorre durante a execucao; testes offline dispensam Edge.
    sys.path.insert(0, str(RAIZ / "worker"))
    from dna_diagnostico import _verify_local_cdp, allowed_url
    from playwright.sync_api import sync_playwright
    from .inspecao_sso_consig import SCRIPT, resumir_estrutura
    from .inspecao_validar_cpf import ler_barras
    from .inspecao_campos import ler_frame

    _verify_local_cdp(cdp)
    with sync_playwright() as playwright:
        browser = playwright.chromium.connect_over_cdp(cdp)
        try:
            candidatos = [
                frame
                for contexto in browser.contexts
                for pagina in contexto.pages
                for frame in pagina.frames
                if allowed_url(frame.url)
            ]
            if len(candidatos) != 1:
                return {
                    "versao": "0.3.0", "modo": "somente_leitura",
                    "situacao": "revisao", "motivo": "frame_dna_ambiguo_ou_ausente",
                    "frames_permitidos": len(candidatos),
                    "etapas": {passo: "bloqueado" for passo in PASSOS},
                    "gravou_no_dna": False, "clicou": False,
                    "leu_dados_pessoais": False, "autorizado_escrever": False
                }
            frame = candidatos[0]
            formulario = None
            permissoes = None
            manutencao = None
            if frame.get_by_role("button", name="Cadastrar", exact=True).count() == 1:
                # Sem leitura de valores. A tela de cadastro pode estar vazia.
                formulario = ler_frame(frame)
                permissoes = resumir_estrutura(frame.evaluate(SCRIPT))
            else:
                # Na tela de Manutencao, apenas contagem das barras de sete acoes.
                manutencao = ler_barras(frame)
            return consolidar(
                formulario=formulario, permissoes=permissoes,
                manutencao=manutencao,
            )
        finally:
            browser.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Cadastro DNA v0.3 - somente leitura")
    parser.add_argument("--cdp", default="http://127.0.0.1:9222")
    parser.add_argument("--saida", type=Path, default=RELATORIO)
    args = parser.parse_args()
    try:
        relatorio = executar(args.cdp)
    except Exception as exc:
        # Nao salvar excecoes brutas: podem conter URLs ou dados pessoais.
        relatorio = {
            "versao": "0.3.0", "modo": "somente_leitura",
            "situacao": "revisao",
            "motivo": "falha_tecnica_" + type(exc).__name__,
            "etapas": {passo: "bloqueado" for passo in PASSOS},
            "gravou_no_dna": False, "clicou": False,
            "leu_dados_pessoais": False, "autorizado_escrever": False,
        }
    args.saida.parent.mkdir(parents=True, exist_ok=True)
    args.saida.write_text(json.dumps(relatorio, indent=2, ensure_ascii=False) + "\n",
                          encoding="utf-8")
    print("CADASTRO DNA | v0.3 | SOMENTE LEITURA")
    for etapa, estado in relatorio["etapas"].items():
        print(f"[{estado.upper()}] {etapa}")
    print("Resultado:", relatorio["situacao"])
    print("Relatorio:", args.saida)
    print("Nenhuma gravacao ou validacao CPF foi executada.")
    return 0 if relatorio["situacao"] == "homologacao_parcial" else 2


if __name__ == "__main__":
    raise SystemExit(main())
