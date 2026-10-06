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

  function formatDate(v){
    if(!v) return '—';
    return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v));
  }

  function statusBadge(s){
    const st=STATUS[s]||STATUS.na_fila;
    return `<span class="status-badge ${st.className}">${st.label}</span>`;
  }

  async function requireUser(){
    const {data,error}=await window.MOP_SUPABASE.auth.getUser();
    if(error||!data.user){
      location.href='index.html';
      return null;
    }
    document.querySelectorAll('#userName').forEach(el=>el.textContent=data.user.email||'Usuário');
    document.querySelectorAll('#logoutButton').forEach(el=>{
      el.addEventListener('click',async()=>{
        await window.MOP_SUPABASE.auth.signOut();
        location.href='index.html';
      });
    });
    return data.user;
  }

  return {FRANCHISES,STATUS,formatDate,statusBadge,requireUser};
})();
