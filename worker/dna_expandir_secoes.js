() => {
  'use strict';
  // Somente expansores sem campos de dados e vinculados a titulos conhecidos.
  const normalize = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g, ' ').trim();
  const allowed = new Set(['funcoes help','funcoes consig','funcoes para utilizacao do sistema','acesso a telas']);
  const selectors = ['button[aria-expanded="false"]','[role="button"][aria-expanded="false"]',
    'a[aria-expanded="false"]','a[data-toggle="collapse"].collapsed','a[data-bs-toggle="collapse"].collapsed',
    'button[data-toggle="collapse"].collapsed','button[data-bs-toggle="collapse"].collapsed'];
  const matches = [...new Set(document.querySelectorAll(selectors.join(',')))];
  const expanded = [];
  for (const element of matches) {
    if (expanded.length >= 8) break;
    if (!element.isConnected || element.matches('input,label,select,textarea')) continue;
    if (element.querySelector('input,select,textarea')) continue;
    const title = normalize(element.textContent || element.getAttribute('aria-label'));
    if (!allowed.has(title)) continue;
    const href = element.getAttribute('href');
    if (href && href !== '#' && !/^#[a-zA-Z][\w-]*$/.test(href)) continue;
    if (element.getAttribute('aria-expanded') === 'true') continue;
    element.click(); // Expandir/mostrar seções somente; nunca interage com checkbox.
    expanded.push(title);
  }
  return {secoes_expandidas:expanded};
}