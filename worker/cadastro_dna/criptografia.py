"""Cifra AES-256-GCM usada pela Edge Function; chave apenas no cofre Windows.

Formato no banco: Base64(IV de 12 bytes || ciphertext || tag GCM de 16 bytes).
A falha de autenticacao criptografica bloqueia todo processamento.
"""
import base64
import json
import re


class DadosProtegidosInvalidos(ValueError):
    pass


def decifrar(cifra_base64: str, chave_hex: str) -> dict:
    if not isinstance(cifra_base64,str) or not isinstance(chave_hex,str):
        raise DadosProtegidosInvalidos("Formato de dados protegido invalido.")
    if not re.fullmatch(r"[0-9a-fA-F]{64}",chave_hex):
        raise DadosProtegidosInvalidos("Chave AES-256 invalida.")
    try:
        raw=base64.b64decode(cifra_base64,validate=True)
        if not 29<=len(raw)<=15000:
            raise ValueError("Tamanho invalido")
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        plain=AESGCM(bytes.fromhex(chave_hex)).decrypt(raw[:12],raw[12:],None)
        data=json.loads(plain)
        if not isinstance(data,dict):
            raise ValueError("Estrutura invalida")
        expected=("nome","cpf","nascimento","email","telefone","perfil","lojas","idempotencia")
        if any(name not in data for name in expected):
            raise ValueError("Campos incompletos")
        if not re.fullmatch(r"\d{11}",str(data["cpf"])) or not isinstance(data["lojas"],list):
            raise ValueError("Campos invalidos")
        return data
    except (ValueError,TypeError,UnicodeDecodeError,ImportError) as exc:
        raise DadosProtegidosInvalidos("Nao foi possivel decifrar ou validar o pedido.") from exc
    except Exception as exc:
        # GCM InvalidTag e respostas criptograficas nao devem vazar detalhes.
        raise DadosProtegidosInvalidos("Autenticacao criptografica falhou.") from exc
