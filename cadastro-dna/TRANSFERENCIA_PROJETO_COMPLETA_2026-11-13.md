# DOCUMENTO DE TRANSFERÊNCIA — CADASTRO DNA / MOP-CNC
Data de corte: 13/11/2026. Fonte: conversa completa e branch GitHub confirmada.
Repositório: https://github.com/CRM-Credvix/mop-cnc-web
Branch: `feature/cadastro-colaboradores-dna-v01`
PR: https://github.com/CRM-Credvix/mop-cnc-web/pull/56

## 1. OBJETIVO
Automatizar inclusão de colaboradores no sistema DNA, por loja, via MOP-CNC.
Cadastrar Consultores/Supervisores, ativar SSO, marcar primeira Função Consig e validar CPF posteriormente.
Público: operação Credvix autorizada, com controle de acesso e auditoria.

## 2. STACK E AMBIENTE
- Windows 10, estação `CRM`, pasta `Desktop\CREDVIX - CADASTRO DNA - ETAPA 6`.
- Python 3.11 [CONFIRMAR versão local], Playwright síncrono, `requests`, `cryptography`.
- Navegador Microsoft Edge com CDP local: `http://127.0.0.1:9222`.
- DNA Web: `https://cadastro.help.com.br/`.
- MOP-CNC: HTML, CSS, JavaScript estático, GitHub Pages [CONFIRMAR hospedagem].
- Supabase: Auth, PostgreSQL, Edge Functions, SQL/RLS propostos; **não implantados**.
- GitHub: `CRM-Credvix/mop-cnc-web`, branch isolada e PR #56 em rascunho [CONFIRMAR estado atual].
- Integrações existentes de Padronização DNA: motor Python v5.5 e RPCs `dna_web_*`; não reutilizar escrita.
- Credenciais DNA, Supabase e sessões Windows: **[OCULTO]**. Nunca colocar chaves em front-end ou logs.
- Arquivos de referência recebidos: `dna_web_executor(3).py`, `dna_operacional_v5514(3).py`, `dna_replicador_v55(4).py`.
- Outras referências de projeto disponíveis na conversa: contexto Credvix, `bot_dna.py`, `integrador.py`; não presumir compatibilidade.

## 3. ESTADO ATUAL
- ✅ 45 testes offline aprovados **na execução reportada pelo usuário**; versões posteriores ainda sem execução confirmada.
- ✅ Dois JSONs reais: `consultor2.json` e `supervisor2.json`.
- ✅ IDs DNA: `#perfilVenda` e `#subPerfilVenda`; ng-models respectivos confirmados.
- ✅ Perfis oficiais: Consultor → Consultor 2; Supervisor → Supervisor 2.
- ✅ Uma tela de inclusão e um botão `Cadastrar` identificados.
- ✅ Ordem do fluxo definida; código de seleção Perfil → Subperfil preparado.
- ✅ Proteção lógica para 3º ícone entre 7, com interrupção e log.
- ✅ Motor antigo de Padronização preservado; quatro modelos intactos.
- ⚠️ `fluxo_completo.py` é orquestrador com gateway abstrato; não é robô operacional.
- ⚠️ `guarda_validar_cpf.py` não executa clique; assinatura HTML real ainda ausente.
- ⚠️ Inspetor novo identifica 7 ações por célula da tabela; depende de teste no DNA.
- ⚠️ Inspeção prévia `validar_cpf.json`: `quantidade_candidatos: 0`.
- ⚠️ SSO identificado visualmente, mas atributo ainda depende de confirmação na criação.
- ⚠️ Primeira Função Consig definida como necessária; seletor ainda não homologado.
- ⚠️ SQL, Edge Function e integração Windows não homologados nem publicados.

