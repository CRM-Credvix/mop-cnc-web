window.MOP_DATA = (() => {
  let franchises=[];
  const PEDIDO_FIELDS='id,user_id,franquia_codigo,franquia_nome,whatsapp,status,criado_em,iniciado_em,finalizado_em,tentativas';
  const STATUS = {
    na_fila:{label:'Na fila',className:'status-na_fila'},
    emitindo:{label:'Emitindo',className:'status-emitindo'},
    enviado:{label:'Enviado',className:'status-enviado'},
    erro:{label:'Erro',className:'status-erro'}
  };

  function escapeHtml(v){
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function formatDate(v){
    if(!v) return '—';
    return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v));
  }

  function statusBadge(s){
    const st=STATUS[s]||STATUS.na_fila;
    return `<span class="status-badge ${st.className}">${st.label}</span>`;
  }

  function showPageError(message){
    const main=document.querySelector('main');
    if(!main)return;
    let alert=document.getElementById('accessError');
    if(!alert){
      alert=document.createElement('p');
      alert.id='accessError';
      alert.className='inline-alert error';
      alert.setAttribute('role','alert');
      main.prepend(alert);
    }
    alert.textContent=message;
  }

  async function denyAccess(reason){
    franchises=[];
    try{await window.MOP_SUPABASE.auth.signOut({scope:'local'});}
    catch(error){}
    finally{location.replace('index.html?acesso='+reason);}
    return null;
  }

  async function requireUser(){
    try{
      const {data,error}=await window.MOP_SUPABASE.auth.getUser();
      if(error||!data.user){location.replace('index.html');return null;}

      const {data:lojas,error:lojasError}=await window.MOP_SUPABASE
        .from('franquias_mop').select('codigo,nome').order('codigo');
      if(lojasError)return await denyAccess('erro');
      if(!lojas?.length)return await denyAccess('sem-loja');
      franchises=lojas;

      document.querySelectorAll('#userName').forEach(el=>el.textContent=data.user.email||'Usuário');
      document.querySelectorAll('#logoutButton').forEach(el=>{
        el.addEventListener('click',async()=>{
          franchises=[];
          try{await window.MOP_SUPABASE.auth.signOut({scope:'local'});}
          finally{location.replace('index.html');}
        });
      });
      window.MOP_SUPABASE.auth.onAuthStateChange(event=>{
        if(event==='SIGNED_OUT'){franchises=[];location.replace('index.html');}
      });
      window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
      return data.user;
    }catch(error){return await denyAccess('erro');}
  }

  return {get FRANCHISES(){return franchises;},PEDIDO_FIELDS,STATUS,formatDate,statusBadge,escapeHtml,showPageError,requireUser};
})();