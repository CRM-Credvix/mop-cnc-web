(async function(){
  const D=window.MOP_DATA;
  const user=await D.requireUser();
  if(!user)return;
  const id=new URLSearchParams(location.search).get('id');
  if(!id||!/^\d+$/.test(id)){location.replace('historico.html?acesso=negado');return;}

  let item;
  try{
    const {data,error}=await window.MOP_SUPABASE
      .from('pedidos_mop').select(D.PEDIDO_FIELDS).eq('id',id).maybeSingle();
    if(error||!data){location.replace('historico.html?acesso=negado');return;}
    item=data;
  }catch(error){D.showPageError('Não foi possível carregar o pedido.');return;}

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
  document.getElementById('timeline').innerHTML=labels.map((x,i)=>{
    const cls=i<current?'done':i===current?'current':'future';
    return `<li class="${cls}"><span class="timeline-dot">${i<current?'✓':i+1}</span><strong>${x[1]}</strong><small>${x[2]}</small></li>`;
  }).join('')+(item.status==='erro'
    ? '<li class="current"><span class="timeline-dot">!</span><strong>Erro na emissão</strong><small>O pedido requer verificação.</small></li>' : '');

  try{
    const {data:files,error}=await window.MOP_SUPABASE.from('arquivos_mop')
      .select('id,nome,storage_path').eq('pedido_id',id).order('criado_em');
    if(error)throw error;
    if(!files?.length)return;
    const row=document.createElement('div');
    const label=document.createElement('dt');
    const values=document.createElement('dd');
    label.textContent='Arquivos';
    row.append(label,values);
    document.querySelector('.detail-list').append(row);
    files.forEach(file=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='button button--secondary button--sm';
      button.textContent='Baixar '+file.nome;
      button.addEventListener('click',async()=>{
        button.disabled=true;
        try{
          const {data:blob,error:downloadError}=await window.MOP_SUPABASE.storage
            .from('mop-arquivos').download(file.storage_path);
          if(downloadError)throw downloadError;
          const url=URL.createObjectURL(blob);
          const link=document.createElement('a');
          link.href=url;
          link.download=file.nome;
          document.body.append(link);
          link.click();
          link.remove();
          setTimeout(()=>URL.revokeObjectURL(url),1000);
        }catch(error){D.showPageError('Arquivo indisponível ou acesso não autorizado.');}
        finally{button.disabled=false;}
      });
      values.append(button);
    });
  }catch(error){D.showPageError('Não foi possível consultar os arquivos deste pedido.');}
})();