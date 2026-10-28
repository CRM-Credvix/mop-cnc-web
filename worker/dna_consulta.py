"""Consulta DNA por CPF, escolha conservadora da conta e validacao antes da leitura.

NUNCA escreve configuracoes ou clica em Gravar. Busca na tela ja aberta,
seleciona Editar apenas com seletor semanticamente identificado, e verifica
CPF, nome e login novamente na manutencao. Dados identificaveis ficam em RAM.
"""
from __future__ import annotations
import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from cpf_dna import cpf_valido
from dna_diagnostico import _verify_local_cdp, allowed_url, UnsafePage

BASE = Path(__file__).resolve().parent
FORM_JS = BASE / 'dna_pesquisa_dom.js'
ROWS_JS = BASE / 'dna_resultados_dom.js'
MAINT_JS = BASE / 'dna_manutencao_identidade.js'


def digits(s: str) -> str:
    return re.sub(r'\D', '', s or '')


def normalized(s: str) -> str:
    return ' '.join(''.join(x for x in unicodedata.normalize('NFKD', str(s or ''))
                            if not unicodedata.combining(x)).casefold().split())


def login_base(login: str) -> tuple[str, str] | None:
    """Base CPF com pontuacao opcional; extensao `_n` nao e parte do CPF.

    Nao remove pontuacao de forma indiscriminada: preserva sufixos para distinguir contas.
    """
    if not isinstance(login, str):
        return None
    value = login.strip()
    m = re.fullmatch(r'(\d{3}(?:\.?\d{3}){2}-?\d{2}|\d{11})(_[1-9]\d*)?', value)
    if not m:
        return None
    base = digits(m.group(1))
    return (base, m.group(2) or '') if len(base)==11 else None


def decide_account(rows: list[dict], *, cpf: str, nome: str = '', login: str = '', total: int | None = None,
                   pagination: bool = False) -> dict:
    """Result never selects by order or assumed rarity of duplicates."""
    cpf=digits(cpf)
    if not cpf_valido(cpf):
        return {'status':'cpf_invalido'}
    if not isinstance(rows,list) or total is None or pagination or len(rows)!=total:
        return {'status':'resultado_incompleto','encontrados_na_pagina':len(rows) if isinstance(rows,list) else 0}
    matches=[]
    for row in rows:
        if not isinstance(row,dict):continue
        base=login_base(row.get('usuario',''))
        if not base or base[0]!=cpf:continue
        if nome and normalized(row.get('nome'))!=normalized(nome):continue
        matches.append(row)
    if not matches:return {'status':'nao_encontrado','contas_mesmo_cpf':0}
    active=[r for r in matches if normalized(r.get('situacao'))=='ativo']
    if login:
        active=[r for r in active if r.get('usuario','').strip()==login.strip()]
    if not active:
        return {'status':'somente_inativas_ou_login_ausente','contas_mesmo_cpf':len(matches)}
    if len(active)!=1:
        return {'status':'multiplas_contas_ativas','contas_mesmo_cpf':len(matches),'ativas':len(active)}
    row=active[0]
    if row.get('editar_index') is None or row.get('editar_ambiguo'):
        return {'status':'editar_nao_identificado','contas_mesmo_cpf':len(matches)}
    return {'status':'conta_unica_ativa','contas_mesmo_cpf':len(matches),'selecionado':row}


def check_maintenance(expected: dict, current: dict, cpf: str, nome: str = '') -> dict:
    cpf=digits(cpf)
    if not current.get('tela_manutencao'):
        return {'status':'tela_incorreta'}
    cpfs=current.get('cpf') or []
    logins=current.get('login') or []
    names=current.get('nome') or []
    if len(set(digits(x) for x in cpfs))!=1 or digits(cpfs[0])!=cpf:
        return {'status':'cpf_divergente_ou_ausente'}
    if len(set(logins))!=1 or logins[0]!=expected.get('usuario',''):
        return {'status':'login_divergente_ou_ausente'}
    if not names or len(set(normalized(n) for n in names))!=1:
        return {'status':'nome_ausente_ou_ambiguo'}
    exp_name=nome or expected.get('nome','')
    if normalized(names[0])!=normalized(exp_name):
        return {'status':'nome_divergente'}
    return {'status':'trinca_consistente_na_tela'}


