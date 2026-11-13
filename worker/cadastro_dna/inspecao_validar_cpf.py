"""Identificacao SOMENTE LEITURA do terceiro icone na barra de 7 acoes.

Nao le valores de campos, texto de linhas, CPF, nomes ou URLs.
Nao clica, nao valida CPF e nunca habilita gravacao.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

JS_INSPECAO = r"""() => {
  const css='button,a,[role="button"],input[type="button"],input[type="submit"]';
  const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const visivel=e=>!!e.getClientRects().length;
  const technical=e=>{
    const raw=e.getAttribute('ng-click') || e.getAttribute('data-ng-click') || '';
    // Exporta SOMENTE nome de funcao sem argumentos de usuarios.
    const func=raw.match(/^\s*([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*){0,5})\s*\(/);
    const labels=[e.getAttribute('title'),e.getAttribute('aria-label'),
                  e.getAttribute('data-original-title')];
    return {
      tag:e.tagName.toLowerCase(), id:e.getAttribute('id')||'',
      ng_model:e.getAttribute('ng-model')||'',
      ng_click_funcao:func?func[1]:'',
      classe_icone:(e.querySelector('i,svg')?.getAttribute('class')||''),
      rotulo_validar_cpf:labels.some(t=>norm(t).includes('validar')&&norm(t).includes('cpf')),
      visivel:visivel(e), desabilitado:!!e.disabled || e.getAttribute('aria-disabled')==='true'
    };
  };
  const linhas=[...document.querySelectorAll('tr')].filter(visivel);
  const barras=[];
  for (const linha of linhas) {
    const celulas=[...linha.querySelectorAll(':scope > td')];
    for (const celula of celulas) {
      const acoes=[...celula.querySelectorAll(css)].filter(visivel);
      if (acoes.length!==7) continue;
      const descricoes=acoes.map(technical);
      barras.push({quantidade_icones:acoes.length,icones:descricoes,
        terceiro_indice:2,terceiro:descricoes[2]});
    }
  }
  return {barras:barras.slice(0,10),quantidade_barras:barras.length,
          apenas_metadados:true,clicou:false};
}"""


def _safe_ident(text: object, maxlen=90) -> str:
    return text if isinstance(text,str) and len(text)<=maxlen and re.fullmatch(r"[A-Za-z_$][A-Za-z0-9_.$:-]*",text) else ""


def _safe_classes(text: object) -> list[str]:
    # Lista de tokens CSS sem conteudo dinamico.
    return [t for t in str(text or "").split()[:8] if _safe_ident(t,64)]


def ler_barras(frame) -> dict:
    raw=frame.evaluate(JS_INSPECAO)
    result=[]
    for b in raw.get("barras",[]):
        icones=[]
        for item in b.get("icones",[]):
            icones.append({
                "tag":_safe_ident(item.get("tag")),
                "id":_safe_ident(item.get("id")),
                "ng_model":_safe_ident(item.get("ng_model")),
                "ng_click_funcao":_safe_ident(item.get("ng_click_funcao")),
                "classes_icone":_safe_classes(item.get("classe_icone")),
                "rotulo_validar_cpf":bool(item.get("rotulo_validar_cpf")),
                "visivel":bool(item.get("visivel")),
                "desabilitado":bool(item.get("desabilitado")),
            })
        if len(icones)==7:
            result.append({"quantidade_icones":7,"terceiro_indice":2,
                           "icones":icones})
    return {"quantidade_barras":int(raw.get("quantidade_barras",0)),
            "barras":result,
            "nenhum_clique":True,"nenhum_dado_pessoal":True}


def inspecionar(cdp: str) -> dict:
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
    from dna_diagnostico import _verify_local_cdp, allowed_url
    from playwright.sync_api import sync_playwright
    _verify_local_cdp(cdp)
    with sync_playwright() as playwright:
        browser=playwright.chromium.connect_over_cdp(cdp)
        try:
            valid=[frame for ctx in browser.contexts for page in ctx.pages
                   for frame in page.frames if allowed_url(frame.url)]
            if len(valid)!=1:
                return {"situacao":"revisao","motivo":"frame_dna_nao_unico",
                        "quantidade_frames":len(valid)}
            info=ler_barras(valid[0])
            # Mesmo com apenas uma barra, o 3o icone requer homologacao.
            return {"situacao":"estrutura_lida" if info["quantidade_barras"] else "revisao",
                    "acao":"identificar_terceiro_icone","estrutura":info,
                    "assinatura_homologada":False}
        finally:
            browser.close()


def main() -> int:
    parser=argparse.ArgumentParser(description="Ler barra de 7 icones sem clicar")
    parser.add_argument("--cdp",default="http://127.0.0.1:9222")
    parser.add_argument("--saida",type=Path,
                        default=Path("RELATORIOS_CADASTRO_DNA/validar_cpf_terceiro_icone.json"))
    args=parser.parse_args()
    try:
        result=inspecionar(args.cdp)
        args.saida.parent.mkdir(parents=True,exist_ok=True)
        args.saida.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",
                              encoding="utf-8")
        print("Situacao:",result["situacao"])
        print("Relatorio:",args.saida)
        print("Nao foi feito nenhum clique.")
        return 0 if result["situacao"]=="estrutura_lida" else 2
    except Exception as exc:
        print("Nao foi possivel inspecionar:",type(exc).__name__)
        print("Nenhum clique executado.")
        return 2


if __name__=="__main__":
    raise SystemExit(main())
