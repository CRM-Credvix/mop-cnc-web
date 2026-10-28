() => {
  'use strict';
  // Read-only: collect narrowly allowlisted identifiers from the current user
  // maintenance form. Do NOT collect cookie, localStorage, full URL or page HTML.
  const allowedModels = new Map([
    ['usuario.id', 'id'], ['usuario.codigo', 'codigo'],
    ['usuario.matricula', 'matricula'], ['usuario.uuid', 'id'],
  ]);
  const allowedParams = new Map([
    ['idUsuario', 'id'], ['usuarioId', 'id'],
    ['id_usuario', 'id'], ['codigoUsuario', 'codigo'],
    ['usuarioCodigo', 'codigo'], ['matriculaUsuario', 'matricula'],
  ]);
  const attrs = new Map([
    ['data-usuario-id', 'id'], ['data-user-id', 'id'],
    ['data-id-usuario', 'id'], ['data-codigo-usuario', 'codigo'],
  ]);
  const clean = x => {
    if (typeof x !== 'string') return '';
    const t = x.trim();
    return t.length >= 1 && t.length <= 96 && /^[A-Za-z0-9_:\-.]+$/.test(t) ? t : '';
  };
  const items = [];
  const add = (tipo, valor, fonte) => {
    const v = clean(valor);
    if (v && !items.some(x => x.tipo === tipo && x.valor === v && x.fonte === fonte)) {
      if (items.length < 12) items.push({tipo, valor: v, fonte});
    }
  };
  for (const field of document.querySelectorAll('[ng-model],[data-ng-model]')) {
    const model = field.getAttribute('ng-model') || field.getAttribute('data-ng-model');
    if (!allowedModels.has(model)) continue;
    if (field.matches('input[type="password"],input[type="hidden"][name*="token"]')) continue;
    if (!field.matches('input,select,textarea')) continue;
    // The .value is read directly; no typing, changes, submission or DOM writes.
    add(allowedModels.get(model), field.value, 'ng-model:' + model);
  }
  const formCheck = document.querySelector('input[ng-model="item.selected"],input[data-ng-model="item.selected"]');
  let root = formCheck ? formCheck.closest('form') : null;
  // Never enumerate arbitrary data-* fields or rows in search-result tables.
  for (let depth = 0; root && depth < 3; depth++, root = root.parentElement) {
    for (const [attr, kind] of attrs) add(kind, root.getAttribute(attr), 'atributo:' + attr);
  }
  const query = new URL(location.href).searchParams;
  for (const [param, kind] of allowedParams) {
    const values = query.getAll(param);
    if (values.length === 1) add(kind, values[0], 'url:' + param);
  }
  // These are unverified candidates: no claim of identity or uniqueness.
  return {formato: 'dna-id-candidatos-v1', candidatos: items};
}