def _one_frame(browser, script: str):
    frames=[]
    for context in browser.contexts:
        for page in context.pages:
            if not allowed_url(page.url):continue
            for frame in page.frames:
                if not allowed_url(frame.url):continue
                d=frame.evaluate(script)
                if d.get('tela_consulta'):
                    frames.append((page,frame,d))
    if len(frames)!=1:raise UnsafePage('Abra uma unica aba na tela Consulta de Usuarios do DNA.')
    return frames[0]


def pesquisar_e_abrir(cdp_uri: str, cpf: str, nome: str = '', login: str = '') -> dict:
    """Operacao local; nao grava CPF/login no resultado retornado."""
    _verify_local_cdp(cdp_uri)
    if not cpf_valido(digits(cpf)):
        return {'status':'cpf_invalido'}
    from playwright.sync_api import sync_playwright
    with sync_playwright() as playwright:
        browser=playwright.chromium.connect_over_cdp(cdp_uri)
        try:
            page,frame,fields=_one_frame(browser, FORM_JS.read_text(encoding='utf-8'))
            if fields.get('cpf_input_index') is None or fields.get('cpf_input_ambiguo'):
                return {'status':'campo_cpf_nao_identificado'}
            cpf_input=frame.locator('input:not([type="hidden"]):not([type="password"])').nth(fields['cpf_input_index'])
            cpf_input.fill(digits(cpf))
            if fields.get('submit_index') is None or fields.get('submit_ambiguo'):
                return {'status':'pesquisa_manual_necessaria'}
            frame.locator('button,input[type="submit"],a[role="button"]').nth(fields['submit_index']).click(timeout=10000)
            page.wait_for_timeout(900)
            if not allowed_url(page.url):raise UnsafePage('O DNA navegou para dominio nao autorizado.')
            rows=frame.evaluate(ROWS_JS.read_text(encoding='utf-8'))
            if not rows.get('resultado_identificado'):
                return {'status':'tabela_resultados_nao_identificada'}
            result=decide_account(rows['rows'],cpf=cpf,nome=nome,login=login,
                                  total=rows.get('total_resultados'),pagination=rows.get('paginacao_visivel'))
            if result['status']!='conta_unica_ativa':return result
            expected=result.pop('selecionado')
            before=frame.evaluate(ROWS_JS.read_text(encoding='utf-8'))
            if before.get('rows')!=rows.get('rows'):
                return {'status':'resultado_alterou_antes_de_editar'}
            table=frame.locator('table').nth(rows['table_index'])
            row=table.locator('tbody tr').nth(expected['row_index'])
            row.locator('td').nth(rows['acoes_col_index']).locator('button,a,[role="button"]').nth(expected['editar_index']).click(timeout=10000)
            page.wait_for_timeout(600)
            if not allowed_url(page.url):raise UnsafePage('A manutencao saiu do dominio autorizado.')
            readings=[]
            script=MAINT_JS.read_text(encoding='utf-8')
            for i in range(2):
                if i:page.wait_for_timeout(350)
                candidates=[]
                for fr in page.frames:
                    if allowed_url(fr.url):
                        data=fr.evaluate(script)
                        if data.get('tela_manutencao'):candidates.append(data)
                if len(candidates)!=1:return {'status':'manutencao_nao_identificada'}
                readings.append(candidates[0])
            if readings[0]!=readings[1]:return {'status':'cadastro_mudou_durante_leitura'}
            check=check_maintenance(expected,readings[1],cpf,nome)
            return {'status':check['status'],'contas_mesmo_cpf':result['contas_mesmo_cpf'],
                    'filtro_nome_usado':bool(nome),'login_exato_usado':bool(login)}
        finally:
            browser.close()