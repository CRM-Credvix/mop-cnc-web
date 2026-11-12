"""Contrato de estados e classificação de resultados para o futuro worker DNA.

Nenhuma operação de navegador ou de Supabase é executada neste módulo.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Status(str, Enum):
    NA_FILA = "na_fila"
    PROCESSANDO = "processando"
    AGUARDANDO_VALIDACAO = "aguardando_validacao"
    ATIVO = "ativo"
    ERRO = "erro"
    REVISAO = "revisao"


class Evidencia(str, Enum):
    INEXISTENTE = "inexistente"
    CADASTRO_CONFIRMADO = "cadastro_confirmado"
    VALIDACAO_SOLICITADA = "validacao_solicitada"
    ATIVACAO_CONFIRMADA = "ativacao_confirmada"
    FALHA_DEFINITIVA = "falha_definitiva"
    ESTADO_INCERTO = "estado_incerto"


@dataclass(frozen=True)
class Resultado:
    status: Status
    motivo: str
    permite_repetir_cadastro: bool = False


def classificar(evidencia: Evidencia, *, identidade_confirmada: bool) -> Resultado:
    """Falha fechada: sem identidade + confirmação inequívoca, nunca retornar ATIVO."""
    if evidencia is Evidencia.ESTADO_INCERTO:
        return Resultado(Status.REVISAO, "Estado do DNA incerto; não repetir cadastro.")
    if not identidade_confirmada:
        return Resultado(Status.REVISAO, "Identidade do colaborador não confirmada.")
    if evidencia is Evidencia.ATIVACAO_CONFIRMADA:
        return Resultado(Status.ATIVO, "Ativação confirmada no DNA.")
    if evidencia is Evidencia.FALHA_DEFINITIVA:
        return Resultado(Status.ERRO, "Falha definitiva retornada pelo DNA.")
    if evidencia is Evidencia.VALIDACAO_SOLICITADA:
        return Resultado(Status.AGUARDANDO_VALIDACAO, "Aguardando resultado do DNA.")
    if evidencia is Evidencia.CADASTRO_CONFIRMADO:
        return Resultado(Status.PROCESSANDO, "Cadastro confirmado; solicitar validação.")
    return Resultado(Status.REVISAO, "Cadastro não confirmado; verificar existência antes de incluir.")


def nova_tentativa_autorizada(*, confirmado_existente: bool, estado_incerto: bool) -> bool:
    """Nunca repetir inclusão quando existe sucesso ou dúvida sobre escrita anterior."""
    return not confirmado_existente and not estado_incerto
