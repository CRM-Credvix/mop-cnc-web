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

### `worker/cadastro_dna/inspecao_validar_cpf.py`
```python
"""Identificacao SOMENTE LEITURA do terceiro icone na barra de 7 acoes.

Nao le valores de campos, texto de linhas, CPF, nomes ou URLs.
Nao clica, nao valida CPF e nunca habilita gravacao.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

JS_INSPECAO = r"""() => {
  const css='button,a,[role="button"],input[type="button"],input[type="submit"]';
  const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const visivel=e=>!!e.getClientRects().length;
  const technical=e=>{
    const raw=e.getAttribute('ng-click') || e.getAttribute('data-ng-click') || '';
    // Exporta SOMENTE nome de funcao sem argumentos de usuarios.
    const func=raw.match(/^\s*([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*){0,5})\s*\(/);
    const labels=[e.getAttribute('title'),e.getAttribute('aria-label'),
                  e.getAttribute('data-original-title')];
    return {
      tag:e.tagName.toLowerCase(), id:e.getAttribute('id')||'',
      ng_model:e.getAttribute('ng-model')||'',
      ng_click_funcao:func?func[1]:'',
      classe_icone:(e.querySelector('i,svg')?.getAttribute('class')||''),
      rotulo_validar_cpf:labels.some(t=>norm(t).includes('validar')&&norm(t).includes('cpf')),
      visivel:visivel(e), desabilitado:!!e.disabled || e.getAttribute('aria-disabled')==='true'
    };
  };
  const linhas=[...document.querySelectorAll('tr')].filter(visivel);
  const barras=[];
  for (const linha of linhas) {
    const celulas=[...linha.querySelectorAll(':scope > td')];
    for (const celula of celulas) {
      const acoes=[...celula.querySelectorAll(css)].filter(visivel);
      if (acoes.length!==7) continue;
      const descricoes=acoes.map(technical);
      barras.push({quantidade_icones:acoes.length,icones:descricoes,
        terceiro_indice:2,terceiro:descricoes[2]});
    }
  }
  return {barras:barras.slice(0,10),quantidade_barras:barras.length,
          apenas_metadados:true,clicou:false};
}"""


def _safe_ident(text: object, maxlen=90) -> str:
    return text if isinstance(text,str) and len(text)<=maxlen and re.fullmatch(r"[A-Za-z_$][A-Za-z0-9_.$:-]*",text) else ""


def _safe_classes(text: object) -> list[str]:
    # Lista de tokens CSS sem conteudo dinamico.
    return [t for t in str(text or "").split()[:8] if _safe_ident(t,64)]


def ler_barras(frame) -> dict:
    raw=frame.evaluate(JS_INSPECAO)
    result=[]
    for b in raw.get("barras",[]):
        icones=[]
        for item in b.get("icones",[]):
            icones.append({
                "tag":_safe_ident(item.get("tag")),
                "id":_safe_ident(item.get("id")),
                "ng_model":_safe_ident(item.get("ng_model")),
                "ng_click_funcao":_safe_ident(item.get("ng_click_funcao")),
                "classes_icone":_safe_classes(item.get("classe_icone")),
                "rotulo_validar_cpf":bool(item.get("rotulo_validar_cpf")),
                "visivel":bool(item.get("visivel")),
                "desabilitado":bool(item.get("desabilitado")),
            })
        if len(icones)==7:
            result.append({"quantidade_icones":7,"terceiro_indice":2,
                           "icones":icones})
    return {"quantidade_barras":int(raw.get("quantidade_barras",0)),
            "barras":result,
            "nenhum_clique":True,"nenhum_dado_pessoal":True}


def inspecionar(cdp: str) -> dict:
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
    from dna_diagnostico import _verify_local_cdp, allowed_url
    from playwright.sync_api import sync_playwright
    _verify_local_cdp(cdp)
    with sync_playwright() as playwright:
        browser=playwright.chromium.connect_over_cdp(cdp)
        try:
            valid=[frame for ctx in browser.contexts for page in ctx.pages
                   for frame in page.frames if allowed_url(frame.url)]
            if len(valid)!=1:
                return {"situacao":"revisao","motivo":"frame_dna_nao_unico",
                        "quantidade_frames":len(valid)}
            info=ler_barras(valid[0])
            # Mesmo com apenas uma barra, o 3o icone requer homologacao.
            return {"situacao":"estrutura_lida" if info["quantidade_barras"] else "revisao",
                    "acao":"identificar_terceiro_icone","estrutura":info,
                    "assinatura_homologada":False}
        finally:
            browser.close()


def main() -> int:
    parser=argparse.ArgumentParser(description="Ler barra de 7 icones sem clicar")
    parser.add_argument("--cdp",default="http://127.0.0.1:9222")
    parser.add_argument("--saida",type=Path,
                        default=Path("RELATORIOS_CADASTRO_DNA/validar_cpf_terceiro_icone.json"))
    args=parser.parse_args()
    try:
        result=inspecionar(args.cdp)
        args.saida.parent.mkdir(parents=True,exist_ok=True)
        args.saida.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",
                              encoding="utf-8")
        print("Situacao:",result["situacao"])
        print("Relatorio:",args.saida)
        print("Nao foi feito nenhum clique.")
        return 0 if result["situacao"]=="estrutura_lida" else 2
    except Exception as exc:
        print("Nao foi possivel inspecionar:",type(exc).__name__)
        print("Nenhum clique executado.")
        return 2


if __name__=="__main__":
    raise SystemExit(main())
```

### `worker/cadastro_dna/mapeamento_campos.py`
```python
"""Mapeia identificadores tecnicos do formulario DNA, sem ler valores.

Nao executa acao sobre campos: apenas conta correspondencias e atributos
estaticos de controles vinculados aos rotulos permitidos.
"""
from __future__ import annotations

from .contrato_formulario import atributo_publicavel

ROTULOS = (
    "Nome:", "CPF:", "Data de Nascimento:", "E-mail:",
    "Telefone Celular:", "Login IB Consig:", "Descrição uso Perfil:",
    "Observação:", "Perfil:", "Sub Perfil:",
)
SSO_NG_MODEL = "usuario.acessoSso"


def mapear_campos(frame) -> dict:
    """Nao chama input_value, text_content, screenshot, fill nem click."""
    campos = {}
    for rotulo in ROTULOS:
        locator = frame.get_by_label(rotulo, exact=True)
        quantidade = locator.count()
        item = {"quantidade": quantidade}
        if quantidade == 1:
            static = locator.evaluate("""el => ({
              tag: el.tagName.toLowerCase(),
              type: el.getAttribute('type') || '',
              id: el.getAttribute('id') || '',
              name: el.getAttribute('name') || '',
              ng_model: el.getAttribute('ng-model') || el.getAttribute('data-ng-model') || ''
            })""")
            item["identificadores"] = {
                k: atributo_publicavel(static.get(k)) for k in
                ("tag", "type", "id", "name", "ng_model")
            }
        campos[rotulo] = item
    sso = frame.locator('[ng-model="usuario.acessoSso"], [data-ng-model="usuario.acessoSso"]')
    quantidade = sso.count()
    controle_sso = {"quantidade": quantidade}
    if quantidade == 1:
        static = sso.evaluate("""el => ({
            tag: el.tagName.toLowerCase(),
            type: el.getAttribute('type') || '',
            id: el.getAttribute('id') || ''
        })""")
        controle_sso.update({
            "tag": atributo_publicavel(static.get("tag")),
            "tipo": atributo_publicavel(static.get("type")),
            "id": atributo_publicavel(static.get("id")),
        })
    return {
        "campos": campos,
        "sso_ng_model": controle_sso,
        "sem_valores_pessoais": True,
        "sem_escrita": True,
    }
```

### `worker/cadastro_dna/monitor.py`
```python
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
    if observacao.sinal == Sinal.AMBIGUO:
        return "revisao", "Identidade ou resultado ambiguo: conferir manualmente."
    if observacao.sinal in (Sinal.ATIVO, Sinal.ERRO) and not observacao.identidade_unica:
        return "revisao", "Resultado sem identidade unica: conferir manualmente."
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
    pendente = status == "nao_encontrado" and consulta.get("contas_mesmo_cpf") == 0
    return Observacao(
        identidade_unica=identidade,
        situacao_usuario_ativo=identidade,
        validacao_cpf_confirmada=False,
        sinal=Sinal.PENDENTE if identidade or pendente else Sinal.AMBIGUO,
    )
```

### `worker/cadastro_dna/perfis.py`
```python
"""Mapeamento OFICIAL exclusivo do NOVO Cadastro DNA.

Os quatro modelos do modulo de padronizacao existente nao sao modificados.
A escolha e derivada do perfil, nunca informada livremente pelo operador.
"""
from __future__ import annotations

from enum import Enum


class Perfil(str, Enum):
    CONSULTOR = "CONSULTOR"
    SUPERVISOR = "SUPERVISOR"


SUBPERFIL_OFICIAL = {
    Perfil.CONSULTOR: "CONSULTOR_2",
    Perfil.SUPERVISOR: "SUPERVISOR_2",
}

ROTULO_DNA = {
    "CONSULTOR_2": "Consultor 2",
    "SUPERVISOR_2": "Supervisor 2",
}


def subperfil_oficial(perfil: str) -> str:
    """Falha fechada para Caixa, SAF, Consultor 1/3/B2C/Hibrido e Supervisor 1."""
    try:
        return SUBPERFIL_OFICIAL[Perfil(perfil)]
    except (ValueError, KeyError, TypeError) as exc:
        raise ValueError("Perfil não autorizado para Cadastro DNA.") from exc


def verificar_subperfil(perfil: str, subperfil: str) -> bool:
    """Verifica correspondencia exata, sem conversao silenciosa."""
    return subperfil_oficial(perfil) == subperfil
```

### `worker/cadastro_dna/preflight_perfil.py`
```python
"""Preflight de PERFIL e SUBPERFIL DNA - somente leitura.

Validado contra relatorios de 12/11/2026. O preflight nao preenche dados,
nao altera permissoes, nao salva e nunca clica Cadastrar.
"""
from __future__ import annotations

from dataclasses import dataclass
from .contrato_formulario import EstruturaInsegura

PERFIL_ID = "perfilVenda"
SUBPERFIL_ID = "subPerfilVenda"
PERFIL_NG_MODEL = "usuario.perfilVenda.id"
SUBPERFIL_NG_MODEL = "usuario.subPerfilVenda.id"
PADRAO = {"CONSULTOR": ("Consultor", "Consultor 2"),
          "SUPERVISOR": ("Supervisor", "Supervisor 2")}


@dataclass(frozen=True)
class Preflight:
    perfil: str
    subperfil: str
    pronto_para_inspecao: bool = True
    autorizacao_cadastrar: bool = False


def verificar_relatorio(dados: dict, perfil_desejado: str) -> Preflight:
    """Analisa exclusivamente metadados estruturais capturados pelo inspetor."""
    if perfil_desejado not in PADRAO:
        raise EstruturaInsegura("Perfil fora do padrao oficial.")
    if not isinstance(dados, dict) or dados.get("situacao") != "estrutura_lida":
        raise EstruturaInsegura("Captura invalida.")
    if dados.get("formulario") != "manutencao_usuario_novo":
        raise EstruturaInsegura("Formulario de inclusao nao reconhecido.")
    estrutura = dados.get("estrutura") or {}
    if estrutura.get("botao_cadastrar") != 1:
        raise EstruturaInsegura("Botao Cadastrar ausente ou duplicado.")
    for campo in ("Nome:", "CPF:", "Data de Nascimento:", "E-mail:",
                  "Telefone Celular:", "Perfil:", "Sub Perfil:"):
        if (estrutura.get("campos") or {}).get(campo) != 1:
            raise EstruturaInsegura("Campo obrigatorio nao identificado: " + campo)
    selects = estrutura.get("selects")
    if not isinstance(selects, list) or len(selects) != 2:
        raise EstruturaInsegura("Esperados dois selects identificados.")
    por_id = {}
    for item in selects:
        identificadores = item.get("identificadores") or {}
        element_id = identificadores.get("id")
        if element_id in por_id:
            raise EstruturaInsegura("Seletor duplicado.")
        por_id[element_id] = item
    if set(por_id) != {PERFIL_ID, SUBPERFIL_ID}:
        raise EstruturaInsegura("Ids dos selects inesperados.")
    if por_id[PERFIL_ID]["identificadores"].get("ng-model") != PERFIL_NG_MODEL:
        raise EstruturaInsegura("Ng-model Perfil divergiu.")
    if por_id[SUBPERFIL_ID]["identificadores"].get("ng-model") != SUBPERFIL_NG_MODEL:
        raise EstruturaInsegura("Ng-model Subperfil divergiu.")
    perfil, subperfil = PADRAO[perfil_desejado]
    if por_id[PERFIL_ID].get("selecionado_reconhecido") != perfil:
        raise EstruturaInsegura("Perfil selecionado divergiu.")
    if por_id[SUBPERFIL_ID].get("selecionado_reconhecido") != subperfil:
        raise EstruturaInsegura("Subperfil selecionado divergiu.")
    if perfil not in (por_id[PERFIL_ID].get("opcoes_reconhecidas") or []):
        raise EstruturaInsegura("Opcao de perfil indisponivel.")
    if subperfil not in (por_id[SUBPERFIL_ID].get("opcoes_reconhecidas") or []):
        raise EstruturaInsegura("Opcao de subperfil indisponivel.")
    return Preflight(perfil, subperfil)
```

