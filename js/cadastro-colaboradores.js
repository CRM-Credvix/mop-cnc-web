/* MOP-CNC | cadastro DNA: envio SOMENTE se banco e backend liberarem. */
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
 let liberado = false;
 let enviando = false;
 let chaveTentativa = '';
 let impressaoTentativa = '';
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
   return errors.length === 0;
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
 async function loadLiberacao() {
   liberado = false;
   $('solicitar').disabled = true;
   try {
     const {data,error} = await client.from('dna_cadastro_config')
       .select('ativo').eq('chave','cadastro_ativo').maybeSingle();
     if (!error && data?.ativo===true) {
       liberado = true;
       $('solicitar').disabled = false;
       $('solicitar').textContent = 'Solicitar cadastro';
       $('avisoBloqueio').textContent = 'O cadastro será registrado na fila segura. A ativação só será confirmada após validação do DNA.';
       return;
     }
   } catch (_) {}
   $('solicitar').textContent = 'Solicitar cadastro (bloqueado)';
   $('avisoBloqueio').textContent = 'Cadastro indisponível até homologação do banco, segurança e robô Windows.';
 }
 async function enviar(event) {
   event.preventDefault();
   if (!liberado || enviando) {
     $('formFeedback').textContent = 'Cadastro bloqueado ou já em processamento.';
     return;
   }
   if (!validate()) return;
   const dados = {
     nome:f('nome').replace(/\s+/g,' '),cpf:digits(f('cpf')),nascimento:f('nascimento'),
     email:f('email'),telefone:digits(f('telefone')),perfil:f('perfil'),
     lojas:[...document.querySelectorAll('input[name="loja"]:checked')].map(x=>x.value)
   };
   const impressao = JSON.stringify(dados);
   if (impressaoTentativa!==impressao) {
     chaveTentativa=crypto.randomUUID();
     impressaoTentativa=impressao;
   }
   enviando=true;$('solicitar').disabled=true;
   $('formFeedback').textContent='Enviando solicitação segura. Não clique novamente.';
   try {
     // A funcao exige Auth + allowlist de UUID, e o SQL exige cadastro_ativo=true.
     const {data,error}=await client.functions.invoke('cadastro-dna-criar',{
       body:{...dados,idempotencia:chaveTentativa}
     });
     if (error || !data?.id) throw Error('SOLICITACAO_NAO_CONFIRMADA');
     $('formFeedback').textContent='Solicitação '+String(data.id).slice(0,8)+' registrada. Acompanhe na tabela abaixo.';
     form.reset();chaveTentativa='';impressaoTentativa='';
     await loadFila();
   } catch (_) {
     // Na falha de rede, a mesma chave de idempotencia sera usada em nova tentativa
     // enquanto o conteudo do formulario nao for alterado.
     $('formFeedback').textContent='Envio não confirmado. Consulte o acompanhamento antes de tentar novamente.';
     await loadFila();
   } finally {
     enviando=false;
     await loadLiberacao();
   }
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
     await Promise.allSettled([loadLojas(),loadFila(),loadLiberacao()]);
   }catch(_){denied.hidden=false;$('lojasInfo').textContent='Falha ao carregar lojas.';}
 }
 $('validar').addEventListener('click',validate);
 form.addEventListener('submit',enviar);
 $('atualizar').addEventListener('click',loadFila);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user)loadFila();});
 window.setInterval(()=>{if(user&&!document.hidden)loadFila();},30000);
 init();
})();