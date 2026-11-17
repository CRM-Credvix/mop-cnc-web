alter policy mop_franquias_select
on public.franquias_mop
using (
  codigo in (select mop_private.lojas_permitidas())
  or (
    ativo = true
    and lower(coalesce((select auth.jwt()->>'email'), '')) = 'rh@credvix.com'
  )
);

drop policy if exists rh_cadastro_catalogo_lojas on public.franquias_mop;