### `worker/cadastro_dna/requirements.txt`
```text
-r ../requirements_dna.txt
cryptography==46.0.4
```

### `worker/cadastro_dna/selecionar_perfis.py`
```python
"""Selecao real do Perfil e Sub Perfil, isolada do envio do cadastro.

Integra apenas os dois campos ja confirmados pelos diagnosticos. Nao clica
em Cadastrar nem modifica Funcoes Consig. Requer aba autorizada e aberta.
"""
from __future__ import annotations

from .contrato_formulario import EstruturaInsegura
from .preflight_perfil import (
    PADRAO, PERFIL_ID, SUBPERFIL_ID, PERFIL_NG_MODEL, SUBPERFIL_NG_MODEL,
)


def _select_unico(frame, selector: str, expected_model: str):
    locator=frame.locator(selector)
    if locator.count()!=1:
        raise EstruturaInsegura("Campo de perfil ausente ou duplicado.")
    current=locator.get_attribute("ng-model") or locator.get_attribute("data-ng-model")
    if current!=expected_model:
        raise EstruturaInsegura("Contrato ng-model divergente: "+selector)
    if locator.evaluate("el => el.tagName.toLowerCase()")!="select":
        raise EstruturaInsegura("Controle nao e select.")
    return locator


def _selecionado(locator) -> str:
    return locator.evaluate("el => (el.selectedOptions[0]?.textContent||'').trim()")


def selecionar_perfil_subperfil(frame, perfil: str) -> tuple[str,str]:
    if perfil not in PADRAO:
        raise EstruturaInsegura("Perfil nao autorizado.")
    rotulo_perfil,rotulo_subperfil=PADRAO[perfil]
    principal=_select_unico(frame,"#"+PERFIL_ID,PERFIL_NG_MODEL)
    principal.select_option(label=rotulo_perfil,timeout=10000)
    if _selecionado(principal)!=rotulo_perfil:
        raise EstruturaInsegura("Perfil nao confirmado.")
    # A aplicacao Angular recarrega as opcoes do subperfil apos mudar Perfil.
    sub=_select_unico(frame,"#"+SUBPERFIL_ID,SUBPERFIL_NG_MODEL)
    sub.locator("option").filter(has_text=rotulo_subperfil).first.wait_for(state="attached",timeout=10000)
    opcoes=sub.locator("option").all_text_contents()
    if sum(1 for t in opcoes if t.strip()==rotulo_subperfil)!=1:
        raise EstruturaInsegura("Subperfil oficial ausente ou duplicado.")
    sub.select_option(label=rotulo_subperfil,timeout=10000)
    if _selecionado(principal)!=rotulo_perfil or _selecionado(sub)!=rotulo_subperfil:
        raise EstruturaInsegura("Perfil e subperfil nao confirmados.")
    return rotulo_perfil,rotulo_subperfil
```

### `worker/cadastro_dna/test_criptografia.py`
```python
"""Testes de contrato criptografico sem usar CPF ou chave real."""
import base64
import json
import unittest
from .criptografia import decifrar, DadosProtegidosInvalidos


class TestCifra(unittest.TestCase):
    def setUp(self):
        try:
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        except ImportError:
            self.skipTest("Dependencia cryptography nao instalada")
        self.chave=bytes(range(32))
        self.data={"nome":"Pessoa Exemplo","cpf":"12345678909","nascimento":"1990-01-01",
                   "email":"exemplo@invalid.test","telefone":"27999999999","perfil":"CONSULTOR",
                   "lojas":["51545"],"idempotencia":"00000000-0000-4000-8000-000000000000"}
        self.iv=b"abcdefghijkl"
        raw=self.iv+AESGCM(self.chave).encrypt(self.iv,json.dumps(self.data).encode(),None)
        self.payload=base64.b64encode(raw).decode()

    def test_decifra(self):
        self.assertEqual(decifrar(self.payload,self.chave.hex()),self.data)

    def test_chave_incorreta(self):
        with self.assertRaises(DadosProtegidosInvalidos):
            decifrar(self.payload,(b"x"*32).hex())

    def test_adulteracao(self):
        raw=bytearray(base64.b64decode(self.payload))
        raw[-1]^=1
        with self.assertRaises(DadosProtegidosInvalidos):
            decifrar(base64.b64encode(raw).decode(),self.chave.hex())

    def test_payload_corrompido(self):
        with self.assertRaises(DadosProtegidosInvalidos):
            decifrar("%%%invalid%%%",self.chave.hex())


if __name__=="__main__":
    unittest.main()
```

### `worker/cadastro_dna/test_estado.py`
```python
"""Testes sem acesso a DNA/Supabase. Executar com:
python -m unittest worker.cadastro_dna.test_estado -v
"""
import unittest
from .estado import Evidencia, Status, classificar, nova_tentativa_autorizada


class EstadoTests(unittest.TestCase):
    def test_ativo_exige_identidade(self):
        self.assertEqual(classificar(Evidencia.ATIVACAO_CONFIRMADA, identidade_confirmada=False).status, Status.REVISAO)

    def test_ativo_apenas_com_evidencia(self):
        self.assertEqual(classificar(Evidencia.ATIVACAO_CONFIRMADA, identidade_confirmada=True).status, Status.ATIVO)

    def test_salvar_nao_e_suficiente(self):
        self.assertEqual(classificar(Evidencia.VALIDACAO_SOLICITADA, identidade_confirmada=True).status, Status.AGUARDANDO_VALIDACAO)

    def test_estado_incerto_nao_reexecuta(self):
        self.assertEqual(classificar(Evidencia.ESTADO_INCERTO, identidade_confirmada=True).status, Status.REVISAO)
        self.assertFalse(nova_tentativa_autorizada(confirmado_existente=False, estado_incerto=True))

    def test_cadastro_existente_nao_reexecuta(self):
        self.assertFalse(nova_tentativa_autorizada(confirmado_existente=True, estado_incerto=False))


if __name__ == "__main__":
    unittest.main()
```

### `worker/cadastro_dna/test_fluxo_completo.py`
```python
"""Teste offline: ordem das etapas e veto a qualquer gravacao por padrao."""
import unittest
from .fluxo_completo import Pedido, Etapa, PASSOS, planejar, executar_controlado, ExecucaoBloqueada


def pedido(perfil="CONSULTOR"):
    return Pedido("53743","Nome Exemplo","12345678909","01/01/2000",
                  "exemplo@example.org","27","999999999",perfil)


class GatewayFake:
    def __init__(self):
        self.calls=[]
    def __getattr__(self,name):
        def call(*a):
            self.calls.append(name)
            return "nao_confirmado"
        return call


class FluxoTests(unittest.TestCase):
    def test_ordem_perfil_antes_subperfil(self):
        etapas=planejar(pedido()).etapas
        self.assertLess(etapas.index(Etapa.PERFIL),etapas.index(Etapa.SUBPERFIL))
        self.assertLess(etapas.index(Etapa.SSO),etapas.index(Etapa.CADASTRAR))
        self.assertLess(etapas.index(Etapa.CADASTRAR),etapas.index(Etapa.VALIDAR))

    def test_padrao_supervisor(self):
        plano=planejar(pedido("SUPERVISOR"))
        self.assertEqual((plano.perfil,plano.subperfil),("Supervisor","Supervisor 2"))
        self.assertFalse(plano.autorizado_escrever)

    def test_bloqueio_por_padrao(self):
        gateway=GatewayFake()
        with self.assertRaises(ExecucaoBloqueada):
            executar_controlado(pedido(),gateway)
        self.assertEqual(gateway.calls,[])

    def test_ordem_com_gateway_falso(self):
        gateway=GatewayFake()
        executar_controlado(pedido(),gateway,autorizado=True)
        esperado=["abrir_loja_por_codigo","preencher_dados","selecionar_perfil",
                  "aguardar_subperfis","selecionar_subperfil","confirmar_perfil_subperfil",
                  "garantir_sso_marcado","garantir_primeira_funcao_consig_marcada",
                  "confirmar_loja","cadastrar_uma_vez","confirmar_cadastro_concluido",
                  "abrir_usuario_manutencao","pesquisar_nome_completo",
                  "confirmar_identidade_inequivoca","validar_cpf_uma_vez",
                  "consultar_situacao_cpf"]
        self.assertEqual(gateway.calls,esperado)


if __name__=="__main__":
    unittest.main()
```

### `worker/cadastro_dna/test_formulario.py`
```python
"""Teste da politica de leitura e das garantias de fail-closed (offline)."""
import unittest
from .contrato_formulario import atributo_publicavel, validar_inspecao, EstruturaInsegura


class FormularioContratoTests(unittest.TestCase):
    def setUp(self):
        self.payload={"formulario":"manutencao_usuario_novo","botao_cadastrar":1,
                      "controles":{name:1 for name in (
                          "Nome:", "CPF:", "Data de Nascimento:", "E-mail:",
                          "Telefone Celular:", "Perfil:", "Sub Perfil:")},
                      "opcoes":{"Consultor":"Consultor 2","Supervisor":"Supervisor 2"}}

    def test_estrutura_correta_nao_libera_escrita(self):
        result=validar_inspecao(self.payload)
        self.assertFalse(result["pode_cadastrar"])

    def test_cadastrar_duplicado_bloqueado(self):
        self.payload["botao_cadastrar"]=2
        with self.assertRaises(EstruturaInsegura):
            validar_inspecao(self.payload)

    def test_campo_ausente_bloqueado(self):
        self.payload["controles"]["CPF:"]=0
        with self.assertRaises(EstruturaInsegura):
            validar_inspecao(self.payload)

    def test_supervisor_1_bloqueado(self):
        self.payload["opcoes"]["Supervisor"]="Supervisor 1"
        with self.assertRaises(EstruturaInsegura):
            validar_inspecao(self.payload)

    def test_identificador_dinamico_nao_publicado(self):
        self.assertEqual(atributo_publicavel("usuario.acessoSso"),"usuario.acessoSso")
        self.assertEqual(atributo_publicavel("CPF: 12345678909"),"")
        self.assertEqual(atributo_publicavel("a\" onclick=\"test"),"")


if __name__=="__main__":
    unittest.main()
```

