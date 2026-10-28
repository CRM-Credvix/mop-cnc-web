() => {
 'use strict';
 const norm = s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
 const visible = el=>Boolean(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none');
 const found=[];
 const tables=[...document.querySelectorAll('table')];
 for(let ti=0;ti<tables.length;ti++){
   const table=tables[ti];if(!visible(table))continue;
   const headRows=[...table.querySelectorAll('thead tr')];
   let headers=[];
   if(headRows.length)headers=[...headRows.at(-1).querySelectorAll('th,td')].map(x=>norm(x.textContent));
   else {const row=table.querySelector('tr'); if(row)headers=[...row.querySelectorAll('th,td')].map(x=>norm(x.textContent));}
   const keys=['usuario','nome','loja','perfil','situacao','acoes'];
   const idx=Object.fromEntries(keys.map(key=>[key,headers.indexOf(key)]));
   if(Object.values(idx).some(v=>v<0))continue;
   const rows=[...table.querySelectorAll('tbody tr')];
   const rawRows=rows.length?rows:[...table.querySelectorAll('tr')].slice(1);
   const parsed=[];
   for(let ri=0;ri<rawRows.length;ri++){
     const row=rawRows[ri];if(!visible(row))continue;
     const cells=[...row.querySelectorAll(':scope > td')];
     if(cells.length<headers.length)continue;
     // Acoes legadas do DNA podem ser apenas icones sem title/aria-label.
     // Nunca deduzimos Editar pela posicao (ex.: "ultimo botao da linha").
     const actionSelector='button,a,[role="button"],input[type="button"],input[type="image"]';
     const actions=[...cells[idx.acoes].querySelectorAll(actionSelector)];
     const isEdit = el => {
       const nested=[el,...el.querySelectorAll('i,svg,use,img,span,[data-lucide],[data-icon]')];
       const labels=[];
       for (const node of nested) {
         for (const attr of ['title','aria-label','data-original-title','data-bs-original-title','data-tooltip','alt']) {
           const val=node.getAttribute(attr);if(val)labels.push(norm(val));
         }
       }
       labels.push(norm(el.textContent||''));
       // Mesmo com icone de caneta, nao tocar em acao rotulada como outra operacao.
       if(labels.some(label=>/^(excluir|deletar|bloquear|desbloquear|cancelar|alterar senha|redefinir senha|trocar senha|detalhar|visualizar|ver detalhes|consultar|reativar|renovar|atualizar|reprocessar)(?:$|\s)/.test(label)))return false;
       const explicit=labels.some(label=>/^(editar|editar usuario|edicao de usuario|alterar usuario|manutencao|manutencao de usuario)$/.test(label));
       if(explicit)return true;
       const patterns=[/(?:^|[\s_-])(?:fa|glyphicon|mdi|bi|icon|lucide)[-_](?:edit|pencil(?:-square(?:-o)?)?|square-pen|pen-to-square|user-edit)(?:$|[\s_-])/,
         /^(?:edit|pencil|pencil_square|square-pen|mode_edit)$/];
       const hasEditIcon=nested.some(node=>{
         const signatures=[node.getAttribute('class'),node.getAttribute('data-lucide'),node.getAttribute('data-icon'),
           node.getAttribute('href'),node.getAttribute('xlink:href'),node.getAttribute('ng-click'),node.getAttribute('data-ng-click')];
         return signatures.some(raw=>{
           const value=String(raw||'').toLowerCase();
           if(patterns.some(regex=>regex.test(value)))return true;
           // Atributos de eventos so servem como evidencia se nomeiam a acao, nao por indices.
           return /^(?:[\w$]+\.)*(?:editar|edit|abrirEdicao|manutencaoUsuario)\s*\(/i.test(value);
         });
       });
       // O caractere da caneta e permitido apenas quando e o conteudo do proprio icone.
       const pencilGlyph=nested.some(node=>['✎','✏','✐','🖉'].includes((node.textContent||'').trim()));
       return hasEditIcon||pencilGlyph;
     };
     const edits=actions.map((x,i)=>({i,match:isEdit(x)})).filter(x=>x.match);
     parsed.push({
       row_index:ri, usuario:cells[idx.usuario].textContent.trim(),nome:cells[idx.nome].textContent.trim(),
       loja:cells[idx.loja].textContent.trim(),perfil:cells[idx.perfil].textContent.trim(),
       situacao:cells[idx.situacao].textContent.trim(), editar_index:edits.length===1?edits[0].i:null,
       editar_ambiguo:edits.length>1,
     });
   }
   found.push({table_index:ti,acoes_col_index:idx.acoes,rows:parsed});
 }
 const match = (document.body?.innerText||'').match(/\bTotal\s*:\s*(\d{1,6})\b/i);
 const total=match?Number(match[1]):null;
 const pageIndicators=[...document.querySelectorAll('.pagination,[aria-label="pagination"],[aria-label="Paginação"],.paginator,.ui-paginator')].filter(visible);
 return {resultado_identificado:found.length===1,ambiguidade_tabelas:found.length>1,
  table_index:found.length===1?found[0].table_index:null,
  acoes_col_index:found.length===1?found[0].acoes_col_index:null,
  rows:found.length===1?found[0].rows:[],total_resultados:total,
  paginacao_visivel:pageIndicators.length>0};
}