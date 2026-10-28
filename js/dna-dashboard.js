/* CREDVIX DNA | Visao operacional de leitura. NUNCA modifica usuarios ou lotes.
 * As politicas RLS do Supabase determinam quem pode consultar os registros.
 */
(() => {
  'use strict';
  const shell = document.getElementById('dnaShell');
  const client = window.MOP_SUPABASE;
  if (!shell || !client) return;
  const $ = (selector,root=document) => root.querySelector(selector);
  const fmt = value => value ? new Intl.DateTimeFormat('pt-BR', {dateStyle:'short',timeStyle:'short'}).format(new Date(value)) : '—';
  const stage = name => document.querySelector(`[data-stage="${name}"].dna-stage`);
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };
  let busy = false;
  let lastRefresh = 0;
  const allRows = [];
  function ensureArea(name, title) {
    const parent = stage(name);
    if (!parent) return null;
    let area = $(`[data-dna-live="${name}"]`, parent);
    if (area) return area;
    area = make('section','dna-card');
    area.dataset.dnaLive = name;
    area.setAttribute('aria-label',title);
    const head = make('div','dna-table-head');
    const left = make('div');
    left.append(make('h2','',title),make('p','', 'Informações reais do Supabase. Nenhuma permissão é modificada.'));
    const refresh = make('button','dna-button dna-button--ghost','⟳ Atualizar dados');
    refresh.type = 'button';
    refresh.addEventListener('click',() => load(true));
    head.append(left,refresh);
    const stats = make('p','dna-subcopy','Carregando dados autorizados…');
    stats.setAttribute('role','status');
    stats.dataset.dnaLiveStatus = '';
    const wrap = make('div','dna-table-shell');
    const table = make('table','dna-table');
    const thead = make('thead');
    const hdr = make('tr');
    for (const name of ['Leitura','Data de importação','Modelo','Divergências','Identidade','Resultado']) hdr.append(make('th','',name));
    thead.append(hdr);
    const body = make('tbody'); body.dataset.dnaLiveRows = '';
    table.append(thead,body); wrap.append(table);
    area.append(head,stats,wrap);
    // Acompanhamento: diagnósticos visuais não representam execução de lotes.
    if (name === 'acompanhamento') parent.insertBefore(area,parent.querySelector('.dna-stepper'));
    else parent.append(area);
    return area;
  }
  function setText(row,text) { if (row) row.textContent=String(text); }
  function drawRows(area,rows) {
    const body = $('[data-dna-live-rows]',area);
    if (!body) return;
    body.replaceChildren();
    for (const r of rows.slice(0,25)) {
      const tr = make('tr');
      const cells = [String(r.id||'').slice(0,8),fmt(r.importado_em),r.perfil==='CONSULTOR'?'Consultor 2':'Supervisor 1',r.divergencias_total ?? '—','Não confirmada',r.resultado==='conforme_visual'?'Conforme na tela':'Divergências visuais'];
      cells.forEach(v=>tr.append(make('td','',v)));
      body.append(tr);
    }
    if (!rows.length) {
      const tr = make('tr'),td = make('td','dna-empty-row','Ainda não existem diagnósticos importados.');
      td.colSpan=6;tr.append(td);body.append(tr);
    }
  }
  function drawSummary(inspections,lotes) {
    const total=inspections.length;
    const conformes=inspections.filter(x=>x.resultado==='conforme_visual').length;
    const divergentes=total-conformes;
    for (const key of ['gestao','acompanhamento']) {
      const area=ensureArea(key,key==='gestao'?'Diagnósticos registrados':'Acompanhamento de diagnósticos');
      if (!area) continue;
      setText($('[data-dna-live-status]',area),
        `${total} leitura(s) exibida(s) · ${conformes} conforme(s) visualmente · ${divergentes} com divergências · ${lotes.length} solicitação(ões) de conferência. Nenhuma alteração de permissões autorizada.`);
      drawRows(area,inspections);
    }
    // Painel Gestão: números de lotes reais, sem misturar com inspeções.
    const cards = stage('gestao')?.querySelectorAll('.dna-stat-grid .dna-stat-card')||[];
    if (cards.length>=4) {
      const counts = ['aguardando_worker','em_consulta','concluido','revisao'].map(s=>lotes.filter(l=>l.status===s).length);
      cards.forEach((el,i) => {if (i<4) setText(el.querySelector('strong'),counts[i]);});
      const subs=['Consultas aguardando worker','Consultas em andamento','Consultas encerradas','Consultas em revisão'];
      cards.forEach((el,i)=>{if(i<4)setText(el.querySelector('small'),subs[i]);});
    }
    // Auditoria: 'Verificados' seria incorreto sem identificação externa.
    const auditCards = stage('auditoria')?.querySelectorAll('.dna-stat-grid--audit .dna-stat-card')||[];
    if(auditCards.length>=4) {
      const labels=['Lotes registrados','Leituras visuais','Identidades não verificadas','Última importação'];
      const values=[lotes.length,total,total,inspections.length?fmt(inspections[0].importado_em):'—'];
      auditCards.forEach((el,i)=>{setText(el.querySelector('span'),labels[i]);setText(el.querySelector('strong'),values[i]);setText(el.querySelector('small'),i===2?'Nenhum CPF equivale a confirmação de identidade':'Dados reais do Supabase');});
    }
    const audFoot=stage('auditoria')?.querySelectorAll('.dna-audit-foot > div strong')||[];
    if(audFoot[0])setText(audFoot[0],lotes.length);
    if(audFoot[1])setText(audFoot[1],0);
  }
  async function load(force=false) {
    if(shell.hidden || busy || (!force && Date.now()-lastRefresh<10000)) return;
    busy=true;
    const sections=['gestao','acompanhamento'].map((key)=>ensureArea(key,key==='gestao'?'Diagnósticos registrados':'Acompanhamento de diagnósticos')).filter(Boolean);
    try {
      const [a,b] = await Promise.all([
        client.from('dna_inspecoes').select('id,perfil,resultado,divergencias_total,importado_em').order('importado_em',{ascending:false}).limit(100),
        client.from('dna_consulta_lotes').select('id,status,criado_em').order('criado_em',{ascending:false}).limit(100)
      ]);
      if(a.error) throw a.error;
      if(b.error) throw b.error;
      lastRefresh=Date.now();
      drawSummary(a.data||[],b.data||[]);
    } catch(err) {
      sections.forEach(area=>setText($('[data-dna-live-status]',area),'Erro ao consultar dados: '+String(err?.message||err)));
    } finally { busy=false; }
  }
  const observer=new MutationObserver(()=>{if(!shell.hidden){observer.disconnect();load(true);}});
  if(shell.hidden)observer.observe(shell,{attributes:true,attributeFilter:['hidden']});
  else load(true);
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-target]'))setTimeout(()=>load(true),0);
  });
  window.addEventListener('hashchange',()=>load(true));
  window.addEventListener('dna:imported',()=>load(true));
})();