-- NAO APLICAR AUTOMATICAMENTE NO SUPABASE DE PRODUCAO.
-- Metadados e acesso aos resultados das MultiExtracoes, sem alterar
-- pedidos_mop/arquivos_mop do modulo CNC.
-- Aplicar somente no cutover, apos revisao de politicas e armazenamento.

create table if not exists public.arquivos_extracoes_mop (
    id uuid primary key default gen_random_uuid(),
    pedido_id bigint not null unique references public.pedidos_extracoes_mop(id),
    nome text not null check (length(nome) between 1 and 240),
    storage_path text not null unique
      check (storage_path like 'extracoes/%' and position('..' in storage_path) = 0),
    sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
    tamanho_bytes bigint not null check (tamanho_bytes > 0),
    criado_em timestamptz not null default now()
);

alter table public.arquivos_extracoes_mop enable row level security;
revoke all on table public.arquivos_extracoes_mop from public,anon,authenticated;
grant select on table public.arquivos_extracoes_mop to authenticated;
drop policy if exists "extracoes_arquivos_select_owner" on public.arquivos_extracoes_mop;
create policy "extracoes_arquivos_select_owner"
  on public.arquivos_extracoes_mop for select to authenticated
  using (
    exists (
      select 1 from public.pedidos_extracoes_mop p
       where p.id = pedido_id
         and p.user_id = (select auth.uid())
         and p.status = 'validado'
         and p.franquia_codigo in
               (select mop_private.extracoes_lojas_permitidas())
    )
  );

-- Nao permitir que usuarios publiquem objetos. Apenas worker server-side.
-- Bucket mop-arquivos ja existente e privado.
drop policy if exists "extracoes_objeto_select_owner" on storage.objects;
create policy "extracoes_objeto_select_owner"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'mop-arquivos'
    and name like 'extracoes/%'
    and exists (
      select 1
        from public.arquivos_extracoes_mop a
        join public.pedidos_extracoes_mop p on p.id = a.pedido_id
       where a.storage_path = name
         and p.user_id = (select auth.uid())
         and p.status = 'validado'
         and p.franquia_codigo in
               (select mop_private.extracoes_lojas_permitidas())
    )
  );