## 4. PENDÊNCIAS E ERROS
- Obter atributos reais do **3º ícone** na barra de **7** ações; nunca clicar por posição isoladamente.
- Confirmar a barra vinculada à linha correta e identidade única do colaborador.
- Identificar primeira Função Consig; marcar apenas se desmarcada.
- Validar seletor SSO `usuario.acessoSso` na tela de inclusão.
- Homologar seleção da loja pelo código e botão `+`, campos obrigatórios e datas.
- Homologar sucesso de `Cadastrar`, eventual modal, busca por nome, estado de CPF e resposta final.
- Implementar gateway Playwright real e tratamento de submissão única, sem repetição em estado incerto.
- Executar testes integrados com usuário de teste autorizado antes de liberar escrita.
- Erro BAT registrado: `'IDENTIFICAR' não é reconhecido como um comando interno ou externo, um programa operável ou um arquivo em lotes.`
- Causa: `echo CREDVIX | IDENTIFICAR...`; pipe interpretado pelo CMD. Corrigido com hífen.
- Outro erro: BAT anterior não abria Edge; corrigido no BAT de inspeção atualizado.
- Diagnóstico antigo retornou zero candidatos; procurava texto/tooltip `Validar CPF` em ícone sem rótulo.
- Não repetir mapeamento Consultor 2/Supervisor 2. Usuário fez esse trabalho duas vezes.
- [CONFIRMAR] O inspetor atualizado encontra a estrutura correta na sessão real.
- [CONFIRMAR] Se existem ícones ocultos ou elementos aninhados, revisar contagem por célula.

## 5. DECISÕES TÉCNICAS
- **Python + Playwright:** automação Windows compatível com robôs existentes.
- **CDP local Edge:** aproveitar login manual sem expor credenciais.
- **Perfil primeiro:** subperfil Angular depende da seleção do perfil.
- **Consultor 2 / Supervisor 2:** decisão definitiva exclusiva do Cadastro DNA.
- **SSO marcado:** exigência explícita na inclusão.
- **Primeira Função Consig:** mínimo necessário para permitir `Cadastrar`; preservar demais.
- **Validar CPF depois:** caminho `Usuário → Manutenção → pesquisar nome → Validar CPF`.
- **Terceiro entre sete:** evidência visual auxiliar; requer atributo técnico único.
- **Fail-closed:** divergência, ambiguidade ou desabilitação impedem clique e geram log.
- **Clique único:** proibir reenvio automático de cadastro e validação.
- **Separação de módulos:** nunca modificar o motor de Padronização DNA nem seus quatro modelos.
- **Branch isolada:** sem merge, deploy ou SQL em produção antes de homologar.

## 6. REGRAS E PREFERÊNCIAS
- Responder em português brasileiro, **muito resumidamente**, com instruções diretas.
- Não solicitar dados ou diagnósticos já fornecidos.
- Uma pasta definitiva; atualizar somente arquivos necessários, sem downloads integrais recorrentes.
- Entregar BAT/arquivos prontos; conferir sintaxe e dependências antes.
- Distinguir **implementado**, **testado offline**, **testado no DNA** e **não homologado**.
- Nunca declarar conclusão de cadastro/CPF por um clique sem confirmação no DNA.
- Segurança rigorosa de loja, identidade, ícone e ações irreversíveis.
- Sem CPF, credenciais, dados pessoais ou tokens em logs/diagnósticos.
- Nunca executar cadastro real nem alterações de produção sem autorização específica.
- Não alterar arquivos de Padronização nem seus quatro modelos existentes.
- Nos documentos de transferência, preservar somente versões atuais completas.

## 7. CÓDIGO ATUAL
**Fonte de verdade:** branch acima, na data de corte.
**Escopo:** todos os arquivos ativos do módulo novo, com texto integral.
**Exclusões conscientes:** `cadastro-dna/schema_proposta.sql` (substituído pela proposta v02), protótipo `cadastro-dna/formulario.*`, BATs antigos de diagnóstico duplicado e arquivos do motor legado.
**Cuidado:** arquivos Python de guarda e inspeção são preparatórios; não autorizam clique real.

### `worker/cadastro_dna/__init__.py`
```python
"""Cadastro DNA — motor isolado, ainda sem ações produtivas."""
```

