"""Fila de CONFERENCIA DNA, nunca aplica permissoes.

A chave service_role fica exclusivamente no Windows (WinVault) ou ambiente do worker.
So usa RPCs autorizadas pela migration do MOP-CNC; nao move plaintext para JSON.
"""
from __future__ import annotations

from getpass import getpass
import os
import re
import uuid
from urllib.parse import urlsplit

from dna_acesso import _vault, voltar_consulta
from dna_consulta import pesquisar_e_abrir
from iniciar_assistido import make_report, read_reference, save_report

SUPABASE_URL = 'https://ijcqgitluzefphomkkmo.supabase.co'
WORKER_SERVICE = 'CREDVIX_DNA_FILA_WORKER_SUPABASE_V1'
PROFILE = {'CONSULTOR', 'SUPERVISOR'}


class FilaError(RuntimeError):
    pass


def worker_key():
    env = os.environ.get('DNA_SUPABASE_WORKER_KEY', '').strip()
    if env:
        return validate_key(env), None
    vault = _vault()
    if not vault:
        raise FilaError('O modo Fila requer Windows Credential Manager. Configure uma chave secreta somente no worker.')
    record = vault.get_credential(WORKER_SERVICE, None)
    if record and record.password:
        return validate_key(record.password), None
    print('A fila exige uma Secret API Key do Supabase apenas neste computador.')
    print('Nunca informe a chave no site publico, GitHub ou nesta conversa.')
    key = validate_key(getpass('Chave secreta do worker: ').strip())
    return key, vault


def validate_key(key):
    if not isinstance(key, str) or len(key)>2500 or not (key.startswith('sb_secret_') or re.fullmatch(r'eyJ[A-Za-z0-9_.-]{80,}',key)):
        raise FilaError('Apenas Secret API Key (sb_secret_) ou JWT service_role legado sao aceitos.')
    return key


def _post_rpc(key, name, params, session=None):
    import requests
    if name not in {'dna_reservar_consulta', 'dna_finalizar_consulta'}:
        raise FilaError('RPC nao autorizada para o worker DNA.')
    headers={'apikey':key,'Content-Type':'application/json'}
    if key.startswith('eyJ'):
        headers['Authorization']='Bearer '+key
    endpoint=SUPABASE_URL+'/rest/v1/rpc/'+name
    if urlsplit(endpoint).hostname!='ijcqgitluzefphomkkmo.supabase.co':
        raise FilaError('Endereco de destino inesperado.')
    sender = session or requests
    try:
        response=sender.post(endpoint,json=params,headers=headers,timeout=(6,35),allow_redirects=False)
    except (requests.RequestException,OSError) as exc:
        raise FilaError('Nao foi possivel consultar a fila Supabase; conexao indisponivel.') from exc
    if response.status_code!=200:
        # Nunca imprime response.text: pode conter dados pessoais nos erros.
        raise FilaError(f'RPC {name} indisponivel (HTTP {response.status_code}). Verifique chave, grants e conexao.')
    try:return response.json()
    except ValueError as exc:raise FilaError('Resposta da fila nao era JSON valido.') from exc


def _safe_item(raw):
    if not isinstance(raw,dict) or not all(raw.get(x) for x in ('item_id','lote_id','cpf','nome','perfil','token')):
        raise FilaError('Reserva incompleta; nao executar consulta.')
    for field in ('item_id','lote_id','token'):
        try:uuid.UUID(str(raw[field]))
        except (TypeError,ValueError) as exc:raise FilaError('ID de reserva invalido.') from exc
    if raw['perfil'] not in PROFILE:raise FilaError('Perfil inesperado na reserva.')
    if not re.fullmatch(r'\d{11}',str(raw['cpf'])):raise FilaError('CPF invalido na reserva.')
    return raw


def _status(result):
    status=result.get('status','')
    if status=='trinca_consistente_na_tela':return 'consulta_confirmada'
    if status=='multiplas_contas_ativas':return 'duplicidade'
    if status=='nao_encontrado':return 'nao_encontrado'
    return 'revisao'


def executar_fila(cdp_uri: str, *, limite: int = 10, rpc=_post_rpc, wait=input):
    """Executa itens reservados ate o limite, no mesmo Edge autenticado.
    Nao interage com o editor de permissoes; so leitura e relatorio local.
    """
    key,to_save=worker_key()
    worker_name='CREDVIX-DNA-WIN'
    processed=0
    for _ in range(max(1,min(50,limite))):
        claimed=rpc(key,'dna_reservar_consulta',{'p_worker':worker_name})
        if not claimed:
            print('Sem solicitacoes pendentes na fila DNA.')
            break
        if not isinstance(claimed,list) or len(claimed)!=1:
            raise FilaError('Fila retornou quantidade inesperada; interrompendo.')
        item=_safe_item(claimed[0])
        outcome='revisao'
        observation='Analise interrompida; revisar no DNA.'
        try:
            voltar_consulta(cdp_uri)
            result=pesquisar_e_abrir(cdp_uri,item['cpf'],item['nome'],item.get('login') or '',
                                    solicitar_edicao_manual=lambda _: 'S')
            outcome=_status(result)
            observation='Consulta sem confirmacao: '+str(result.get('status','desconhecido')).replace('_',' ')[:110]
            if outcome=='consulta_confirmada':
                profile=item['perfil']
                report=make_report(read_reference(profile),cdp_uri)
                report['identidade_evidencia']['consulta_previa']={
                    'resultado':'trinca_consistente_na_tela',
                    'contas_mesmo_cpf':result.get('contas_mesmo_cpf'),
                    'cpf_nome_login_conferidos_na_tela':True,
                    'identidade_externa_homologada':False,
                }
                path=save_report(report,profile)
                observation=f"Leitura 227 controles; divergencias {report['divergencias_total']}; identidade externa nao homologada."
                print('Relatorio somente leitura:',path.name)
        except Exception as exc:
            outcome='revisao'
            observation='Erro tecnico durante conferencia ('+type(exc).__name__+').'
            print('Conferencia interrompida por erro tecnico; encaminhada para revisao.')
        completed=rpc(key,'dna_finalizar_consulta',{
            'p_item':str(item['item_id']),'p_token':str(item['token']),
            'p_resultado':outcome,'p_observacao':observation[:200]})
        if completed is not True:raise FilaError('O Supabase nao confirmou conclusao do item.')
        if to_save:
            to_save.set_password(WORKER_SERVICE,'worker',key)
            to_save=None
        print('Item finalizado na fila:',outcome,'| Nenhuma permissao alterada.')
        processed+=1
    return processed