### `worker/cadastro_dna/test_guarda_validar_cpf.py`
```python
"""Testes offline: nao permitir clique baseado apenas na posicao do icone."""
import tempfile
import unittest
from pathlib import Path

from .guarda_validar_cpf import (
    AssinaturaValidada, CliqueBloqueado, validar_alvo,
)


class MockBotao:
    def __init__(self, signature=None, enabled=True):
        self.signature=signature
        self.enabled=enabled
    def is_visible(self): return True
    def is_enabled(self): return self.enabled
    def get_attribute(self,name): return self.signature if name=="ng-click" else None
    def element_handle(self): return self
    def evaluate(self,code,other): return self is other


class MockLocators:
    def __init__(self, buttons):
        self.buttons=buttons
    def count(self): return len(self.buttons)
    def nth(self,index): return self.buttons[index]
    @property
    def first(self): return self.buttons[0]


class MockLinha:
    def __init__(self,buttons): self.buttons=buttons
    def count(self): return 1
    def locator(self,selector):
        if selector.startswith("button, a"):
            return MockLocators(self.buttons)
        return MockLocators([x for x in self.buttons if x.signature=="validarCpf()"])


class GuardaTests(unittest.TestCase):
    def setUp(self):
        self.botoes=[MockBotao() for _ in range(7)]
        self.botoes[2].signature="validarCpf()"
        self.linha=MockLinha(self.botoes)
        self.assinatura=AssinaturaValidada("ng-click","validarCpf()",True)

    def test_indice_tres_confirmado_com_assinatura(self):
        alvo=validar_alvo(self.linha,self.assinatura,identidade_confirmada=True)
        self.assertIs(alvo,self.botoes[2])

    def test_nao_homologado_bloqueia(self):
        with self.assertRaises(CliqueBloqueado):
            validar_alvo(self.linha,AssinaturaValidada("ng-click","validarCpf()"),
                         identidade_confirmada=True)

    def test_identidade_ambigua_bloqueia(self):
        with self.assertRaises(CliqueBloqueado):
            validar_alvo(self.linha,self.assinatura,identidade_confirmada=False)

    def test_icone_trocou_de_posicao_bloqueia(self):
        self.botoes[2].signature=None
        self.botoes[3].signature="validarCpf()"
        with self.assertRaises(CliqueBloqueado):
            validar_alvo(self.linha,self.assinatura,identidade_confirmada=True)

    def test_icone_desabilitado_bloqueia(self):
        self.botoes[2].enabled=False
        with self.assertRaises(CliqueBloqueado):
            validar_alvo(self.linha,self.assinatura,identidade_confirmada=True)

    def test_somente_seis_icones_bloqueia(self):
        self.botoes.pop()
        with self.assertRaises(CliqueBloqueado):
            validar_alvo(self.linha,self.assinatura,identidade_confirmada=True)

    def test_registra_log_sem_dados_pessoais(self):
        with tempfile.TemporaryDirectory() as td:
            log=Path(td)/"guard.jsonl"
            with self.assertRaises(CliqueBloqueado):
                validar_alvo(self.linha,None,identidade_confirmada=True,arquivo_log=log)
            txt=log.read_text(encoding="utf-8")
            self.assertIn("assinatura_nao_homologada",txt)
            self.assertIn('"clique_executado": false',txt)


if __name__=="__main__":
    unittest.main()
```

### `worker/cadastro_dna/test_homologacao_unificada.py`
```python
"""Testes offline de validacao das duas capturas estruturais."""
import unittest
from .homologacao_unificada import confirmar_opcoes, DiagnosticoInconclusivo


def exemplo(perfil="Consultor",subperfil="Consultor 2"):
    return {
        "situacao":"estrutura_lida",
        "estrutura":{"botao_cadastrar":1,"selects":[
            {"opcoes_reconhecidas":["Consultor","Supervisor","Caixa","SAF"],
             "selecionado_reconhecido":perfil},
            {"opcoes_reconhecidas":[subperfil,"Supervisor 1" if subperfil=="Supervisor 2" else "Consultor 1"],
             "selecionado_reconhecido":subperfil}
        ]}
    }


class TesteUnificada(unittest.TestCase):
    def test_consultor(self):
        confirmar_opcoes(exemplo(),"Consultor","Consultor 2")

    def test_supervisor(self):
        confirmar_opcoes(exemplo("Supervisor","Supervisor 2"),"Supervisor","Supervisor 2")

    def test_perfil_errado(self):
        with self.assertRaises(DiagnosticoInconclusivo):
            confirmar_opcoes(exemplo("Supervisor","Consultor 2"),"Consultor","Consultor 2")

    def test_subperfil_errado(self):
        with self.assertRaises(DiagnosticoInconclusivo):
            confirmar_opcoes(exemplo("Supervisor","Supervisor 1"),"Supervisor","Supervisor 2")

    def test_botao_duplo(self):
        data=exemplo()
        data["estrutura"]["botao_cadastrar"]=2
        with self.assertRaises(DiagnosticoInconclusivo):
            confirmar_opcoes(data,"Consultor","Consultor 2")


if __name__=="__main__":
    unittest.main()
```

### `worker/cadastro_dna/test_inspecao_validar_cpf.py`
```python
"""Testa a filtragem privada e as regras do novo inspetor de 7 icones."""
import unittest

from .inspecao_validar_cpf import _safe_ident, _safe_classes, ler_barras


class FrameFalso:
    def evaluate(self, script):
        assert "querySelectorAll" in script
        icons=[{"tag":"button","id":"","ng_model":"","ng_click_funcao":"",
                "classe_icone":"fa fa-square","rotulo_validar_cpf":False,
                "visivel":True,"desabilitado":False} for _ in range(7)]
        icons[2].update({"ng_click_funcao":"usuario.validarCpf",
                         "classe_icone":"fa fa-refresh",
                         "desabilitado":True})
        return {"quantidade_barras":1,"barras":[{"icones":icons}]}


class InspetorTerceiroIconeTests(unittest.TestCase):
    def test_sete_icones_e_terceiro(self):
        result=ler_barras(FrameFalso())
        self.assertEqual(result["quantidade_barras"],1)
        self.assertEqual(result["barras"][0]["terceiro_indice"],2)
        self.assertEqual(result["barras"][0]["icones"][2]["ng_click_funcao"],"usuario.validarCpf")
        self.assertTrue(result["barras"][0]["icones"][2]["desabilitado"])
        self.assertTrue(result["nenhum_clique"])

    def test_rejeita_conteudo_dinamico(self):
        self.assertEqual(_safe_ident("usuario.validarCpf"),"usuario.validarCpf")
        self.assertEqual(_safe_ident("cpf=12345678909;"),"")
        self.assertEqual(_safe_classes("fa fa-refresh cpf=12345678909;"),["fa","fa-refresh"])


if __name__=="__main__":
    unittest.main()
```

### `worker/cadastro_dna/test_mapeamento_campos.py`
```python
"""Teste de leitura: apenas metadados, sem acessar valores do formulario."""
import unittest
from .mapeamento_campos import mapear_campos, ROTULOS


class FakeLocator:
    def __init__(self, attributes=None, count=1):
        self.attributes=attributes or {}
        self._count=count
    def count(self):
        return self._count
    def evaluate(self, _js):
        return self.attributes


class FakeFrame:
    def get_by_label(self, label, exact=False):
        assert exact is True and label in ROTULOS
        return FakeLocator({"tag":"input","type":"text","id":"nome","name":"campoNome","ng_model":"usuario.nome"})
    def locator(self, selector):
        assert selector == '[ng-model="usuario.acessoSso"], [data-ng-model="usuario.acessoSso"]'
        return FakeLocator({"tag":"input","type":"checkbox","id":"sso"},1)


class MapeamentoTests(unittest.TestCase):
    def test_mapeia_apenas_atributos(self):
        result=mapear_campos(FakeFrame())
        self.assertTrue(result["sem_valores_pessoais"])
        self.assertTrue(result["sem_escrita"])
        self.assertEqual(result["sso_ng_model"]["quantidade"],1)
        self.assertEqual(result["campos"]["Nome:"]["identificadores"]["ng_model"],"usuario.nome")
        self.assertNotIn("value",str(result).lower())


if __name__=="__main__":
    unittest.main()
```

### `worker/cadastro_dna/test_monitor.py`
```python
"""Testes offline para validar sem executar cadastro real."""
import unittest
from datetime import datetime, timedelta, timezone
from .monitor import Sinal, Observacao, decidir, observacao_de_consulta_identidade

NOW = datetime(2026, 11, 12, 12, 0, tzinfo=timezone.utc)
LIMITE = NOW + timedelta(minutes=10)


class MonitorTest(unittest.TestCase):
    def test_ativo_exige_prova_cpf(self):
        obs=Observacao(True,True,False,Sinal.ATIVO)
        self.assertEqual(decidir(obs,limite=LIMITE,agora=NOW)[0], "aguardando_validacao")

    def test_ativo_com_todas_as_provas(self):
        obs=Observacao(True,True,True,Sinal.ATIVO)
        self.assertEqual(decidir(obs,limite=LIMITE,agora=NOW)[0], "ativo")

    def test_conta_ativa_nao_prova_validacao_cpf(self):
        obs=observacao_de_consulta_identidade({"status":"trinca_consistente_na_tela","contas_mesmo_cpf":1})
        self.assertFalse(obs.validacao_cpf_confirmada)
        self.assertEqual(decidir(obs,limite=LIMITE,agora=NOW)[0], "aguardando_validacao")

    def test_ambiguo_exige_revisao(self):
        self.assertEqual(decidir(Observacao(False,False,False,Sinal.AMBIGUO),
                                limite=LIMITE,agora=NOW)[0],"revisao")

    def test_prazo_expirado_revisao_sem_nova_escrita(self):
        self.assertEqual(decidir(Observacao(True,True,False,Sinal.PENDENTE),
                                limite=LIMITE,agora=LIMITE)[0],"revisao")

    def test_erro_so_dna_confirmado(self):
        self.assertEqual(decidir(Observacao(True,False,False,Sinal.ERRO,"CPF recusado"),
                                limite=LIMITE,agora=NOW)[0],"erro")

    def test_nao_aceita_data_ingenua(self):
        with self.assertRaises(ValueError):
            decidir(Observacao(True,False,False,Sinal.PENDENTE),
                    limite=datetime(2026,11,12),agora=NOW)


if __name__ == "__main__":
    unittest.main()
```

### `worker/cadastro_dna/test_perfis.py`
```python
"""Regressao do padrao oficial de subperfis de cadastro."""
import unittest
from .perfis import SUBPERFIL_OFICIAL, Perfil, ROTULO_DNA, subperfil_oficial, verificar_subperfil


class TestPerfisCadastro(unittest.TestCase):
    def test_consultor(self):
        self.assertEqual(subperfil_oficial("CONSULTOR"), "CONSULTOR_2")
        self.assertEqual(ROTULO_DNA["CONSULTOR_2"], "Consultor 2")

    def test_supervisor(self):
        self.assertEqual(subperfil_oficial("SUPERVISOR"), "SUPERVISOR_2")
        self.assertEqual(ROTULO_DNA["SUPERVISOR_2"], "Supervisor 2")

    def test_so_duas_opcoes(self):
        self.assertEqual(set(SUBPERFIL_OFICIAL), {Perfil.CONSULTOR, Perfil.SUPERVISOR})

    def test_nao_aceita_subperfis_alternativos(self):
        for profile, sub in [
            ("CONSULTOR","CONSULTOR_1"),("CONSULTOR","CONSULTOR_3"),
            ("CONSULTOR","CONSULTOR_B2C"),("CONSULTOR","CONSULTOR_HIBRIDO"),
            ("SUPERVISOR","SUPERVISOR_1")
        ]:
            with self.subTest(profile=profile, sub=sub):
                self.assertFalse(verificar_subperfil(profile,sub))

    def test_outros_perfis_rejeitados(self):
        for profile in ("CAIXA","SAF","",None,"consultor","SUPERVISOR_1"):
            with self.subTest(profile=profile):
                with self.assertRaises(ValueError):
                    subperfil_oficial(profile)


if __name__ == "__main__":
    unittest.main()
```

