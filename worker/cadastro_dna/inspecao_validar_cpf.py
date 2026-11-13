"""Descoberta somente leitura da acao Validar CPF na Manutencao do DNA.

Somente atributos tecnicos de elementos cuja ROTULAGEM PUBLICA contenha
"validar" e "cpf". Nao le tabela de usuarios, nomes, CPF nem links/URLs.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit

from .contrato_formulario import atributo_publicavel


def ler_acoes(frame) -> dict:
    js = """() => {
      const normal = s => String(s||'').normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/\\s+/g,' ').trim();
      const nodes = [...document.querySelectorAll(
        'button, a, input[type="button"], input[type="submit"], [role="button"]'
      )];
      return nodes.filter(el => {
        const labels=[el.getAttribute('aria-label'),el.getAttribute('title'),
                      el.getAttribute('data-original-title'),el.textContent,
                      (el.matches('input')?el.getAttribute('value'):'')];
        return labels.some(v => {
          const t=normal(v);
          return t.length <= 80 && t.includes('validar') && t.includes('cpf');
        });
      }).slice(0,20).map(el => ({
        tag:el.tagName.toLowerCase(), type:el.getAttribute('type')||'',
        id:el.getAttribute('id')||'', name:el.getAttribute('name')||'',
        title:el.getAttribute('title')||'', aria:el.getAttribute('aria-label')||'',
        ng_click:el.getAttribute('ng-click')||el.getAttribute('data-ng-click')||'',
        visible:!!(el.getClientRects().length), disabled:!!el.disabled
      }));
    }"""
    items=[]
    for obj in frame.evaluate(js):
        item={k:atributo_publicavel(obj.get(k)) for k in
              ("tag","type","id","name","ng_click")}
        # Do not publish free text, even if UI has user-derived title content.
        item.update({"rotulo_title_compativel": "cpf" in obj.get("title","").lower()
                     and "validar" in obj.get("title","").lower(),
                     "rotulo_aria_compativel": "cpf" in obj.get("aria","").lower()
                     and "validar" in obj.get("aria","").lower(),
                     "visivel":bool(obj.get("visible")),
                     "desabilitado":bool(obj.get("disabled"))})
        items.append(item)
    return {"quantidade_candidatos":len(items),"candidatos":items,
            "clicou":False,"leu_dados_pessoais":False}


def inspecionar(cdp: str) -> dict:
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
    from dna_diagnostico import _verify_local_cdp, allowed_url
    from playwright.sync_api import sync_playwright
    _verify_local_cdp(cdp)
    with sync_playwright() as p:
        browser=p.chromium.connect_over_cdp(cdp)
        try:
            frames=[]
            for ctx in browser.contexts:
                for page in ctx.pages:
                    for frame in page.frames:
                        if allowed_url(frame.url):
                            frames.append(frame)
            if len(frames)!=1:
                return {"situacao":"revisao","motivo":"Esperado um frame DNA unico."}
            info=ler_acoes(frames[0])
            return {"situacao":"acao_candidata" if info["quantidade_candidatos"]==1 else "revisao",
                    "acao":"validar_cpf","estrutura":info}
        finally:
            browser.close()


def main() -> int:
    parser=argparse.ArgumentParser(description="Inspecao da acao Validar CPF sem cliques")
    parser.add_argument("--cdp",default="http://127.0.0.1:9222")
    parser.add_argument("--saida",type=Path,default=Path("RELATORIOS_CADASTRO_DNA/validar_cpf.json"))
    args=parser.parse_args()
    try:
        resultado=inspecionar(args.cdp)
        args.saida.parent.mkdir(parents=True,exist_ok=True)
        args.saida.write_text(json.dumps(resultado,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
        print("Resultado:",resultado["situacao"],"| Arquivo:",args.saida)
        return 0 if resultado["situacao"]=="acao_candidata" else 2
    except Exception:
        print("Inspecao inconclusiva. Nenhuma alteracao no DNA.")
        return 2


if __name__=="__main__":
    raise SystemExit(main())
