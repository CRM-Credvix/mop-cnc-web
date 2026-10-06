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
    const {data,error}=await window.MOP_SUPABASE
      .from('pedidos_mop')
      .select('*')
      .order('criado_em',{ascending:false});

    if(error){
      empty.hidden=false;
      empty.textContent='Não foi possível carregar o histórico.';
      return;
    }

    all=data||[];
    render();
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
        <td><strong>#${x.id}</strong></td>
        <td>${D.formatDate(x.criado_em)}</td>
        <td><strong>${x.franquia_codigo}</strong><br><small>${x.franquia_nome}</small></td>
        <td>${x.whatsapp}</td>
        <td>${D.statusBadge(x.status)}</td>
        <td><a class="table-action" href="pedido.html?id=${x.id}">↗</a></td>
      </tr>`).join('');

    empty.hidden=rows.length>0;
  }

  search.addEventListener('input',render);
  status.addEventListener('change',render);
  document.getElementById('clearFilters').addEventListener('click',()=>{
    search.value='';
    status.value='';
    render();
  });

  await load();
})();