### `worker/cadastro_dna/test_preflight_perfil.py`
```python
"""Preflight validado com estrutura reduzida dos dois relatorios DNA."""
import unittest
from copy import deepcopy
from .preflight_perfil import verificar_relatorio
from .contrato_formulario import EstruturaInsegura


def exemplo(perfil):
    consulta = perfil == "CONSULTOR"
    nome = "Consultor" if consulta else "Supervisor"
    sub = "Consultor 2" if consulta else "Supervisor 2"
    opcoes = (["Consultor 1", "Consultor 2", "Consultor 3", "Consultor B2C",
                "Consultor Híbrido"] if consulta else ["Supervisor 1", "Supervisor 2"])
    return {
      "situacao":"estrutura_lida","formulario":"manutencao_usuario_novo",
      "estrutura":{
        "botao_cadastrar":1,
        "campos":{key:1 for key in ("Nome:","CPF:","Data de Nascimento:","E-mail:",
                  "Telefone Celular:","Perfil:","Sub Perfil:")},
        "selects":[
            {"identificadores":{"id":"perfilVenda","ng-model":"usuario.perfilVenda.id"},
             "opcoes_reconhecidas":["Caixa","Consultor","SAF","Supervisor"],
             "selecionado_reconhecido":nome},
            {"identificadores":{"id":"subPerfilVenda","ng-model":"usuario.subPerfilVenda.id"},
             "opcoes_reconhecidas":opcoes,"selecionado_reconhecido":sub}
        ]}}


class PreflightTest(unittest.TestCase):
    def test_consultor(self):
        report=verificar_relatorio(exemplo("CONSULTOR"),"CONSULTOR")
        self.assertEqual(report.subperfil,"Consultor 2")
        self.assertFalse(report.autorizacao_cadastrar)

    def test_supervisor(self):
        report=verificar_relatorio(exemplo("SUPERVISOR"),"SUPERVISOR")
        self.assertEqual(report.subperfil,"Supervisor 2")
        self.assertFalse(report.autorizacao_cadastrar)

    def test_troca_de_perfil(self):
        with self.assertRaises(EstruturaInsegura):
            verificar_relatorio(exemplo("CONSULTOR"),"SUPERVISOR")

    def test_ng_model_divergente(self):
        dado=exemplo("CONSULTOR")
        dado["estrutura"]["selects"][0]["identificadores"]["ng-model"]="outro"
        with self.assertRaises(EstruturaInsegura):
            verificar_relatorio(dado,"CONSULTOR")

    def test_nao_aceita_duplo_cadastrar(self):
        dado=exemplo("SUPERVISOR")
        dado["estrutura"]["botao_cadastrar"]=2
        with self.assertRaises(EstruturaInsegura):
            verificar_relatorio(dado,"SUPERVISOR")


if __name__=="__main__":
    unittest.main()
```

### `worker/cadastro_dna/test_sql_invariantes.py`
```python
"""Verificacao esttica de invariantes SQL; nao substitui teste em PostgreSQL."""
from pathlib import Path
import unittest

SQL = (Path(__file__).resolve().parents[2] / "cadastro-dna" / "schema_seguro_v02.sql").read_text(encoding="utf-8")


class TesteSql(unittest.TestCase):
    def test_um_commit_uma_transacao(self):
        self.assertEqual(SQL.count("\ncommit;"),1)
        self.assertEqual(SQL.count("\nbegin;"),1)

    def test_delimitadores_plpgsql_em_pares(self):
        self.assertEqual(SQL.count("as $"),6)
        self.assertEqual(SQL.count("$;"),6)
        self.assertNotIn("as $\n",SQL)

    def test_configuracao_bloqueada_por_padrao(self):
        self.assertIn("values('cadastro_ativo',false)",SQL)
        self.assertIn("CADASTRO_DESABILITADO",SQL)

    def test_subperfil_oficial_e_consistente(self):
        self.assertIn("subperfil text not null check(subperfil in ('CONSULTOR_2','SUPERVISOR_2'))",SQL)
        self.assertIn("dna_cadastro_perfil_subperfil_oficial",SQL)
        self.assertIn("when 'CONSULTOR' then 'CONSULTOR_2'",SQL)
        self.assertIn("when 'SUPERVISOR' then 'SUPERVISOR_2'",SQL)

    def test_controle_cpf(self):
        self.assertIn("create unique index if not exists dna_cadastro_cpf_unico",SQL)

    def test_isolamento_esquema(self):
        self.assertIn("dna_cadastro_private.dna_cadastro_payloads",SQL)
        self.assertNotIn("mop_private.",SQL)

    def test_sem_reserva_incerteza(self):
        self.assertIn("where s.status='na_fila'",SQL)
        self.assertIn("where s.status='aguardando_validacao'",SQL)
        self.assertIn("reserva_expirada",SQL)

    def test_eventos_append_only(self):
        self.assertIn("trg_dna_cadastro_evento_imutavel",SQL)
        self.assertIn("grant select,insert on public.dna_cadastro_eventos",SQL)


if __name__=="__main__":
    unittest.main()
```

### `cadastro-colaboradores.html`
```html
<!doctype html>
<html lang="pt-BR" class="mop-shell-loading">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cadastro de colaboradores DNA | CREDVIX</title>
<script src="js/theme.js"></script>
<link rel="stylesheet" href="css/tokens.css"><link rel="stylesheet" href="css/app.css">
<link rel="stylesheet" href="css/mop-shell.css">
<link rel="stylesheet" href="css/cadastro-colaboradores.css">
</head>
<body>
<div class="mop-shell" id="cadastroShell" hidden>
<aside class="mop-nav" data-mop-shell-sidebar aria-label="Menu de navegação"></aside>
<div class="app-main"><header class="topbar mop-shared-topbar" data-mop-shell-topbar></header>
<main class="content cvx-cadastro">
<p class="cvx-eyebrow">MÓDULO ADMINISTRATIVO</p>
<h1>Cadastro de <span>Colaboradores DNA</span></h1>
<p>Cadastre colaboradores e acompanhe a validação do CPF. A execução automática permanece bloqueada até homologação.</p>
<section class="cvx-card" aria-label="Nova solicitação">
<div class="cvx-heading"><h2>Dados do colaborador</h2><strong class="cvx-flag">Em homologação</strong></div>
<form id="cadastroForm" novalidate>
<div class="cvx-grid">
<label>Nome completo<input name="nome" autocomplete="off" required minlength="5"></label>
<label>CPF<input name="cpf" inputmode="numeric" autocomplete="off" required></label>
<label>Data de nascimento<input name="nascimento" type="date" required></label>
<label>E-mail<input name="email" type="email" autocomplete="off" required></label>
<label>Telefone com DDD<input name="telefone" inputmode="tel" autocomplete="off" required></label>
<label>Perfil<select name="perfil" required><option value="">Selecione</option><option value="CONSULTOR">Consultor</option><option value="SUPERVISOR">Supervisor</option></select></label>
<label>Subperfil oficial<input id="subperfilOficial" aria-label="Subperfil oficial" value="Selecione o perfil" readonly disabled><small id="subperfilAviso">Definido automaticamente: Consultor 2 ou Supervisor 2. Não editável.</small></label>
</div>
<fieldset><legend>Loja(s) de vínculo</legend><p id="lojasInfo" role="status">Carregando lojas cadastradas no MOP-CNC…</p><div id="lojasLista" class="cvx-lojas"></div></fieldset>
<div class="cvx-actions">
<button type="button" id="validar" class="cvx-button">Conferir preenchimento</button>
<button type="submit" disabled id="solicitar" class="cvx-button" aria-describedby="avisoBloqueio">Solicitar cadastro (bloqueado)</button>
</div>
<p id="avisoBloqueio">Nenhum cadastro será enviado. A fila segura e o agente Windows ainda não foram homologados.</p>
<p id="formFeedback" role="status" aria-live="polite"></p>
</form></section>
<section class="cvx-card" aria-label="Acompanhamento de cadastros">
<div class="cvx-heading"><h2>Acompanhamento</h2><button type="button" id="atualizar" class="cvx-button">Atualizar</button></div>
<p id="filaInfo" role="status">Aguardando autenticação…</p>
<div class="cvx-scroll"><table><thead><tr><th>Solicitação</th><th>Situação</th><th>Etapa</th><th>Atualização</th><th>Motivo</th></tr></thead><tbody id="filaRows"></tbody></table></div>
</section>
</main></div></div>
<p id="cadastroDenied" class="cvx-denied" hidden>Acesso administrativo não autorizado. <a href="app.html">Voltar ao MOP-CNC</a></p>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script><script src="js/mop-shell.js"></script>
<script src="js/cadastro-colaboradores.js"></script>
</body></html>
```

### `css/cadastro-colaboradores.css`
```css
.cvx-cadastro{max-width:1100px;margin:0 auto;padding:24px 22px 54px;color:#171411}.cvx-cadastro h1{font-size:clamp(1.7rem,4vw,2.3rem);margin:3px 0 6px;font-weight:800}.cvx-cadastro h1 span{color:#b04307}.cvx-eyebrow{color:#b04307;font-size:12px;font-weight:750;letter-spacing:.08em}.cvx-card{background:#fff;border:1px solid #ded5cf;border-radius:18px;padding:22px;margin-top:20px}.cvx-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.cvx-flag{font-size:12px;color:#8f5107;background:#fff4df;border-radius:20px;padding:7px 10px}.cvx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.cvx-grid label{font-weight:650;font-size:14px}.cvx-grid input,.cvx-grid select{display:block;width:100%;box-sizing:border-box;border:1px solid #857a73;border-radius:8px;padding:12px;margin-top:6px;background:white;color:#171411;font-size:16px}.cvx-cadastro fieldset{border:1px solid #ded5cf;border-radius:10px;margin-top:16px}.cvx-lojas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.cvx-lojas label{display:flex;align-items:center;gap:8px;font-size:14px}.cvx-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.cvx-button{padding:10px 15px;border-radius:9px;border:1px solid #b04307;background:#b04307;color:white;font:inherit;cursor:pointer}.cvx-button:disabled{background:#eee8e3;color:#5b514b;border-color:#b8ada7;cursor:not-allowed}.cvx-scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:640px}th,td{text-align:left;border-bottom:1px solid #ded5cf;padding:11px 8px;font-size:14px}#formFeedback{font-weight:650}#avisoBloqueio{color:#70665f;font-size:13px}.cvx-denied{padding:24px}@media(max-width:700px){.cvx-grid,.cvx-lojas{grid-template-columns:1fr}.cvx-card{padding:15px}}
```

