"""Conservative identity-candidate analysis for the DNA read-only robot.

Never confirms a user identity. Does not put raw IDs, names or logins in reports.
The hashes correlate captures but are NOT proof that a candidate belongs to the
profile shown: the DNA itself must independently validate persistent IDs.
"""
from __future__ import annotations

import hashlib
import re
from typing import Any

_ALLOWED_TYPES = frozenset({'id', 'codigo', 'matricula'})
_ALLOWED_SOURCE = re.compile(r'^(ng-model:usuario\.(?:id|codigo|matricula|uuid)|url:(?:idUsuario|usuarioId|id_usuario|codigoUsuario|usuarioCodigo|matriculaUsuario)|atributo:data-(?:usuario-id|user-id|id-usuario|codigo-usuario))$')
_ALLOWED_VALUE = re.compile(r'^[A-Za-z0-9_:\-.]{1,96}$')


def _normalized(snapshot: Any) -> set[tuple[str, str, str]]:
    if not isinstance(snapshot, dict) or snapshot.get('formato') != 'dna-id-candidatos-v1':
        return set()
    candidates = snapshot.get('candidatos')
    if not isinstance(candidates, list) or len(candidates) > 12:
        return set()
    result: set[tuple[str, str, str]] = set()
    for c in candidates:
        if not isinstance(c, dict):
            continue
        kind, value, source = c.get('tipo'), c.get('valor'), c.get('fonte')
        if kind not in _ALLOWED_TYPES or not isinstance(source, str) or not _ALLOWED_SOURCE.fullmatch(source):
            continue
        if not isinstance(value, str) or not _ALLOWED_VALUE.fullmatch(value):
            continue
        result.add((kind, value, source))
    return result


def analyze_identity(readings: Any) -> dict:
    """Two read-only observations of the same frame; never an identity verdict."""
    base = {'status': 'nao_verificada', 'origem': 'inspecao_tecnica_somente_leitura',
            'parecer': 'identificador_ausente', 'candidatos_tecnicos': [],
            'observacoes': 2, 'orientacao': 'Nao comprova vinculo com usuario DNA'}
    if not isinstance(readings, list) or len(readings) != 2:
        base['parecer'] = 'observacoes_incompletas'
        return base
    first, second = _normalized(readings[0]), _normalized(readings[1])
    if first != second:
        base['parecer'] = 'leituras_inconsistentes'
        return base
    if not first:
        return base
    by_type: dict[str, set[str]] = {}
    for kind, value, _ in first:
        by_type.setdefault(kind, set()).add(value)
    if any(len(values) > 1 for values in by_type.values()):
        base['parecer'] = 'identificadores_conflitantes'
        return base
    # Give priority to explicit user IDs; never infer ID=code=matricula.
    base['parecer'] = 'candidato_estavel_na_tela' if 'id' in by_type else 'codigo_ou_matricula_candidato'
    for kind, value, src in sorted(first):
        base['candidatos_tecnicos'].append({
            'tipo': kind, 'fonte': src,
            'sha256': hashlib.sha256((kind + '\x00' + value).encode('utf-8')).hexdigest()
        })
    return base