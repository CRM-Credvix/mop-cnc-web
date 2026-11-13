"""Guarda de clique para Validar CPF: SEM assinatura homologada, NUNCA clica.

Ordem visual (terceiro dos sete) eh uma prova auxiliar, nao um seletor.
A assinatura de um atributo tecnico da acao precisa ser homologada em DOM.
Somente atua na linha do usuario cuja identidade foi comprovada separadamente.
Nao pesquisa por nome/CPF nem registra dados pessoais.
"""
from __future__ import annotations
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

LOG = logging.getLogger("cadastro_dna.validar_cpf")
ACTION_CSS = 'button, a, [role="button"], input[type="button"], input[type="submit"]'


class CliqueBloqueado(RuntimeError):
    pass


@dataclass(frozen=True)
class AssinaturaValidada:
    atributo: str
    valor: str
    homologado: bool = False


def _falhar(motivo: str, arquivo_log: Path | None = None):
    evento={"momento_utc":datetime.now(timezone.utc).isoformat(),
            "etapa":"validar_cpf","resultado":"BLOQUEADO","motivo":motivo,
            "clique_executado":False}
    LOG.error(json.dumps(evento,ensure_ascii=False))
    if arquivo_log:
        arquivo_log.parent.mkdir(parents=True,exist_ok=True)
        with arquivo_log.open("a",encoding="utf-8") as saida:
            saida.write(json.dumps(evento,ensure_ascii=False)+"\n")
    raise CliqueBloqueado(motivo)


def validar_alvo(linha, assinatura: AssinaturaValidada | None,
                 *, identidade_confirmada: bool, arquivo_log: Path | None = None):
    """Retorna locator somente se TODOS os criterios independentes passam.

    Nao clica. O chamador deve conferir permissao de escrita em outro nivel,
    impedir segundo envio e registrar resultado externo.
    """
    if not identidade_confirmada:
        _falhar("identidade_nao_confirmada",arquivo_log)
    if assinatura is None or not assinatura.homologado:
        _falhar("assinatura_nao_homologada",arquivo_log)
    if assinatura.atributo not in {"ng-click","data-ng-click","id"}:
        _falhar("tipo_assinatura_proibido",arquivo_log)
    if not assinatura.valor or len(assinatura.valor)>160:
        _falhar("assinatura_invalida",arquivo_log)
    if linha.count()!=1:
        _falhar("linha_ambigua",arquivo_log)
    botoes=linha.locator(ACTION_CSS)
    if botoes.count()!=7:
        _falhar("barra_nao_tem_sete_icones",arquivo_log)
    alvo=botoes.nth(2)  # indice zero: terceiro da esquerda para direita
    try:
        if not alvo.is_visible() or not alvo.is_enabled():
            _falhar("terceiro_icone_invisivel_ou_desabilitado",arquivo_log)
        valor=alvo.get_attribute(assinatura.atributo)
        if valor != assinatura.valor:
            _falhar("terceiro_icone_assinatura_divergente",arquivo_log)
        iguais=linha.locator(f'[{assinatura.atributo}="{_escapar_css(assinatura.valor)}"]')
        if iguais.count()!=1:
            _falhar("assinatura_duplicada_ou_ausente",arquivo_log)
        # O matching confirma que o atributo pertence mesmo ao terceiro icon.
        if iguais.first.evaluate("(el, target) => el === target", alvo.element_handle()) is not True:
            _falhar("assinatura_aponta_outro_icone",arquivo_log)
    except CliqueBloqueado:
        raise
    except Exception:
        _falhar("falha_na_verificacao_do_dom",arquivo_log)
    return alvo


def _escapar_css(valor: str) -> str:
    return valor.replace("\\","\\\\").replace('"','\\"')