### `js/cadastro-colaboradores.js`
```javascript
/* MOP-CNC | cadastro DNA: envio SOMENTE se banco e backend liberarem. */
(() => {
 'use strict';
 const client = window.MOP_SUPABASE;
 const shell = document.getElementById('cadastroShell');
 const denied = document.getElementById('cadastroDenied');
 const form = document.getElementById('cadastroForm');
 const $ = id => document.getElementById(id);
 const normalize = value => String(value || '').trim().toLowerCase();
 const digits = value => String(value || '').replace(/\D/g,'');
 let user = null;
 let loading = false;
 let liberado = false;
 let enviando = false;
 let chaveTentativa = '';
 let impressaoTentativa = '';
 const SUBPERFIS_CADASTRO = Object.freeze({CONSULTOR:'CONSULTOR_2',SUPERVISOR:'SUPERVISOR_2'});
 const ROTULOS_SUBPERFIL = Object.freeze({CONSULTOR_2:'Consultor 2',SUPERVISOR_2:'Supervisor 2'});
 function sincronizarSubperfil() {
   const subperfil=SUBPERFIS_CADASTRO[f('perfil')];
   const node=$('subperfilOficial');
   node.value=subperfil?ROTULOS_SUBPERFIL[subperfil]:'Selecione o perfil';
   node.dataset.codigo=subperfil||'';
 }
 function cpfValido(input){
   const cpf = digits(input);
   if(!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf))return false;
   for(let n=9;n<=10;n++){
     let soma=0;for(let i=0;i<n;i++)soma+=Number(cpf[i])*(n+1-i);
     if(Number(cpf[n])!==((soma*10)%11)%10)return false;
   }
   return true;
 }
 const f = name => form.elements.namedItem(name).value.trim();
 function validate(){
   const errors=[];
   const nome=f('nome').replace(/\s+/g,' ');
   const birth=f('nascimento');
   const telefone=digits(f('telefone'));
   if(nome.length<5||!nome.includes(' ')) errors.push('Nome completo inválido.');
   if(!cpfValido(f('cpf'))) errors.push('CPF inválido.');
   if(!birth || !/^\d{4}-\d{2}-\d{2}$/.test(birth) || Number.isNaN(Date.parse(birth)) ||
      new Date(birth+'T12:00:00')>new Date()) errors.push('Nascimento inválido.');
   if(!form.elements.namedItem('email').checkValidity()) errors.push('E-mail inválido.');
   if(!/^\d{10,11}$/.test(telefone)) errors.push('Telefone inválido.');
   if(!Object.hasOwn(SUBPERFIS_CADASTRO,f('perfil')))errors.push('Selecione um perfil.');
   if ($('subperfilOficial').dataset.codigo!==SUBPERFIS_CADASTRO[f('perfil')])
     errors.push('Subperfil oficial não corresponde ao perfil.');
   if(![...document.querySelectorAll('input[name="loja"]:checked')].length)errors.push('Selecione uma loja.');
   $('formFeedback').textContent=errors.length?errors.join(' '):'Preenchimento válido. Nenhum dado foi enviado.';
   return errors.length === 0;
 }
 async function loadLojas(){
   const r=await client.from('franquias_mop').select('codigo,nome').eq('ativo',true).order('nome');
   if(r.error)throw r.error;
   $('lojasLista').replaceChildren();
   for(const loja of r.data||[]){
     const label=document.createElement('label'),box=document.createElement('input'),text=document.createElement('span');
     box.type='checkbox';box.name='loja';box.value=loja.codigo;
     text.textContent=loja.codigo+' — '+loja.nome;label.append(box,text);$('lojasLista').append(label);
   }
   $('lojasInfo').textContent=(r.data||[]).length+' lojas no catálogo. A autorização por usuário será validada no backend antes de liberar qualquer solicitação.';
 }
 async function loadLiberacao() {
   liberado = false;
   $('solicitar').disabled = true;
   try {
     const {data,error} = await client.from('dna_cadastro_config')
       .select('ativo').eq('chave','cadastro_ativo').maybeSingle();
     if (!error && data?.ativo===true) {
       liberado = true;
       $('solicitar').disabled = false;
       $('solicitar').textContent = 'Solicitar cadastro';
       $('avisoBloqueio').textContent = 'O cadastro será registrado na fila segura. A ativação só será confirmada após validação do DNA.';
       return;
     }
   } catch (_) {}
   $('solicitar').textContent = 'Solicitar cadastro (bloqueado)';
   $('avisoBloqueio').textContent = 'Cadastro indisponível até homologação do banco, segurança e robô Windows.';
 }
 async function enviar(event) {
   event.preventDefault();
   if (!liberado || enviando) {
     $('formFeedback').textContent = 'Cadastro bloqueado ou já em processamento.';
     return;
   }
   if (!validate()) return;
   const dados = {
     nome:f('nome').replace(/\s+/g,' '),cpf:digits(f('cpf')),nascimento:f('nascimento'),
     email:f('email'),telefone:digits(f('telefone')),perfil:f('perfil'),
     lojas:[...document.querySelectorAll('input[name="loja"]:checked')].map(x=>x.value)
   };
   const impressao = JSON.stringify(dados);
   if (impressaoTentativa!==impressao) {
     chaveTentativa=crypto.randomUUID();
     impressaoTentativa=impressao;
   }
   enviando=true;$('solicitar').disabled=true;
   $('formFeedback').textContent='Enviando solicitação segura. Não clique novamente.';
   try {
     // A funcao exige Auth + allowlist de UUID, e o SQL exige cadastro_ativo=true.
     const {data,error}=await client.functions.invoke('cadastro-dna-criar',{
       body:{...dados,idempotencia:chaveTentativa}
     });
     if (error || !data?.id) throw Error('SOLICITACAO_NAO_CONFIRMADA');
     $('formFeedback').textContent='Solicitação '+String(data.id).slice(0,8)+' registrada. Acompanhe na tabela abaixo.';
     form.reset();sincronizarSubperfil();chaveTentativa='';impressaoTentativa='';
     await loadFila();
   } catch (_) {
     // Na falha de rede, a mesma chave de idempotencia sera usada em nova tentativa
     // enquanto o conteudo do formulario nao for alterado.
     $('formFeedback').textContent='Envio não confirmado. Consulte o acompanhamento antes de tentar novamente.';
     await loadFila();
   } finally {
     enviando=false;
     await loadLiberacao();
   }
 }
 const statuses={na_fila:'Na fila',processando:'Processando',aguardando_validacao:'Aguardando validação',ativo:'Ativo',erro:'Erro',revisao:'Revisão obrigatória'};
 async function loadFila(){
   if(loading||!user)return;loading=true;$('atualizar').disabled=true;
   try{
     const r=await client.from('dna_cadastro_solicitacoes')
       .select('id,status,etapa,motivo_publico,atualizado_em')
       .order('criado_em',{ascending:false}).limit(50);
     if(r.error){
       $('filaInfo').textContent=['42P01','PGRST205','42501'].includes(r.error.code)
         ?'A fila de cadastro ainda não está instalada ou autorizada. Nenhuma solicitação foi criada.'
         :'Acompanhamento indisponível. Nenhuma alteração realizada.';
       $('filaRows').replaceChildren();return;
     }
     const rows=r.data||[];$('filaInfo').textContent=rows.length+' solicitação(ões) visível(is) para esta conta.';
     $('filaRows').replaceChildren();
     for(const item of rows){
       const tr=document.createElement('tr');
       const values=[String(item.id).slice(0,8),statuses[item.status]||item.status,item.etapa||'—',
         item.atualizado_em?new Date(item.atualizado_em).toLocaleString('pt-BR'):'—',
         item.motivo_publico||'—'];
       for(const v of values){const td=document.createElement('td');td.textContent=String(v);tr.append(td);}
       $('filaRows').append(tr);
     }
   }catch(_){$('filaInfo').textContent='Acompanhamento indisponível.'}
   finally{loading=false;$('atualizar').disabled=false;}
 }
 async function init(){
   try{
     if(!client)throw Error('Cliente Supabase indisponível');
     const {data,error}=await client.auth.getUser();
     if(error||!data?.user){location.replace('index.html');return;}
     if(normalize(data.user.email)!=='crm@credvix.com'){denied.hidden=false;return;}
     user=data.user; shell.hidden=false;
     window.MOP_SHELL?.setUser(user);
     await Promise.allSettled([loadLojas(),loadFila(),loadLiberacao()]);
   }catch(_){denied.hidden=false;$('lojasInfo').textContent='Falha ao carregar lojas.';}
 }
 form.elements.namedItem('perfil').addEventListener('change',sincronizarSubperfil);
 sincronizarSubperfil();
 $('validar').addEventListener('click',validate);
 form.addEventListener('submit',enviar);
 $('atualizar').addEventListener('click',loadFila);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user)loadFila();});
 window.setInterval(()=>{if(user&&!document.hidden)loadFila();},30000);
 init();
})();
```

