/* CREDVIX DNA | solicitações de conferência somente leitura.
 * CPF entra por TLS na RPC e é criptografado no schema privado.
 * Nunca armazena CPF em localStorage, logs ou tabelas expostas.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const client = window.MOP_SUPABASE;
  const shell = $('dnaShell');
  const names = $('dnaNames');
  const create = $('dnaQueueCreate');
  const msg = $('dnaQueueMessage');
  if (!client || !shell || !names || !create || !msg) return;
  let sending = false;
  let busy = false;
  let lastDigest = '';
  let lastKey = '';
  let selectedBatch = '';
  let lastRefresh = 0;

  function cpfValid(raw) {
    const cpf = String(raw || '').replace(/\D/g,'');
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
    for (let n = 9; n < 11; n++) {
      const sum = [...cpf.slice(0,n)].reduce((a,d,i) => a + Number(d)*(n+1-i),0);
      if (Number(cpf[n]) !== ((sum*10)%11)%10) return false;
    }
    return true;
  }
  function parseRows() {
    const lines = names.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    if (lines.length < 1 || lines.length > 50) throw Error('Informe de 1 a 50 colaboradores.');
    const seen = new Set();
    return lines.map((line,idx) => {
      const parts = line.split(';').map(s=>s.trim());
      if (parts.length < 2 || parts.length > 3) throw Error(`Linha ${idx+1}: use CPF; Nome completo; Login opcional.`);
      const [cpfRaw,nomeRaw,loginRaw=''] = parts;
      const cpf = cpfRaw.replace(/\D/g,'');
      const nome = nomeRaw.replace(/\s+/g,' ').trim();
      const login = loginRaw.trim();
      if (!cpfValid(cpf)) throw Error(`Linha ${idx+1}: CPF inválido.`);
      if (nome.length < 5 || nome.length > 140 || !nome.includes(' ')) throw Error(`Linha ${idx+1}: informe nome e sobrenome (até 140 caracteres).`);
      if (login && (login.length > 42 || !/^[0-9A-Za-z._-]+$/.test(login))) throw Error(`Linha ${idx+1}: Login inválido.`);
      const key = cpf+'|'+login.toLowerCase();
      if (seen.has(key)) throw Error(`Linha ${idx+1}: CPF e Login repetidos.`);
      seen.add(key);
      return {cpf,nome,login};
    });
  }
  const fmt = v => v ? new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v)) : '—';
  const short = v => String(v||'').slice(0,8);
  const add = (tr,v) => { const c=tr.insertCell(); c.textContent=String(v??'—'); return c; };
  const text = (value,isError=false) => { msg.textContent=value;msg.style.color=isError?'#ad3928':''; };
  const status = {
    aguardando_worker:'Aguardando robô local',em_consulta:'Em consulta',concluido:'Consulta encerrada',revisao:'Revisão necessária',
    consulta_confirmada:'Cadastro conferido no DNA',duplicidade:'Contas duplicadas',nao_encontrado:'Não encontrado',erro:'Falha',revisao_item:'Revisão'
  };
  function renderList(lotes,items,container) {
    container.replaceChildren();
    const table=document.createElement('table');table.className='dna-table';
    const head=table.createTHead().insertRow();
    ['Lote','Criado em','Perfil','Colaborador','CPF (final)','Estado'].forEach(label => {const th=document.createElement('th');th.textContent=label;head.append(th);});
    const body=table.createTBody();
    for (const l of lotes) {
      const own=items.filter(i=>i.lote_id===l.id).sort((a,b)=>a.ordem-b.ordem);
      if (!own.length) {
        const tr=body.insertRow();add(tr,short(l.id));add(tr,fmt(l.criado_em));add(tr,l.perfil==='CONSULTOR'?'Consultor 2':'Supervisor 1');
        const td=add(tr,'Carregando itens');td.colSpan=3;continue;
      }
      for (const i of own) {
        const tr=body.insertRow();add(tr,short(l.id));add(tr,fmt(l.criado_em));add(tr,l.perfil==='CONSULTOR'?'Consultor 2':'Supervisor 1');
        add(tr,i.nome);add(tr,'•••.'+i.cpf_final4);add(tr,status[i.status]||i.status);
      }
    }
    if (!lotes.length) {const tr=body.insertRow();add(tr,'Nenhuma solicitação registrada.').colSpan=6;}
    container.append(table);
  }
  function area(stageName) {
    const stage=document.querySelector(`.dna-stage[data-stage="${stageName}"]`);
    if (!stage) return null;
    let section=stage.querySelector('[data-dna-queue]');
    if(section)return section;
    section=document.createElement('section');section.className='dna-card';section.dataset.dnaQueue='';
    const heading=document.createElement('div');heading.className='dna-table-head';
    const info=document.createElement('div');
    const h=document.createElement('h2');h.textContent='Fila de conferência (somente leitura)';
    const p=document.createElement('p');p.textContent='Pedidos recebidos pelo Supabase. CPF completo protegido; aguardando conexão do robô local para processamento automático.';
    info.append(h,p);
    const refresh=document.createElement('button');refresh.className='dna-button dna-button--ghost';refresh.type='button';refresh.textContent='⟳ Atualizar';refresh.addEventListener('click',()=>load(true));
    heading.append(info,refresh);
    const caption=document.createElement('p');caption.dataset.queueStatus='';caption.setAttribute('role','status');caption.className='dna-subcopy';caption.textContent='Carregando solicitações…';
    const box=document.createElement('div');box.className='dna-table-shell';box.dataset.queueRows='';
    section.append(heading,caption,box);
    const first=stage.querySelector('.dna-stepper');
    if (first && stageName==='acompanhamento')first.insertAdjacentElement('afterend',section);else stage.append(section);
    return section;
  }
  async function load(force=false) {
    if (shell.hidden || busy || (!force && Date.now()-lastRefresh<8000)) return;
    busy=true;
    const panels=['gestao','acompanhamento'].map(area).filter(Boolean);
    try {
      const {data:lotes,error:e1}=await client.from('dna_consulta_lotes')
        .select('id,perfil,status,total,criado_em').order('criado_em',{ascending:false}).limit(20);
      if(e1)throw e1;
      let itens=[];
      if(lotes?.length){const {data,error}=await client.from('dna_consulta_itens')
        .select('lote_id,ordem,nome,cpf_final4,status').in('lote_id',lotes.map(l=>l.id)).order('ordem');
        if(error)throw error;itens=data||[];
      }
      for(const panel of panels){const s=panel.querySelector('[data-queue-status]');
        s.textContent=`${lotes?.length||0} lote(s) exibido(s); ${itens.filter(x=>x.status==='aguardando_worker').length} colaborador(es) aguardando robô.`;
        renderList(lotes||[],itens,panel.querySelector('[data-queue-rows]'));
      }
      lastRefresh=Date.now();
    } catch(e) {panels.forEach(panel=>{panel.querySelector('[data-queue-status]').textContent='Falha ao consultar a fila: '+(e?.message||'erro');});}
    finally {busy=false;}
  }
  async function submit() {
    if(sending)return;
    let items;
    try {items=parseRows();}catch(e){return text(e.message,true);}
    const selected=document.querySelector('input[name="dnaProfile"]:checked');
    const perfil=selected?.value;
    if(!['CONSULTOR','SUPERVISOR'].includes(perfil))return text('Selecione o perfil.',true);
    const signature=JSON.stringify([perfil,items]);
    if(lastDigest!==signature){lastDigest=signature;lastKey=crypto.randomUUID();}
    sending=true;create.disabled=true;
    text('Registrando solicitação de conferência…');
    try {
      const {data,error}=await client.rpc('dna_criar_consulta_lote',{
        p_perfil:perfil,p_itens:items,p_idempotencia:lastKey
      });
      if(error)throw error;
      selectedBatch=String(data||'');
      names.value='';
      names.dispatchEvent(new Event('input',{bubbles:true}));
      text(`Lote ${short(selectedBatch)} registrado com ${items.length} colaborador(es). Aguardando conexão do robô local.`);
      document.querySelector('[data-target="acompanhamento"]')?.click();
      await load(true);
    }catch(e){text('Não foi possível criar a solicitação: '+(e?.message||'erro de acesso'),true);}
    finally {sending=false;create.disabled=false;}
  }
  create.addEventListener('click',submit);
  const observer=new MutationObserver(()=>{if(!shell.hidden){observer.disconnect();load(true);}});
  if(shell.hidden)observer.observe(shell,{attributes:true,attributeFilter:['hidden']});else load(true);
  document.addEventListener('click',e=>{if(e.target.closest('[data-target="gestao"],[data-target="acompanhamento"]'))setTimeout(()=>load(true),0);});
  window.addEventListener('hashchange',()=>{if(['#gestao','#acompanhamento'].includes(location.hash))load(true);});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)load(true);});
  window.DNA_CONSULTA_FILA={parseRows,cpfValid,load};
})();