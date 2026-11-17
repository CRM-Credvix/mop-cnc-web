/* Cadastro DNA — interface de homologacao. Nunca envia dados pessoais nem cria cadastro. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('cadastroForm');
  const client = window.MOP_SUPABASE;
  const FILA = 'dna_cadastro_conexao_testes';
  const PERFIS = Object.freeze({CONSULTOR:'Consultor 2',SUPERVISOR:'Supervisor 2'});
  const ALLOWED_EMAILS = new Set(['crm@credvix.com','rh@credvix.com']);
  let user = null;
  let carregando = false;
  let testes = [];
  let atualizacao = null;
  let cadastroAtivo = false;
  let enviando = false;
  let idempotencia = crypto.randomUUID();
  let pedidos = [];
  const ESTADOS = Object.freeze({
    na_fila:'Na fila',processando:'Em execução',
    aguardando_validacao:'Validando CPF',ativo:'Validado',
    erro:'Erro',revisao:'Revisão necessária'
  });
  function validarCPF(cpf) {
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
    for (let n=9;n<=10;n++) {
      let soma=0;
      for (let j=0;j<n;j++) soma+=Number(cpf[j])*(n+1-j);
      if (Number(cpf[n])!==((soma*10)%11)%10) return false;
    }
    return true;
  }
  async function carregarConfig() {
    try {
      const {data,error}=await client.from('dna_cadastro_config')
        .select('ativo').eq('chave','cadastro_ativo').single();
      cadastroAtivo=!error && data?.ativo === true;
    } catch (_) {cadastroAtivo=false;}
    $('solicitar').disabled=!cadastroAtivo;
    $('cadastroEstado').textContent=cadastroAtivo ? '● Solicitações habilitadas' : '● Em homologação';
    $('avisoBloqueio').textContent=cadastroAtivo
      ? 'A solicitação será registrada na fila segura. O resultado depende do robô Windows.'
      : 'O envio permanece bloqueado até a configuração privada da API e a homologação do robô.';
  }
  async function carregarPedidos() {
    if (!user) return;
    const corpo=$('filaCadastroRows');
    $('atualizarCadastros').disabled=true;
    try {
      const {data,error}=await client.from('dna_cadastro_solicitacoes')
        .select('id,cpf_final4,lojas,perfil,subperfil,status,etapa,motivo_publico,atualizado_em')
        .order('criado_em',{ascending:false}).limit(50);
      if(error)throw new Error('fila_inacessivel');
      pedidos=data||[];
      corpo.replaceChildren();
      for(const pedido of pedidos){
        const tr=document.createElement('tr');
        for(const val of [String(pedido.id).slice(0,8),'***'+pedido.cpf_final4,
          (pedido.lojas||[]).join(', '),pedido.perfil,pedido.etapa,
          ESTADOS[pedido.status]||pedido.status,dataPt(pedido.atualizado_em)]){
          const td=document.createElement('td');td.textContent=String(val||'—');tr.append(td);
        }
        const td=document.createElement('td'),botao=document.createElement('button');
        botao.type='button';botao.textContent='Detalhes';
        botao.addEventListener('click',()=>mostrarPedido(pedido));
        td.append(botao);tr.append(td);corpo.append(tr);
      }
      if(!pedidos.length){
        const tr=document.createElement('tr'),td=document.createElement('td');
        td.colSpan=8;td.textContent='Nenhuma solicitação de cadastro registrada.';
        tr.append(td);corpo.append(tr);
      }
      $('filaCadastroInfo').textContent=pedidos.length+
        ' solicitações encontradas. A exibição não comprova execução no DNA.';
    }catch(_){$('filaCadastroInfo').textContent='Fila indisponível ou sem permissão para este usuário.';}
    finally{$('atualizarCadastros').disabled=false;}
  }
  async function mostrarEventos(pedidoId) {
    const lista=$('eventosLista');
    lista.replaceChildren();
    $('eventosInfo').textContent='Consultando histórico autorizado…';
    try {
      const {data,error}=await client.from('dna_cadastro_eventos')
        .select('tipo,detalhe_publico,criado_em')
        .eq('solicitacao_id',pedidoId)
        .order('criado_em',{ascending:true}).limit(100);
      if(error)throw new Error('historico_indisponivel');
      for(const evento of data||[]){
        const linha=document.createElement('li');
        const tipo=document.createElement('b');
        tipo.textContent=String(evento.tipo||'Evento');
        const texto=document.createElement('span');
        // Os detalhes sao mensagens tecnicas, nunca HTML.
        texto.textContent=dataPt(evento.criado_em)+
          (evento.detalhe_publico?' · '+String(evento.detalhe_publico):'');
        linha.append(tipo,texto);lista.append(linha);
      }
      $('eventosInfo').textContent=(data||[]).length
        ? 'Histórico atualizado.':'Nenhum evento publicado para esta solicitação.';
    }catch(_){
      $('eventosInfo').textContent='Não foi possível acessar os eventos desta solicitação.';
    }
  }
  function mostrarPedido(pedido){
    mostrarEventos(pedido.id);
    $('detalheId').textContent=String(pedido.id).slice(0,8);
    $('detalheEtapa').textContent=pedido.etapa||'—';
    $('detalheAtualizado').textContent=dataPt(pedido.atualizado_em);
    $('detalheSituacao').textContent=ESTADOS[pedido.status]||pedido.status;
    $('detalheStatus').textContent=ESTADOS[pedido.status]||pedido.status;
    $('detalheTexto').textContent=pedido.motivo_publico||
      'Acompanhe o pedido no DNA. Sem confirmação explícita, o status não será Validado.';
    aba('detalhe');
  }
  async function enviarCadastro() {
    if (!cadastroAtivo || !user || enviando) return;
    if(!conferir()) return;
    const cpf=form.elements.namedItem('cpf').value.replace(/\D/g,'');
    if(!validarCPF(cpf)){
      $('formFeedback').textContent='CPF inválido. Nenhum pedido foi enviado.';
      return;
    }
    const dados={
      idempotencia,
      nome:form.elements.namedItem('nome').value.trim(),
      cpf,
      nascimento:form.elements.namedItem('nascimento').value,
      email:form.elements.namedItem('email').value.trim(),
      telefone:form.elements.namedItem('telefone').value.replace(/\D/g,''),
      perfil:form.elements.namedItem('perfil').value,
      lojas:[form.elements.namedItem('loja').value]
    };
    enviando=true;
    $('solicitar').disabled=true;
    $('formFeedback').textContent='Enviando pedido à API segura…';
    try {
      const {data,error}=await client.functions.invoke('cadastro-dna-criar',{body:dados});
      if(error || !data?.id)throw new Error('RESPOSTA_NAO_CONFIRMADA');
      $('formFeedback').textContent='Pedido '+String(data.id).slice(0,8)+
        ' registrado. Acompanhe a fila; isso ainda não confirma cadastro no DNA.';
      form.reset();idempotencia=crypto.randomUUID();resumo();
      await carregarPedidos();
      aba('acompanhamento');
    }catch(_){
      $('formFeedback').textContent=
        'Não foi possível confirmar o envio. Antes de tentar novamente, confira o acompanhamento para evitar duplicação.';
      // Sem resposta conclusiva, NUNCA gerar nova idempotencia nem repetir automaticamente.
    }finally{
      enviando=false;
      $('solicitar').disabled=!cadastroAtivo;
    }
  }
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
    $('eventosLista').replaceChildren();
    $('eventosInfo').textContent='Este registro é somente um teste de conectividade.';
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
      if (!ALLOWED_EMAILS.has((data.user.email||'').trim().toLowerCase())) {
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
      await carregarConfig();
      await carregarPedidos();
      await atualizarConexao();
      atualizacao = window.setInterval(() => {
        if (user && !document.hidden) {atualizarConexao();carregarPedidos();}
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
  form.addEventListener('submit',event => {event.preventDefault();enviarCadastro();});
  $('testarConexao').addEventListener('click',testarConexao);
  $('atualizar').addEventListener('click',atualizarConexao);
  $('atualizarCadastros').addEventListener('click',carregarPedidos);
  window.addEventListener('hashchange',()=>aba(location.hash.slice(1),false));
  window.addEventListener('pagehide',()=>{if(atualizacao)clearInterval(atualizacao);});
  resumo();
  init();
})();