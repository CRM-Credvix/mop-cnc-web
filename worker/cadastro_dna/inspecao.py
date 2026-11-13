"""Inspeciona apenas a ESTRUTURA da tela DNA via Edge CDP.
Nao le valores digitados, CPF, nomes, sessoes ou DOM bruto.
Nao faz clicks ou screenshots; nao executa cadastro.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit


LABELS = (
    "Nome:", "Data de Nascimento:", "CPF:", "E-mail:",
    "Telefone Celular:", "Sub Perfil:", "Observação:",
)
BUTTONS = ("Cadastrar", "Salvar", "Confirmar", "Fechar", "Pesquisar")
INPUT_IDS = ("dddTelefoneCelular", "wait", "usuario-nome", "menu-usuario-manutencao")


def resumo_frame(frame) -> dict:
    """Contagem de controles identificados; sem inspecao de valores ou dados pessoais."""
    labels={}
    for label in LABELS:
        try:
            labels[label]=int(frame.get_by_label(label,exact=True).count())
        except Exception:
            labels[label]=-1
    botoes={}
    for nome in BUTTONS:
        try:
            botoes[nome]=int(frame.get_by_role("button",name=nome,exact=True).count())
        except Exception:
            botoes[nome]=-1
    ids={}
    for field in INPUT_IDS:
        try:
            ids[field]=int(frame.locator('[id="'+field+'"]').count())
        except Exception:
            ids[field]=-1
    return {"rotulos":labels,"botoes":botoes,"ids":ids}


def inspecionar(cdp_url: str) -> dict:
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
    from dna_diagnostico import _verify_local_cdp, allowed_url
    from playwright.sync_api import sync_playwright
    _verify_local_cdp(cdp_url)
    with sync_playwright() as p:
        browser=p.chromium.connect_over_cdp(cdp_url)
        try:
            frames=[]
            for ctx in browser.contexts:
                for page in ctx.pages:
                    for frame in page.frames:
                        try:
                            url=urlsplit(frame.url)
                            if url.scheme!="https" or url.hostname!="cadastro.help.com.br" or not allowed_url(frame.url):
                                continue
                            frames.append(resumo_frame(frame))
                        except Exception:
                            continue
            if len(frames)!=1:
                return {"situacao":"revisao","motivo":"Esperado um frame do Cadastro DNA, encontrado(s): "+str(len(frames))}
            return {"situacao":"estrutura_lida","controles":frames[0],
                    "aviso":"Somente contagens de controles. Nenhum dado pessoal capturado."}
        finally:
            browser.close()


def main() -> int:
    parser=argparse.ArgumentParser(description="Inspecao somente leitura dos seletores DNA")
    parser.add_argument("--cdp",default="http://127.0.0.1:9222")
    parser.add_argument("--saida",type=Path,default=Path("diagnostico_cadastro_dna_estrutura.json"))
    args=parser.parse_args()
    try:
        result=inspecionar(args.cdp)
        args.saida.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
        print("Relatorio estrutural salvo:",args.saida.name)
        print("Situacao:",result["situacao"])
        return 0 if result["situacao"]=="estrutura_lida" else 2
    except Exception:
        print("Nao foi possivel inspecionar a tela. Nenhuma alteracao realizada.")
        return 2


if __name__=="__main__":
    raise SystemExit(main())
