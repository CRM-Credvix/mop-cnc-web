-- PROPOSTA DE MIGRACAO: NAO APLICADA EM PRODUCAO.
-- Sem CPF em texto claro; nenhuma permissao de gravacao pelo cliente web.
-- Revisar com modelo de autenticacao e modelo de chaves antes de aplicar.

create table if not exists public.dna_cadastro_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  solicitante_id uuid not null references auth.users(id),
  chave_idempotencia uuid not null,
  status text not null default 'na_fila'
    check (status in ('na_fila','processando','aguardando_validacao','ativo','erro','revisao')),
  etapa text not null default 'aguardando',
  total_lojas integer not null check (total_lojas between 1 and 100),
  tentativas smallint not null default 0 check (tentativas between 0 and 3),
  motivo_publico text,
  dna_usuario_id text,
  reservado_por text,
  reserva_ate timestamptz,
  proxima_consulta timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(solicitante_id, chave_idempotencia)
);

create table if not exists public.dna_cadastro_eventos (
  id bigint generated always as identity primary key,
  solicitacao_id uuid not null references public.dna_cadastro_solicitacoes(id),
  tipo text not null check (char_length(tipo) between 3 and 80),
  detalhe_publico text,
  criado_em timestamptz not null default now()
);

alter table public.dna_cadastro_solicitacoes enable row level security;
alter table public.dna_cadastro_eventos enable row level security;

-- Defesa padrao: nenhuma politica de INSERT/UPDATE/DELETE para browser.
revoke all on public.dna_cadastro_solicitacoes from anon, authenticated;
revoke all on public.dna_cadastro_eventos from anon, authenticated;
grant select on public.dna_cadastro_solicitacoes to authenticated;
grant select on public.dna_cadastro_eventos to authenticated;

drop policy if exists dna_cadastro_solicitacoes_ver_proprias on public.dna_cadastro_solicitacoes;
create policy dna_cadastro_solicitacoes_ver_proprias
on public.dna_cadastro_solicitacoes for select to authenticated
using ((select auth.uid()) = solicitante_id);

drop policy if exists dna_cadastro_eventos_ver_proprios on public.dna_cadastro_eventos;
create policy dna_cadastro_eventos_ver_proprios
on public.dna_cadastro_eventos for select to authenticated
using (exists (
  select 1 from public.dna_cadastro_solicitacoes s
  where s.id = solicitacao_id and s.solicitante_id = (select auth.uid())
));

-- PENDENTE: tabelas privadas de dados cifrados, RPC de criacao autorizada,
-- reserva atomica por worker, finalizacao com token e restricoes append-only.
-- Nao acionar worker com esse esquema incompleto.
