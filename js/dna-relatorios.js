/* Auditoria DNA: importacao assistida e consultas/exportacao apenas de metadados.
 * Dados de CPF, HMAC e 227 controles nunca entram no CSV ou na tabela.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const picker=$('dnaReportFiles'), upload=$('dnaReportUpload'), reload=$('dnaReportRefresh');
  const info=$('dnaReportInfo'), tbody=$('dnaReportRows'), shell=$('dnaShell');
  const query=$('dnaSearchRecord'), filterProfile=$('dnaFilterProfile'), filterStatus=$('dnaFilterStatus');
  const reset=$('dnaClearFilters'), exportCsv=$('dnaExportCsv');
  const client=window.MOP_SUPABASE;
  if(!picker||!upload||!reload||!info||!tbody||!client||!shell)return;
  let rows=[];
  let loading=false;
  const displayDate=v=>v?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v)):'—';
  const cell=(r,v)=>{const td=r.insertCell();td.textContent=String(v??'—');};
  const shorten=id=>String(id||'').slice(0,8);
  function message(text,error=false){info.textContent=text;info.style.color=error?'#b91c1c':'';}
  function validateReport(r){
    if(!r||r.versao_relatorio!==2||r.gravou_no_dna!==false||
       !['CONSULTOR','SUPERVISOR'].includes(r.perfil)||
       !Array.isArray(r.controles_evidencia)||r.controles_evidencia.length!==227||
       r.identidade_evidencia?.status!=='nao_verificada'){
      throw new Error('Arquivo não é um diagnóstico DNA v2 válido. Gere pelo robô atual.');
    }
    return r;
  }
  const identityLabel=i=>{
    const evidence=i.identidade_evidencia||{};
    const cpf=evidence.validacao_cpf_login?.resultado;
    if (cpf==='cpf_login_coincidem_na_tela')return 'CPF/Login coincidem · não confirmado';
    if (['cpf_invalido','cpf_login_diferentes','leituras_inconsistentes','valores_ambiguos'].includes(cpf))return 'CPF/Login divergentes · revisão';
    if (['candidato_estavel_na_tela','codigo_ou_matricula_candidato'].includes(evidence.parecer))return 'Candidato técnico · não confirmado';
    return 'Identidade não confirmada';
  };
  function filteredRows(){
    const q=(query?.value||'').toLocaleLowerCase('pt-BR').trim();
    const profile=filterProfile?.value||'';
    const status=filterStatus?.value||'';
    return rows.filter(r=>{
      if(q && !(r.id||'').toLowerCase().includes(q) &&
         !String(r.perfil||'').toLowerCase().includes(q) &&
         !(r.perfil==='CONSULTOR'?'consultor 2':'supervisor 1').includes(q))return false;
      if(profile && r.perfil!==profile)return false;
      if(status==='conforme'&&r.resultado!=='conforme_visual')return false;
      if(status==='divergente'&&r.resultado!=='divergencias_visuais')return false;
      if(status==='revisao'&&!identityLabel(r).includes('revisão'))return false;
      return true;
    });
  }
  function render(){
    const data=filteredRows();tbody.replaceChildren();
    for(const item of data){
      const row=tbody.insertRow();
      [shorten(item.id),displayDate(item.importado_em),item.perfil==='CONSULTOR'?'Consultor 2':'Supervisor 1',item.divergencias_total,identityLabel(item),item.resultado==='conforme_visual'?'Conforme na tela':'Divergências visuais'].forEach(v=>cell(row,v));
    }
    if(!data.length){const row=tbody.insertRow(),td=row.insertCell();td.colSpan=6;td.className='dna-empty-row';td.textContent=rows.length?'Nenhum resultado corresponde aos filtros.':'Nenhum diagnóstico real importado.';}
    if (exportCsv)exportCsv.disabled=!data.length;
  }
  async function loadHistory(){
    if(shell.hidden||loading)return;
    loading=true;reload.disabled=true;
    try{
      const {data,error}=await client.from('dna_inspecoes')
        .select('id,perfil,resultado,divergencias_total,identidade_status,identidade_evidencia,importado_em')
        .order('importado_em',{ascending:false}).limit(250);
      if(error)throw error;
      rows=data||[];render();
    }catch(error){message('Não foi possível consultar a auditoria: '+(error?.message||'erro de acesso'),true);}
    finally{reload.disabled=false;loading=false;}
  }
  async function uploadReports(){
    const files=Array.from(picker.files||[]);
    if(!files.length)return message('Selecione os arquivos de diagnóstico, não os modelos.',true);
    if(files.length>10)return message('Importe até 10 relatórios por vez.',true);
    upload.disabled=true;let count=0;
    try{
      for(const file of files){
        if(!file.name.toLowerCase().endsWith('.json')||file.size>180000||file.size<100)throw new Error('Arquivo JSON inválido ou grande demais: '+file.name);
        const report=validateReport(JSON.parse(await file.text()));
        const {error}=await client.rpc('dna_registrar_inspecao',{p_relatorio:report});
        if(error)throw new Error(file.name+': '+error.message);
        count++;
      }
      picker.value='';message(`${count} relatório(s) registrado(s). Diagnóstico somente leitura; identidade não confirmada.`);
      await loadHistory();window.dispatchEvent(new Event('dna:imported'));
    }catch(error){message(`${count} importado(s). `+(error?.message||'Falha no registro.'),true);}
    finally{upload.disabled=false;}
  }
  function csvExport(){
    const dataset=filteredRows();if(!dataset.length)return;
    const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const header=['Leitura','Importação','Perfil','Divergências','Identidade','Resultado'];
    const lines=[header.map(quote).join(';')];
    for(const i of dataset){
      lines.push([shorten(i.id),displayDate(i.importado_em),i.perfil==='CONSULTOR'?'Consultor 2':'Supervisor 1',i.divergencias_total,identityLabel(i),i.resultado==='conforme_visual'?'Conforme na tela':'Divergências visuais'].map(quote).join(';'));
    }
    const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='auditoria_dna_metadados.csv';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),250);
  }
  for(const filter of [query,filterProfile,filterStatus]){
    if(filter)filter.addEventListener(filter.tagName==='INPUT'?'input':'change',render);
  }
  reset?.addEventListener('click',()=>{if(query)query.value='';if(filterProfile)filterProfile.value='';if(filterStatus)filterStatus.value='';render();});
  exportCsv?.addEventListener('click',csvExport);
  picker.addEventListener('change',()=>message(`${picker.files?.length||0} arquivo(s) selecionado(s). Clique em Registrar diagnósticos.`));
  upload.addEventListener('click',uploadReports);reload.addEventListener('click',loadHistory);
  const observer=new MutationObserver(()=>{if(!shell.hidden){observer.disconnect();loadHistory();}});
  if(shell.hidden)observer.observe(shell,{attributes:true,attributeFilter:['hidden']}); else loadHistory();
  document.addEventListener('click',event=>{if(event.target.closest('[data-target="auditoria"]'))setTimeout(loadHistory,0);});
  window.addEventListener('hashchange',()=>{if(location.hash==='#auditoria')loadHistory();});
})();