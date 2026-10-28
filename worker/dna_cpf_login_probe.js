() => {
  'use strict';
  // Restrito a pagina de manutencao ja aberta. Nunca modifica o DOM.
  // CPF e Login retornam apenas a memoria do processo Python; nao vao ao JSON.
  const visible = (el) => {
    if (!el || !el.isConnected) return false;
    for (let p = el, i = 0; p && i < 8; p = p.parentElement, i++) {
      const st = getComputedStyle(p);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const clean = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
  const cpfLike = s => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(s) || /^\d{11}$/.test(s) || /^\d{9}-\d{2}$/.test(s);
  const digitize = s => String(s || '').replace(/\D/g, '');
  const entries = {cpf: [], login: []};
  const add = (kind, value, source) => {
    if (!cpfLike(String(value || '').trim())) return;
    const v = digitize(value);
    if (v.length !== 11) return;
    if (!entries[kind].some(e => e.valor === v && e.fonte === source)) entries[kind].push({valor:v,fonte:source});
  };
  const allowedField = el => el && el.matches && el.matches('input:not([type="password"]):not([type="hidden"]),textarea') && visible(el);
  const fields = Array.from(document.querySelectorAll('input,textarea')).filter(allowedField);
  // Caso Angular com ng-model explicitamente nomeado; nao varre os valores dos outros campos.
  for (const el of fields) {
    const hint = clean([el.getAttribute('ng-model'),el.getAttribute('data-ng-model'),el.name,el.id].filter(Boolean).join(' '));
    if (/(^|[.\s_\-])cpf($|[\s_\-])/.test(hint)) add('cpf',el.value,'campo:cpf');
    if (/(^|[.\s_\-])login($|[\s_\-])/.test(hint)) add('login',el.value,'campo:login');
  }
  // Ler somente labels cujo texto seja exatamente CPF/CPF:, ou Login/Login:.
  const labels = Array.from(document.querySelectorAll('label,span,strong,b,th,td,div,p'));
  const ownText = el => Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join(' ').trim();
  for (const el of labels) {
    if (!visible(el)) continue;
    const text = clean(ownText(el));
    if (text !== 'cpf' && text !== 'cpf:' && text !== 'login' && text !== 'login:') continue;
    const kind = text.startsWith('cpf') ? 'cpf' : 'login';
    const byFor = el.htmlFor && document.getElementById(el.htmlFor);
    if (allowedField(byFor)) add(kind,byFor.value,'rotulo:for');
    // Estrutura Bootstrap comum: <div class="form-group"><label>CPF:</label><input ...></div>.
    for (const root of [el.parentElement, el.parentElement?.parentElement]) {
      if (!root || !visible(root)) continue;
      const near = Array.from(root.querySelectorAll('input,textarea')).filter(allowedField);
      if (near.length === 1) add(kind,near[0].value,'rotulo:grupo');
    }
    // Fallback geométrico: campo mais próximo, alinhado abaixo do label.
    const a = el.getBoundingClientRect();
    const nearby = fields.map(f => ({f,r:f.getBoundingClientRect()})).filter(x => {
      const dy=x.r.top-a.bottom, dx=x.r.left-a.left;
      return dy >= -5 && dy <= 55 && dx >= -35 && dx <= 65 && x.r.width >= 65;
    });
    if (nearby.length === 1) add(kind,nearby[0].f.value,'rotulo:geometria');
  }
  // Cabecalho como no DNA: "Login: 00000000000" ou "Login: 000.000.000-00".
  // Somente nos elementos curtos com texto direto e visivel, sem percorrer o HTML inteiro.
  for (const el of labels) {
    if (!visible(el)) continue;
    const t = ownText(el).replace(/\s+/g,' ').trim();
    if (t.length > 65) continue;
    const m = t.match(/^Login\s*:\s*(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{9}-\d{2}|\d{11})$/i);
    if (m) add('login',m[1],'cabecalho:login');
  }
  // Versao alternativa do cabecalho: <div>Login: <span>NUMERO</span></div>.
  // Exige grupo curto e exato para nao interpretar dados de outros formularios.
  for (const el of labels) {
    if (!visible(el) || (el.children && el.children.length > 3)) continue;
    const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length > 65) continue;
    const m = text.match(/^Login\s*:\s*(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{9}-\d{2}|\d{11})$/i);
    if (m) add('login',m[1],'cabecalho:agrupado');
  }
  const unique = kind => [...new Set(entries[kind].map(x => x.valor))];
  return {
    formato:'dna-cpf-login-v1',
    cpf:{valores:unique('cpf'),fontes:[...new Set(entries.cpf.map(x => x.fonte))]},
    login:{valores:unique('login'),fontes:[...new Set(entries.login.map(x => x.fonte))]}
  };
}