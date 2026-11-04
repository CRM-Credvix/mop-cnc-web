/* CREDVIX DNA - fila de padronizacao controlada. O browser nao executa RPA.
 * Sem service_role no frontend. Todos os pedidos passam por RPC com RLS e auditoria.
 */
(() => {
  "use strict";
  const root=document.getElementById("dnaWebExec");
  const shell=document.getElementById("dnaShell");
  const client=window.MOP_SUPABASE;
  if(!root||!shell||!client) return;
  const $=id=>document.getElementById(id);
  const MODELS={CONSULTOR_1:"Consultor 1",CONSULTOR_2:"Consultor 2",
    SUPERVISOR_1:"Supervisor 1",SUPERVISOR_2:"Supervisor 2"};
  let sending=false,enabled=false,key="",signature="";
  let activeModels=new Set();
  const message=(s,bad=false)=>{const e=$("dnaWebInfo");e.textContent=s;e.style.color=bad?"#a23225":"";};
  const chosen=()=>document.querySelector('input[name="dnaProfile"]:checked')?.value||"";
  const date=s=>s?new Date(s).toLocaleString("pt-BR"):"—";
  function cpfValid(raw){
    if(!/^\d{11}$/.test(raw)||/^(\d)\1{10}$/.test(raw))return false;
    for(let n=9;n<=10;n++){
      const sum=[...raw.slice(0,n)].reduce((a,d,i)=>a+Number(d)*(n+1-i),0);
      if(Number(raw[n])!==((sum*10)%11)%10)return false;
    }
    return true;
  }
  function rows(){
    // Mesmos colaboradores da conferencia. O modelo da padronizacao e
    // lido do seletor principal; o login opcional nao entra na fila de escrita.
    const valid=window.DNA_CONSULTA_FILA?.parseRows();
    if(!Array.isArray(valid))throw Error("Validador de colaboradores indisponivel.");
    const seen=new Set();
    return valid.map(x=>{
      if(seen.has(x.cpf))throw Error("CPF repetido no lote de padronizacao.");
      seen.add(x.cpf);
      return {cpf:x.cpf,nome:x.nome};
    });
  }
  let priorModel="";
  function prompt(){
    const current=chosen();
    if(priorModel!==current){$("dnaWebConfirm").value="";priorModel=current;}
    $("dnaWebConfirmHelp").textContent="Para autorizar, digite exatamente APLICAR "+current;
    $("dnaWebConfirm").placeholder="APLICAR "+current;
    $("dnaWebCurrentModel").textContent=MODELS[current]||"Selecione um modelo";
    const total=$("dnaNames").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).length;
    $("dnaWebSelectedCount").textContent=total+" colaborador"+(total===1?"":"es");
  }
  async function refresh(){
    if(shell.hidden)return;
    try{
      const {data:lotes,error:a}=await client.from("dna_web_lotes")
        .select("id,modelo,criado_em,total").order("criado_em",{ascending:false}).limit(20);
      if(a)throw a;
      let itens=[];
      if(lotes?.length){
        const {data,error}=await client.from("dna_web_itens")
          .select("lote_id,ordem,nome,cpf_final4,estado,resultado,atualizado_em")
          .in("lote_id",lotes.map(x=>x.id)).order("ordem");
        if(error)throw error;
        itens=data||[];
      }
      const body=$("dnaWebRows");body.replaceChildren();
      const status={aguardando_worker:"Aguardando agente Windows",em_execucao:"Em execucao",
        ja_conforme:"Ja padronizado",confirmado:"Padronizacao confirmada",
        bloqueado:"Bloqueado com seguranca",falha_sem_gravar:"Falha sem gravar",
        revisao:"Revisao obrigatoria",falha_estado_desconhecido:"Estado incerto - nao repetir"};
      for(const lote of lotes||[]){
        for(const item of itens.filter(x=>x.lote_id===lote.id)){
          const tr=body.insertRow();
          [lote.id.slice(0,8),MODELS[lote.modelo]||lote.modelo,item.nome,
            "•••"+item.cpf_final4,status[item.estado]||item.estado,
            item.resultado?.diferencas_depois??"—",date(item.atualizado_em)]
            .forEach(v=>{const td=tr.insertCell();td.textContent=String(v);});
        }
      }
      if(!body.children.length){
        const tr=body.insertRow();const td=tr.insertCell();
        td.colSpan=7;td.textContent="Nenhuma padronizacao solicitada.";
      }
      $("dnaWebUpdated").textContent="Atualizado: "+new Date().toLocaleTimeString("pt-BR");
    }catch(e){
      $("dnaWebUpdated").textContent="Nao foi possivel consultar a fila: "+String(e?.message||"erro");
    }
  }
  async function ready(){
    enabled=false;$("dnaWebSubmit").disabled=true;
    try{
      const {data,error}=await client.from("dna_web_modelos").select("codigo,ativo");
      if(error)throw error;
      activeModels=new Set((data||[]).filter(x=>x.ativo).map(x=>x.codigo));
      enabled=activeModels.has(chosen());
      $("dnaWebSubmit").disabled=!enabled;
      message(enabled?"Modelo habilitado no banco; confirme que o agente Windows esta conectado.":
        "Os quatro modelos estao disponiveis para selecao. A execucao web deste modelo permanece bloqueada ate homologacao.",!enabled);
    }catch(e){message("Fila de padronizacao indisponivel. Nenhuma gravacao sera enviada.",true);}
  }
  async function submit(){
    if(sending||!enabled)return;
    let modelo,itens;
    try{
      modelo=chosen();
      if(!Object.hasOwn(MODELS,modelo))throw Error("Selecione um modelo valido.");
      itens=rows();
      if($("dnaWebConfirm").value.trim()!=="APLICAR "+modelo)
        throw Error("A confirmacao deve ser APLICAR "+modelo);
    }catch(e){message(e.message,true);return;}
    const digest=JSON.stringify([modelo,itens]);
    if(signature!==digest){signature=digest;key=crypto.randomUUID();}
    sending=true;$("dnaWebSubmit").disabled=true;
    message("Registrando solicitacao unica...");
    try{
      const {data,error}=await client.rpc("dna_web_criar_lote",
        {p_modelo:modelo,p_itens:itens,p_idempotencia:key,p_confirmacao:"APLICAR "+modelo});
      if(error)throw error;
      $("dnaWebPessoas").value="";
      $("dnaWebConfirm").value="";
      signature="";key="";
      message("Lote "+String(data).slice(0,8)+" registrado. Nao envie novamente. Acompanhe abaixo.");
      await refresh();
    }catch(e){message("Solicitacao nao concluida; confira o historico antes de tentar novamente. "+String(e?.message||""),true);}
    finally{sending=false;$("dnaWebSubmit").disabled=!enabled;}
  }
  document.querySelectorAll('input[name="dnaProfile"]').forEach(x=>
    x.addEventListener("change",()=>{prompt();ready();}));
  $("dnaNames").addEventListener("input",prompt);
  $("dnaWebSubmit").addEventListener("click",submit);
  $("dnaWebRefresh").addEventListener("click",refresh);
  prompt();
  const obs=new MutationObserver(()=>{if(!shell.hidden){obs.disconnect();ready();refresh();}});
  if(shell.hidden)obs.observe(shell,{attributes:true,attributeFilter:["hidden"]});else{ready();refresh();}
  setInterval(()=>{if(!document.hidden&&!shell.hidden)refresh();},20000);
})();