### `worker/cadastro_dna/agente.py`
```python
"""Entrada do agente Windows para diagnostico e testes SEGUROS.

Proibido reservar filas enquanto o cadastro e a validacao CPF nao forem
homologados em uma conta de teste autorizada.
"""
from __future__ import annotations

import argparse
import os
import sys
import unittest
from pathlib import Path


def diagnostico() -> int:
    print("CREDVIX | CADASTRO DNA | DIAGNOSTICO SEM ESCRITA")
    print("Plataforma Windows:", "SIM" if os.name=="nt" else "NAO")
    try:
        import playwright.sync_api  # noqa: F401
        print("Playwright:", "INSTALADO")
    except ImportError:
        print("Playwright:", "NAO INSTALADO")
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM  # noqa: F401
        print("AES-GCM:", "DISPONIVEL")
    except ImportError:
        print("AES-GCM:", "NAO DISPONIVEL")
    try:
        import requests  # noqa: F401
        print("Requests:", "INSTALADO")
    except ImportError:
        print("Requests:", "NAO INSTALADO")
    print("Cadastro no DNA: BLOQUEADO (homologacao pendente)")
    print("Reserva no Supabase: NAO EXECUTADA")
    return 0


def main() -> int:
    ap=argparse.ArgumentParser(description="Agente Cadastro DNA (modo seguro)")
    ap.add_argument("--diagnostico",action="store_true")
    ap.add_argument("--testes",action="store_true")
    ap.add_argument("--executar",action="store_true")
    args=ap.parse_args()
    if args.testes:
        # -m unittest worker.cadastro_dna.test_* funciona na raiz do repositorio.
        root=Path(__file__).resolve().parents[2]
        sys.path.insert(0,str(root))
        suite=unittest.defaultTestLoader.loadTestsFromNames([
            "worker.cadastro_dna.test_estado",
            "worker.cadastro_dna.test_monitor",
            "worker.cadastro_dna.test_criptografia",
            "worker.cadastro_dna.test_perfis",
            "worker.cadastro_dna.test_sql_invariantes",
            "worker.cadastro_dna.test_formulario",
            "worker.cadastro_dna.test_homologacao_unificada",
            "worker.cadastro_dna.test_preflight_perfil",
            "worker.cadastro_dna.test_mapeamento_campos",
            "worker.cadastro_dna.test_fluxo_completo",
            "worker.cadastro_dna.test_guarda_validar_cpf",
            "worker.cadastro_dna.test_inspecao_validar_cpf",
        ])
        result=unittest.TextTestRunner(verbosity=2).run(suite)
        return 0 if result.wasSuccessful() else 1
    if args.executar:
        print("BLOQUEADO: falta homologar seletores do cadastro, lojas e retorno CPF.")
        print("Nenhuma reserva criada; nenhum usuario alterado.")
        return 3
    return diagnostico()


if __name__=="__main__":
    raise SystemExit(main())
```

### `worker/cadastro_dna/contrato_formulario.py`
```python
"""Contrato de seletores do novo Cadastro DNA. Nao altera o sistema externo.

Os identificadores concretos so podem ser homologados com inspeção do DOM;
a captura nao inclui CPF, nome, email, telefone, valor de campo nem screenshot.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

PERFIL_TO_SUBPERFIL = {"Consultor": "Consultor 2", "Supervisor": "Supervisor 2"}
ROTULOS_RECONHECIDOS = (
    "Nome:", "CPF:", "Data de Nascimento:", "E-mail:", "Telefone Celular:",
    "Perfil:", "Sub Perfil:", "Login IB Consig:", "Usuário acesso SSO",
    "Descrição uso Perfil:", "Observação:"
)
NOMES_BOTOES = ("Cadastrar",)
ATRIBUTOS_SEGUROS = ("id", "name", "ng-model", "data-ng-model", "type")
IDENTIFICADOR = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_.:-]{0,95}$")


class EstruturaInsegura(ValueError):
    pass


def atributo_publicavel(value: object) -> str:
    """Somente identificadores CSS estaticos. Nunca incluir valores dinamicos ou HTML."""
    if not isinstance(value, str) or not IDENTIFICADOR.fullmatch(value):
        return ""
    return value


def validar_inspecao(payload: dict) -> dict:
    """Valida diagnostico estrutural sem confiar em select arbitrario ou DOM antigo."""
    if not isinstance(payload, dict) or payload.get("formulario") != "manutencao_usuario_novo":
        raise EstruturaInsegura("Tela de inclusao nao identificada de forma unica.")
    if payload.get("botao_cadastrar") != 1:
        raise EstruturaInsegura("Botao Cadastrar ausente ou duplicado.")
    controls = payload.get("controles")
    if not isinstance(controls, dict):
        raise EstruturaInsegura("Estrutura de controles invalida.")
    for title in ("Nome:", "CPF:", "Data de Nascimento:", "E-mail:", "Telefone Celular:", "Perfil:", "Sub Perfil:"):
        if controls.get(title) != 1:
            raise EstruturaInsegura("Campo obrigatorio ausente ou ambiguo: "+title)
    options = payload.get("opcoes", {})
    if not isinstance(options, dict):
        raise EstruturaInsegura("Opcoes de perfil invalidas.")
    if options.get("Consultor") != "Consultor 2" or options.get("Supervisor") != "Supervisor 2":
        raise EstruturaInsegura("Mapeamento de subperfis divergente do oficial.")
    return {"situacao": "estrutura_compatível", "pode_cadastrar": False,
            "subperfis": dict(PERFIL_TO_SUBPERFIL)}
```

