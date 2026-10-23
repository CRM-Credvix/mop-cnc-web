/* CREDVIX shared shell v2026-10-23-02 — presentation only, not authorization. */
(() => {
  'use strict';
  const CACHE_KEY = 'mop-ui-verified-user-v1';
  const MAX_AGE = 8 * 60 * 60 * 1000;
  const ADMIN_EMAIL = 'crm@credvix.com';
  const VERSION = 'v2026-10-23-02';
  const isDna = /(?:^|\/)perfis-dna\.html$/i.test(location.pathname);
  const routes = ['gestao', 'conferencia', 'acompanhamento', 'auditoria'];
  const menu = Object.freeze([
    {id:'app',label:'Nova solicitação',icon:'⌂',href:'app.html'},
    {id:'history',label:'Histórico de emissões',icon:'◷',href:'historico.html'},
    {id:'multi',label:'MOP MultiExtrações',icon:'▤',href:'multiextracoes.html'},
    {id:'help',label:'Ajuda',icon:'?',href:'app.html#ajuda'},
    {id:'gestao',label:'Gestão de Perfis DNA',icon:'◇',href:'perfis-dna.html#gestao',admin:true},
    {id:'conferencia',label:'Conferência',icon:'↗',href:'perfis-dna.html#conferencia',admin:true},
    {id:'acompanhamento',label:'Acompanhamento',icon:'⌁',href:'perfis-dna.html#acompanhamento',admin:true},
    {id:'auditoria',label:'Auditoria DNA',icon:'☰',href:'perfis-dna.html#auditoria',admin:true}
  ]);

  const normalize = value => String(value||'').trim().toLowerCase();
  function readCache() {
    try {
      const s = JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');
      if (!s || !s.email || Date.now()-s.when>=MAX_AGE || s.when>Date.now()) return null;
      return String(s.email);
    } catch (_) { return null; }
  }
  let cachedEmail = readCache();
  let displayEmail = cachedEmail;
  let verifiedEmail = null;
  const $ = selector => document.querySelector(selector);

  function route() {
    if (isDna) {
      const key=location.hash.slice(1).toLowerCase();
      return routes.includes(key)?key:'gestao';
    }
    const path=location.pathname.toLowerCase();
    if (path.endsWith('/historico.html')||path.endsWith('/pedido.html')) return 'history';
    if (path.endsWith('/multiextracoes.html')) return 'multi';
    return location.hash==='#ajuda'?'help':'app';
  }

  function menuItem(item) {
    const sameDocument=isDna&&item.admin;
    const tag=sameDocument?'button':'a';
    const attributes=sameDocument?`type="button" data-target="${item.id}"`:`href="${item.href}"`;
    const current=item.id===route();
    const label=item.label;
    return `<${tag} class="mop-nav__item${sameDocument?' dna-side-link':''}${current?' is-active':''}" data-mop-route="${item.id}" ${attributes} title="${label}" aria-label="${label}"${current?' aria-current="page"':''}>
      <span class="mop-nav__icon" aria-hidden="true">${item.icon}</span>
      <span class="mop-nav__label">${label}</span>
      ${item.id==='gestao'?'<span class="mop-nav__badge" aria-hidden="true">🔒</span>':''}
    </${tag}>`;
  }

  function renderSidebar() {
    const host=$('[data-mop-shell-sidebar]');
    if (!host) return;
    const adminCached=normalize(displayEmail)===ADMIN_EMAIL;
    host.innerHTML=`
      <div class="mop-nav__backdrop" data-mop-nav-dismiss aria-hidden="true"></div>
      <div class="mop-nav__panel" id="mop-nav-panel">
        <a class="mop-nav__brand" href="app.html" aria-label="CREDVIX — início"><span>CRED</span><strong>VIX</strong></a>
        <div class="mop-nav__product"><strong>MOP - CNC</strong><span>Sistema de Emissões</span></div>
        <nav class="mop-nav__links" aria-label="Emissões">${menu.filter(item=>!item.admin).map(menuItem).join('')}</nav>
        <section class="mop-nav__admin" ${adminCached?'':'hidden'} aria-label="Administração">
          <h2 class="mop-nav__section">ADMINISTRAÇÃO</h2>
          <nav class="mop-nav__links" aria-label="Administração">${menu.filter(item=>item.admin).map(menuItem).join('')}</nav>
        </section>
        <div class="mop-nav__footer"><span class="mop-nav__status" aria-hidden="true"></span><span>~by: fraquinn.<small>${VERSION}</small></span></div>
      </div>`;
    host.querySelector('[data-mop-nav-dismiss]').addEventListener('click',closeDrawer);
    host.querySelectorAll('.mop-nav__item').forEach(link=>{
      link.addEventListener('click',()=>{if(window.matchMedia('(max-width: 639px)').matches)closeDrawer();});
    });
  }

  function renderTopbar() {
    const el=$('[data-mop-shell-topbar]');
    if (!el) return;
    el.innerHTML=`
      <div class="mop-topbar__leading">
        <button class="mop-nav__toggle" type="button" aria-controls="mop-nav-panel" aria-expanded="false" aria-label="Abrir menu" title="Abrir menu"><span aria-hidden="true">☰</span></button>
        <p class="breadcrumb" id="${isDna?'dnaBreadcrumb':'mopBreadcrumb'}"></p>
      </div>
      <div class="topbar-actions mop-topbar-actions">
        <div class="user-chip mop-user-chip" aria-live="polite">
          <span class="avatar" aria-hidden="true">CV</span>
          <div class="mop-identity"><strong id="userName"></strong><small id="mopUserSubtitle">Identidade em verificação</small></div>
        </div>
        <button class="button button--ghost button--sm" id="logoutButton" type="button">Sair</button>
      </div>`;
    const toggle=$('.mop-nav__toggle');
    toggle?.addEventListener('click',()=>document.body.classList.contains('mop-nav--open')?closeDrawer():openDrawer());
    setDisplayedUser(displayEmail);
    syncRoute();
  }

  function setDisplayedUser(email) {
    const node=$('#userName'),sub=$('#mopUserSubtitle');
    if (node) node.textContent=email||'Verificando acesso…';
    if (sub) sub.textContent=email
      ? (normalize(email)===ADMIN_EMAIL?'Administrador • acesso exclusivo':'Usuário autenticado')
      : 'Identidade em verificação';
  }

  function syncRoute() {
    const current=route();
    document.querySelectorAll('.mop-nav__item').forEach(el=>{
      const active=el.dataset.mopRoute===current;
      el.classList.toggle('is-active',active);
      if(active)el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current');
    });
    const crumb=$(`#${isDna?'dnaBreadcrumb':'mopBreadcrumb'}`);
    const active=$('.mop-nav__item[aria-current="page"] .mop-nav__label');
    if(crumb)crumb.textContent='Início › '+(active?.textContent||'Nova solicitação');
  }

  function openDrawer() {
    document.body.classList.add('mop-nav--open');
    const toggle=$('.mop-nav__toggle');
    if(toggle){toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Fechar menu');}
    const first=$('.mop-nav__item[aria-current="page"]')||$('.mop-nav__item');
    first?.focus({preventScroll:true});
  }
  function closeDrawer() {
    const wasOpen=document.body.classList.contains('mop-nav--open');
    document.body.classList.remove('mop-nav--open');
    const toggle=$('.mop-nav__toggle');
    if(toggle){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menu');}
    if(wasOpen)toggle?.focus({preventScroll:true});
  }

  function setUser(user) {
    const email=typeof user==='string'?user:user?.email;
    if(!email)return;
    verifiedEmail=email;displayEmail=email;cachedEmail=email;
    try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({email,when:Date.now()}));}catch(_){}
    setDisplayedUser(email);
    const admin=$('.mop-nav__admin');
    if(admin)admin.hidden=normalize(email)!==ADMIN_EMAIL;
    document.documentElement.classList.remove('mop-shell-loading');
    if(document.body.classList.contains('mop-nav--open'))closeDrawer();
  }
  function clearUser() {
    verifiedEmail=null;cachedEmail=null;displayEmail=null;
    try{sessionStorage.removeItem(CACHE_KEY);}catch(_){}
    const admin=$('.mop-nav__admin');if(admin)admin.hidden=true;
    closeDrawer();setDisplayedUser(null);
  }

  function bootstrap() {
    renderSidebar();renderTopbar();syncRoute();
    if(cachedEmail)document.documentElement.classList.remove('mop-shell-loading');
    const logout=$('#logoutButton');
    if(logout){
      logout.addEventListener('click',clearUser,{capture:true});
      if(isDna)logout.addEventListener('click',async()=>{await window.MOP_SUPABASE.auth.signOut({scope:'local'});location.replace('index.html');});
    }
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&document.body.classList.contains('mop-nav--open')){event.preventDefault();closeDrawer();}
      if(event.key==='Tab'&&document.body.classList.contains('mop-nav--open')){
        const focusables=[...document.querySelectorAll('.mop-nav__panel a,.mop-nav__panel button')].filter(x=>!x.closest('[hidden]'));
        if(!focusables.length)return;
        const first=focusables[0],last=focusables[focusables.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    window.matchMedia('(min-width: 640px)').addEventListener?.('change',closeDrawer);
    window.addEventListener('hashchange',()=>{syncRoute();closeDrawer();});
  }
  window.MOP_SHELL={VERSION,menu,route,syncRoute,setUser,clearUser,closeDrawer};
  if($('[data-mop-shell-sidebar]'))bootstrap();
  else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap,{once:true});
  else bootstrap();
})();