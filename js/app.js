(async function(){
  const D=window.MOP_DATA;
  const user=await D.requireUser();
  if(!user) return;

  const search=document.getElementById('franchiseSearch');
  const code=document.getElementById('franchiseCode');
  const options=document.getElementById('franchiseOptions');
  const whatsapp=document.getElementById('whatsapp');
  const form=document.getElementById('requestForm');

  function normalize(v){return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function renderOptions(){
    const q=normalize(search.value.trim());
    const list=D.FRANCHISES.filter(f=>!q||normalize(f.codigo+' '+f.nome).includes(q)).slice(0,10);
    options.innerHTML=list.map(f=>`<button type="button" class="combo-option" role="option" data-code="${f.codigo}"><strong>${f.codigo}</strong><span>${f.nome}</span></button>`).join('')||'<div class="empty-state">Nenhuma franquia encontrada.</div>';
    options.hidden=false;
  }

  search.addEventListener('focus',renderOptions);
  search.addEventListener('input',()=>{code.value='';renderOptions();});
  options.addEventListener('click',(e)=>{
    const btn=e.target.closest('[data-code]');
    if(!btn)return;
    const f=D.FRANCHISES.find(x=>x.codigo===btn.dataset.code);
    code.value=f.codigo;
    search.value=`${f.codigo} — ${f.nome}`;
    options.hidden=true;
  });
  document.addEventListener('click',(e)=>{if(!e.target.closest('#franchiseCombobox'))options.hidden=true;});
  whatsapp.addEventListener('input',()=>whatsapp.value=whatsapp.value.replace(/\D/g,'').slice(0,13));

  function validWhats(v){return /^55\d{10,11}$/.test(v);}

  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const f=D.FRANCHISES.find(x=>x.codigo===code.value);
    const fErr=document.getElementById('franchiseError');
    const wErr=document.getElementById('whatsappError');
    const feedback=document.getElementById('requestFeedback');
    const submit=form.querySelector('button[type="submit"]');

    fErr.hidden=!!f;
    wErr.hidden=validWhats(whatsapp.value);
    if(!f||!validWhats(whatsapp.value))return;

    submit.disabled=true;

    const {data,error}=await window.MOP_SUPABASE
      .from('pedidos_mop')
      .insert({
        user_id:user.id,
        franquia_codigo:f.codigo,
        franquia_nome:f.nome,
        whatsapp:whatsapp.value
      })
      .select('id,status')
      .single();

    submit.disabled=false;

    if(error){
      feedback.className='inline-alert error';
      feedback.textContent=error.code==='23505'
        ? 'Já existe uma emissão desta franquia em andamento. Aguarde a conclusão do pedido atual.'
        : 'Não foi possível criar a solicitação. Tente novamente.';
      feedback.hidden=false;
      return;
    }

    feedback.className='inline-alert success';
    feedback.innerHTML=`Pedido <strong>#${data.id}</strong> criado com sucesso. Status inicial: <strong>Na fila</strong>.`;
    feedback.hidden=false;
    form.reset();
    code.value='';
    await render();
  });

  async function render(){
    const {data:list=[],error}=await window.MOP_SUPABASE
      .from('pedidos_mop')
      .select('*')
      .order('criado_em',{ascending:false})
      .limit(50);

    if(error)return;

    const counts={na_fila:0,emitindo:0,enviado:0,erro:0};
    list.forEach(x=>counts[x.status]=(counts[x.status]||0)+1);

    document.getElementById('metricQueue').textContent=counts.na_fila;
    document.getElementById('metricProcessing').textContent=counts.emitindo;
    document.getElementById('metricSent').textContent=counts.enviado;
    document.getElementById('metricError').textContent=counts.erro;

    const recent=list.slice(0,6);
    document.getElementById('recentEmpty').hidden=recent.length>0;
    document.getElementById('recentTableBody').innerHTML=recent.map(x=>`
      <tr>
        <td><strong>#${x.id}</strong></td>
        <td>${D.formatDate(x.criado_em)}</td>
        <td><strong>${x.franquia_codigo}</strong><br><small>${x.franquia_nome}</small></td>
        <td>${x.whatsapp}</td>
        <td>${D.statusBadge(x.status)}</td>
        <td><div class="table-actions"><a class="table-action" href="pedido.html?id=${x.id}" title="Ver detalhes">↗</a></div></td>
      </tr>`).join('');
  }

  await render();
})();
