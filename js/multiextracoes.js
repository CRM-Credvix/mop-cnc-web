(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const products = new Set(['FGTS','CNC','CONSIGNADO','ANTECIPAÇÃO DE BENEFÍCIO','BMG CARD','CARTAO BENEFICIO','CONSIGNADO PRIVADO']);
  const statuses = {na_fila:'Na fila',extraindo:'Extraindo',validado:'Validado',erro:'Erro',revisao_manual:'Revisão manual'};
  let user = null, franchises = [], busy = false;
  const db = () => window.MOP_SUPABASE;
  function feedback(message, isError = false) {
    const node = $('multiFeedback'); node.textContent = message; node.hidden = false;
    node.style.background = isError ? '#fee8e8' : '#ebf6ee';
  }
  function enableForm() {
    $('multiEnviar').disabled = busy || !user || !franchises.length;
  }
  async function loadFranchises() {
    // The authorization list for extractions is distinct from CNC's franchises.
    const { data, error } = await db().rpc('listar_lojas_extracoes_mop');
    if (error) throw new Error('Não foi possível consultar as franquias autorizadas para extrações.');
    franchises = (data || []).filter(f => /^[0-9]+$/.test(String(f.codigo)) && typeof f.nome === 'string');
    const select = $('multiFranquia'); select.replaceChildren();
    const first = document.createElement('option'); first.value = ''; first.textContent = franchises.length ? 'Selecione uma franquia' : 'Nenhuma franquia autorizada'; select.append(first);
    for (const f of franchises) {
      const option = document.createElement('option'); option.value = f.codigo; option.textContent = f.codigo + ' — ' + f.nome; select.append(option);
    }
    enableForm();
  }
  async function downloadFile(path, button) {
    button.disabled = true;
    try {
      const { data, error } = await db().storage.from('mop-arquivos').createSignedUrl(path, 60);
      if (error || !data?.signedUrl) throw new Error('SIGNED_URL_NEGADA');
      // O Storage autoriza com o JWT; o link temporario nao e publico permanente.
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.rel = 'noopener noreferrer';
      document.body.append(link);
      link.click();
      link.remove();
    } catch (_) { feedback('Seu acesso ao arquivo não foi autorizado ou expirou. Atualize e tente novamente.', true); }
    finally { button.disabled = false; }
  }
  async function refresh() {
    const node = $('multiHistorico');
    const { data, error } = await db().from('pedidos_extracoes_mop')
      .select('id,franquia_codigo,produto,status,registros,criado_em')
      .order('criado_em', {ascending:false}).limit(100);
    if (error) { node.replaceChildren(); feedback('Não foi possível consultar o histórico.', true); return; }
    node.replaceChildren();
    const entries = data || [];
    if (!entries.length) {
      const row = node.insertRow(); const cell = row.insertCell(); cell.colSpan=7; cell.textContent = 'Nenhuma extração encontrada.'; return;
    }
    const validatedIds = entries.filter(x=>x.status==='validado').map(x=>x.id);
    const fileMap = new Map();
    if (validatedIds.length) {
      const {data:files, error:fileError}=await db().from('arquivos_extracoes_mop')
        .select('pedido_id,nome,storage_path').in('pedido_id',validatedIds);
      if (fileError) feedback('Histórico disponível, mas o acesso aos arquivos ainda não foi habilitado.', true);
      else for (const file of files || []) fileMap.set(String(file.pedido_id),file);
    }
    for (const item of entries) {
      const row = node.insertRow();
      const values = [item.id, item.produto, item.franquia_codigo,
        statuses[item.status] || 'Em análise', item.registros ?? '—',
        item.criado_em ? new Date(item.criado_em).toLocaleString('pt-BR') : '—'];
      for (const value of values) row.insertCell().textContent = String(value);
      const cell = row.insertCell();
      const file = fileMap.get(String(item.id));
      if (file && item.status === 'validado') {
        const button = document.createElement('button');
        button.type='button'; button.className='button button--secondary';
        button.textContent='Baixar XLSX';
        button.title=file.nome;
        button.addEventListener('click',()=>void downloadFile(file.storage_path,button));
        cell.append(button);
      } else cell.textContent='—';
    }
  }
  async function submit(event) {
    event.preventDefault(); if (busy || !user) return;
    const produto = $('multiProduto').value, codigo = $('multiFranquia').value;
    if (!products.has(produto) || !franchises.some(x => x.codigo === codigo)) {
      feedback('Selecione um produto e uma franquia autorizada.', true); return;
    }
    busy=true; enableForm();
    try {
      const {data,error} = await db().from('pedidos_extracoes_mop')
        .insert({user_id:user.id,franquia_codigo:codigo,produto})
        .select('id,status').single();
      if (error) {
        feedback(error.code === '23505' ? 'Já existe uma extração ativa para essa franquia e produto.' :
          error.code === '42501' ? 'Acesso negado para essa franquia.' : 'Não foi possível registrar o pedido. Confira o histórico antes de tentar novamente.', true);
        return;
      }
      feedback('Extração #' + data.id + ' registrada na fila. O processamento depende da ativação do worker.');
      $('multiForm').reset(); await refresh();
    } catch (_) { feedback('Falha de conexão. Confira o histórico antes de reenviar.', true); }
    finally { busy=false; enableForm(); }
  }
  async function boot() {
    try {
      const session = await db().auth.getUser();
      if (session.error || !session.data?.user) {
        location.replace('index.html');
        return;
      }
      user = session.data.user;
      window.MOP_SHELL?.setUser(user);
      $('logoutButton')?.addEventListener('click', async () => {
        try { await db().auth.signOut({scope:'local'}); }
        finally { location.replace('index.html'); }
      });
      $('multiForm').addEventListener('submit', submit);
      $('multiAtualizar').addEventListener('click', () => void refresh());
      await loadFranchises();
      await refresh();
    } catch (_) { feedback('Falha ao iniciar o módulo. Verifique sua sessão e as permissões.', true); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void boot(),{once:true});
  else void boot();
})();
