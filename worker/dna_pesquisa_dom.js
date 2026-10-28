() => {
  'use strict';
  // Somente metadados da consulta; nunca coleta a pagina inteira, senhas ou cookies.
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
  const visible = e => Boolean(e && e.isConnected && e.getClientRects().length && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden');
  const allInputs = [...document.querySelectorAll('input:not([type="hidden"]):not([type="password"])')];
  const candidates = [];
  for (const e of document.querySelectorAll('label,th,td,span,strong,div')) {
    if (!visible(e)) continue;
    const direct = [...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();
    if (!['cpf','cpf:'].includes(norm(direct))) continue;
    const directFor = e.htmlFor ? document.getElementById(e.htmlFor) : null;
    const roots = [directFor,e.parentElement,e.parentElement?.parentElement];
    for (const root of roots) {
      if (!root) continue;
      const fields = root.matches?.('input') ? [root] : [...root.querySelectorAll('input')].filter(visible);
      const eligible = fields.filter(x=>allInputs.includes(x) && !['checkbox','radio','button','submit','reset'].includes((x.type||'').toLowerCase()));
      if (eligible.length === 1) candidates.push(allInputs.indexOf(eligible[0]));
    }
  }
  const unique = [...new Set(candidates)];
  const actionNodes = [...document.querySelectorAll('button,input[type="submit"],a[role="button"]')];
  const actions = actionNodes.map((e,i)=>({i,el:e,label:norm([e.textContent,e.value,e.getAttribute('aria-label'),e.getAttribute('title')].filter(Boolean).join(' '))}))
    .filter(x=>visible(x.el)&&/^(pesquisar|consultar|buscar)$/.test(x.label));
  const heading = norm(document.body?.innerText?.slice(0,1000)||'');
  return {
    tela_consulta: heading.includes('consulta de usuarios') && heading.includes('filtro de pesquisa'),
    cpf_input_index:unique.length===1 ? unique[0] : null,
    cpf_input_ambiguo:unique.length>1,
    submit_index:actions.length===1?actions[0].i:null,
    submit_ambiguo:actions.length>1,
  };
}