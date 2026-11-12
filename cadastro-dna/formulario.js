/* Prototipo offline: nunca transmite dados para qualquer endereco. */
(() => {
  'use strict';
  const form = document.getElementById('form');
  const result = document.getElementById('resultado');
  const value = id => document.getElementById(id).value.trim();
  const digits = str => str.replace(/\D/g, '');
  function cpfValido(input) {
    const cpf = digits(input);
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
    for (let n = 9; n <= 10; n++) {
      const soma = [...cpf.slice(0, n)].reduce((a, d, i) => a + Number(d) * (n + 1 - i), 0);
      if (Number(cpf[n]) !== ((soma * 10) % 11) % 10) return false;
    }
    return true;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const nome = value('nome').replace(/\s+/g, ' ');
    const nascimento = value('nascimento');
    const telefone = digits(value('telefone'));
    const lojas = value('lojas').split(',').map(x => x.trim());
    const erros = [];
    if (nome.length < 5 || !nome.includes(' ')) erros.push('Informe nome completo.');
    if (!cpfValido(value('cpf'))) erros.push('CPF inválido.');
    if (!nascimento || Number.isNaN(Date.parse(nascimento)) || new Date(nascimento) > new Date()) erros.push('Nascimento inválido.');
    if (!document.getElementById('email').checkValidity()) erros.push('E-mail inválido.');
    if (!/^\d{10,11}$/.test(telefone)) erros.push('Telefone inválido.');
    if (!['CONSULTOR','SUPERVISOR'].includes(value('perfil'))) erros.push('Selecione um perfil.');
    if (!lojas.length || lojas.some(x => !/^\d+$/.test(x)) || new Set(lojas).size !== lojas.length) erros.push('Informe códigos de lojas válidos e sem repetição.');
    result.textContent = erros.length ? erros.join(' ') : 'Formato válido. Nenhum cadastro foi enviado. Integração ainda não habilitada.';
  });
})();