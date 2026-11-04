/* CREDVIX DNA — acompanhamento real e somente leitura da fila de padronizacao.
 * Nao registra lotes, nao reserva tarefas e nao altera usuarios/permissoes.
 * A autorizacao dos dados e garantida por RLS no Supabase.
 */
(() => {
  'use strict';
  const client=window.MOP_SUPABASE;
  const shell=document.getElementById('dnaShell');
  const stage=document.querySelector('.dna-stage[data-stage="gestao"]');
  if(!client || !shell || !stage)return;
  const labels=Object.freeze({
    CONSULTOR_1:'Consultor 1',
    CONSULTOR_2:'Consultor 2',
    SUPERVISOR_1:'Supervisor 1',
    SUPERVISOR_2:'Supervisor 2',
  });
  const statuses=Object.freeze({
    aguardando_worker:'Aguardando agente',
    em_execucao:'Em processamento',
    ja_conforme:'Já conforme',
    confirmado:'Confirmado após verificação',
    bloqueado:'Bloqueado com segurança',
    falha_sem_gravar:'Falha sem gravar',
    revisao:'Revisão obrigatória',
    falha_estado_desconhecido:'Estado incerto — não repetir'
  });
  const el=(tag,className,content)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(content!==undefined)node.textContent=String(content);
    return node;
  };
  let panel=null,modelStatus=null,jobStatus=null,tbody=null,refreshButton=null,loading=false,lastFetch=0;
  const date=value=>value?new Date(value).toLocaleString('pt-BR'):'—';
  function mount(){
    if(panel)return;
    panel=el('section','dna-card');
    panel.id='dnaWebReadOnlyStatus';
    panel.setAttribute('aria-label','Acompanhamento da padronização web');
    panel.style.margin='18px 0';
    const heading=el('div','dna-table-head');
    const left=el('div');
    left.append(el('h2','', 'Integração web — acompanhamento real'),
      el('p','', 'Dados autorizados do Supabase. Este painel não executa alterações.'));
    refreshButton=el('button','dna-button dna-button--ghost','Atualizar');
    refreshButton.type='button';
    refreshButton.addEventListener('click',()=>load(true));
    heading.append(left,refreshButton);
    modelStatus=el('p','dna-subcopy','Consultando habilitação dos modelos…');
    modelStatus.setAttribute('role','status');
    jobStatus=el('p','dna-helper-line','Consultando solicitações…');
    jobStatus.setAttribute('role','status');
    const tableWrap=el('div','dna-table-shell');
    const table=el('table','dna-table');
    const header=table.createTHead().insertRow();
    ['Solicitação','Modelo','Colaborador','CPF (final)','Situação','Atualização'].forEach(name=>{
      header.append(el('th','',name));
    });
    tbody=table.createTBody();
    tableWrap.append(table);
    panel.append(heading,modelStatus,jobStatus,tableWrap);
    const after=stage.querySelector('.dna-layout--primary');
    if(after)after.insertAdjacentElement('afterend',panel);
    else stage.append(panel);
  }
  function cell(row,value){
    row.append(el('td','',value));
  }
  async function load(force=false){
    if(shell.hidden || document.hidden || loading || (!force && Date.now()-lastFetch<12000))return;
    mount();
    loading=true;
    refreshButton.disabled=true;
    try{
      const [modelsResult,batchesResult]=await Promise.all([
        client.from('dna_web_modelos').select('codigo,ativo'),
        client.from('dna_web_lotes').select('id,modelo,total,criado_em').order('criado_em',{ascending:false}).limit(15),
      ]);
      if(modelsResult.error)throw modelsResult.error;
      if(batchesResult.error)throw batchesResult.error;
      const models=Object.fromEntries((modelsResult.data||[]).map(row=>[row.codigo,row.ativo===true]));
      const modelLines=Object.keys(labels).map(id=>labels[id]+': '+(models[id]?'habilitado':'bloqueado'));
      modelStatus.textContent='Modelos de padronização — '+modelLines.join('  ·  ')+'. A disponibilidade do agente Windows em tempo real não é monitorada nesta versão.';
      const batches=batchesResult.data||[];
      let items=[];
      if(batches.length){
        const {data,error}=await client.from('dna_web_itens')
          .select('lote_id,nome,cpf_final4,estado,atualizado_em')
          .in('lote_id',batches.map(row=>row.id));
        if(error)throw error;
        items=data||[];
      }
      const ordered=[...items].sort((a,b)=>new Date(b.atualizado_em||0)-new Date(a.atualizado_em||0));
      const pending=items.filter(x=>x.estado==='aguardando_worker').length;
      const inProgress=items.filter(x=>x.estado==='em_execucao').length;
      const needsReview=items.filter(x=>['revisao','falha_estado_desconhecido'].includes(x.estado)).length;
      jobStatus.textContent='Solicitações exibidas: '+batches.length+' lote(s) · '+pending+' aguardando · '+inProgress+' em execução · '+needsReview+' exigindo revisão. Atualizado '+new Date().toLocaleTimeString('pt-BR')+'.';
      tbody.replaceChildren();
      for(const record of ordered.slice(0,50)){
        const batch=batches.find(b=>b.id===record.lote_id);
        if(!batch)continue;
        const row=tbody.insertRow();
        cell(row,String(batch.id).slice(0,8));
        cell(row,labels[batch.modelo]||batch.modelo);
        cell(row,record.nome||'—');
        cell(row,'•••'+String(record.cpf_final4||''));
        cell(row,statuses[record.estado]||record.estado||'Não identificado');
        cell(row,date(record.atualizado_em));
      }
      if(!tbody.children.length){
        const row=tbody.insertRow(),td=row.insertCell();
        td.colSpan=6;
        td.className='dna-empty-row';
        td.textContent='Nenhuma solicitação de padronização registrada. Os quatro modelos permanecem disponíveis apenas para seleção e conferência.';
      }
      lastFetch=Date.now();
    }catch(_){
      modelStatus.textContent='Não foi possível validar a habilitação dos modelos pelo Supabase.';
      jobStatus.textContent='Acompanhamento temporariamente indisponível. Nenhuma tarefa foi criada ou executada por esta consulta.';
      tbody.replaceChildren();
    }finally{
      loading=false;
      refreshButton.disabled=false;
    }
  }
  const observer=new MutationObserver(()=>{
    if(!shell.hidden){observer.disconnect();load(true);}
  });
  if(shell.hidden)observer.observe(shell,{attributes:true,attributeFilter:['hidden']});
  else load(true);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)load(false);});
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-target="gestao"],[data-target="acompanhamento"]'))load(false);
  });
  window.setInterval(()=>{if(!document.hidden && !shell.hidden)load(false);},30000);
})();