### `worker/cadastro_dna/criptografia.py`
```python
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
```

### `worker/cadastro_dna/estado.py`
```python
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
```

### `worker/cadastro_dna/fluxo_completo.py`
```python
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
```

### `worker/cadastro_dna/guarda_validar_cpf.py`
```python
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
```

### `worker/cadastro_dna/homologacao_unificada.py`
```python
"""Execucao unica da homologacao estrutural. SOMENTE LEITURA.

O operador faz login e muda os dois perfis manualmente; o programa executa
testes e grava 2 relatorios tecnicos em uma pasta, sem dados pessoais.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from .inspecao_campos import inspecionar

RAIZ=Path(__file__).resolve().parents[2]
SAIDA=RAIZ/"RELATORIOS_CADASTRO_DNA"
FASES=(
    ("CONSULTOR 2","Consultor","Consultor 2","consultor2.json"),
    ("SUPERVISOR 2","Supervisor","Supervisor 2","supervisor2.json"),
)


class DiagnosticoInconclusivo(RuntimeError):
    pass


def confirmar_opcoes(report: dict, familia: str, subperfil: str) -> None:
    if report.get("situacao")!="estrutura_lida":
        raise DiagnosticoInconclusivo("Tela de cadastro nao identificada.")
    info=report.get("estrutura") or {}
    if info.get("botao_cadastrar")!=1:
        raise DiagnosticoInconclusivo("Botao Cadastrar ausente ou ambiguo.")
    selects=info.get("selects") or []
    familias=[s for s in selects if familia in s.get("opcoes_reconhecidas",[])
              and "Consultor" in s.get("opcoes_reconhecidas",[])
              and "Supervisor" in s.get("opcoes_reconhecidas",[])]
    subperfis=[s for s in selects if subperfil in s.get("opcoes_reconhecidas",[])]
    if len(familias)!=1 or len(subperfis)!=1 or familias[0] is subperfis[0]:
        raise DiagnosticoInconclusivo("Select Perfil/Sub Perfil nao foi identificado unicamente.")
    if familias[0].get("selecionado_reconhecido")!=familia:
        raise DiagnosticoInconclusivo("Perfil selecionado nao corresponde ao esperado.")
    if subperfis[0].get("selecionado_reconhecido")!=subperfil:
        raise DiagnosticoInconclusivo("Subperfil selecionado nao corresponde ao esperado.")


def run() -> int:
    print("="*60)
    print("CREDVIX | CADASTRO DNA | HOMOLOGACAO UNIFICADA")
    print("Somente leitura: sem CPF, sem envio, sem cadastrar.")
    print("="*60)
    if sys.platform!="win32":
        print("Este procedimento foi preparado somente para Windows.")
        return 2
    edge=RAIZ/"worker"/"ABRIR_EDGE_DIAGNOSTICO.bat"
    if not edge.is_file():
        print("Arquivo de inicializacao Edge de diagnostico ausente.")
        return 2
    try:
        subprocess.run(["cmd","/c",str(edge)],check=True,cwd=str(RAIZ))
        SAIDA.mkdir(exist_ok=True)
        for titulo,familia,subperfil,nome in FASES:
            print("\n"+"-"*60)
            print("FASE:",titulo)
            print("No Edge aberto, faca login, escolha UMA loja autorizada,")
            print("clique em + para abrir Manutencao de Usuario.")
            print("Selecione Perfil:",familia,"| Sub Perfil:",subperfil)
            print("NAO preencha CPF, nome, email nem clique em Cadastrar.")
            resposta=input("Apos conferir visualmente, pressione ENTER; digite SAIR para encerrar: ")
            if resposta.strip():
                print("Operacao encerrada sem novas leituras.")
                return 2
            data=inspecionar("http://127.0.0.1:9222")
            confirmar_opcoes(data,familia,subperfil)
            data["fase"]=titulo
            data["acoes_realizadas"]=["leitura_estrutura"]
            destino=SAIDA/nome
            destino.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
            print("Leitura confirmada; relatorio gerado:",destino.name)
        print("\n"+"="*60)
        print("DOIS RELATORIOS GERADOS SEM ALTERACOES NO DNA")
        print("Pasta:",SAIDA)
        print("Envie consultor2.json e supervisor2.json para o chat.")
        print("="*60)
        return 0
    except (DiagnosticoInconclusivo,EOFError,KeyboardInterrupt) as exc:
        print("DIAGNOSTICO INCONCLUSIVO:", type(exc).__name__)
        print("Revise a selecao na tela; nenhum cadastro foi realizado.")
        return 2
    except Exception as exc:
        print("Diagnostico interrompido:",type(exc).__name__)
        print("Nao clique em Cadastrar. Nenhuma escrita automatica ocorreu.")
        return 2


if __name__=="__main__":
    raise SystemExit(run())
```

