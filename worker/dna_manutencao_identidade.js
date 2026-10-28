() => {
 'use strict';
 // Extrai CPF, nome e login apenas da tela de manutencao aberta, em memoria.
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
 const visible=e=>Boolean(e&&e.getClientRects().length&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden');
 const exact=(root,which)=>{
   const entries=[];
   for(const e of root.querySelectorAll('label,span,strong,b,div')){
     if(!visible(e))continue;
     const own=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();
     if(normalize(own)!==which&&normalize(own)!==which+':')continue;
     const direct=e.htmlFor?document.getElementById(e.htmlFor):null;
     const parents=[direct,e.parentElement,e.parentElement?.parentElement];
     for(const p of parents){
       if(!p)continue;
       const inp=p.matches?.('input')?[p]:[...p.querySelectorAll('input:not([type=password]):not([type=hidden])')].filter(visible);
       if(inp.length===1 && inp[0].value)entries.push(inp[0].value.trim());
     }
   }
   return [...new Set(entries)];
 };
 const login=[];
 for(const e of document.querySelectorAll('span,strong,b,div,label,td')){
   if(!visible(e))continue;
   const own=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();
   const inner=String(e.textContent||'').replace(/\s+/g,' ').trim();
   for(const t of [own,inner]){
     if(t.length>70)continue;
     const m=t.match(/^Login\s*:\s*([\d._-]{11,32})$/i);
     if(m)login.push(m[1]);
   }
 }
 return {tela_manutencao:normalize(document.body?.innerText?.slice(0,450)||'').includes('manutencao de usuario'),
   cpf:exact(document,'cpf'),nome:exact(document,'nome'),login:[...new Set(login)]};
}