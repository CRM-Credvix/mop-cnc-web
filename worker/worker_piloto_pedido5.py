import os
import socket
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

ORDER_ID = 5
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
RUN_MOP_PATH = Path(os.environ["RUN_MOP_PATH"]).expanduser().resolve()
PYTHON_EXE = os.environ.get("PYTHON_EXE", sys.executable)
WORKER_ID = os.environ.get("WORKER_ID") or f"{socket.gethostname()}-mop-piloto"

supabase = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


def finish(success: bool, error: str | None = None):
    return supabase.rpc(
        "finish_mop",
        {
            "p_id": ORDER_ID,
            "p_worker_id": WORKER_ID,
            "p_success": success,
            "p_error": error,
        },
    ).execute()


def main():
    if not RUN_MOP_PATH.exists():
        raise FileNotFoundError(f"run_mop.py nao encontrado: {RUN_MOP_PATH}")

    print("=" * 64)
    print("MOP-CNC PILOTO CONTROLADO - PEDIDO #5")
    print("=" * 64)
    print(f"Worker ID: {WORKER_ID}")
    print(f"Robo: {RUN_MOP_PATH}")
    print("Este executor processa somente o pedido #5 e encerra.")
    print("=" * 64)

    claimed = supabase.rpc(
        "claim_mop_by_id",
        {"p_id": ORDER_ID, "p_worker_id": WORKER_ID},
    ).execute().data or []

    if not claimed:
        print("[PILOTO] Pedido #5 nao foi assumido. Ele pode nao estar mais na fila.")
        return 2

    order = claimed[0]
    print(
        f"[PILOTO] Pedido #{order['id']} assumido | "
        f"franquia={order['franquia_codigo']} | whatsapp={order['whatsapp']}",
        flush=True,
    )

    authorized = supabase.rpc(
        "mop_pedido_autorizado",
        {"p_id": ORDER_ID},
    ).execute().data

    if not authorized:
        finish(False, "ACESSO_LOJA_REVOGADO")
        print("[PILOTO] BLOQUEADO: autorizacao da loja foi revogada.", flush=True)
        return 3

    cmd = [
        str(PYTHON_EXE),
        str(RUN_MOP_PATH),
        "--franquia",
        str(order["franquia_codigo"]),
        "--whatsapp",
        str(order["whatsapp"]),
    ]
    print(f"[PILOTO] Iniciando robo: {' '.join(cmd)}", flush=True)

    completed = subprocess.run(
        cmd,
        cwd=str(RUN_MOP_PATH.parent),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    if completed.stdout:
        print(completed.stdout, flush=True)
    if completed.stderr:
        print(completed.stderr, file=sys.stderr, flush=True)

    if completed.returncode == 0:
        finish(True, None)
        print("[PILOTO] Pedido #5 concluido -> ENVIADO", flush=True)
        return 0

    error_text = (
        completed.stderr.strip()
        or completed.stdout.strip()
        or f"run_mop.py retornou codigo {completed.returncode}"
    )
    finish(False, error_text[-4000:])
    print("[PILOTO] Pedido #5 concluido -> ERRO", flush=True)
    return completed.returncode or 1


if __name__ == "__main__":
    raise SystemExit(main())
