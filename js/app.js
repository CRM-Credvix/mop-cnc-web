(async function(){
  const D=window.MOP_DATA;
  const user=await D.requireUser();
  if(!user) return;

  const search=document.getElementById('franchiseSearch');
  const code=document.getElementById('franchiseCode');
  const options=document.getElementById('franchiseOptions');
  const form=document.getElementById('requestForm');
  const service=document.getElementById('serviceKind');
  // Valores identicos aos filtros homologados ou previstos no Power BI.
  const produtosPermitidos=new Set(['Antecipação de Benefício','Bmg Card','Cartao Beneficio','CNC','CONSIGNADO','Consignado Privado','FGTS']);
  let availableStores=[];
  let storesLoading=false;
  let storeRequest=0;

  // O formulario deste site cria somente pedidos de extracao Power BI.
  // A operacao CNC legada continua preservada, mas fora deste formulario.
  async function setService(){
    const request=++storeRequest;
    code.value='';
    search.value='';
    options.hidden=true;
    availableStores=[];
    storesLoading=true;
    try{
      const all=await D.loadExtractionFranchises();
      if(request===storeRequest)availableStores=all;
    }catch(error){
      if(request===storeRequest)D.showPageError('Nao foi possivel consultar as lojas de extracao. Tente novamente.');
    }finally{
      if(request===storeRequest)storesLoading=false;
    }
  }
  service.addEventListener('change',setService);
  setService();

  function normalize(v){return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function renderOptions(){
    const q=normalize(search.value.trim());
    const list=availableStores.filter(f=>!q||normalize(f.codigo+' '+f.nome).includes(q)).slice(0,10);
    options.innerHTML=list.map(f=>`<button type="button" class="combo-option" role="option" data-code="${D.escapeHtml(f.codigo)}"><strong>${D.escapeHtml(f.codigo)}</strong><span>${D.escapeHtml(f.nome)}</span></button>`).join('')||'<div class="empty-state">Nenhuma franquia encontrada.</div>';
    options.hidden=false;
  }

  search.addEventListener('focus',renderOptions);
  search.addEventListener('input',()=>{code.value='';renderOptions();});
  options.addEventListener('click',(e)=>{
    const btn=e.target.closest('[data-code]');
    if(!btn)return;
    const f=availableStores.find(x=>x.codigo===btn.dataset.code);
    if(!f)return;
    code.value=f.codigo;
    search.value=`${f.codigo} — ${f.nome}`;
    options.hidden=true;
  });
  document.addEventListener('click',(e)=>{if(!e.target.closest('#franchiseCombobox'))options.hidden=true;});
  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const f=availableStores.find(x=>x.codigo===code.value);
    const fErr=document.getElementById('franchiseError');
    const feedback=document.getElementById('requestFeedback');
    const submit=form.querySelector('button[type="submit"]');

    const product=service.value;
    // Nao permitir pedidos de produtos que nao constam na lista oficial do site.
    const productOK=produtosPermitidos.has(product);
    if(!productOK){
      feedback.className='inline-alert error';
      feedback.textContent='Selecione um dos sete produtos disponiveis.';
      feedback.hidden=false;
    }
    fErr.hidden=!!f;
    if(!f||storesLoading||!productOK)return;
    submit.disabled=true;

    try{
      const {data,error}=await window.MOP_SUPABASE
        .from('pedidos_extracoes_mop')
        .insert({user_id:user.id,franquia_codigo:f.codigo,franquia_nome:f.nome,produto:product})
        .select('id,status').single();
      if(error){
        feedback.className='inline-alert error';
        feedback.textContent=error.code==='23505'
          ? 'Já existe uma solicitação ativa para esta franquia e serviço. Aguarde a conclusão.'
          : error.code==='42501'
          ? 'Acesso negado para esta loja. Atualize a página ou procure o administrador.'
          : error.message?.includes('RATE_LIMIT_MOP')
          ? 'Aguarde 60 segundos entre solicitações.'
          : 'Não foi possível criar a solicitação. Tente novamente.';
        feedback.hidden=false;
        return;
      }
      feedback.className='inline-alert success';
      feedback.innerHTML=`Pedido <strong>EX-${D.escapeHtml(data.id)}</strong> criado com sucesso. <strong>Na fila</strong>. Extração sem WhatsApp.`;
      feedback.hidden=false;
      form.reset();
      code.value='';
      setService();
      await render();
    }catch(error){
      feedback.className='inline-alert error';
      feedback.textContent='Falha de conexão. Consulte o histórico antes de reenviar.';
      feedback.hidden=false;
    }finally{submit.disabled=false;}
  });

  async function render(){
    let list;
    try{list=await D.loadUnifiedOrders(50);}
    catch(error){D.showPageError('Não foi possível carregar as solicitações.');return;}
    const counts={na_fila:0,emitindo:0,extraindo:0,enviado:0,validado:0,erro:0,revisao_manual:0};
    list.forEach(x=>{counts[x.status]=(counts[x.status]||0)+1;});
    document.getElementById('metricQueue').textContent=counts.na_fila;
    document.getElementById('metricProcessing').textContent=counts.emitindo+counts.extraindo;
    document.getElementById('metricSent').textContent=counts.enviado+counts.validado;
    document.getElementById('metricError').textContent=counts.erro+counts.revisao_manual;
    const recent=list.slice(0,6);
    document.getElementById('recentEmpty').hidden=recent.length>0;
    document.getElementById('recentTableBody').innerHTML=recent.map(x=>`
      <tr>
        <td><strong>${D.escapeHtml(D.pedidoNumero(x))}</strong></td>
        <td>${D.formatDate(x.criado_em)}</td>
        <td><strong>${D.escapeHtml(x.franquia_codigo)}</strong><br><small>${D.escapeHtml(x.franquia_nome)} · ${D.escapeHtml(x.produto)}</small></td>
        <td>${D.escapeHtml(x.whatsapp)}</td>
        <td>${D.statusBadge(x.status)}</td>
        <td><div class="table-actions"><a class="table-action" href="${D.pedidoUrl(x)}" title="Ver detalhes">↗</a></div></td>
      </tr>`).join('');
  }
  try{await render();}catch(error){D.showPageError('Falha de conexão ao carregar os pedidos.');}
})();