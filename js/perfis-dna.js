(()=>{'use strict';
 const $=id=>document.getElementById(id), root=$('dnaShell'), denied=$('dnaDenied');
 const state={profile:'CONSULTOR',names:[]};
 const names=()=>$('dnaNames').value.split(/\r?\n/).map(s=>s.trim().replace(/\s+/g,' ')).filter(Boolean);
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
 const profiles={CONSULTOR:['Consultor','Consultor 2'],SUPERVISOR:['Supervisor','Supervisor 1']};
 function update(){state.profile=document.querySelector('input[name="dnaProfile"]:checked').value;const [p,sub]=profiles[state.profile];$('dnaSelected').textContent=p;$('dnaSubSelected').textContent=sub;$('dnaCounter').textContent=names().length+' de 50 nomes';$('dnaReviewProfile').textContent=p;$('dnaReviewSub').textContent=sub;}
 function tab(key){document.querySelectorAll('[data-panel]').forEach(x=>x.hidden=x.dataset.panel!==key);document.querySelectorAll('[data-tab]').forEach(x=>{if(x.dataset.tab===key)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')});}
 function prepare(){const list=names();if(list.length<1||list.length>50){$('dnaInputError').textContent='Informe de 1 a 50 nomes completos, um por linha.';$('dnaInputError').hidden=false;return;}if(list.some(v=>v.length<5||!v.includes(' ')||v.length>140)){ $('dnaInputError').textContent='Verifique os nomes. Informe nome e sobrenome, sem linhas incompletas.';$('dnaInputError').hidden=false;return;}const seen=new Set();if(list.some(x=>{const s=normalize(x);if(seen.has(s))return true;seen.add(s);return false})){ $('dnaInputError').textContent='Há nomes repetidos no lote. Revise antes de continuar.';$('dnaInputError').hidden=false;return;}$('dnaInputError').hidden=true;state.names=list;$('dnaReviewCount').textContent=String(list.length);const tbody=$('dnaReviewRows');tbody.replaceChildren();list.forEach((n,i)=>{const row=document.createElement('tr');[String(i+1),n,'Não consultado','Aguardando backend'].forEach(t=>{const td=document.createElement('td');td.textContent=t;row.appendChild(td)});tbody.appendChild(row)});update();tab('conferencia');}
 document.querySelectorAll('[data-tab]').forEach(el=>el.addEventListener('click',()=>tab(el.dataset.tab)));
 document.querySelectorAll('[data-goto]').forEach(el=>el.addEventListener('click',()=>tab(el.dataset.goto)));
 $('dnaNames').addEventListener('input',update);document.querySelectorAll('input[name="dnaProfile"]').forEach(el=>el.addEventListener('change',update));
 $('dnaClear').addEventListener('click',()=>{$('dnaNames').value='';$('dnaInputError').hidden=true;update()});$('dnaReview').addEventListener('click',prepare);
 async function gate(){try{const client=window.MOP_SUPABASE;if(!client)throw new Error('sem cliente');const {data,error}=await client.auth.getUser();if(error||!data?.user){location.replace('index.html');return;}const user=data.user; // UI-only gate. Real backend permissions must be checked by RLS + worker.
 if(normalize(user.email||'')!=='crm@credvix.com'){denied.hidden=false;return;}
 $('userName').textContent=user.email;root.hidden=false;update();$('logoutButton').addEventListener('click',async()=>{await client.auth.signOut({scope:'local'});location.replace('index.html')});
 }catch(err){denied.hidden=false;}}
 gate();
})();