### `supabase/functions/cadastro-dna-criar/index.ts`
```typescript
// Supabase Edge Function - cadastro-dna-criar (NAO implantada)
// Autenticacao + autorizacao no servidor; CPF cifrado antes de chegar ao banco.
// Secrets obrigatorios: DNA_CADASTRO_ALLOWED_USER_IDS, DNA_CADASTRO_AES_KEY_HEX,
// DNA_CADASTRO_HMAC_KEY_HEX, DNA_CADASTRO_ALLOWED_ORIGIN.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao injetados pela plataforma.
import { createClient } from 'npm:@supabase/supabase-js@2.57.0'

const ALLOWED_ORIGIN = Deno.env.get('DNA_CADASTRO_ALLOWED_ORIGIN') || ''
const headers = (origin: string | null) => ({
  'Content-Type': 'application/json; charset=utf-8',
  ...(origin === ALLOWED_ORIGIN && ALLOWED_ORIGIN ? {'Access-Control-Allow-Origin': origin, 'Vary': 'Origin'} : {}),
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})
const result = (status: number, data: unknown, origin: string | null) =>
  new Response(JSON.stringify(data), {status, headers: headers(origin)})

function hexBytes(value: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error('CONFIGURACAO_CRIPTO_INVALIDA')
  return Uint8Array.from(value.match(/.{2}/g)!.map(v => parseInt(v, 16)))
}
function b64(bytes: Uint8Array): string {
  let s = ''
  for (let i=0; i<bytes.length; i+=8192) s += String.fromCharCode(...bytes.subarray(i,i+8192))
  return btoa(s)
}
function cpfValido(value: string): boolean {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false
  for (let n=9; n<=10; n++) {
    let soma=0
    for (let i=0; i<n; i++) soma += Number(value[i]) * (n+1-i)
    if (Number(value[n]) !== ((soma*10)%11)%10) return false
  }
  return true
}
function validar(raw: unknown) {
  if (!raw || typeof raw!=='object' || Array.isArray(raw)) throw new Error('ENTRADA_INVALIDA')
  const data=raw as Record<string,unknown>
  const nome=String(data.nome||'').trim().replace(/\s+/g,' ')
  const cpf=String(data.cpf||'').replace(/\D/g,'')
  const nascimento=String(data.nascimento||'')
  const email=String(data.email||'').trim().toLowerCase()
  const telefone=String(data.telefone||'').replace(/\D/g,'')
  const perfil=String(data.perfil||'')
  const lojas=data.lojas
  const idempotencia=String(data.idempotencia||'')
  if (nome.length<5 || nome.length>140 || !nome.includes(' ') || !cpfValido(cpf)) throw new Error('COLABORADOR_INVALIDO')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) throw new Error('DATA_INVALIDA')
  const d=new Date(nascimento+'T12:00:00Z')
  if(Number.isNaN(d.valueOf()) || d.toISOString().slice(0,10)!==nascimento || d>new Date())throw new Error('DATA_INVALIDA')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254)throw new Error('EMAIL_INVALIDO')
  if (!/^\d{10,11}$/.test(telefone)) throw new Error('TELEFONE_INVALIDO')
  // Subperfil derivado no backend: nao aceitar escolha arbitraria do navegador.
  const subperfil=perfil==='CONSULTOR'?'CONSULTOR_2':perfil==='SUPERVISOR'?'SUPERVISOR_2':null
  if (!subperfil || (data.subperfil!==undefined && data.subperfil!==subperfil))
    throw new Error('PERFIL_OU_SUBPERFIL_INVALIDO')
  if (!Array.isArray(lojas) || lojas.length<1 || lojas.length>100 ||
      lojas.some(x=>typeof x!=='string'|| !/^\d+$/.test(x)) ||
      new Set(lojas).size!==lojas.length) throw new Error('LOJAS_INVALIDAS')
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencia))
    throw new Error('IDEMPOTENCIA_INVALIDA')
  return {nome,cpf,nascimento,email,telefone,perfil,subperfil,lojas:lojas as string[],idempotencia}
}

Deno.serve(async req => {
  const origin=req.headers.get('origin')
  if (req.method==='OPTIONS') return new Response(null,{status:204,headers:headers(origin)})
  if (req.method!=='POST') return result(405,{erro:'METODO_NAO_PERMITIDO'},origin)
  // Proibir origens web inesperadas. Clientes nao-web ainda dependem de JWT + UUID allowlist.
  if (origin && origin!==ALLOWED_ORIGIN) return result(403,{erro:'ORIGEM_NAO_PERMITIDA'},origin)
  const required=['DNA_CADASTRO_ALLOWED_USER_IDS','DNA_CADASTRO_AES_KEY_HEX',
    'DNA_CADASTRO_HMAC_KEY_HEX','DNA_CADASTRO_ALLOWED_ORIGIN',
    'SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']
  if(required.some(k=>!Deno.env.get(k)))return result(503,{erro:'RECURSO_NAO_HABILITADO'},origin)
  const bearer=req.headers.get('authorization')||''
  const jwt=/^Bearer\s+(.+)$/i.exec(bearer)?.[1]
  if (!jwt) return result(401,{erro:'AUTENTICACAO_OBRIGATORIA'},origin)
  const allowed=(Deno.env.get('DNA_CADASTRO_ALLOWED_USER_IDS')||'').split(',').map(s=>s.trim())
  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{
    auth:{persistSession:false,autoRefreshToken:false}
  })
  try {
    const {data:{user},error:authError}=await supabase.auth.getUser(jwt)
    if(authError||!user) return result(401,{erro:'SESSAO_INVALIDA'},origin)
    if(!allowed.includes(user.id)) return result(403,{erro:'ACESSO_ADMIN_NEGADO'},origin)
    if(Number(req.headers.get('content-length')||'0')>8000)return result(413,{erro:'REQUISICAO_GRANDE'},origin)
    const body=await req.text()
    if(body.length>8000)return result(413,{erro:'REQUISICAO_GRANDE'},origin)
    let validated
    try{validated=validar(JSON.parse(body))}catch{return result(400,{erro:'DADOS_INVALIDOS'},origin)}
    const aes=await crypto.subtle.importKey('raw',hexBytes(Deno.env.get('DNA_CADASTRO_AES_KEY_HEX')!),'AES-GCM',false,['encrypt'])
    const hmac=await crypto.subtle.importKey('raw',hexBytes(Deno.env.get('DNA_CADASTRO_HMAC_KEY_HEX')!),{name:'HMAC',hash:'SHA-256'},false,['sign'])
    const enc=new TextEncoder()
    const iv=crypto.getRandomValues(new Uint8Array(12))
    const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},aes,enc.encode(JSON.stringify(validated))))
    // payload no banco = IV(12 bytes) + ciphertext|tag (AES-GCM).
    const joined=new Uint8Array(iv.length+encrypted.length);joined.set(iv);joined.set(encrypted,iv.length)
    const digest=new Uint8Array(await crypto.subtle.sign('HMAC',hmac,enc.encode(validated.cpf)))
    const cpfHmac=Array.from(digest).map(x=>x.toString(16).padStart(2,'0')).join('')
    const {data,error}=await supabase.rpc('dna_cadastro_criar',{
      p_solicitante:user.id,p_idempotencia:validated.idempotencia,
      p_cpf_hmac:cpfHmac,p_cpf_final4:validated.cpf.slice(-4),
      p_lojas:validated.lojas,p_perfil:validated.perfil,p_cifra_base64:b64(joined)
    })
    if(error) {
      const code=['23505','42501','22023'].includes(error.code)?error.code:'FALHA'
      return result(code==='23505'?409:code==='42501'?403:400,{erro:code},origin)
    }
    return result(201,{id:data,status:'na_fila'},origin)
  } catch {
    return result(500,{erro:'ERRO_INTERNO'},origin)
  }
})
```

