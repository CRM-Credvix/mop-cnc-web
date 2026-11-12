/* MOP-CNC | cadastro DNA: UI read-only; nunca envia dados pessoais. */
(() => {
 'use strict';
 const client = window.MOP_SUPABASE;
 const shell = document.getElementById('cadastroShell');
 const denied = document.getElementById('cadastroDenied');
 const form = document.getElementById('cadastroForm');
 const $ = id => document.getElementById(id);
 const normalize = value => String(value || '').trim().toLowerCase();
 const digits = value => String(value || '').replace(/\D/g,'');
 let user = null;
 let loading = false;
 function cpfValido(input){
   const cpf = digits(input);
   if(!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf))return false;
   for(let n=9;n<=10;n++){
     let soma=0;for(let i=0;i<n;i++)soma+=Number(cpf[i])*(n+1-i);
     if(Number(cpf[n])!==((soma*10)%11)%10)return false;
   }
   return true;
 }
 const f = name => form.elements.namedItem(name).value.trim();
 function validate(){
   const errors=[];
   const nome=f('nome').replace(/\s+/g,' ');
   const birth=f('nascimento');
   const telefone=digits(f('telefone'));
   if(nome.length<5||!nome.includes(' ')) errors.push('Nome completo inválido.');
   if(!cpfValido(f('cpf'))) errors.push('CPF inválido.');
   if(!birth || !/^\d{4}-\d{2}-\d{2}$/.test(birth) || Number.isNaN(Date.parse(birth)) ||
      new Date(birth+'T12:00:00')>new Date()) errors.push('Nascimento inválido.');
   if(!form.elements.namedItem('email').checkValidity()) errors.push('E-mail inválido.');
   if(!/^\d{10,11}$/.test(telefone)) errors.push('Telefone inválido.');
   if(!['CONSULTOR','SUPERVISOR'].includes(f('perfil')))errors.push('Selecione um perfil.');
   if(![...document.querySelectorAll('input[name="loja"]:checked')].length)errors.push('Selecione uma loja.');
   $('formFeedback').textContent=errors.length?errors.join(' '):'Preenchimento válido. Nenhum dado foi enviado.';
 }
 async function loadLojas(){
   const r=await client.from('franquias_mop').select('codigo,nome').eq('ativo',true).order('nome');
   if(r.error)throw r.error;
   $('lojasLista').replaceChildren();
   for(const loja of r.data||[]){
     const label=document.createElement('label'),box=document.createElement('input'),text=document.createElement('span');
     box.type='checkbox';box.name='loja';box.value=loja.codigo;
     text.textContent=loja.codigo+' — '+loja.nome;label.append(box,text);$('lojasLista').append(label);
   }
   $('lojasInfo').textContent=(r.data||[]).length+' lojas no catálogo. A autorização por usuário será validada no backend antes de liberar qualquer solicitação.';
 }
 const statuses={na_fila:'Na fila',processando:'Processando',aguardando_validacao:'Aguardando validação',ativo:'Ativo',erro:'Erro',revisao:'Revisão obrigatória'};
 async function loadFila(){
   if(loading||!user)return;loading=true;$('atualizar').disabled=true;
   try{
     const r=await client.from('dna_cadastro_solicitacoes')
       .select('id,status,etapa,motivo_publico,atualizado_em')
       .order('criado_em',{ascending:false}).limit(50);
     if(r.error){
       $('filaInfo').textContent=['42P01','PGRST205','42501'].includes(r.error.code)
         ?'A fila de cadastro ainda não está instalada ou autorizada. Nenhuma solicitação foi criada.'
         :'Acompanhamento indisponível. Nenhuma alteração realizada.';
       $('filaRows').replaceChildren();return;
     }
     const rows=r.data||[];$('filaInfo').textContent=rows.length+' solicitação(ões) visível(is) para esta conta.';
     $('filaRows').replaceChildren();
     for(const item of rows){
       const tr=document.createElement('tr');
       const values=[String(item.id).slice(0,8),statuses[item.status]||item.status,item.etapa||'—',
         item.atualizado_em?new Date(item.atualizado_em).toLocaleString('pt-BR'):'—',
         item.motivo_publico||'—'];
       for(const v of values){const td=document.createElement('td');td.textContent=String(v);tr.append(td);}
       $('filaRows').append(tr);
     }
   }catch(_){$('filaInfo').textContent='Acompanhamento indisponível.'}
   finally{loading=false;$('atualizar').disabled=false;}
 }
 async function init(){
   try{
     if(!client)throw Error('Cliente Supabase indisponível');
     const {data,error}=await client.auth.getUser();
     if(error||!data?.user){location.replace('index.html');return;}
     if(normalize(data.user.email)!=='crm@credvix.com'){denied.hidden=false;return;}
     user=data.user; shell.hidden=false;
     window.MOP_SHELL?.setUser(user);
     await Promise.allSettled([loadLojas(),loadFila()]);
   }catch(_){denied.hidden=false;$('lojasInfo').textContent='Falha ao carregar lojas.';}
 }
 $('validar').addEventListener('click',validate);
 form.addEventListener('submit',e=>{e.preventDefault();$('formFeedback').textContent='Cadastro bloqueado até homologação.';});
 $('atualizar').addEventListener('click',loadFila);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user)loadFila();});
 window.setInterval(()=>{if(user&&!document.hidden)loadFila();},30000);
 init();
})();