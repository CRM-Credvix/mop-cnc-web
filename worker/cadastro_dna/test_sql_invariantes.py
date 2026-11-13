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

    def test_reserva_validacao_retorna_todas_as_sete_colunas(self):
        self.assertIn(
            "return query select s.id,v_token,p.cifra_base64,s.perfil,s.subperfil,s.lojas,s.validacao_limite",
            SQL,
        )

    def test_eventos_append_only(self):
        self.assertIn("trg_dna_cadastro_evento_imutavel",SQL)
        self.assertIn("grant select,insert on public.dna_cadastro_eventos",SQL)


if __name__=="__main__":
    unittest.main()
