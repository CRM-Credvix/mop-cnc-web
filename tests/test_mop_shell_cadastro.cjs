// Teste isolado do menu compartilhado, sem navegador, rede ou escrita no DNA.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/mop-shell.js', 'utf8');
function shellAt(pathname, hash = '') {
  const context = {
    location: { pathname, hash },
    document: {
      querySelector() { return null; },
      readyState: 'loading',
      addEventListener() {},
    },
    window: {},
  };
  vm.runInNewContext(source, context, { filename: 'js/mop-shell.js', timeout: 1000 });
  return context.window.MOP_SHELL;
}
const cadastro = shellAt('/mop-cnc-web/cadastro-colaboradores.html');
assert.equal(cadastro.route(), 'cadastro');
const menu = cadastro.menu;
assert.equal(menu.filter(item => item.id === 'cadastro').length, 1);
assert.equal(menu.find(item => item.id === 'cadastro').admin, true);
assert.equal(menu.find(item => item.id === 'cadastro').href, 'cadastro-colaboradores.html');
for (const id of ['gestao', 'acompanhamento', 'auditoria']) {
  assert.equal(menu.filter(item => item.id === id).length, 1);
  assert.equal(shellAt('/mop-cnc-web/perfis-dna.html', '#' + id).route(), id);
}
assert.equal(shellAt('/mop-cnc-web/app.html').route(), 'app');
assert.equal(shellAt('/mop-cnc-web/historico.html').route(), 'history');
console.log('OK: cadastro na administracao e rotas DNA preservadas.');
