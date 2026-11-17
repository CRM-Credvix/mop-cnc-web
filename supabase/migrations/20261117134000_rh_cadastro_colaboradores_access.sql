create policy "rh_cadastro_catalogo_lojas"
on public.franquias_mop
for select
to authenticated
using (
  ativo = true
  and lower(coalesce((select auth.jwt()->>'email'), '')) = 'rh@credvix.com'
);

drop policy if exists dna_cadastro_conexao_insert on public.dna_cadastro_conexao_testes;
create policy dna_cadastro_conexao_insert
on public.dna_cadastro_conexao_testes
for insert
to authenticated
with check (
  solicitante_id = (select auth.uid())
  and lower(coalesce((select auth.jwt()->>'email'), ''))
      in ('crm@credvix.com','rh@credvix.com')
  and tipo = 'ping'
  and status = 'pendente'
  and etapa = 'aguardando_robo'
  and recebido_em is null
);

drop policy if exists dna_cadastro_conexao_select on public.dna_cadastro_conexao_testes;
create policy dna_cadastro_conexao_select
on public.dna_cadastro_conexao_testes
for select
to authenticated
using (
  solicitante_id = (select auth.uid())
  and lower(coalesce((select auth.jwt()->>'email'), ''))
      in ('crm@credvix.com','rh@credvix.com')
);
