/* CREDVIX DNA | unica fila de padronizacao, vinculada aos 4 modelos.
 * CPF completo nunca e exibido na listagem, nem guardado em localStorage.
 * Nenhuma tarefa pode ser criada enquanto o banco mantiver o modelo inativo.
 * O motor Windows compara antes, grava no maximo uma vez e valida em nova sessao.
 */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const client=window.MOP_SUPABASE;
  const shell=$('dnaShell');
  if(!client||!shell||!$('dnaSubmit'))return;
  const labels=Object.freeze({
    CONSULTOR_1:'Consultor 1',CONSULTOR_2:'Consultor 2',
    SUPERVISOR_1:'Supervisor 1',SUPERVISOR_2:'Supervisor 2'
  });
  const states=Object.freeze({
    aguardando_worker:'Aguardando robô',
    em_execucao:'Em execução',
    ja_conforme:'Já conforme — sem gravar',
    confirmado:'Confirmado após nova sessão',
    bloqueado:'Bloqueado com segurança',
    falha_sem_gravar:'Falha sem gravar',
    revisao:'Revisão obrigatória — não repetir',
    falha_estado_desconhecido:'Estado incerto — não repetir'
  });
  const pending=new Set(['aguardando_worker','em_execucao']);
  const complete=new Set(['ja_conforme','confirmado']);
  const review=new Set(['revisao','falha_estado_desconhecido','bloqueado','falha_sem_gravar']);
  let active=new Set(), ready=false, sending=false, loading=false, retriesDigest='',retryKey='';
  let cachedLotes=[],cachedItems=[];
  let pilotReady=false,pilotCanPrepare=false,pilotState='nao_preparado';
  const selected=()=>document.querySelector('input[name="dnaProfile"]:checked')?.value||'';
  const fmtDate=s=>s?new Date(s).toLocaleString('pt-BR'):'—';
  const safeText=(node,v)=>{node.textContent=String(v??'—');};
  function message(content,bad=false){
    safeText($('dnaSubmitInfo'),content);
    $('dnaSubmitInfo').classList.toggle('dna-padronizacao-error',bad);
  }
  function cpfValid(cpf){
    if(!/^\d{11}$/.test(cpf)||/^(\d)\1{10}$/.test(cpf))return false;
    for(let count=9;count<=10;count++){
      let sum=0;
      for(let i=0;i<count;i++)sum+=Number(cpf[i])*(count+1-i);
      if(Number(cpf[count])!==((sum*10)%11)%10)return false;
    }
    return true;
  }
  function parseRows(){
    const raw=$('dnaNames').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    if(raw.length<1||raw.length>50)throw Error('Informe entre 1 e 50 colaboradores.');
    const seen=new Set();
    return raw.map((line,i)=>{
      const parts=line.split(';').map(x=>x.trim());
      if(parts.length!==2)throw Error('Linha '+(i+1)+': use CPF; Nome completo.');
      const cpf=parts[0].replace(/\D/g,'');
      const nome=parts[1].replace(/\s+/g,' ');
      if(!cpfValid(cpf))throw Error('CPF inválido na linha '+(i+1)+'.');
      if(nome.length<5||nome.length>140||!nome.includes(' '))
        throw Error('Nome completo inválido na linha '+(i+1)+'.');
      if(seen.has(cpf))throw Error('CPF repetido na lista. Cada colaborador pode aparecer uma única vez por solicitação.');
      seen.add(cpf);
      return {cpf,nome};
    });
  }
  function informError(err){
    const box=$('dnaInputError');
    box.hidden=false;
    safeText(box,err?.message||'Verifique os dados dos colaboradores.');
    $('dnaNames').setAttribute('aria-invalid','true');
  }
  function available(){
    const code=selected(),pilotCode=code==='CONSULTOR_2'&&!active.has(code);
    const allowed=ready&&(active.has(code)||(pilotCode&&pilotReady));
    $('dnaSubmit').disabled=sending||!allowed;
    safeText($('summaryWebStatus'),allowed?(pilotCode?'Piloto único autorizado':'Modelo habilitado'):'Em homologação');
    safeText($('dnaModelAvailability'),allowed?
      (pilotCode?'Piloto autorizado para um colaborador. Confirme APLICAR CONSULTOR_2 e envie uma vez.':
        'Modelo habilitado para solicitações autorizadas.'):
      'Execução web indisponível para este modelo até homologação.');
    safeText($('dnaExecutionBadge'),allowed?'🛡 Piloto restrito autorizado':'🛡 Execução web em homologação');
    const area=$('dnaPilotArea');
    area.hidden=!pilotCode;
    $('dnaPilotAuthorize').disabled=!ready||sending||!pilotCanPrepare||!pilotCode;
    let note='Estado do piloto: '+pilotState+'.';
    if(pilotState==='nao_preparado')note+=' Autorize somente quando o agente estiver pronto para executar o teste.';
    if(pilotState==='preparado')note+=' Autorizado por 30 minutos para CPF e nome informados.';
    if(pilotState==='consumido')note+=' Solicitação já criada. Não é possível criar outro lote com essa autorização.';
    if(pilotState==='expirado')note+=' Autorização expirada e não renovável automaticamente.';
    safeText($('dnaPilotNotice'),note);
  }
  function selectedChanged(){
    const code=selected();
    if(!Object.hasOwn(labels,code)){ready=false;available();return;}
    safeText($('dnaConfirmHelp'),'Confirmação: digite APLICAR '+code);
    $('dnaConfirm').placeholder='APLICAR '+code;
    $('dnaConfirm').value='';
    available();
  }
  async function loadModels(){
    ready=false;pilotReady=false;pilotCanPrepare=false;available();
    try{
      const [modelsResult,pilotResult]=await Promise.all([
        client.from('dna_web_modelos').select('codigo,ativo'),
        client.rpc('dna_web_status_piloto')
      ]);
      if(modelsResult.error)throw modelsResult.error;
      if(pilotResult.error)throw pilotResult.error;
      active=new Set((modelsResult.data||[]).filter(x=>x.ativo===true).map(x=>x.codigo));
      const status=pilotResult.data||{};
      pilotReady=status.pode_enviar===true&&status.modelo==='CONSULTOR_2';
      pilotCanPrepare=status.pode_preparar===true;
      pilotState=status.estado||'nao_identificado';
      ready=true;available();
    }catch(_){
      ready=false;active.clear();pilotReady=false;pilotCanPrepare=false;
      pilotState='indisponivel';available();
      message('Não foi possível validar a autorização do piloto. Nenhuma solicitação pode ser enviada.',true);
    }
  }
  async function authorizePilot(){
    if(!ready||!pilotCanPrepare||selected()!=='CONSULTOR_2'||sending)return;
    let rows;
    try{
      rows=parseRows();
      if(rows.length!==1)throw Error('O piloto exige exatamente um colaborador.');
      if($('dnaPilotText').value.trim()!=='AUTORIZAR PILOTO CONSULTOR_2')
        throw Error('Digite exatamente AUTORIZAR PILOTO CONSULTOR_2.');
      $('dnaInputError').hidden=true;
    }catch(err){informError(err);message(err.message,true);return;}
    sending=true;available();
    message('Registrando autorização de uso único no Supabase...');
    try{
      const {error}=await client.rpc('dna_web_autorizar_piloto',{
        p_cpf:rows[0].cpf,p_nome:rows[0].nome,
        p_confirmacao:'AUTORIZAR PILOTO CONSULTOR_2'
      });
      if(error)throw error;
      $('dnaPilotText').value='';
      message('Autorização criada. Prazo de 30 minutos: confirme APLICAR CONSULTOR_2 e solicite a padronização.');
      await loadModels();
    }catch(_){
      message('Não foi possível confirmar a autorização. Consulte o estado do piloto antes de repetir a tentativa.',true);
      await loadModels();
    }finally{sending=false;available();}
  }
  function cell(row,value){
    const td=row.insertCell();
    safeText(td,value);
  }
  function renderRows(tbody,items){
    tbody.replaceChildren();
    for(const item of items){
      const lote=cachedLotes.find(x=>x.id===item.lote_id);
      if(!lote)continue;
      const tr=tbody.insertRow();
      cell(tr,String(lote.id).slice(0,8));
      cell(tr,labels[lote.modelo]||'Não identificado');
      cell(tr,item.nome);
      cell(tr,'•••'+item.cpf_final4);
      cell(tr,states[item.estado]||item.estado||'Estado inválido');
      cell(tr,fmtDate(item.atualizado_em));
    }
    if(!tbody.children.length){
      const tr=tbody.insertRow(),td=tr.insertCell();
      td.colSpan=6;td.className='dna-empty-row';
      td.textContent='Nenhuma solicitação de padronização registrada.';
    }
  }
  function updateMetrics(){
    let waiting=0,running=0,completed=0,needsReview=0;
    for(const item of cachedItems){
      if(item.estado==='aguardando_worker')waiting++;
      if(item.estado==='em_execucao')running++;
      if(complete.has(item.estado))completed++;
      if(review.has(item.estado))needsReview++;
    }
    safeText($('dnaMetricWaiting'),waiting);
    safeText($('dnaMetricRunning'),running);
    safeText($('dnaMetricComplete'),completed);
    safeText($('dnaMetricReview'),needsReview);
    const note=cachedLotes.length+' lote(s) recente(s) · '+cachedItems.length+' colaborador(es) · '+
      waiting+' aguardando · '+running+' em execução · '+needsReview+' em revisão ou bloqueado(s). Atualizado '+new Date().toLocaleTimeString('pt-BR')+'.';
    safeText($('dnaQueueStatus'),note);
    safeText($('dnaAuditStatus'),note);
    safeText($('dnaRecentStatus'),cachedLotes.length?
      'Solicitações recentes. Reexecução permitida somente após a finalização segura da anterior.':
      'Nenhuma padronização solicitada até agora.');
  }
  function updateAudit(){
    const term=$('dnaAuditSearch').value.toLocaleLowerCase('pt-BR').trim();
    const filtered=cachedItems.filter(item=>{
      const lote=cachedLotes.find(x=>x.id===item.lote_id);
      if(!lote)return false;
      const hay=(lote.id+' '+(labels[lote.modelo]||'')+' '+item.nome+' '+(states[item.estado]||''))
        .toLocaleLowerCase('pt-BR');
      return !term||hay.includes(term);
    });
    renderRows($('dnaAuditRows'),filtered.slice(0,150));
  }
  function render(){
    cachedItems.sort((a,b)=>new Date(b.atualizado_em||0)-new Date(a.atualizado_em||0));
    renderRows($('dnaRecentRows'),cachedItems.slice(0,6));
    renderRows($('dnaQueueRows'),cachedItems.slice(0,150));
    updateAudit();
    updateMetrics();
  }
  async function loadQueue(){
    if(shell.hidden||loading)return;
    loading=true;
    $('dnaRefresh').disabled=true;
    $('dnaAuditRefresh').disabled=true;
    try{
      const {data:lotes,error}=await client.from('dna_web_lotes')
        .select('id,modelo,total,criado_em').order('criado_em',{ascending:false}).limit(75);
      if(error)throw error;
      cachedLotes=lotes||[];
      cachedItems=[];
      if(cachedLotes.length){
        const {data,error:itemError}=await client.from('dna_web_itens')
          .select('lote_id,ordem,nome,cpf_final4,estado,atualizado_em')
          .in('lote_id',cachedLotes.map(x=>x.id)).order('atualizado_em',{ascending:false}).limit(3500);
        if(itemError)throw itemError;
        cachedItems=data||[];
      }
      render();
    }catch(_){
      const msg='Não foi possível carregar as solicitações. Os dados anteriores podem estar desatualizados.';
      safeText($('dnaQueueStatus'),msg);
      safeText($('dnaAuditStatus'),msg);
      safeText($('dnaRecentStatus'),msg);
    }finally{
      loading=false;
      $('dnaRefresh').disabled=false;
      $('dnaAuditRefresh').disabled=false;
    }
  }
  async function submit(){
    if(sending||!ready||!(active.has(selected())||(selected()==='CONSULTOR_2'&&pilotReady)))return;
    let rows,code;
    try{
      code=selected();
      if(!Object.hasOwn(labels,code))throw Error('Selecione um modelo válido.');
      rows=parseRows();
      if(!active.has(code)&&rows.length!==1)throw Error('O piloto exige exatamente um colaborador.');
      if($('dnaConfirm').value.trim()!=='APLICAR '+code)
        throw Error('Para confirmar, digite exatamente APLICAR '+code+'.');
      $('dnaInputError').hidden=true;
    }catch(err){informError(err);message(err.message,true);return;}
    const digest=JSON.stringify([code,rows]);
    if(retriesDigest!==digest){retriesDigest=digest;retryKey=crypto.randomUUID();}
    sending=true;available();
    message('Registrando solicitação única... Não clique novamente.');
    try{
      const {data,error}=await client.rpc('dna_web_criar_lote',{
        p_modelo:code,p_itens:rows,p_idempotencia:retryKey,p_confirmacao:'APLICAR '+code
      });
      if(error)throw error;
      $('dnaNames').value='';
      $('dnaConfirm').value='';
      $('dnaNames').dispatchEvent(new Event('input',{bubbles:true}));
      retriesDigest='';retryKey='';
      message('Solicitação '+String(data).slice(0,8)+' registrada. Acompanhe o resultado no menu Acompanhamento.');
      await loadQueue();
      await loadModels();
      document.querySelector('[data-target="acompanhamento"]')?.click();
    }catch(_){
      // A resposta pode ter sido perdida depois do commit no servidor.
      // Reutilizar o mesmo UUID se o operador tentar novamente, mas primeiro consultar o historico.
      message('Não foi possível confirmar o envio. Consulte o acompanhamento antes de tentar novamente; não crie outra solicitação para o mesmo colaborador.',true);
      await loadQueue();
    }finally{
      sending=false;
      available();
    }
  }
  $('dnaSubmit').addEventListener('click',submit);
  $('dnaPilotAuthorize').addEventListener('click',authorizePilot);
  $('dnaRefresh').addEventListener('click',()=>loadQueue());
  $('dnaAuditRefresh').addEventListener('click',()=>loadQueue());
  $('dnaAuditSearch').addEventListener('input',updateAudit);
  window.addEventListener('dna:model-change',selectedChanged);
  window.addEventListener('dna:stage-change',()=>loadQueue());
  const obs=new MutationObserver(()=>{
    if(!shell.hidden){obs.disconnect();selectedChanged();loadModels();loadQueue();}
  });
  if(shell.hidden)obs.observe(shell,{attributes:true,attributeFilter:['hidden']});
  else{selectedChanged();loadModels();loadQueue();}
  window.setInterval(()=>{if(!shell.hidden&&!document.hidden)loadQueue();},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadQueue();});
})();