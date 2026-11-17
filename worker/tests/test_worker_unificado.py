"""Testes sem rede, sem Supabase, sem subprocessos reais."""
import importlib.util
import os
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

SRC = Path(__file__).resolve().parents[1] / "worker_unificado.py"
spec = importlib.util.spec_from_file_location("worker_unificado", SRC)
w = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w)


class WorkerUnificadoOfflineTests(unittest.TestCase):
    def config(self):
        return {
            "url":"https://example.supabase.co", "secret":"SOMENTE_FAKE",
            "cnc":Path("falso_cnc.py"), "multi":Path("falso_multi.py"),
            "python":Path(sys.executable), "poll":10, "timeout":60,
            "worker_id":"TESTE-WORKER",
        }

    def test_preflight_falha_se_extrator_nao_existe(self):
        self.assertFalse(w.preflight(self.config()))

    def test_execucao_bloqueada_sem_flag_de_ativacao(self):
        with patch.object(w, "env", return_value=self.config()), \
             patch.object(w, "preflight", return_value=True), \
             patch.dict(os.environ, {"ENABLE_UNIFIED_WORKER":"NAO"}), \
             patch.object(sys, "argv", ["worker_unificado.py","--execute","--once"]):
            self.assertEqual(w.main(), 3)

    def test_preflight_nao_aciona_claim(self):
        with patch.object(w, "env", return_value=self.config()), \
             patch.object(w, "preflight", return_value=True), \
             patch.object(sys, "argv", ["worker_unificado.py","--preflight"]), \
             patch.object(w, "rpc") as rpc:
            self.assertEqual(w.main(), 0)
            rpc.assert_not_called()

    def test_cnc_reutiliza_comando_legado(self):
        db = object()
        job={"id":12,"franquia_codigo":"51545","whatsapp":"5527999999999"}
        calls=[]
        def rpc(_db,name,**kwargs):
            calls.append((name,kwargs))
            return True
        with patch.object(w,"rpc",side_effect=rpc), \
             patch.object(w,"execute_process",return_value=subprocess.CompletedProcess([],0,"","")) as p:
            w.process_cnc(db,self.config(),job)
            argv=p.call_args.args[0]
            self.assertEqual(argv[2:],[ "--franquia","51545","--whatsapp","5527999999999"])
            self.assertEqual(calls[-1][0],"finish_mop")
            self.assertTrue(calls[-1][1]["p_success"])

    def test_multi_produto_desconhecido_falha_fechada(self):
        job={"id":13,"produto":"NAO_EXISTE"}
        with patch.object(w, "rpc") as rpc:
            with self.assertRaises(ValueError):
                w.process_multi(object(),self.config(),job)
            rpc.assert_not_called()

    def test_dispatch_rejeita_origem_desconhecida(self):
        with self.assertRaises(ValueError):
            w.process(object(),self.config(),{"origem":"outro","pedido":{"id":1}})


if __name__ == "__main__":
    unittest.main()