### `worker/cadastro_dna/inspecao.py`
```python
"""Inspeciona apenas a ESTRUTURA da tela DNA via Edge CDP.
Nao le valores digitados, CPF, nomes, sessoes ou DOM bruto.
Nao faz clicks ou screenshots; nao executa cadastro.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit


LABELS = (
    "Nome:", "Data de Nascimento:", "CPF:", "E-mail:",
    "Telefone Celular:", "Sub Perfil:", "Observação:",
)
BUTTONS = ("Cadastrar", "Salvar", "Confirmar", "Fechar", "Pesquisar")
INPUT_IDS = ("dddTelefoneCelular", "wait", "usuario-nome", "menu-usuario-manutencao")


def resumo_frame(frame) -> dict:
    """Contagem de controles identificados; sem inspecao de valores ou dados pessoais."""
    labels={}
    for label in LABELS:
        try:
            labels[label]=int(frame.get_by_label(label,exact=True).count())
        except Exception:
            labels[label]=-1
    botoes={}
    for nome in BUTTONS:
        try:
            botoes[nome]=int(frame.get_by_role("button",name=nome,exact=True).count())
        except Exception:
            botoes[nome]=-1
    ids={}
    for field in INPUT_IDS:
        try:
            ids[field]=int(frame.locator('[id="'+field+'"]').count())
        except Exception:
            ids[field]=-1
    return {"rotulos":labels,"botoes":botoes,"ids":ids}


def inspecionar(cdp_url: str) -> dict:
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
    from dna_diagnostico import _verify_local_cdp, allowed_url
    from playwright.sync_api import sync_playwright
    _verify_local_cdp(cdp_url)
    with sync_playwright() as p:
        browser=p.chromium.connect_over_cdp(cdp_url)
        try:
            frames=[]
            for ctx in browser.contexts:
                for page in ctx.pages:
                    for frame in page.frames:
                        try:
                            url=urlsplit(frame.url)
                            if url.scheme!="https" or url.hostname!="cadastro.help.com.br" or not allowed_url(frame.url):
                                continue
                            frames.append(resumo_frame(frame))
                        except Exception:
                            continue
            if len(frames)!=1:
                return {"situacao":"revisao","motivo":"Esperado um frame do Cadastro DNA, encontrado(s): "+str(len(frames))}
            return {"situacao":"estrutura_lida","controles":frames[0],
                    "aviso":"Somente contagens de controles. Nenhum dado pessoal capturado."}
        finally:
            browser.close()


def main() -> int:
    parser=argparse.ArgumentParser(description="Inspecao somente leitura dos seletores DNA")
    parser.add_argument("--cdp",default="http://127.0.0.1:9222")
    parser.add_argument("--saida",type=Path,default=Path("diagnostico_cadastro_dna_estrutura.json"))
    args=parser.parse_args()
    try:
        result=inspecionar(args.cdp)
        args.saida.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
        print("Relatorio estrutural salvo:",args.saida.name)
        print("Situacao:",result["situacao"])
        return 0 if result["situacao"]=="estrutura_lida" else 2
    except Exception:
        print("Nao foi possivel inspecionar a tela. Nenhuma alteracao realizada.")
        return 2


if __name__=="__main__":
    raise SystemExit(main())
```

