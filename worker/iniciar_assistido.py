"""Assistente local CREDVIX DNA: inicia Edge e compara somente controles visiveis.

Nao envia credenciais, nao altera cadastros, nao clica em Gravar.
"""
from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Callable

from dna_diagnostico import UnsafePage, inspect_live, validate_live_capture
from evidencia_dna import build_report, read_manifest
from validar_referencias import SnapshotInvalid, make_snapshot, normalized_counts

WORKER = Path(__file__).resolve().parent
FIXTURES = WORKER.parent / "fixtures"
RESULTADOS = WORKER / "resultados"
DNA_URL = "https://cadastro.help.com.br/"
PROFILE_DIR = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "Credvix" / "DNA_Diagnostico_Edge"
MANIFEST = WORKER.parent.parent / "manifesto_modelos.json"
OPTIONS = {"1": ("CONSULTOR", "Consultor 2"), "2": ("SUPERVISOR", "Supervisor 1")}


def find_edge(env: dict[str, str] | None = None) -> Path:
    e = os.environ if env is None else env
    candidates = []
    for var in ("ProgramFiles(x86)", "ProgramFiles", "LOCALAPPDATA"):
        if e.get(var):
            candidates.append(Path(e[var]) / "Microsoft" / "Edge" / "Application" / "msedge.exe")
    for p in candidates:
        if p.is_file():
            return p
    raise RuntimeError("Microsoft Edge nao encontrado. Instale ou repare o Microsoft Edge.")


def choose_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


def wait_cdp(port: int, process: subprocess.Popen, timeout_seconds: int = 35) -> None:
    endpoint = f"http://127.0.0.1:{port}/json/version"
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(endpoint, timeout=1) as resp:
                data = json.load(resp)
                if isinstance(data, dict) and data.get("webSocketDebuggerUrl"):
                    return
        except (urllib.error.URLError, TimeoutError, ValueError, OSError):
            pass
        time.sleep(0.4)
    raise RuntimeError(
        "O Edge abriu, mas o canal local de diagnostico nao respondeu. "
        "Feche essa janela do Edge e tente novamente."
    )


def start_edge(executable: Path, port: int) -> subprocess.Popen:
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    args = [
        str(executable), f"--remote-debugging-port={port}",
        "--remote-debugging-address=127.0.0.1",
        f"--user-data-dir={PROFILE_DIR}", "--no-first-run", DNA_URL,
    ]
    # Nunca inicia o navegador com senhas ou cookies em argumentos.
    return subprocess.Popen(args, stdin=subprocess.DEVNULL,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def choose_profile(input_fn: Callable[[str], str] = input) -> tuple[str, str] | None:
    while True:
        print("\nQual modelo deseja conferir?")
        print("  [1] Consultor 2")
        print("  [2] Supervisor 1")
        print("  [0] Sair")
        choice = input_fn("Digite 1, 2 ou 0 e pressione ENTER: ").strip()
        if choice == "0":
            return None
        if choice in OPTIONS:
            return OPTIONS[choice]
        print("Opcao invalida. Digite apenas 1, 2 ou 0.")


def read_reference(profile: str) -> dict:
    filename = f"modelo_{profile.lower()}_v1.json"
    path = FIXTURES / filename
    if not path.is_file():
        raise FileNotFoundError(f"Referencia nao encontrada: {filename}. Extraia o ZIP completo.")
    value = json.loads(path.read_text(encoding="utf-8-sig"))
    counts = normalized_counts(value)
    if (value.get("perfil") != profile or value.get("total_controles") != 227
            or counts["permissoes"] != 224 or counts["globais_e_sso"] != 3):
        raise SnapshotInvalid("O modelo de referencia esta incompleto ou corresponde a outro perfil.")
    read_manifest(MANIFEST, profile)
    return value


def make_report(reference: dict, url: str) -> dict:
    profile = reference["perfil"]
    raw = validate_live_capture(inspect_live(url, profile), profile)
    reference_hash = read_manifest(MANIFEST, profile)["snapshot_sha256"]
    return build_report(reference, raw, reference_hash)


def save_report(report: dict, profile: str) -> Path:
    RESULTADOS.mkdir(parents=True, exist_ok=True)
    # Nao inclui nomes de usuarios, login nem cookies no nome do arquivo.
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    path = RESULTADOS / f"diagnostico_{profile.lower()}_{stamp}.json"
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def run() -> int:
    print("CREDVIX | Robo DNA - assistente de diagnostico (SOMENTE LEITURA)")
    print("O programa nao edita permissoes, nao salva usuarios e nao usa senhas do DNA.")
    selected = choose_profile()
    if not selected:
        return 0
    profile, subprofile = selected
    reference = read_reference(profile)
    print(f"\nReferencia conferida: {subprofile} | 227 controles, sendo 224 permissoes.")
    print("Preparando a janela do Edge...")
    port = choose_port()
    proc = start_edge(find_edge(), port)
    wait_cdp(port, proc)
    print("\nO Microsoft Edge foi aberto.")
    print("FAÇA APENAS ISTO NA JANELA DO EDGE:")
    print("  1. Entre no DNA com seu login e sua senha habituais.")
    print("  2. Abra a manutencao de UM usuario autorizado para conferencia.")
    print("  3. Expanda todas as secoes de permissoes (227 controles visiveis).")
    print("  4. Volte para ESTA janela preta e pressione ENTER.")
    print("\nNao altere caixas de selecao nem clique em Gravar.")
    cdp = f"http://127.0.0.1:{port}"
    while True:
        action = input("\nENTER = conferir a tela | S = sair: ").strip().lower()
        if action in ("s", "sair", "0"):
            print("Encerrando assistente. Feche o Edge quando terminar.")
            return 0
        print("Lendo somente os controles da tela aberta...")
        try:
            report = make_report(reference, cdp)
        except (UnsafePage, SnapshotInvalid, OSError, RuntimeError, ValueError) as exc:
            print("\nNAO FOI POSSIVEL CONFERIR ESSA TELA.")
            print("Motivo:", str(exc))
            print("Confirme que a janela aberta e a do Edge iniciada pelo robo,")
            print("que existe somente UM cadastro em manutencao e que as secoes estao expandidas.")
            print("Nao foi feita nenhuma alteracao no DNA.")
            continue
        output = save_report(report, profile)
        print("\n=============================================================")
        print("DIAGNOSTICO FINALIZADO (SOMENTE LEITURA)")
        print("Controles verificados:", report["controles_verificados"])
        print("Divergencias encontradas:", report["divergencias_total"])
        print("Identidade do cadastro: NAO VERIFICADA (candidatos apenas)")
        print("Identificador da leitura:", report["id_relatorio"])
        print("Resultado:", report["resultado"])
        print("Permissoes alteradas: 0")
        print("Relatorio detalhado salvo em:", output)
        print("Para registrar no Supabase: importe este JSON na tela Auditoria DNA do MOP-CNC.")
        print("=============================================================")
        if report["divergencias_total"]:
            print("As divergencias foram apenas registradas. NADA foi corrigido automaticamente.")
        if input("\nENTER = conferir outra tela do mesmo perfil | S = sair: ").strip().lower() in ("s", "sair", "0"):
            print("Concluido. O relatorio fica salvo localmente.")
            return 0


def main() -> int:
    try:
        return run()
    except (KeyboardInterrupt, EOFError):
        print("\nAssistente encerrado, sem alterar nada no DNA.")
        return 1
    except Exception as exc:
        print("\nNao foi possivel iniciar: ", str(exc))
        return 1


if __name__ == "__main__":
    sys.exit(main())