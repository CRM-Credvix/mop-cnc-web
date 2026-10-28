"""Conferencia CPF/Login em memoria, somente leitura, sem persistir CPF completo.

CPF valido + login correspondente e evidencia adicional da tela, NAO autenticacao
ou prova de unicidade no sistema fonte. HMAC local evita hashes publicos de CPF.
"""
from __future__ import annotations
import hashlib
import hmac
import os
import secrets
from pathlib import Path


def cpf_valido(cpf: str) -> bool:
    if not isinstance(cpf, str) or len(cpf) != 11 or not cpf.isdigit() or len(set(cpf)) == 1:
        return False
    numeros = [int(v) for v in cpf]
    for total, idx in ((10, 9), (11, 10)):
        soma = sum(numeros[j] * (total - j) for j in range(idx))
        digito = (soma * 10) % 11
        if digito == 10: digito = 0
        if numeros[idx] != digito: return False
    return True


def obter_chave_local() -> bytes:
    """A chave fica fora do ZIP e da pasta de resultados, no perfil local Windows."""
    base = Path(os.environ.get('LOCALAPPDATA', str(Path.home() / '.local'))) / 'Credvix' / 'DNA_Diagnostico_Edge'
    base.mkdir(parents=True, exist_ok=True)
    path = base / 'cpf_hmac_local.key'
    try:
        with path.open('xb') as fh:
            fh.write(secrets.token_bytes(32))
    except FileExistsError:
        pass
    key = path.read_bytes()
    if len(key) != 32: raise RuntimeError('Chave local de CPF invalida. Corrija o ambiente antes de prosseguir.')
    return key


def _valores(snapshot: dict, kind: str) -> set[str] | None:
    if not isinstance(snapshot, dict) or snapshot.get('formato') != 'dna-cpf-login-v1': return None
    block = snapshot.get(kind)
    if not isinstance(block, dict) or not isinstance(block.get('valores'), list): return None
    values = block['valores']
    if len(values) > 6 or any(not isinstance(v,str) or len(v)!=11 or not v.isdigit() for v in values): return None
    return set(values)


def comparar_cpf_login(readings: object, chave: bytes | None = None) -> dict:
    base = {'resultado': 'nao_localizado', 'cpf_formato_valido': False, 'login_corresponde_cpf': False,
            'observacoes': 2, 'cpf_hmac': None, 'fonte': 'campo_cpf_e_cabecalho_login'}
    if not isinstance(readings, list) or len(readings) != 2:
        base['resultado'] = 'leituras_incompletas';return base
    a,b = readings
    vals = [_valores(x,kind) for x in (a,b) for kind in ('cpf','login')]
    if any(v is None for v in vals):base['resultado']='captura_invalida';return base
    ca,la,cb,lb = vals
    if ca != cb or la != lb:base['resultado']='leituras_inconsistentes';return base
    if len(ca)>1 or len(la)>1:base['resultado']='valores_ambiguos';return base
    if len(ca)==0 or len(la)==0:base['resultado']='cpf_ou_login_ausente';return base
    cpf,login=next(iter(ca)),next(iter(la))
    if not cpf_valido(cpf):base['resultado']='cpf_invalido';return base
    base['cpf_formato_valido']=True
    if cpf!=login:base['resultado']='cpf_login_diferentes';return base
    base['login_corresponde_cpf']=True
    secret=chave if chave is not None else obter_chave_local()
    if not isinstance(secret,bytes) or len(secret)!=32: raise ValueError('Chave local deve conter 32 bytes')
    base['cpf_hmac']=hmac.new(secret,b'DNA-CPF-v1\x00'+cpf.encode('ascii'),hashlib.sha256).hexdigest()
    base['resultado']='cpf_login_coincidem_na_tela'
    return base