### `worker/cadastro_dna/inspecao_campos.py`
```python
"""Inspecao ESTATICA de formulario ja aberto no Edge DNA.

Nao realiza clique, fill, select_option, reload, screenshot nem leitura de valores
de campos pessoais. Exporta somente contagens, estrutura e nomes de opcoes
dois selects reconhecidos pela familia Consultor/Supervisor.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def ler_frame(frame) -> dict:
    from .mapeamento_campos import mapear_campos
    from .contrato_formulario import (
        ROTULOS_RECONHECIDOS, ATRIBUTOS_SEGUROS, atributo_publicavel,
        PERFIL_TO_SUBPERFIL,
    )
    # DOM somente leitura: filtra TODAS as opcoes para rótulos conhecidos.
    script = """() => {
      const known = new Set(['Consultor','Supervisor','Consultor 2','Supervisor 2',
                             'Consultor 1','Supervisor 1','Consultor 3',
                             'Consultor B2C','Consultor Híbrido','Caixa','SAF','-- Selecione --']);
      return [...document.querySelectorAll('select')].map(el => ({
        attrs: Object.fromEntries(['id','name','ng-model','data-ng-model','type'].map(a => [a,el.getAttribute(a)||''])),
        options: [...el.options].map(o=>o.textContent.trim()).filter(t=>known.has(t)),
        total_options: el.options.length,
        selected_known: known.has(el.selectedOptions[0]?.textContent.trim()||'')
          ? el.selectedOptions[0].textContent.trim() : ''
      })).filter(x=>x.options.includes('Consultor')||x.options.includes('Supervisor')
                   ||x.options.includes('Consultor 2')||x.options.includes('Supervisor 2'))
    }"""
    labels={name:frame.get_by_label(name,exact=True).count() for name in ROTULOS_RECONHECIDOS}
    buttons=frame.get_by_role("button",name="Cadastrar",exact=True).count()
    selects=[]
    for select in frame.evaluate(script):
        attrs={k:atributo_publicavel(select.get("attrs",{}).get(k)) for k in ATRIBUTOS_SEGUROS}
        selects.append({"identificadores":attrs,"opcoes_reconhecidas":select["options"],
                        "total_opcoes":int(select["total_options"]),
                        "selecionado_reconhecido":select.get("selected_known","")})
    return {"botao_cadastrar":buttons,"campos":labels,"selects":selects,
            "mapeamento_campos":mapear_campos(frame),
            "padrao_esperado":PERFIL_TO_SUBPERFIL,
            "aviso":"Somente estrutura; nenhum cadastro efetuado."}


def inspecionar(cdp: str) -> dict:
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
    from dna_diagnostico import _verify_local_cdp, allowed_url
    from playwright.sync_api import sync_playwright
    _verify_local_cdp(cdp)
    with sync_playwright() as pw:
        browser=pw.chromium.connect_over_cdp(cdp)
        try:
            valid=[]
            for ctx in browser.contexts:
                for page in ctx.pages:
                    for frame in page.frames:
                        if not allowed_url(frame.url): continue
                        if frame.get_by_role("button",name="Cadastrar",exact=True).count()==1:
                            valid.append(frame)
            if len(valid)!=1:
                return {"situacao":"revisao","motivo":"Formulario nao localizado de maneira unica.",
                        "quantidade_formularios":len(valid)}
            return {"situacao":"estrutura_lida","formulario":"manutencao_usuario_novo",
                    "estrutura":ler_frame(valid[0])}
        finally:
            browser.close()


def main():
    p=argparse.ArgumentParser(description="Leitura de seletores do Cadastro DNA, sem escrita")
    p.add_argument("--cdp",default="http://127.0.0.1:9222")
    p.add_argument("--saida",type=Path,default=Path("diagnostico_cadastro_dna_campos.json"))
    args=p.parse_args()
    try:
        data=inspecionar(args.cdp)
        args.saida.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
        print("Situacao:",data["situacao"])
        print("Saida:",args.saida.name)
        return 0 if data["situacao"]=="estrutura_lida" else 2
    except Exception:
        print("Diagnostico nao concluido; nenhuma alteracao realizada.")
        return 2


if __name__=="__main__":
    raise SystemExit(main())
```

