window.MOP_DATA = (() => {
  const FRANCHISES = [
    {codigo:'51545',nome:'HELP! - ES - SÃO MATEUS - CENTRO'},
    {codigo:'51832',nome:'HELP! - ES - COLATINA - CENTRO'},
    {codigo:'53742',nome:'HELP! - ES - ARACRUZ - CENTRO'},
    {codigo:'53743',nome:'HELP! - ES - CARIACICA - CAMPO GRANDE'},
    {codigo:'53749',nome:'HELP! - BA - TEIXEIRA DE FREITAS - CENTRO'},
    {codigo:'53752',nome:'HELP! - ES - SERRA - LARANJEIRAS'},
    {codigo:'54371',nome:'HELP! - MT - RONDONÓPOLIS - CENTRO'},
    {codigo:'54389',nome:'HELP! - GO - ÁGUAS LINDAS DE GOIÁS'},
    {codigo:'54407',nome:'HELP! - DF - BRASÍLIA - CEILÂNDIA SUL'},
    {codigo:'54465',nome:'HELP! - MG - IPATINGA - CENTRO'},
    {codigo:'55329',nome:'HELP! - ES - GUARAPARI - CENTRO'},
    {codigo:'56395',nome:'HELP! - BA - ITABUNA - CENTRO'},
    {codigo:'56620',nome:'HELP! - MG - TEOFILO OTONI - CENTRO'},
    {codigo:'56679',nome:'HELP! - DF - BRASÍLIA - TAGUATINGA'},
    {codigo:'56961',nome:'HELP! - MT - CUIABÁ - CPA 2'},
    {codigo:'57330',nome:'HELP! - ES - VILA VELHA - GLÓRIA'},
    {codigo:'57380',nome:'HELP! - MT - VÁRZEA GRANDE - CRISTO REI II'}
  ];
  const STATUS = {
    na_fila:{label:'Na fila',className:'status-na_fila'},
    emitindo:{label:'Emitindo',className:'status-emitindo'},
    enviado:{label:'Enviado',className:'status-enviado'},
    erro:{label:'Erro',className:'status-erro'}
  };
  const key='mopPrototypeRequests';
  function seed(){
    if(localStorage.getItem(key)) return;
    const now=Date.now();
    const demo=[
      {id:1258,franquia_codigo:'56620',franquia_nome:'HELP! - MG - TEOFILO OTONI - CENTRO',whatsapp:'5527999297823',status:'enviado',createdAt:new Date(now-1000*60*6).toISOString()},
      {id:1257,franquia_codigo:'51545',franquia_nome:'HELP! - ES - SÃO MATEUS - CENTRO',whatsapp:'5527999297823',status:'emitindo',createdAt:new Date(now-1000*60*15).toISOString()},
      {id:1256,franquia_codigo:'56961',franquia_nome:'HELP! - MT - CUIABÁ - CPA 2',whatsapp:'5527999297823',status:'erro',createdAt:new Date(now-1000*60*47).toISOString()},
      {id:1255,franquia_codigo:'53742',franquia_nome:'HELP! - ES - ARACRUZ - CENTRO',whatsapp:'5527999297823',status:'enviado',createdAt:new Date(now-1000*60*84).toISOString()}
    ];
    localStorage.setItem(key,JSON.stringify(demo));
  }
  function getRequests(){seed();return JSON.parse(localStorage.getItem(key)||'[]');}
  function saveRequests(list){localStorage.setItem(key,JSON.stringify(list));}
  function addRequest(f,w){const list=getRequests();const id=Math.max(1258,...list.map(x=>Number(x.id)||0))+1;const item={id,franquia_codigo:f.codigo,franquia_nome:f.nome,whatsapp:w,status:'na_fila',createdAt:new Date().toISOString()};list.unshift(item);saveRequests(list);return item;}
  function updateStatus(id,status){const list=getRequests();const item=list.find(x=>String(x.id)===String(id));if(item){item.status=status;item.updatedAt=new Date().toISOString();saveRequests(list);}return item;}
  function formatDate(v){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v));}
  function statusBadge(s){const st=STATUS[s]||STATUS.na_fila;return `<span class="status-badge ${st.className}">${st.label}</span>`;}
  function userGuard(){const u=sessionStorage.getItem('mopUser');if(!u){location.href='index.html';return null;}document.querySelectorAll('#userName').forEach(el=>el.textContent=u);document.querySelectorAll('#logoutButton').forEach(el=>el.addEventListener('click',()=>{sessionStorage.removeItem('mopUser');location.href='index.html';}));return u;}
  return {FRANCHISES,STATUS,getRequests,saveRequests,addRequest,updateStatus,formatDate,statusBadge,userGuard};
})();
