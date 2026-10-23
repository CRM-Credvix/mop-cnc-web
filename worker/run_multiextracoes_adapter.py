"""Adaptador do diagnostico_local.py existente para a fila MultiExtracoes.

O diagnostico Power BI gera XLSX LOCAL e nunca envia WhatsApp.
O adaptador somente aceita stdout validado e caminho seguro do XLSX.
Nenhuma execucao automatica ocorre ao importar este modulo.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ALLOWED = {
    "FGTS", "CNC", "CONSIGNADO", "ANTECIPAÇÃO DE BENEFÍCIO",
    "BMG CARD", "CARTAO BENEFICIO", "CONSIGNADO PRIVADO",
}
VALIDATED = re.compile(
    r"^DIAGNOSTICO_VALIDADO\s*\|\s*tipo=(.+?)\s*\|\s*loja=(\d+)\s*\|\s*linhas=(\d+)\s*$",
    re.MULTILINE,
)
FILE_LINE = re.compile(r"^Arquivo local gerado:\s*(.+?)\s*$", re.MULTILINE)


def generate(order_id: int, franchise: str, product: str, output_dir: Path, report: Path):
    if product not in ALLOWED:
        raise ValueError("PRODUTO_NAO_PERMITIDO")
    if not re.fullmatch(r"\d{4,8}", franchise):
        raise ValueError("FRANQUIA_INVALIDA")
    original = os.getenv("DIAGNOSTICO_LOCAL_PATH", "")
    if not original:
        raise RuntimeError("DIAGNOSTICO_LOCAL_PATH_NAO_CONFIGURADO")
    script = Path(original).expanduser().resolve(strict=True)
    if not script.is_file() or script.name.lower() != "diagnostico_local.py":
        raise ValueError("DIAGNOSTICO_LOCAL_INVALIDO")
    sample_folder = Path(os.getenv(
        "DIAGNOSTICO_SAMPLES_DIR", str(script.parent / "runtime" / "samples")
    )).expanduser().resolve()
    output_dir = output_dir.resolve()
    report = report.resolve()
    if report.parent != output_dir or not output_dir.is_dir():
        raise ValueError("DIRETORIO_SAIDA_INVALIDO")
    started_at = time.time()

    p = subprocess.run(
        [sys.executable, "-u", str(script), "--tipo", product, "--loja", franchise],
        cwd=str(script.parent), capture_output=True, text=True,
        encoding="utf-8", errors="replace", timeout=3600, check=False,
    )
    if p.returncode != 0:
        raise RuntimeError("DIAGNOSTICO_FALHOU")
    matches = VALIDATED.findall(p.stdout or "")
    paths = FILE_LINE.findall(p.stdout or "")
    if len(matches) != 1 or len(paths) != 1:
        raise ValueError("SAIDA_DIAGNOSTICO_AMBIGUA")
    got_product, got_store, count_text = matches[0]
    if got_product != product or got_store != franchise or int(count_text) < 1:
        raise ValueError("DIAGNOSTICO_NAO_CORRESPONDE_AO_PEDIDO")

    extracted = Path(paths[0].strip()).expanduser().resolve(strict=True)
    if (extracted.parent != sample_folder or extracted.suffix.lower() != ".xlsx"
            or not extracted.name.upper().endswith("_DIAGNOSTICO.XLSX")):
        raise ValueError("CAMINHO_XLSX_INVALIDO")
    stem = re.sub(r"[^A-Z0-9_-]+", "_", product).strip("_")[:60] or "PRODUTO"
    if not extracted.name.upper().startswith(f"{stem}_{franchise}_"):
        raise ValueError("ARQUIVO_NAO_CORRESPONDE_AO_PRODUTO")
    if extracted.stat().st_mtime < started_at - 3:
        raise ValueError("XLSX_ANTIGO_NAO_PERMITIDO")

    output = output_dir / "relatorio.xlsx"
    if output.exists():
        raise FileExistsError("RELATORIO_JA_EXISTE")
    shutil.copy2(extracted, output)
    payload = {
        "pedido_id": order_id,
        "franquia_codigo": franchise,
        "produto": product,
        "registros": int(count_text),
        "arquivo": output.name,
    }
    tmp = report.with_suffix(".json.tmp")
    try:
        with tmp.open("w",encoding="utf-8") as fd:
            json.dump(payload, fd, ensure_ascii=False)
            fd.flush()
            os.fsync(fd.fileno())
        os.replace(tmp, report)
    finally:
        tmp.unlink(missing_ok=True)
    print(f"ADAPTADOR_VALIDADO | pedido={order_id} | registros={count_text} | XLSX_LOCAL")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pedido-id", type=int, required=True)
    parser.add_argument("--franquia", required=True)
    parser.add_argument("--produto", required=True)
    parser.add_argument("--diretorio-saida", type=Path, required=True)
    parser.add_argument("--resultado-json", type=Path, required=True)
    args = parser.parse_args()
    if args.pedido_id < 1:
        parser.error("pedido-id deve ser positivo")
    generate(args.pedido_id, args.franquia, args.produto,
             args.diretorio_saida, args.resultado_json)


if __name__ == "__main__":
    main()
