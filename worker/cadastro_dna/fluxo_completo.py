"""Contrato sequencial do Cadastro DNA, separado da padronizacao antiga.

O planejamento eh executavel offline. A integracao real deve implementar
GatewayCadastro com seletores homologados. Nao existe habilitacao de producao.
"""
from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from .contrato_formulario import EstruturaInsegura


class Etapa(str, Enum):
    LOJA="loja"
    DADOS="dados"
    PERFIL="perfil"
    SUBPERFIL="subperfil"
    SSO="sso"
    FUNCAO="primeira_funcao_consig"
    CADASTRAR="cadastrar"
    MANUTENCAO="usuario_manutencao"
    PESQUISA="localizar_usuario"
    IDENTIDADE="confirmar_identidade"
    VALIDAR="validar_cpf"
    RESULTADO="consultar_resultado"


PASSOS=tuple(Etapa)
SUBPERFIS={"CONSULTOR":("Consultor","Consultor 2"),
           "SUPERVISOR":("Supervisor","Supervisor 2")}


@dataclass(frozen=True)
class Pedido:
    loja: str
    nome: str
    cpf: str
    nascimento: str
    email: str
    ddd: str
    telefone: str
    perfil: str

    def conferir(self) -> None:
        import re
        if not self.loja.strip() or not self.nome.strip() or len(self.nome.split())<2:
            raise EstruturaInsegura("Loja ou nome incompleto.")
        if not re.fullmatch(r"\d{11}",self.cpf):
            raise EstruturaInsegura("CPF deve conter 11 digitos.")
        if not re.fullmatch(r"\d{2}",self.ddd) or not re.fullmatch(r"\d{8,9}",self.telefone):
            raise EstruturaInsegura("Telefone invalido.")
        if "@" not in self.email or not self.nascimento.strip():
            raise EstruturaInsegura("Email ou nascimento ausente.")
        if self.perfil not in SUBPERFIS:
            raise EstruturaInsegura("Perfil nao permitido.")


@dataclass(frozen=True)
class Plano:
    etapas: tuple[Etapa,...]
    perfil: str
    subperfil: str
    autorizado_escrever: bool=False


def planejar(pedido: Pedido) -> Plano:
    pedido.conferir()
    perfil, subperfil=SUBPERFIS[pedido.perfil]
    return Plano(etapas=PASSOS,perfil=perfil,subperfil=subperfil)


class ExecucaoBloqueada(RuntimeError):
    pass


def executar_controlado(pedido: Pedido, gateway, *, autorizado: bool=False):
    """Orquestracao para futuro gateway homologado.

    SEGURANCA: bloqueia antes de chamar o gateway. Nao aceita flag por CLI,
    config de usuario ou variavel de ambiente; integracao interna futura.
    """
    plano=planejar(pedido)
    if not autorizado:
        raise ExecucaoBloqueada("Escrita bloqueada ate homologacao do gateway.")

    # Interface injetada: cada metodo deve verificar unicidade dos seletores e
    # confirmar a loja/identidade antes de qualquer mutacao.
    gateway.abrir_loja_por_codigo(pedido.loja)
    gateway.preencher_dados(pedido)
    gateway.selecionar_perfil(plano.perfil)
    gateway.aguardar_subperfis()
    gateway.selecionar_subperfil(plano.subperfil)
    gateway.confirmar_perfil_subperfil(plano.perfil,plano.subperfil)
    gateway.garantir_sso_marcado()
    gateway.garantir_primeira_funcao_consig_marcada()
    gateway.confirmar_loja(pedido.loja)
    gateway.cadastrar_uma_vez()
    gateway.confirmar_cadastro_concluido()
    gateway.abrir_usuario_manutencao()
    gateway.pesquisar_nome_completo(pedido.nome)
    gateway.confirmar_identidade_inequivoca(pedido)
    gateway.validar_cpf_uma_vez()
    return gateway.consultar_situacao_cpf()
