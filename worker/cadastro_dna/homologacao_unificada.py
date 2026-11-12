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
