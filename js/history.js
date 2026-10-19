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
      all=await D.loadUnifiedOrders(500);
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
      (!q||String(D.pedidoNumero(x)).includes(q)||x.franquia_codigo.includes(q)||x.franquia_nome.toLowerCase().includes(q)||x.whatsapp.includes(q)||x.produto.toLowerCase().includes(q))
    );
    body.innerHTML=rows.map(x=>`
      <tr>
        <td><strong>#${D.escapeHtml(D.pedidoNumero(x))}</strong></td>
        <td>${D.formatDate(x.criado_em)}</td>
        <td><strong>${D.escapeHtml(x.franquia_codigo)}</strong><br><small>${D.escapeHtml(x.franquia_nome)} · ${D.escapeHtml(x.produto)}</small></td>
        <td>${D.escapeHtml(x.whatsapp)}</td>
        <td>${D.statusBadge(x.status)}</td>
        <td><a class="table-action" href="${D.pedidoUrl(x)}">↗</a></td>
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