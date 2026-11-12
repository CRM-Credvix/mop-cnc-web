"""Monitor de validacao: status ATIVO exige identificacao unica E evidencia
explicita do retorno da acao CPF. Consulta de conta ativa, sozinha, nao basta.
Sem rede ou Playwright: recebe observacoes produzidas por adaptadores auditados.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum


class Sinal(str, Enum):
    PENDENTE = "pendente"
    ATIVO = "ativo"
    ERRO = "erro"
    AMBIGUO = "ambiguo"


@dataclass(frozen=True)
class Observacao:
    identidade_unica: bool
    situacao_usuario_ativo: bool
    validacao_cpf_confirmada: bool
    sinal: Sinal
    motivo_publico: str = ""


def decidir(observacao: Observacao, *, limite: datetime, agora: datetime | None = None):
    """Retorna (estado, motivo), sem emitir cliques ou repetir cadastro."""
    if agora is None:
        agora = datetime.now(timezone.utc)
    if agora.tzinfo is None or limite.tzinfo is None:
        raise ValueError("Datas precisam de timezone.")
    if observacao.sinal == Sinal.AMBIGUO or not observacao.identidade_unica:
        return "revisao", "Identidade ou resultado ambiguo: conferir manualmente."
    if observacao.sinal == Sinal.ERRO:
        return "erro", (observacao.motivo_publico or "Erro informado pelo DNA.")[:240]
    if (observacao.sinal == Sinal.ATIVO and observacao.situacao_usuario_ativo
            and observacao.validacao_cpf_confirmada):
        return "ativo", "CPF validado e usuario ativo, identidade conferida."
    if agora >= limite:
        return "revisao", "Validacao sem confirmacao apos 10 minutos; revisar no DNA."
    return "aguardando_validacao", "Aguardando confirmacao da validacao CPF."


def observacao_de_consulta_identidade(consulta: dict) -> Observacao:
    """A consulta existente prova a identidade na manutencao, mas NAO a acao CPF."""
    status = str(consulta.get("status", ""))
    identidade = status == "trinca_consistente_na_tela" and consulta.get("contas_mesmo_cpf") == 1
    return Observacao(
        identidade_unica=identidade,
        situacao_usuario_ativo=identidade,
        validacao_cpf_confirmada=False,
        sinal=Sinal.PENDENTE if identidade else Sinal.AMBIGUO,
    )
