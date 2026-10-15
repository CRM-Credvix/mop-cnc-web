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

  document.getElementById('detailId').textContent='#'+D.pedidoNumero(item);
  document.getElementById('detailIdEyebrow').textContent='#'+D.pedidoNumero(item);
  document.getElementById('detailFranchise').textContent=`${item.franquia_codigo} — ${item.franquia_nome}`;
  document.getElementById('detailWhatsapp').textContent=item.whatsapp;
  document.getElementById('detailCreated').textContent=D.formatDate(item.criado_em);
  document.getElementById('detailStatus').innerHTML=D.statusBadge(item.status);

  const labels=[
    ['na_fila','Pedido recebido','Solicitação registrada na fila.'],
    ['emitindo','Emissão iniciada','Sua solicitação está sendo processada.'],
    ['enviado','Arquivo enviado','Arquivo gerado e enviado para o WhatsApp informado.']
  ];
  const order=['na_fila','emitindo','enviado'];
  const isError=item.status==='erro';
  const current=order.indexOf(item.status);

  document.getElementById('timeline').innerHTML=labels.map((x,i)=>{
    let cls;
    if(isError){
      cls=i<2?'done':'future';
    }else{
      cls=i<current?'done':i===current?'current':'future';
    }
    return `<li class="${cls}"><span class="timeline-dot">${cls==='done'?'✓':i+1}</span><strong>${x[1]}</strong><small>${x[2]}</small></li>`;
  }).join('')+(isError
    ? '<li class="current"><span class="timeline-dot">!</span><strong>Erro na emissão</strong><small>A emissão não foi concluída.</small></li>' : '');

  const errorBox=document.getElementById('detailErrorReason');
  const errorText=document.getElementById('detailErrorReasonText');
  if(isError){
    errorText.textContent=item.erro_publico||'Não foi possível concluir a emissão. Tente novamente mais tarde ou entre em contato com o suporte.';
    errorBox.hidden=false;
  }

  try{
    const {data:files,error}=await window.MOP_SUPABASE.from('arquivos_mop')
      .select('id,nome,storage_path').eq('pedido_id',id).order('criado_em');
    if(error)throw error;
    if(!files?.length)return;
    const row=document.createElement('div');
    row.className='detail-file-row';
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