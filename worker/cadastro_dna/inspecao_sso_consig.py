"""Diagnostico somente leitura de SSO e Funcao Consig no formulario DNA.

Nao consulta valores pessoais, nao clica, nao altera checked e nao grava DOM.
Apenas relata contagens e nomes de atributos tecnicos previamente filtrados.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from .inspecao_campos import inspecionar as inspecionar_formulario

SCRIPT = r"""() => {
  const wanted = /(?:sso|consig|funcao|fun[cç][aã]o)/i;
  const safe = s => typeof s === 'string' &&
    s.length <= 96 && /^[a-zA-Z0-9_.\\[\\]-]+$/.test(s) && wanted.test(s);
  const attrs = ['id','name','ng-model','data-ng-model','formcontrolname'];
  const selectors = 'input[type="checkbox"],input[type="radio"],[role="checkbox"]';
  const matches = [...document.querySelectorAll(selectors)]
    .map(el => {
      const keys = {};
      for (const key of attrs) {
        const value = el.getAttribute(key);
        if (safe(value)) keys[key] = value;
      }
      return {el,keys};
    })
    .filter(x => Object.keys(x.keys).length > 0);
  return {
    total_controles_selecao: document.querySelectorAll(selectors).length,
    candidatos: matches.slice(0,20).map(x => ({
      tag: x.el.tagName.toLowerCase(),
      tipo: ['checkbox','radio'].includes(x.el.getAttribute('type'))
        ? x.el.getAttribute('type') : 'role-checkbox',
      atributos: x.keys,
      marcado: x.el.matches('input') ? x.el.checked : x.el.getAttribute('aria-checked') === 'true',
      desabilitado: x.el.matches(':disabled') || x.el.getAttribute('aria-disabled') === 'true'
    })),
    candidatos_total: matches.length,
    amostras_limitadas: matches.length > 20
  };
}"""


def resumir_estrutura(estrutura: dict) -> dict:
    """Nao transforma evidencias parciais em autorizacao para operar."""
    candidatos = estrutura.get("candidatos", [])
    sso = [c for c in candidatos if any("sso" in str(v).lower()
           for v in c.get("atributos", {}).values())]
    consig = [c for c in candidatos if any("consig" in str(v).lower()
              or "funcao" in str(v).lower() for v in c.get("atributos", {}).values())]
    return {
        "situacao": "candidatos_estruturais" if (sso or consig) else "revisao",
        "somente_leitura": True, "clicou": False, "leu_dados_pessoais": False,
        "sso_candidatos": len(sso), "funcao_consig_candidatos": len(consig),
        "estrutura": estrutura,
        "seletores_homologados": False, "cadastro_liberado": False,
        "aviso": "Candidatos tecnicos nao autorizam selecao automatica."
    }


def inspecionar(cdp: str = "http://127.0.0.1:9222") -> dict:
    # Reaproveita o fail-closed do inspetor ja homologado: exatamente um
    # formulario com botao Cadastrar, em URL DNA permitida e CDP local.
    from .inspecao_campos import inspecionar as _inspecionar
    from .inspecao_campos import ler_frame  # noqa: F401
    from pathlib import Path
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from dna_diagnostico import _verify_local_cdp, allowed_url
    from playwright.sync_api import sync_playwright
    _verify_local_cdp(cdp)
    with sync_playwright() as pw:
        browser = pw.chromium.connect_over_cdp(cdp)
        try:
            candidatos = [
                frame for ctx in browser.contexts for page in ctx.pages
                for frame in page.frames if allowed_url(frame.url)
                and frame.get_by_role("button", name="Cadastrar", exact=True).count() == 1
            ]
            if len(candidatos) != 1:
                return {
                    "situacao": "revisao", "somente_leitura": True,
                    "clicou": False, "leu_dados_pessoais": False,
                    "formularios_encontrados": len(candidatos),
                    "seletores_homologados": False, "cadastro_liberado": False
                }
            return resumir_estrutura(candidatos[0].evaluate(SCRIPT))
        finally:
            browser.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspecao SSO e Funcao Consig: somente leitura")
    parser.add_argument("--cdp", default="http://127.0.0.1:9222")
    parser.add_argument("--saida", type=Path,
                        default=Path("RELATORIOS_CADASTRO_DNA/sso_funcao_consig.json"))
    args = parser.parse_args()
    try:
        resultado = inspecionar(args.cdp)
        args.saida.parent.mkdir(parents=True, exist_ok=True)
        args.saida.write_text(json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("Situacao:", resultado["situacao"])
        print("Relatorio:", args.saida)
        return 0 if resultado["situacao"] == "candidatos_estruturais" else 2
    except Exception:
        print("Inspecao inconclusiva. Nenhuma alteracao realizada.")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
