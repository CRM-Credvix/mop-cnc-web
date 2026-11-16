/* Cadastro DNA — interface de homologacao. Nunca envia dados pessoais nem cria cadastro. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('cadastroForm');
  const client = window.MOP_SUPABASE;
  const FILA = 'dna_cadastro_conexao_testes';
  const PERFIS = Object.freeze({CONSULTOR:'Consultor 2',SUPERVISOR:'Supervisor 2'});
  let user = null;
  let carregando = false;
  let testes = [];
  let atualizacao = null;
  const html = document.documentElement;

  function dataPt(v) {
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d.toLocaleString('pt-BR') : '—';
  }
  function aba(nome, atualizarHash = true) {
    if (!['solicitacao','acompanhamento','detalhe'].includes(nome)) nome='solicitacao';
    document.querySelectorAll('[data-view]').forEach(p => p.hidden = p.dataset.view !== nome);
    document.querySelectorAll('[data-tab]').forEach(btn => {
      if (btn.dataset.tab === nome) btn.setAttribute('aria-current','page');
      else btn.removeAttribute('aria-current');
    });
    if (atualizarHash && location.hash.slice(1) !== nome) {
      history.replaceState(null,'','#'+nome);
    }
  }
  function resumo() {
    const perfil = form.elements.namedItem('perfil').value;
    const loja = form.elements.namedItem('loja');
    $('subperfilOficial').value = PERFIS[perfil] || 'Selecione o perfil';
    $('resumoLoja').textContent = loja.selectedOptions[0]?.textContent || '—';
    if (!loja.value) $('resumoLoja').textContent='—';
    $('resumoPerfil').textContent = perfil === 'CONSULTOR' ? 'Consultor' :
      perfil === 'SUPERVISOR' ? 'Supervisor' : '—';
    $('resumoSubperfil').textContent = PERFIS[perfil] || '—';
  }
  function limparFeedback() { $('formFeedback').textContent=''; }
  function conferir() {
    const perfil = form.elements.namedItem('perfil').value;
    const loja = form.elements.namedItem('loja').value;
    const nome = form.elements.namedItem('nome').value.trim();
    const cpf = form.elements.namedItem('cpf').value.replace(/\D/g,'');
    const tel = form.elements.namedItem('telefone').value.replace(/\D/g,'');
    const data = form.elements.namedItem('nascimento').value;
    const email = form.elements.namedItem('email').value;
    const valido = nome.split(/\s+/).length >= 2 && cpf.length === 11 &&
      tel.length >= 10 && tel.length <= 13 && Boolean(data) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !!perfil && !!loja;
    $('formFeedback').textContent = valido
      ? 'Campos preenchidos para revisão visual. Nenhum dado foi transmitido. O envio continua bloqueado.'
      : 'Confira nome completo, CPF, nascimento, e-mail, telefone, loja e perfil. Nenhum dado foi transmitido.';
    return valido;
  }
  function mostrarDetalhe(item) {
    $('detalheId').textContent = item ? String(item.id).slice(0,8) : '—';
    $('detalheEtapa').textContent = item?.etapa || '—';
    $('detalheAtualizado').textContent = item ? dataPt(item.atualizado_em) : '—';
    $('detalheSituacao').textContent = item ? 'Teste de conectividade' : 'Fluxo ilustrativo';
    $('detalheStatus').textContent = item?.status === 'recebido' ? 'Teste recebido' :
      item?.status === 'erro' ? 'Falha na conectividade' :
      item ? 'Aguardando serviço Windows' : 'Aguardando homologação';
    $('detalheTexto').textContent = item
      ? 'Este registro não contém dados de colaboradores e não executa ações no DNA.'
      : 'Selecione um teste de conectividade no acompanhamento para visualizar seu registro.';
    aba('detalhe');
  }
  async function atualizarConexao() {
    if (!user || carregando) return;
    carregando = true;
    $('atualizar').disabled = true;
    try {
      const {data,error} = await client.from(FILA)
        .select('id,tipo,status,etapa,criado_em,atualizado_em')
        .order('criado_em',{ascending:false}).limit(50);
      if (error) throw new Error('fila_indisponivel');
      testes = data || [];
      const corpo = $('filaRows');
      corpo.replaceChildren();
      for (const item of testes) {
        const tr = document.createElement('tr');
        for (const valor of [String(item.id).slice(0,8), 'Conectividade', 
          String(item.etapa), String(item.status),dataPt(item.atualizado_em)]) {
          const td = document.createElement('td');
          td.textContent = valor;
          tr.append(td);
        }
        const td = document.createElement('td');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Detalhes';
        button.addEventListener('click',() => mostrarDetalhe(item));
        td.append(button);tr.append(td);corpo.append(tr);
      }
      if (!testes.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan=6;
        td.textContent='Nenhum teste de conectividade cadastrado.';
        tr.append(td);corpo.append(tr);
      }
      $('metricPendentes').textContent = String(testes.filter(t => t.status==='pendente').length);
      $('filaInfo').textContent = testes.length
        ? testes.length + ' testes de conectividade listados. Nenhum cadastro DNA executado.'
        : 'Nenhum teste registrado. O cadastro automático ainda não está habilitado.';
    } catch (_) {
      $('filaInfo').textContent='Não foi possível consultar a fila de testes. Verifique a sessão.';
    } finally {
      carregando = false;
      $('atualizar').disabled=false;
    }
  }
  async function testarConexao() {
    if (!user) return;
    $('testarConexao').disabled=true;
    $('filaInfo').textContent='Enviando teste de conectividade sem dados pessoais…';
    try {
      const {data,error} = await client.from(FILA).insert({
        solicitante_id:user.id,tipo:'ping',status:'pendente',etapa:'aguardando_robo'
      }).select('id').single();
      if (error || !data?.id) throw new Error('insert_falhou');
      await atualizarConexao();
      $('filaInfo').textContent='Teste enviado ao Supabase. O serviço Windows ainda não está conectado.';
    } catch (_) {
      $('filaInfo').textContent='Falha no teste de conexão. Nenhum cadastro foi solicitado.';
    } finally {
      $('testarConexao').disabled=false;
    }
  }
  function renderLojas(lojas) {
    const select=$('lojaSelect');
    select.replaceChildren();
    const prompt = document.createElement('option');
    prompt.value='';prompt.textContent='Selecione a loja';
    select.append(prompt);
    for (const loja of lojas) {
      const opt = document.createElement('option');
      opt.value=String(loja.codigo);
      opt.textContent=String(loja.codigo)+' — '+String(loja.nome);
      select.append(opt);
    }
    resumo();
  }
  async function init() {
    $('solicitar').disabled = true;
    $('testarConexao').disabled = true;
    $('atualizar').disabled = true;
    aba(location.hash.slice(1),false);
    if (!client) {
      $('cadastroDenied').hidden=false;
      html.classList.remove('mop-shell-loading');
      return;
    }
    try {
      const {data,error}=await client.auth.getUser();
      if (error || !data?.user) {location.replace('index.html');return;}
      if ((data.user.email||'').trim().toLowerCase()!=='crm@credvix.com') {
        $('cadastroDenied').hidden=false;
        html.classList.remove('mop-shell-loading');
        return;
      }
      user=data.user;
      $('cadastroShell').hidden=false;
      window.MOP_SHELL?.setUser(user);
      $('atualizar').disabled=false;
      $('testarConexao').disabled=false;
      const lojas = await client.from('franquias_mop')
        .select('codigo,nome').eq('ativo',true).order('nome');
      if (!lojas.error) renderLojas(lojas.data||[]);
      else $('filaInfo').textContent='Catálogo de lojas indisponível.';
      await atualizarConexao();
      atualizacao = window.setInterval(() => {
        if (user && !document.hidden) atualizarConexao();
      },15000);
    } catch (_) {
      $('cadastroDenied').hidden=false;
      html.classList.remove('mop-shell-loading');
    }
  }

  document.querySelectorAll('[data-tab]').forEach(btn =>
    btn.addEventListener('click',() => aba(btn.dataset.tab)));
  $('voltarFila').addEventListener('click',()=>aba('acompanhamento'));
  form.elements.namedItem('perfil').addEventListener('change',resumo);
  form.elements.namedItem('loja').addEventListener('change',resumo);
  form.addEventListener('input',limparFeedback);
  $('validar').addEventListener('click',conferir);
  form.addEventListener('submit',event => {
    event.preventDefault();
    $('formFeedback').textContent='Cadastro DNA ainda bloqueado. Nenhum dado pessoal foi transmitido.';
  });
  $('testarConexao').addEventListener('click',testarConexao);
  $('atualizar').addEventListener('click',atualizarConexao);
  window.addEventListener('hashchange',()=>aba(location.hash.slice(1),false));
  window.addEventListener('pagehide',()=>{if(atualizacao)clearInterval(atualizacao);});
  resumo();
  init();
})();