### `cadastro-dna/schema_seguro_v02.sql`
```sql
-- CADASTRO DNA V0.2: proposta transacional, NAO APLICAR em producao sem testes.
-- Integracao separada de dna_web_*; dados sensiveis cifrados na Edge Function.
-- Chaves AES/HMAC jamais sao armazenadas no banco.
begin;

create schema if not exists dna_cadastro_private;
revoke all on schema dna_cadastro_private from public, anon, authenticated;
grant usage on schema dna_cadastro_private to service_role;

-- Chave de liberacao: desligada por padrao, inclusive apos aplicar esquema.
create table if not exists public.dna_cadastro_config (
 chave text primary key,
 ativo boolean not null default false,
 atualizado_em timestamptz not null default now(),
 constraint dna_cadastro_config_chave check (chave='cadastro_ativo')
);
insert into public.dna_cadastro_config(chave,ativo) values('cadastro_ativo',false)
on conflict(chave) do nothing;
alter table public.dna_cadastro_config enable row level security;
revoke all on public.dna_cadastro_config from public,anon,authenticated;
grant select on public.dna_cadastro_config to authenticated;
grant select,insert,update on public.dna_cadastro_config to service_role;
drop policy if exists dna_cadastro_config_entrada on public.dna_cadastro_config;
create policy dna_cadastro_config_entrada on public.dna_cadastro_config
for select to authenticated using(true);

create table if not exists public.dna_cadastro_solicitacoes (
 id uuid primary key default gen_random_uuid(),
 solicitante_id uuid not null references auth.users(id),
 idempotencia uuid not null,
 cpf_hmac text not null check(cpf_hmac ~ '^[0-9a-f]{64}$'),
 cpf_final4 text not null check(cpf_final4 ~ '^[0-9]{4}$'),
 lojas text[] not null check(coalesce(array_length(lojas,1),0) between 1 and 100),
 perfil text not null check(perfil in ('CONSULTOR','SUPERVISOR')),
 subperfil text not null check(subperfil in ('CONSULTOR_2','SUPERVISOR_2')),
 constraint dna_cadastro_perfil_subperfil_oficial check (
   (perfil='CONSULTOR' and subperfil='CONSULTOR_2') or
   (perfil='SUPERVISOR' and subperfil='SUPERVISOR_2')
 ),
 status text not null default 'na_fila'
   check(status in ('na_fila','processando','aguardando_validacao','ativo','erro','revisao')),
 etapa text not null default 'fila',
 motivo_publico text,
 worker text,
 token_reserva uuid,
 reserva_ate timestamptz,
 validacao_inicio timestamptz,
 validacao_limite timestamptz,
 proxima_consulta timestamptz,
 tentativas smallint not null default 0 check(tentativas between 0 and 3),
 dna_usuario_id text,
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now(),
 unique(solicitante_id,idempotencia)
);
-- Evitar pedidos concorrentes para mesmo CPF, independentemente de solicitante.
create unique index if not exists dna_cadastro_cpf_unico
on public.dna_cadastro_solicitacoes(cpf_hmac);
-- Um CPF ja processado nao pode ser recadastrado automaticamente.
-- Reprocessamento futuro exige conciliacao e fluxo administrativo separado.

create table if not exists dna_cadastro_private.dna_cadastro_payloads (
 solicitacao_id uuid primary key references public.dna_cadastro_solicitacoes(id),
 cifra_base64 text not null check(length(cifra_base64) between 40 and 20000),
 criado_em timestamptz not null default now()
);

create table if not exists public.dna_cadastro_eventos (
 id bigint generated always as identity primary key,
 solicitacao_id uuid not null references public.dna_cadastro_solicitacoes(id),
 tipo text not null check(length(tipo) between 3 and 80),
 detalhe_publico text,
 criado_em timestamptz not null default now()
);

-- Auditoria append-only: nem worker pode editar/remover eventos.
create or replace function dna_cadastro_private.dna_cadastro_evento_imutavel()
returns trigger language plpgsql set search_path='' as $$
begin
 raise exception using errcode='42501',message='AUDITORIA_IMUTAVEL';
end;
$$;
drop trigger if exists trg_dna_cadastro_evento_imutavel on public.dna_cadastro_eventos;
create trigger trg_dna_cadastro_evento_imutavel before update or delete
on public.dna_cadastro_eventos for each row
execute function dna_cadastro_private.dna_cadastro_evento_imutavel();

alter table public.dna_cadastro_solicitacoes enable row level security;
alter table public.dna_cadastro_eventos enable row level security;
alter table dna_cadastro_private.dna_cadastro_payloads enable row level security;

revoke all on public.dna_cadastro_solicitacoes from public, anon, authenticated;
revoke all on public.dna_cadastro_eventos from public, anon, authenticated;
revoke all on dna_cadastro_private.dna_cadastro_payloads from public, anon, authenticated;
grant select on public.dna_cadastro_solicitacoes to authenticated;
grant select on public.dna_cadastro_eventos to authenticated;
grant select,insert,update on public.dna_cadastro_solicitacoes to service_role;
grant select,insert on public.dna_cadastro_eventos to service_role;
grant usage,select on sequence public.dna_cadastro_eventos_id_seq to service_role;
grant select,insert on dna_cadastro_private.dna_cadastro_payloads to service_role;

drop policy if exists dna_cadastro_ver_proprias on public.dna_cadastro_solicitacoes;
create policy dna_cadastro_ver_proprias on public.dna_cadastro_solicitacoes
for select to authenticated using (solicitante_id = (select auth.uid()));

drop policy if exists dna_cadastro_eventos_ver_proprios on public.dna_cadastro_eventos;
create policy dna_cadastro_eventos_ver_proprios on public.dna_cadastro_eventos
for select to authenticated using (
 exists(select 1 from public.dna_cadastro_solicitacoes s
 where s.id=solicitacao_id and s.solicitante_id=(select auth.uid()))
);

-- Ponto unico de criacao, chamado somente pelo service_role no endpoint seguro.
create or replace function public.dna_cadastro_criar(
 p_solicitante uuid, p_idempotencia uuid, p_cpf_hmac text, p_cpf_final4 text,
 p_lojas text[], p_perfil text, p_cifra_base64 text
) returns uuid language plpgsql security invoker set search_path = ''
as $$
declare v_id uuid; v_count integer; v_distinct_count integer;
begin
 if not exists(select 1 from public.dna_cadastro_config
               where chave='cadastro_ativo' and ativo=true) then
   raise exception using errcode='42501',message='CADASTRO_DESABILITADO';
 end if;
 if p_solicitante is null or p_idempotencia is null
    or p_cpf_hmac !~ '^[0-9a-f]{64}$' or p_cpf_final4 !~ '^[0-9]{4}$'
    or p_perfil not in ('CONSULTOR','SUPERVISOR')
    or length(p_cifra_base64) not between 40 and 20000
    or coalesce(array_length(p_lojas,1),0) not between 1 and 100 then
   raise exception using errcode='22023',message='PARAMETROS_INVALIDOS';
 end if;
 select count(distinct codigo) into v_count from public.franquias_mop
 where codigo=any(p_lojas) and ativo=true;
 select count(distinct loja.codigo) into v_distinct_count
 from unnest(p_lojas) as loja(codigo)
 where loja.codigo ~ '^[0-9]+$';
 if v_count<>array_length(p_lojas,1) or v_distinct_count<>array_length(p_lojas,1) then
   raise exception using errcode='42501',message='LOJA_INVALIDA';
 end if;
 -- NUNCA fazer ON CONFLICT por CPF. Conflito gera revisao/consulta, nao nova inclusao.
 insert into public.dna_cadastro_solicitacoes
 (solicitante_id,idempotencia,cpf_hmac,cpf_final4,lojas,perfil,subperfil)
 values(p_solicitante,p_idempotencia,p_cpf_hmac,p_cpf_final4,p_lojas,p_perfil,
   case p_perfil when 'CONSULTOR' then 'CONSULTOR_2' when 'SUPERVISOR' then 'SUPERVISOR_2' end)
 on conflict(solicitante_id,idempotencia) do nothing returning id into v_id;
 if v_id is null then
   select id into v_id from public.dna_cadastro_solicitacoes
   where solicitante_id=p_solicitante and idempotencia=p_idempotencia
     and cpf_hmac=p_cpf_hmac and lojas=p_lojas and perfil=p_perfil;
   if v_id is null then
     raise exception using errcode='23505',message='IDEMPOTENCIA_CONFLITANTE';
   end if;
   return v_id;
 end if;
 insert into dna_cadastro_private.dna_cadastro_payloads(solicitacao_id,cifra_base64)
 values(v_id,p_cifra_base64);
 insert into public.dna_cadastro_eventos(solicitacao_id,tipo,detalhe_publico)
 values(v_id,'criado','Solicitacao recebida; sem cadastro realizado no DNA.');
 return v_id;
end;
$$;

-- Reservar apenas novos itens. NUNCA reassumir processando expirado:
-- apos queda do Windows, escrita pode ter ocorrido e exige conciliacao manual.
create or replace function public.dna_cadastro_reservar(p_worker text)
returns table(id uuid, token uuid, cifra_base64 text, perfil text, subperfil text, lojas text[])
language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_token uuid := gen_random_uuid();
begin
 if length(coalesce(p_worker,'')) not between 3 and 100 then
  raise exception using errcode='22023',message='WORKER_INVALIDO';
 end if;
 select s.id into v_id from public.dna_cadastro_solicitacoes s
 where s.status='na_fila' order by s.criado_em
 limit 1 for update skip locked;
 if v_id is null then return; end if;
 update public.dna_cadastro_solicitacoes s set status='processando',
  etapa='reservado',worker=p_worker,token_reserva=v_token,
  reserva_ate=now()+interval '20 minutes',tentativas=s.tentativas+1,
  atualizado_em=now()
 where s.id=v_id;
 insert into public.dna_cadastro_eventos(solicitacao_id,tipo)
 values(v_id,'reservado');
 return query select s.id,v_token,p.cifra_base64,s.perfil,s.subperfil,s.lojas
 from public.dna_cadastro_solicitacoes s
 join dna_cadastro_private.dna_cadastro_payloads p on p.solicitacao_id=s.id
 where s.id=v_id;
end;
$$;

create or replace function public.dna_cadastro_finalizar(
 p_id uuid, p_token uuid, p_status text, p_etapa text, p_motivo_publico text default null
) returns boolean language plpgsql security invoker set search_path='' as $$
declare v_old text;
begin
 if p_status not in ('aguardando_validacao','ativo','erro','revisao')
 or length(coalesce(p_etapa,'')) not between 3 and 80
 or length(coalesce(p_motivo_publico,''))>240 then
   raise exception using errcode='22023',message='FINALIZACAO_INVALIDA';
 end if;
 select status into v_old from public.dna_cadastro_solicitacoes
 where id=p_id and token_reserva=p_token and status='processando' for update;
 if v_old is null then return false; end if;
 update public.dna_cadastro_solicitacoes set
 status=p_status,etapa=p_etapa,motivo_publico=p_motivo_publico,
 atualizado_em=now(),reserva_ate=null,token_reserva=null,
 validacao_inicio=case when p_status='aguardando_validacao' then coalesce(validacao_inicio,now()) else validacao_inicio end,
 validacao_limite=case when p_status='aguardando_validacao' then coalesce(validacao_limite,now()+interval '10 minutes') else validacao_limite end,
 proxima_consulta=case when p_status='aguardando_validacao' then now()+interval '30 seconds' else null end
 where id=p_id;
 insert into public.dna_cadastro_eventos(solicitacao_id,tipo,detalhe_publico)
 values(p_id,'finalizado',p_status);
 return true;
end;
$$;

-- Reserva de consulta nao causa nova inclusao; resultado incerto sempre requer revisao.
create or replace function public.dna_cadastro_reservar_validacao(p_worker text)
returns table(id uuid, token uuid, cifra_base64 text, perfil text, subperfil text, lojas text[],
 validacao_limite timestamptz)
language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_token uuid := gen_random_uuid();
begin
 if length(coalesce(p_worker,'')) not between 3 and 100 then
  raise exception using errcode='22023',message='WORKER_INVALIDO';
 end if;
 select s.id into v_id from public.dna_cadastro_solicitacoes s
 where s.status='aguardando_validacao' and s.proxima_consulta<=now()
 order by s.proxima_consulta limit 1 for update skip locked;
 if v_id is null then return; end if;
 update public.dna_cadastro_solicitacoes s set status='processando',etapa='validando',
 worker=p_worker,token_reserva=v_token,reserva_ate=now()+interval '5 minutes',
 atualizado_em=now() where s.id=v_id;
 insert into public.dna_cadastro_eventos(solicitacao_id,tipo)
 values(v_id,'consulta_reservada');
 return query select s.id,v_token,p.cifra_base64,s.perfil,s.lojas,s.validacao_limite
 from public.dna_cadastro_solicitacoes s
 join dna_cadastro_private.dna_cadastro_payloads p on p.solicitacao_id=s.id
 where s.id=v_id;
end;
$$;

-- Limpador conservador: nao reassume tarefa cujo worker caiu.
-- Uma escrita anterior pode ter sido efetivada.
create or replace function public.dna_cadastro_sinalizar_expirados()
returns integer language plpgsql security invoker set search_path='' as $$
declare v_total integer;
begin
 with changed as (
  update public.dna_cadastro_solicitacoes set status='revisao',
    etapa='reserva_expirada',
    motivo_publico='Execucao interrompida: conferir no DNA antes de qualquer novo cadastro.',
    token_reserva=null,reserva_ate=null,atualizado_em=now()
  where status='processando' and reserva_ate<now()
  returning id
 ), audited as (
  insert into public.dna_cadastro_eventos(solicitacao_id,tipo)
  select id,'reserva_expirada' from changed returning id
 ) select count(*) into v_total from audited;
 return v_total;
end;
$$;

-- O worker nao deve aceitar ATIVO sem verificacao independente do DNA.
-- O banco nao verifica a evidencia; esse gate adicional deve existir no worker
-- e ser testado antes da implantacao.
revoke all on function public.dna_cadastro_criar(uuid,uuid,text,text,text[],text,text) from public,anon,authenticated;
revoke all on function public.dna_cadastro_reservar(text) from public,anon,authenticated;
revoke all on function public.dna_cadastro_reservar_validacao(text) from public,anon,authenticated;
revoke all on function public.dna_cadastro_sinalizar_expirados() from public,anon,authenticated;
revoke all on function public.dna_cadastro_finalizar(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.dna_cadastro_criar(uuid,uuid,text,text,text[],text,text) to service_role;
grant execute on function public.dna_cadastro_reservar(text) to service_role;
grant execute on function public.dna_cadastro_reservar_validacao(text) to service_role;
grant execute on function public.dna_cadastro_sinalizar_expirados() to service_role;
grant execute on function public.dna_cadastro_finalizar(uuid,uuid,text,text,text) to service_role;

commit;
```

### `CADASTRO_DNA_PREPARAR_TESTE.bat`
```bat
@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo CADASTRO DNA - PREPARAR AMBIENTE ISOLADO
echo ==================================================
echo Nao modifica a versao funcional do robo e nao
echo conecta ao banco ou ao DNA.
echo.
if exist ".venv_cadastro_dna\Scripts\python.exe" goto instalar
where py >nul 2>&1
if %errorlevel%==0 (
 py -3 -m venv ".venv_cadastro_dna"
) else (
 python -m venv ".venv_cadastro_dna"
)
if errorlevel 1 goto falha
:instalar
".venv_cadastro_dna\Scripts\python.exe" -m pip install --disable-pip-version-check -r "worker\cadastro_dna\requirements.txt"
if errorlevel 1 goto falha
echo.
echo AMBIENTE PREPARADO. Proximo passo: CADASTRO_DNA_DIAGNOSTICO.bat
pause
exit /b 0
:falha
echo Falha ao preparar ambiente. Nenhum robo foi executado.
pause
exit /b 1
```

### `INICIAR_CADASTRO_DNA_TUDO_EM_UM.bat`
```bat
@echo off
setlocal
cd /d "%~dp0"
title CREDVIX - CADASTRO DNA - HOMOLOGACAO UNIFICADA
echo ============================================================
echo CREDVIX - CADASTRO DNA - TUDO EM UMA EXECUCAO
echo ============================================================
echo SOMENTE DIAGNOSTICO - NENHUM CADASTRO SERA REALIZADO.
echo.
set "PY=.venv_cadastro_dna\Scripts\python.exe"
if exist "%PY%" goto ambiente_pronto
echo [1/3] Preparando ambiente isolado pela primeira vez...
where py >nul 2>&1
if %errorlevel%==0 (
 py -3 -m venv ".venv_cadastro_dna"
) else (
 python -m venv ".venv_cadastro_dna"
)
if errorlevel 1 goto erro
"%PY%" -m pip install --disable-pip-version-check -r "worker\cadastro_dna\requirements.txt"
if errorlevel 1 goto erro
:ambiente_pronto
echo [2/3] Executando testes offline...
"%PY%" -m worker.cadastro_dna.agente --testes
if errorlevel 1 goto erro
echo.
echo [3/3] Abrindo Edge e mapeando Consultor 2 + Supervisor 2...
"%PY%" -m worker.cadastro_dna.homologacao_unificada
if errorlevel 1 goto erro
echo.
echo SUCESSO: Abra a pasta RELATORIOS_CADASTRO_DNA.
echo Envie os arquivos consultor2.json e supervisor2.json.
pause
exit /b 0
:erro
echo.
echo DIAGNOSTICO INTERROMPIDO. NAO CADASTRAR NINGUEM.
echo Se a pasta .venv foi criada parcialmente, execute este BAT novamente.
pause
exit /b 2
```

### `IDENTIFICAR_BOTAO_VALIDAR_CPF.bat`
```bat
@echo off
setlocal
cd /d "%~dp0"
title CREDVIX - MAPEAR TERCEIRO ICONE VALIDAR CPF
echo CREDVIX - INSPECAO DO TERCEIRO ICONE
echo NAO CLICA EM VALIDAR CPF.
set "PY=.venv_cadastro_dna\Scripts\python.exe"
if not exist "%PY%" (
 echo Ambiente Python ausente nesta pasta.
 echo Utilize a pasta do projeto onde os testes ja funcionaram.
 goto fim
)
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" (
 echo Microsoft Edge nao encontrado.
 goto fim
)
set "PROFILE=%LOCALAPPDATA%\Credvix\DNA_Diagnostico_Edge"
start "" "%EDGE%" --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --user-data-dir="%PROFILE%" "https://cadastro.help.com.br/"
echo Abra Usuario - Manutencao e deixe a barra com 7 icones visivel.
echo Pode ser usuario ja validado. Nao clique em nenhum icone.
pause
"%PY%" -m worker.cadastro_dna.inspecao_validar_cpf
if errorlevel 1 echo A estrutura nao foi localizada. Envie o resultado ou tela anonimizada.
echo Relatorio: RELATORIOS_CADASTRO_DNA\validar_cpf_terceiro_icone.json
:fim
pause
exit /b
```

