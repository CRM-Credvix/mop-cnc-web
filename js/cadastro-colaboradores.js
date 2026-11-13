/* Cadastro DNA: etapa de homologacao, SEM envio de PII ou escrita. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const client = window.MOP_SUPABASE;
  const form = $('cadastroForm');
  const blocked = $('solicitar');
  let user = null;
  const profiles = Object.freeze({CONSULTOR:'Consultor 2', SUPERVISOR:'Supervisor 2'});
  const sync = () => {
    const perfil = form.elements.namedItem('perfil').value;
    $('subperfilOficial').value = profiles[perfil] || 'Selecione o perfil';
  };
  function blockSubmit(event) {
    event.preventDefault();
    $('formFeedback').textContent =
      'Envio de cadastro desabilitado nesta fase. Nenhum dado foi transmitido.';
  }
  async function start() {
    blocked.disabled = true;
    blocked.textContent = 'Solicitar cadastro (bloqueado)';
    $('avisoBloqueio').textContent =
      'Homologação: nenhum dado pessoal é enviado, armazenado ou incluído na fila.';
    $('filaInfo').textContent = 'A fila de cadastro não está liberada.';
    $('atualizar').disabled = true;
    if (!client) {
      $('cadastroDenied').hidden = false;
      return;
    }
    try {
      const {data, error} = await client.auth.getUser();
      if (error || !data?.user) {
        location.replace('index.html');
        return;
      }
      if (String(data.user.email || '').trim().toLowerCase() !== 'crm@credvix.com') {
        $('cadastroDenied').hidden = false;
        return;
      }
      user = data.user;
      $('cadastroShell').hidden = false;
      window.MOP_SHELL?.setUser(user);
      const r = await client.from('franquias_mop').select('codigo,nome').eq('ativo',true).order('nome');
      if (r.error) throw new Error('catalogo_indisponivel');
      const lista = $('lojasLista');
      lista.replaceChildren();
      for (const loja of r.data || []) {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'loja';
        checkbox.value = String(loja.codigo);
        const span = document.createElement('span');
        span.textContent = String(loja.codigo) + ' — ' + String(loja.nome);
        label.append(checkbox,span);
        lista.append(label);
      }
      $('lojasInfo').textContent = (r.data || []).length + ' lojas do catálogo. Seleção demonstrativa, sem solicitar cadastro.';
    } catch (_) {
      $('lojasInfo').textContent = 'Catálogo indisponível. Nenhum dado enviado.';
    }
  }
  form.addEventListener('submit', blockSubmit);
  form.elements.namedItem('perfil').addEventListener('change', sync);
  $('validar').addEventListener('click', () => {
    $('formFeedback').textContent =
      'Página de homologação. Não informe dados reais: nenhuma solicitação será enviada.';
  });
  sync();
  start();
})();
