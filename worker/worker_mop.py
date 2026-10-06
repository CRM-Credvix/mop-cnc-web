import os
import socket
import subprocess
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
RUN_MOP_PATH = Path(os.environ["RUN_MOP_PATH"]).expanduser().resolve()
PYTHON_EXE = os.environ.get("PYTHON_EXE", sys.executable)
POLL_SECONDS = int(os.environ.get("POLL_SECONDS", "10"))
WORKER_ID = os.environ.get("WORKER_ID") or f"{socket.gethostname()}-mop"

supabase = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


def claim_next():
    result = supabase.rpc("claim_next_mop", {"p_worker_id": WORKER_ID}).execute()
    rows = result.data or []
    return rows[0] if rows else None


def is_authorized(order_id: int) -> bool:
    result = supabase.rpc("mop_pedido_autorizado", {"p_id": order_id}).execute()
    return bool(result.data)


def finish(order_id: int, success: bool, error: str | None = None):
    payload = {
        "p_id": order_id,
        "p_worker_id": WORKER_ID,
        "p_success": success,
        "p_error": error,
    }
    return supabase.rpc("finish_mop", payload).execute()


def run_robot(order: dict):
    cmd = [
        str(PYTHON_EXE),
        str(RUN_MOP_PATH),
        "--franquia",
        str(order["franquia_codigo"]),
        "--whatsapp",
        str(order["whatsapp"]),
    ]
    print(f"[MOP] Pedido #{order['id']} | iniciando: {' '.join(cmd)}", flush=True)
    completed = subprocess.run(
        cmd,
        cwd=str(RUN_MOP_PATH.parent),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return completed


def main():
    if not RUN_MOP_PATH.exists():
        raise FileNotFoundError(f"run_mop.py não encontrado: {RUN_MOP_PATH}")

    print("=" * 64)
    print("MOP-CNC WORKER")
    print("=" * 64)
    print(f"Worker ID: {WORKER_ID}")
    print(f"Robô: {RUN_MOP_PATH}")
    print(f"Intervalo: {POLL_SECONDS}s")
    print("Para parar: CTRL+C")
    print("=" * 64)

    while True:
        try:
            order = claim_next()
            if not order:
                time.sleep(POLL_SECONDS)
                continue

            order_id = int(order["id"])
            print(
                f"[MOP] Pedido #{order_id} assumido | franquia={order['franquia_codigo']} | whatsapp={order['whatsapp']}",
                flush=True,
            )

            if not is_authorized(order_id):
                finish(order_id, False, "ACESSO_LOJA_REVOGADO")
                print(
                    f"[MOP] Pedido #{order_id} bloqueado: vínculo da loja não está autorizado.",
                    file=sys.stderr,
                    flush=True,
                )
                continue

            completed = run_robot(order)

            if completed.stdout:
                print(completed.stdout, flush=True)
            if completed.stderr:
                print(completed.stderr, file=sys.stderr, flush=True)

            if completed.returncode == 0:
                finish(order_id, True, None)
                print(f"[MOP] Pedido #{order_id} concluído -> ENVIADO", flush=True)
            else:
                error_text = (
                    completed.stderr.strip()
                    or completed.stdout.strip()
                    or f"run_mop.py retornou código {completed.returncode}"
                )
                finish(order_id, False, error_text[-4000:])
                print(f"[MOP] Pedido #{order_id} concluído -> ERRO", flush=True)

        except KeyboardInterrupt:
            print("\n[MOP] Worker encerrado pelo operador.")
            return
        except Exception as exc:
            print(f"[MOP] Erro do worker: {exc}", file=sys.stderr, flush=True)
            time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
