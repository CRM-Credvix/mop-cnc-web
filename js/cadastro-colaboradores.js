/* Cadastro DNA: etapa de homologacao, SEM envio de PII ou escrita. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const client = window.MOP_SUPABASE;
  const form = $('cadastroForm');
  const blocked = $('solicitar');
  let user = null;
  const profiles = Object.freeze({CONSULTOR:'Consultor 2', SUPERVISOR:'Supervisor 2'});
  const FILA_TESTE = 'dna_cadastro_conexao_testes';
  let atualizando = false;
  function formatarData(valor) {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? '—' : data.toLocaleString('pt-BR');
  }
  async function atualizarConexao() {
    if (!user || atualizando) return;
    atualizando = true;
    const botao = $('atualizar');
    botao.disabled = true;
    try {
      const {data, error} = await client.from(FILA_TESTE)
        .select('id,status,etapa,criado_em,atualizado_em')
        .order('criado_em',{ascending:false}).limit(25);
      if (error) throw new Error('consulta_indisponivel');
      const corpo = $('filaRows');
      corpo.replaceChildren();
      for (const item of data || []) {
        const tr = document.createElement('tr');
        for (const valor of [
          String(item.id).slice(0,8),
          String(item.status),
          String(item.etapa),
          formatarData(item.atualizado_em),
          'Teste de comunicação; sem dados pessoais'
        ]) {
          const td = document.createElement('td');
          td.textContent = valor;
          tr.append(td);
        }
        corpo.append(tr);
      }
      $('filaInfo').textContent = (data || []).length
        ? 'Solicitações de conectividade (sem dados pessoais).'
        : 'Nenhum teste de comunicação enviado.';
    } catch (_) {
      $('filaInfo').textContent = 'Não foi possível consultar a fila de testes.';
    } finally {
      atualizando = false;
      botao.disabled = false;
    }
  }
  async function criarTesteConexao() {
    if (!user) return;
    const botao = $('testarConexao');
    botao.disabled = true;
    $('filaInfo').textContent = 'Registrando teste de conexão…';
    try {
      const {data, error} = await client.from(FILA_TESTE).insert({
        solicitante_id: user.id,
        tipo: 'ping',
        status: 'pendente',
        etapa: 'aguardando_robo'
      }).select('id').single();
      if (error || !data?.id) throw new Error('falha_insercao');
      $('filaInfo').textContent = 'Teste registrado. Aguardando serviço Windows (ainda não conectado).';
      await atualizarConexao();
    } catch (_) {
      $('filaInfo').textContent = 'Erro ao registrar teste. Nenhum cadastro foi solicitado.';
    } finally {
      botao.disabled = false;
    }
  }
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
    $('filaInfo').textContent = 'Fila de teste aguardando autenticação.';
    $('atualizar').disabled = true;
    $('testarConexao').disabled = true;
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
      $('atualizar').disabled = false;
      $('testarConexao').disabled = false;
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
      await atualizarConexao();
    } catch (_) {
      $('lojasInfo').textContent = 'Catálogo indisponível. Nenhum dado enviado.';
    }
  }
  $('atualizar').addEventListener('click',atualizarConexao);
  $('testarConexao').addEventListener('click',criarTesteConexao);
  form.addEventListener('submit', blockSubmit);
  form.elements.namedItem('perfil').addEventListener('change', sync);
  $('validar').addEventListener('click', () => {
    $('formFeedback').textContent =
      'Página de homologação. Não informe dados reais: nenhuma solicitação será enviada.';
  });
  sync();
  start();
})();
