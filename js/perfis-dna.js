/* CREDVIX DNA | fluxos administrativos: Padronizacao -> Acompanhamento -> Auditoria.
 * Auth real: Supabase Auth + RLS. Nao inclui mais conferencia separada.
 */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const shell=$('dnaShell'), denied=$('dnaDenied');
  if(!shell||!denied)return;
  const stages=['gestao','acompanhamento','auditoria'];
  const models=Object.freeze({
    CONSULTOR_1:{profile:'Consultor',sub:'Consultor 1'},
    CONSULTOR_2:{profile:'Consultor',sub:'Consultor 2'},
    SUPERVISOR_1:{profile:'Supervisor',sub:'Supervisor 1'},
    SUPERVISOR_2:{profile:'Supervisor',sub:'Supervisor 2'}
  });
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
  const stageTitles={gestao:'Padronização de Perfis DNA',acompanhamento:'Acompanhamento da padronização',auditoria:'Histórico de padronizações'};
  function selectedModel(){
    const checked=document.querySelector('input[name="dnaProfile"]:checked');
    return models[checked?.value]?checked.value:'CONSULTOR_2';
  }
  function updateModel(){
    const code=selectedModel(),info=models[code];
    document.querySelectorAll('[data-profile-card]').forEach(el=>{
      el.classList.toggle('active',el.dataset.profileCard===code);
    });
    $('summaryProfileCaps').textContent=info.sub.toLocaleUpperCase('pt-BR');
    $('summaryProfile').textContent=info.profile;
    $('summarySubprofile').textContent=info.sub;
    window.dispatchEvent(new CustomEvent('dna:model-change',{detail:{modelo:code}}));
  }
  function countNames(){
    const count=$('dnaNames').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).length;
    $('dnaCountInline').textContent=count+' colaborador'+(count===1?'':'es');
    $('dnaInputError').hidden=true;
    $('dnaInputError').textContent='';
    $('dnaNames').removeAttribute('aria-invalid');
  }
  function stage(){
    const key=location.hash.replace('#','').toLowerCase();
    return stages.includes(key)?key:'gestao';
  }
  function showStage(key,replace=true){
    const next=stages.includes(key)?key:'gestao';
    document.querySelectorAll('.dna-stage').forEach(el=>{
      el.classList.toggle('active',el.dataset.stage===next);
    });
    document.querySelectorAll('.dna-side-link').forEach(el=>{
      const active=el.dataset.target===next;
      el.classList.toggle('active',active);
      if(active)el.setAttribute('aria-current','page');
      else el.removeAttribute('aria-current');
    });
    if($('dnaBreadcrumb'))$('dnaBreadcrumb').textContent='Início › '+stageTitles[next];
    if(replace&&location.hash!=='#'+next)history.replaceState(null,'','#'+next);
    window.MOP_SHELL?.syncRoute();
    window.dispatchEvent(new CustomEvent('dna:stage-change',{detail:{stage:next}}));
  }
  function bind(){
    document.querySelectorAll('[data-target]').forEach(node=>{
      node.addEventListener('click',()=>showStage(node.dataset.target));
    });
    document.querySelectorAll('input[name="dnaProfile"]').forEach(node=>{
      node.addEventListener('change',updateModel);
    });
    $('dnaNames').addEventListener('input',countNames);
    window.addEventListener('hashchange',()=>showStage(stage(),false));
  }
  async function gate(){
    try{
      const client=window.MOP_SUPABASE;
      if(!client)throw new Error('Autenticação indisponível.');
      const {data,error}=await client.auth.getUser();
      if(error||!data?.user){location.replace('index.html');return;}
      const email=data.user.email||'';
      // Restricao visual adicional: o banco valida administrador nas RPCs e RLS.
      if(normalize(email)!=='crm@credvix.com'){denied.hidden=false;return;}
      window.MOP_SHELL?.setUser(data.user);
      $('userName').textContent=email;
      shell.hidden=false;
      bind();updateModel();countNames();showStage(stage());
    }catch(_){denied.hidden=false;}
  }
  gate();
})();