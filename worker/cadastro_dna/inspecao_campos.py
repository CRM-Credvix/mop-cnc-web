"""Inspecao ESTATICA de formulario ja aberto no Edge DNA.

Nao realiza clique, fill, select_option, reload, screenshot nem leitura de valores
de campos pessoais. Exporta somente contagens, estrutura e nomes de opcoes
dois selects reconhecidos pela familia Consultor/Supervisor.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def ler_frame(frame) -> dict:
    from .mapeamento_campos import mapear_campos
    from .contrato_formulario import (
        ROTULOS_RECONHECIDOS, ATRIBUTOS_SEGUROS, atributo_publicavel,
        PERFIL_TO_SUBPERFIL,
    )
    # DOM somente leitura: filtra TODAS as opcoes para rótulos conhecidos.
    script = """() => {
      const known = new Set(['Consultor','Supervisor','Consultor 2','Supervisor 2',
                             'Consultor 1','Supervisor 1','Consultor 3',
                             'Consultor B2C','Consultor Híbrido','Caixa','SAF','-- Selecione --']);
      return [...document.querySelectorAll('select')].map(el => ({
        attrs: Object.fromEntries(['id','name','ng-model','data-ng-model','type'].map(a => [a,el.getAttribute(a)||''])),
        options: [...el.options].map(o=>o.textContent.trim()).filter(t=>known.has(t)),
        total_options: el.options.length,
        selected_known: known.has(el.selectedOptions[0]?.textContent.trim()||'')
          ? el.selectedOptions[0].textContent.trim() : ''
      })).filter(x=>x.options.includes('Consultor')||x.options.includes('Supervisor')
                   ||x.options.includes('Consultor 2')||x.options.includes('Supervisor 2'))
    }"""
    labels={name:frame.get_by_label(name,exact=True).count() for name in ROTULOS_RECONHECIDOS}
    buttons=frame.get_by_role("button",name="Cadastrar",exact=True).count()
    selects=[]
    for select in frame.evaluate(script):
        attrs={k:atributo_publicavel(select.get("attrs",{}).get(k)) for k in ATRIBUTOS_SEGUROS}
        selects.append({"identificadores":attrs,"opcoes_reconhecidas":select["options"],
                        "total_opcoes":int(select["total_options"]),
                        "selecionado_reconhecido":select.get("selected_known","")})
    return {"botao_cadastrar":buttons,"campos":labels,"selects":selects,
            "mapeamento_campos":mapear_campos(frame),
            "padrao_esperado":PERFIL_TO_SUBPERFIL,
            "aviso":"Somente estrutura; nenhum cadastro efetuado."}


def inspecionar(cdp: str) -> dict:
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
    from dna_diagnostico import _verify_local_cdp, allowed_url
    from playwright.sync_api import sync_playwright
    _verify_local_cdp(cdp)
    with sync_playwright() as pw:
        browser=pw.chromium.connect_over_cdp(cdp)
        try:
            valid=[]
            for ctx in browser.contexts:
                for page in ctx.pages:
                    for frame in page.frames:
                        if not allowed_url(frame.url): continue
                        if frame.get_by_role("button",name="Cadastrar",exact=True).count()==1:
                            valid.append(frame)
            if len(valid)!=1:
                return {"situacao":"revisao","motivo":"Formulario nao localizado de maneira unica.",
                        "quantidade_formularios":len(valid)}
            return {"situacao":"estrutura_lida","formulario":"manutencao_usuario_novo",
                    "estrutura":ler_frame(valid[0])}
        finally:
            browser.close()


def main():
    p=argparse.ArgumentParser(description="Leitura de seletores do Cadastro DNA, sem escrita")
    p.add_argument("--cdp",default="http://127.0.0.1:9222")
    p.add_argument("--saida",type=Path,default=Path("diagnostico_cadastro_dna_campos.json"))
    args=p.parse_args()
    try:
        data=inspecionar(args.cdp)
        args.saida.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
        print("Situacao:",data["situacao"])
        print("Saida:",args.saida.name)
        return 0 if data["situacao"]=="estrutura_lida" else 2
    except Exception:
        print("Diagnostico nao concluido; nenhuma alteracao realizada.")
        return 2


if __name__=="__main__":
    raise SystemExit(main())
