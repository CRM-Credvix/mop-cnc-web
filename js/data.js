window.MOP_DATA = (() => {
  let franchises=[];
  let extractionFranchises=null;
  const PEDIDO_FIELDS='id,numero_usuario,user_id,franquia_codigo,franquia_nome,whatsapp,status,criado_em,iniciado_em,finalizado_em,tentativas,erro_publico';
  const PEDIDO_FIELDS_EXTRACOES='id,user_id,franquia_codigo,franquia_nome,produto,status,criado_em,iniciado_em,finalizado_em,registros,erro_publico';
  const STATUS = {
    na_fila:{label:'Na fila',className:'status-na_fila'},
    emitindo:{label:'Emitindo',className:'status-emitindo'},
    extraindo:{label:'Extraindo',className:'status-emitindo'},
    validado:{label:'Validado (sem envio)',className:'status-enviado'},
    revisao_manual:{label:'Revisão manual',className:'status-erro'},
    enviado:{label:'Enviado',className:'status-enviado'},
    erro:{label:'Erro',className:'status-erro'}
  };

  function escapeHtml(v){
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function pedidoNumero(item){
    return item?.numero_usuario ?? item?.id ?? '—';
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

  async function loadExtractionFranchises(){
    if(extractionFranchises!==null)return extractionFranchises;
    const {data,error}=await window.MOP_SUPABASE.rpc('listar_lojas_extracoes_mop');
    if(error)throw error;
    extractionFranchises=(data||[]).map(x=>({codigo:String(x.codigo),nome:String(x.nome)}));
    return extractionFranchises;
  }

  async function denyAccess(reason){
    franchises=[];
    extractionFranchises=null;
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

  async function loadUnifiedOrders(limit=100){
    const [cnc,ext]=await Promise.all([
      window.MOP_SUPABASE.from('pedidos_mop').select(PEDIDO_FIELDS).order('criado_em',{ascending:false}).limit(limit),
      window.MOP_SUPABASE.from('pedidos_extracoes_mop').select(PEDIDO_FIELDS_EXTRACOES).order('criado_em',{ascending:false}).limit(limit)
    ]);
    if(cnc.error)throw cnc.error;
    if(ext.error)throw ext.error;
    return [
      ...(cnc.data||[]).map(x=>({...x,origem:'cnc',produto:'CNC atual'})),
      ...(ext.data||[]).map(x=>({...x,origem:'extracao',whatsapp:'—',numero_usuario:'EX-'+x.id}))
    ].sort((a,b)=>new Date(b.criado_em)-new Date(a.criado_em));
  }
  function pedidoUrl(x){return 'pedido.html?id='+encodeURIComponent(x.id)+(x.origem==='extracao'?'&tipo=extracao':'');}
  return {loadUnifiedOrders,loadExtractionFranchises,pedidoUrl,PEDIDO_FIELDS_EXTRACOES,get FRANCHISES(){return franchises;},PEDIDO_FIELDS,STATUS,pedidoNumero,formatDate,statusBadge,escapeHtml,showPageError,requireUser};
})();