### `.github/workflows/cadastro-dna-testes.yml`
```yaml
name: Cadastro DNA - testes offline
on:
  pull_request:
    paths:
      - "cadastro-dna/**"
      - "cadastro-colaboradores.html"
      - "css/cadastro-colaboradores.css"
      - "js/cadastro-colaboradores.js"
      - "js/mop-shell.js"
      - "worker/cadastro_dna/**"
      - ".github/workflows/cadastro-dna-testes.yml"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  testes-offline:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Instalar dependencias de teste
        run: python -m pip install --disable-pip-version-check "cryptography==46.0.4"
      - name: Testar estado, monitor e AES-GCM
        run: python -m unittest -v worker.cadastro_dna.test_estado worker.cadastro_dna.test_monitor worker.cadastro_dna.test_criptografia worker.cadastro_dna.test_sql_invariantes worker.cadastro_dna.test_perfis worker.cadastro_dna.test_formulario worker.cadastro_dna.test_homologacao_unificada worker.cadastro_dna.test_preflight_perfil worker.cadastro_dna.test_mapeamento_campos worker.cadastro_dna.test_fluxo_completo worker.cadastro_dna.test_guarda_validar_cpf worker.cadastro_dna.test_inspecao_validar_cpf
      - name: Validar sintaxe de scripts
        run: |
          node --check js/cadastro-colaboradores.js
          node --check js/mop-shell.js
          node --check cadastro-dna/formulario.js
      - name: Verificar alteracoes sem whitespace incorreto
        run: git diff --check
```

### `js/mop-shell.js`
```javascript
/* CREDVIX shared shell v2026-10-23-02 — presentation only, not authorization. */
(() => {
  'use strict';
  const CACHE_KEY = 'mop-ui-verified-user-v1';
  const MAX_AGE = 8 * 60 * 60 * 1000;
  const ADMIN_EMAIL = 'crm@credvix.com';
  const VERSION = 'v2026-10-23-02';
  const isDna = /(?:^|\/)perfis-dna\.html$/i.test(location.pathname);
  const routes = ['gestao', 'acompanhamento', 'auditoria'];
  const menu = Object.freeze([
    {id:'app',label:'Nova solicitação',icon:'⌂',href:'app.html'},
    {id:'history',label:'Histórico de emissões',icon:'◷',href:'historico.html'},
    {id:'help',label:'Ajuda',icon:'?',href:'app.html#ajuda'},
    {id:'cadastro',label:'Cadastro de colaboradores',icon:'+',href:'cadastro-colaboradores.html',admin:true},
    {id:'gestao',label:'Padronização DNA',icon:'◇',href:'perfis-dna.html#gestao',admin:true},
    {id:'acompanhamento',label:'Acompanhamento DNA',icon:'⌁',href:'perfis-dna.html#acompanhamento',admin:true},
    {id:'auditoria',label:'Histórico DNA',icon:'☰',href:'perfis-dna.html#auditoria',admin:true}
  ]);

  const normalize = value => String(value||'').trim().toLowerCase();
  function readCache() {
    try {
      const s = JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');
      if (!s || !s.email || Date.now()-s.when>=MAX_AGE || s.when>Date.now()) return null;
      return String(s.email);
    } catch (_) { return null; }
  }
  let cachedEmail = readCache();
  let displayEmail = cachedEmail;
  let verifiedEmail = null;
  const $ = selector => document.querySelector(selector);

  function route() {
    if (isCadastro) return 'cadastro';
    if (isDna) {
      const key=location.hash.slice(1).toLowerCase();
      return routes.includes(key)?key:'gestao';
    }
    const path=location.pathname.toLowerCase();
    if (path.endsWith('/historico.html')||path.endsWith('/pedido.html')) return 'history';
    return location.hash==='#ajuda'?'help':'app';
  }

  function menuItem(item) {
    const sameDocument=isDna&&routes.includes(item.id);
    const tag=sameDocument?'button':'a';
    const attributes=sameDocument?`type="button" data-target="${item.id}"`:`href="${item.href}"`;
    const current=item.id===route();
    const label=item.label;
    return `<${tag} class="mop-nav__item${sameDocument?' dna-side-link':''}${current?' is-active':''}" data-mop-route="${item.id}" ${attributes} title="${label}" aria-label="${label}"${current?' aria-current="page"':''}>
      <span class="mop-nav__icon" aria-hidden="true">${item.icon}</span>
      <span class="mop-nav__label">${label}</span>
      ${item.id==='gestao'?'<span class="mop-nav__badge" aria-hidden="true">🔒</span>':''}
    </${tag}>`;
  }

  function renderSidebar() {
    const host=$('[data-mop-shell-sidebar]');
    if (!host) return;
    const adminCached=normalize(displayEmail)===ADMIN_EMAIL;
    host.innerHTML=`
      <div class="mop-nav__backdrop" data-mop-nav-dismiss aria-hidden="true"></div>
      <div class="mop-nav__panel" id="mop-nav-panel">
        <a class="mop-nav__brand" href="app.html" aria-label="CREDVIX — início"><span>CRED</span><strong>VIX</strong></a>
        <div class="mop-nav__product"><strong>MOP - CNC</strong><span>Sistema de Emissões</span></div>
        <nav class="mop-nav__links" aria-label="Emissões">${menu.filter(item=>!item.admin).map(menuItem).join('')}</nav>
        <section class="mop-nav__admin" ${adminCached?'':'hidden'} aria-label="Administração">
          <h2 class="mop-nav__section">ADMINISTRAÇÃO</h2>
          <nav class="mop-nav__links" aria-label="Administração">${menu.filter(item=>item.admin).map(menuItem).join('')}</nav>
        </section>
        <div class="mop-nav__footer"><span class="mop-nav__status" aria-hidden="true"></span><span>~by: fraquinn.<small>${VERSION}</small></span></div>
      </div>`;
    host.querySelector('[data-mop-nav-dismiss]').addEventListener('click',closeDrawer);
    host.querySelectorAll('.mop-nav__item').forEach(link=>{
      link.addEventListener('click',()=>{if(window.matchMedia('(max-width: 639px)').matches)closeDrawer();});
    });
  }

  function renderTopbar() {
    const el=$('[data-mop-shell-topbar]');
    if (!el) return;
    el.innerHTML=`
      <div class="mop-topbar__leading">
        <button class="mop-nav__toggle" type="button" aria-controls="mop-nav-panel" aria-expanded="false" aria-label="Abrir menu" title="Abrir menu"><span aria-hidden="true">☰</span></button>
        <p class="breadcrumb" id="${isDna?'dnaBreadcrumb':'mopBreadcrumb'}"></p>
      </div>
      <div class="topbar-actions mop-topbar-actions">
        <div class="user-chip mop-user-chip" aria-live="polite">
          <span class="avatar" aria-hidden="true">CV</span>
          <div class="mop-identity"><strong id="userName"></strong><small id="mopUserSubtitle">Identidade em verificação</small></div>
        </div>
        <button class="button button--ghost button--sm" id="logoutButton" type="button">Sair</button>
      </div>`;
    const toggle=$('.mop-nav__toggle');
    toggle?.addEventListener('click',()=>document.body.classList.contains('mop-nav--open')?closeDrawer():openDrawer());
    setDisplayedUser(displayEmail);
    syncRoute();
  }

  function setDisplayedUser(email) {
    const node=$('#userName'),sub=$('#mopUserSubtitle');
    if (node) node.textContent=email||'Verificando acesso…';
    if (sub) sub.textContent=email
      ? (normalize(email)===ADMIN_EMAIL?'Administrador • acesso exclusivo':'Usuário autenticado')
      : 'Identidade em verificação';
  }

  function syncRoute() {
    const current=route();
    document.querySelectorAll('.mop-nav__item').forEach(el=>{
      const active=el.dataset.mopRoute===current;
      el.classList.toggle('is-active',active);
      if(active)el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current');
    });
    const crumb=$(`#${isDna?'dnaBreadcrumb':'mopBreadcrumb'}`);
    const active=$('.mop-nav__item[aria-current="page"] .mop-nav__label');
    if(crumb)crumb.textContent='Início › '+(active?.textContent||'Nova solicitação');
  }

  function openDrawer() {
    document.body.classList.add('mop-nav--open');
    const toggle=$('.mop-nav__toggle');
    if(toggle){toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Fechar menu');}
    const first=$('.mop-nav__item[aria-current="page"]')||$('.mop-nav__item');
    first?.focus({preventScroll:true});
  }
  function closeDrawer() {
    const wasOpen=document.body.classList.contains('mop-nav--open');
    document.body.classList.remove('mop-nav--open');
    const toggle=$('.mop-nav__toggle');
    if(toggle){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menu');}
    if(wasOpen)toggle?.focus({preventScroll:true});
  }

  function setUser(user) {
    const email=typeof user==='string'?user:user?.email;
    if(!email)return;
    verifiedEmail=email;displayEmail=email;cachedEmail=email;
    try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({email,when:Date.now()}));}catch(_){}
    setDisplayedUser(email);
    const admin=$('.mop-nav__admin');
    if(admin)admin.hidden=normalize(email)!==ADMIN_EMAIL;
    document.documentElement.classList.remove('mop-shell-loading');
    if(document.body.classList.contains('mop-nav--open'))closeDrawer();
  }
  function clearUser() {
    verifiedEmail=null;cachedEmail=null;displayEmail=null;
    try{sessionStorage.removeItem(CACHE_KEY);}catch(_){}
    const admin=$('.mop-nav__admin');if(admin)admin.hidden=true;
    closeDrawer();setDisplayedUser(null);
  }

  function bootstrap() {
    renderSidebar();renderTopbar();syncRoute();
    if(cachedEmail)document.documentElement.classList.remove('mop-shell-loading');
    const logout=$('#logoutButton');
    if(logout){
      logout.addEventListener('click',clearUser,{capture:true});
      if(isDna||isCadastro)logout.addEventListener('click',async()=>{await window.MOP_SUPABASE.auth.signOut({scope:'local'});location.replace('index.html');});
    }
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&document.body.classList.contains('mop-nav--open')){event.preventDefault();closeDrawer();}
      if(event.key==='Tab'&&document.body.classList.contains('mop-nav--open')){
        const focusables=[...document.querySelectorAll('.mop-nav__panel a,.mop-nav__panel button')].filter(x=>!x.closest('[hidden]'));
        if(!focusables.length)return;
        const first=focusables[0],last=focusables[focusables.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    window.matchMedia('(min-width: 640px)').addEventListener?.('change',closeDrawer);
    window.addEventListener('hashchange',()=>{syncRoute();closeDrawer();});
  }
  window.MOP_SHELL={VERSION,menu,route,syncRoute,setUser,clearUser,closeDrawer};
  if($('[data-mop-shell-sidebar]'))bootstrap();
  else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap,{once:true});
  else bootstrap();
})();
```

### `.gitignore`
```text
.env
.env.*
!.env.example
*.log
.DS_Store
Thumbs.db
runtime/
secrets/
credentials/

# DNA RPA local: nunca publicar credenciais, listas ou capturas
worker/dna_local_references/
worker/resultados/
worker/*state*.json
worker/*session*.json
worker/nomes.txt

# Cadastro DNA piloto isolado (.venv e diagnosticos locais)
.venv_cadastro_dna/
diagnostico_cadastro_dna_estrutura.json

diagnostico_cadastro_dna_campos.json

RELATORIOS_CADASTRO_DNA/
```

