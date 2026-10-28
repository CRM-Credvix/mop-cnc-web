"""Evidencia visual DNA v2: leitura apenas. Identidade nunca e declarada como confirmada.

O relatorio contem todos os 227 estados observados. Um digest nao prova identidade;
serve apenas para correlacionar a evidencia e detectar alteracao do arquivo local.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from validar_referencias import make_snapshot, compare_snapshots, SnapshotInvalid
from identidade_dna import analyze_identity
from cpf_dna import comparar_cpf_login

_FIELDS = ('ordem_dom', 'secao', 'subsecao', 'rotulo', 'ocorrencia', 'ng_model', 'marcado')


def compact_controls(snapshot: dict) -> list[dict]:
    items = snapshot['permissoes'] + snapshot['controle_sso_e_globais']
    ordered = sorted(items, key=lambda v: v['ordem_dom'])
    if len(ordered) != 227 or [v['ordem_dom'] for v in ordered] != list(range(1, 228)):
        raise SnapshotInvalid('Nao ha 227 controles ordenados; relatorio recusado')
    return [{k: v[k] for k in _FIELDS} for v in ordered]


def read_manifest(path: Path, profile: str) -> dict:
    manifest = json.loads(path.read_text(encoding='utf-8'))
    entry = manifest.get('modelos', {}).get(profile)
    if not entry:
        raise SnapshotInvalid(f'Hash de referencia ausente para {profile}')
    file_path = path.parent / 'dna_etapa2' / 'fixtures' / f'modelo_{profile.lower()}_v1.json'
    content = file_path.read_bytes()
    if hashlib.sha256(content).hexdigest() != entry['arquivo_sha256']:
        raise SnapshotInvalid('Arquivo de referencia foi modificado: restaure o ZIP original')
    return entry


def build_report(reference: dict, raw: dict, hash_modelo: str) -> dict:
    observed = make_snapshot(raw, reference['perfil'])
    differences = compare_snapshots(reference, observed)
    controls = compact_controls(observed)
    identity_summary = analyze_identity(raw.get("identidade_observacoes"))
    cpf_summary = comparar_cpf_login(raw.get("cpf_login_observacoes"))
    identity_summary["validacao_cpf_login"] = cpf_summary
    identity_summary["leitura_dom"] = raw.get('leitura_dom', {'controles_carregados': 227, 'validada_duas_vezes': False})
    # Nenhum parecer local confirma identidade: preserva status inalterado.
    if cpf_summary["resultado"] == "cpf_login_coincidem_na_tela":
        identity_summary["parecer"] = "cpf_login_coincidem_na_tela"
    captured_at = raw.get('capturado_em') or datetime.now(timezone.utc).isoformat()
    # Data confiavel no sentido do relógio local, NAO uma prova de horario do servidor.
    captured_dt = datetime.fromisoformat(captured_at.replace('Z', '+00:00'))
    if captured_dt.tzinfo is None:
        raise SnapshotInvalid('Captura sem fuso horario')
    result = {
        'versao_relatorio': 2,
        'id_relatorio': str(uuid4()),
        'origem_leitura': 'edge_cdp_somente_leitura',
        'capturado_em': captured_dt.isoformat(),
        'perfil': reference['perfil'],
        'subperfil': reference['subperfil'],
        'modelo_sha256': hash_modelo,
        'controles_verificados': 227,
        'controles_evidencia': controls,
        'identidade_evidencia': identity_summary,
        'divergencias_total': len(differences),
        'divergencias': differences,
        'resultado': 'conforme_visual' if not differences else 'divergencias_visuais',
        'gravou_no_dna': False,
    }
    raw_canonical = json.dumps(controls, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    result['hash_local_controles'] = hashlib.sha256(raw_canonical).hexdigest()
    return result