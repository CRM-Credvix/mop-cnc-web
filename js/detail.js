(async function(){
  const D=window.MOP_DATA;
  const user=await D.requireUser();
  if(!user)return;

  const id=new URLSearchParams(location.search).get('id');
  if(!id){location.href='historico.html';return;}

  const {data:item,error}=await window.MOP_SUPABASE
    .from('pedidos_mop')
    .select('*')
    .eq('id',id)
    .single();

  if(error||!item){location.href='historico.html';return;}

  document.getElementById('detailId').textContent='#'+item.id;
  document.getElementById('detailIdEyebrow').textContent='#'+item.id;
  document.getElementById('detailFranchise').textContent=`${item.franquia_codigo} — ${item.franquia_nome}`;
  document.getElementById('detailWhatsapp').textContent=item.whatsapp;
  document.getElementById('detailCreated').textContent=D.formatDate(item.criado_em);
  document.getElementById('detailStatus').innerHTML=D.statusBadge(item.status);

  const labels=[
    ['na_fila','Pedido recebido','Solicitação registrada na fila.'],
    ['emitindo','Emissão iniciada','O worker assumiu o pedido.'],
    ['enviado','Arquivo enviado','MOP concluído e enviado ao WhatsApp.']
  ];

  const order=['na_fila','emitindo','enviado'];
  let current=order.indexOf(item.status);
  if(item.status==='erro')current=1;

  document.getElementById('timeline').innerHTML=
    labels.map((x,i)=>{
      const cls=i<current?'done':i===current?'current':'future';
      return `<li class="${cls}"><span class="timeline-dot">${i<current?'✓':i+1}</span><strong>${x[1]}</strong><small>${x[2]}</small></li>`;
    }).join('')+
    (item.status==='erro'
      ? '<li class="current"><span class="timeline-dot">!</span><strong>Erro na emissão</strong><small>O pedido requer verificação.</small></li>'
      : '');
})();
