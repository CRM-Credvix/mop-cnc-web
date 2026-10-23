(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const root=$('dnaShell'), denied=$('dnaDenied');
  const allowedStages=['gestao','conferencia','acompanhamento','auditoria'];
  const state={profile:'CONSULTOR'};
  const templates={
    CONSULTOR:{profile:'Consultor',sub:'Consultor 2'},
    SUPERVISOR:{profile:'Supervisor',sub:'Supervisor 1'}
  };
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
  const names=()=>$('dnaNames').value.split(/\r?\n/).map(s=>s.trim().replace(/\s+/g,' ')).filter(Boolean);
  const showError=(message)=>{const el=$('dnaInputError');el.textContent=message;el.hidden=!message; $('dnaNames').setAttribute('aria-invalid',String(Boolean(message)));};
  function getCurrentTemplate(){return templates[state.profile];}
  function updateProfile(){
    const checked=document.querySelector('input[name="dnaProfile"]:checked');
    state.profile=checked?checked.value:'CONSULTOR';
    document.querySelectorAll('[data-profile-card]').forEach(el=>el.classList.toggle('active',el.dataset.profileCard===state.profile));
    const t=getCurrentTemplate();
    $('summaryProfileCaps').textContent=state.profile;
    $('summaryProfile').textContent=t.profile;
    $('summarySubprofile').textContent=t.sub;
    $('conferencePatternPill').textContent='Padrão '+t.sub;
    $('verificationPatternText').textContent='Padrão de referência: '+t.profile+' → '+t.sub;
    $('progressPatternText').textContent=t.profile+' · '+t.sub;
    document.querySelectorAll('.dna-diff-action').forEach(el=>{
      const consultor=el.dataset.consultor;
      const action=state.profile==='CONSULTOR'?consultor:(consultor==='marcar'?'desmarcar':'marcar');
      el.textContent=action==='marcar'?'Marcar':'Desmarcar';
      el.classList.toggle('dna-pos',action==='marcar');
      el.classList.toggle('dna-neg',action==='desmarcar');
    });
  }
  function updateCounts(){
    const count=names().length;
    $('dnaCountInline').textContent=count+(count===1?' nome informado':' nomes informados');
    $('previewCountText').textContent=count+(count===1?' usuário informado':' usuários informados');
    $('dnaFoundChip').textContent='● '+count+(count===1?' nome na lista':' nomes na lista');
    $('dnaAmbiguousChip').textContent='● Identidades não verificadas';
    $('dnaMissingChip').textContent='● Consulta indisponível';
  }
  function fillConference(){
    const tbody=$('conferenceRows');tbody.replaceChildren();
    const list=names();
    if(!list.length){const tr=tbody.insertRow();const td=tr.insertCell();td.colSpan=5;td.className='dna-empty-row';td.textContent='Nenhum nome informado. Volte à Gestão de Perfis DNA para preparar uma lista.';return;}
    list.forEach(name=>{
      const row=tbody.insertRow();
      [name,'Não consultado','—'].forEach(value=>{row.insertCell().textContent=value;});
      const td=row.insertCell();const badge=document.createElement('span');badge.className='dna-tag dna-tag--blue';badge.textContent='● Aguardando integração';td.appendChild(badge);
      row.insertCell().textContent='Prévia local';
    });
  }
  const stageTitle={
    gestao:'Gestão de Perfis DNA',conferencia:'Conferência de usuários',
    acompanhamento:'Acompanhamento do lote',auditoria:'Auditoria DNA'
  };
  function showStage(stage){
    if(!allowedStages.includes(stage))stage='gestao';
    document.querySelectorAll('.dna-stage').forEach(el=>el.classList.toggle('active',el.dataset.stage===stage));
    document.querySelectorAll('.dna-side-link').forEach(el=>{
      const active=el.dataset.target===stage;el.classList.toggle('active',active);
      if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
    });
    $('dnaBreadcrumb').textContent='Início › '+stageTitle[stage];
    if(stage==='conferencia')fillConference();
    if(location.hash!=='#'+stage)history.replaceState(null,'','#'+stage);
  }
  function validateNames(){
    const list=names();let error='';
    if(!list.length||list.length>50)error='Informe entre 1 e 50 nomes completos, um por linha.';
    else if(list.some(s=>s.length<5||s.length>140||!s.includes(' ')))error='Informe nome e sobrenome de cada usuário (até 140 caracteres por linha).';
    else{
      const seen=new Set();
      for(const s of list){const key=normalize(s);if(seen.has(key)){error='A lista contém nomes repetidos. Corrija a duplicidade para continuar.';break;}seen.add(key);}
    }
    showError(error);
    if(error){$('dnaNames').focus();return false;}
    return true;
  }
  function bind(){
    document.querySelectorAll('[data-target]').forEach(el=>el.addEventListener('click',()=>showStage(el.dataset.target)));
    document.querySelectorAll('input[name="dnaProfile"]').forEach(el=>el.addEventListener('change',updateProfile));
    $('dnaNames').addEventListener('input',()=>{showError('');updateCounts();});
    $('goConference').addEventListener('click',()=>{if(validateNames())showStage('conferencia');});
    window.addEventListener('hashchange',()=>showStage(location.hash.slice(1)));
  }
  async function gate(){
    try{
      const client=window.MOP_SUPABASE;
      if(!client)throw new Error('Falha ao inicializar autenticação');
      const {data,error}=await client.auth.getUser();
      if(error||!data?.user){location.replace('index.html');return;}
      const email=data.user.email||'';
      // Somente visibilidade na interface. Autorização real exige backend, RLS e worker.
      if(normalize(email)!=='crm@credvix.com'){denied.hidden=false;return;}
      window.MOP_SHELL?.setUser(data.user);
      $('userName').textContent=email;
      root.hidden=false;
      updateProfile();updateCounts();fillConference();bind();showStage(location.hash.slice(1));
    }catch(e){denied.hidden=false;}
  }
  gate();
})();