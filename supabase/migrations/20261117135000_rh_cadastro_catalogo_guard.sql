alter policy mop_franquias_guard
on public.franquias_mop
using (
  codigo in (select mop_private.lojas_permitidas())
  or (
    ativo = true
    and lower(coalesce((select auth.jwt()->>'email'), '')) = 'rh@credvix.com'
  )
);
