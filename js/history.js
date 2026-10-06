(async function(){
  const D=window.MOP_DATA;
  const user=await D.requireUser();
  if(!user)return;

  const search=document.getElementById('historySearch');
  const status=document.getElementById('statusFilter');
  const body=document.getElementById('historyTableBody');
  const empty=document.getElementById('historyEmpty');
  let all=[];

  async function load(){
    try{
      const {data,error}=await window.MOP_SUPABASE
        .from('pedidos_mop').select(D.PEDIDO_FIELDS)
        .order('criado_em',{ascending:false});
      if(error)throw error;
      all=data||[];
      render();
    }catch(error){
      all=[];
      body.innerHTML='';
      empty.hidden=false;
      empty.textContent='Não foi possível carregar o histórico.';
    }
  }

  function render(){
    const q=search.value.trim().toLowerCase();
    const st=status.value;
    const rows=all.filter(x=>
      (!st||x.status===st)&&
      (!q||String(x.id).includes(q)||x.franquia_codigo.includes(q)||x.franquia_nome.toLowerCase().includes(q)||x.whatsapp.includes(q))
    );
    body.innerHTML=rows.map(x=>`
      <tr>
        <td><strong>#${D.escapeHtml(x.id)}</strong></td>
        <td>${D.formatDate(x.criado_em)}</td>
        <td><strong>${D.escapeHtml(x.franquia_codigo)}</strong><br><small>${D.escapeHtml(x.franquia_nome)}</small></td>
        <td>${D.escapeHtml(x.whatsapp)}</td>
        <td>${D.statusBadge(x.status)}</td>
        <td><a class="table-action" href="pedido.html?id=${encodeURIComponent(x.id)}">↗</a></td>
      </tr>`).join('');
    empty.hidden=rows.length>0;
  }

  search.addEventListener('input',render);
  status.addEventListener('change',render);
  document.getElementById('clearFilters').addEventListener('click',()=>{search.value='';status.value='';render();});
  if(new URLSearchParams(location.search).get('acesso')==='negado'){
    D.showPageError('Pedido indisponível ou acesso não autorizado.');
  }
  await load();
})();