/* MOP-CNC shell v2026-10-23-01: interface only, never an authorization source. */
(() => {
  'use strict';
  const CACHE_KEY = 'mop-ui-verified-user-v1';
  const MAX_AGE = 8 * 60 * 60 * 1000;
  const ADMIN_EMAIL = 'crm@credvix.com';
  const VERSION = 'v2026-10-23-01';
  const isDna = /(?:^|\/)perfis-dna\.html$/i.test(location.pathname);

  /* A única fonte de rótulos e ordem do menu em todas as páginas do sistema. */
  const menu = Object.freeze([
    { id: 'app', label: 'Nova solicitação', icon: '⌂', href: 'app.html' },
    { id: 'history', label: 'Histórico de emissões', icon: '◷', href: 'historico.html' },
    { id: 'help', label: 'Ajuda', icon: '?', href: 'app.html#ajuda' },
    { id: 'gestao', label: 'Gestão de Perfis DNA', icon: '◇', href: 'perfis-dna.html#gestao', admin: true },
    { id: 'conferencia', label: 'Conferência', icon: '↗', href: 'perfis-dna.html#conferencia', admin: true },
    { id: 'acompanhamento', label: 'Acompanhamento', icon: '⌁', href: 'perfis-dna.html#acompanhamento', admin: true },
    { id: 'auditoria', label: 'Auditoria DNA', icon: '☰', href: 'perfis-dna.html#auditoria', admin: true }
  ]);

  let verifiedEmail = null;
  function normalize(v) { return String(v || '').trim().toLowerCase(); }
  function readCache() {
    try {
      const state = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      if (!state || !state.email || Date.now() - state.when >= MAX_AGE) return null;
      return state.email;
    } catch (_) { return null; }
  }
  let cachedEmail = readCache();
  let displayEmail = cachedEmail;

  function route() {
    if (isDna) {
      const key = location.hash.slice(1).toLowerCase();
      return ['gestao', 'conferencia', 'acompanhamento', 'auditoria'].includes(key) ? key : 'gestao';
    }
    const path = location.pathname.toLowerCase();
    if (path.endsWith('/historico.html')) return 'history';
    if (path.endsWith('/pedido.html')) return 'history';
    if (location.hash === '#ajuda') return 'help';
    return 'app';
  }

  function renderSidebar() {
    const el = document.querySelector('[data-mop-shell-sidebar]');
    if (!el) return;
    const section = (items) => items.map(item => {
      const adminOnSamePage = isDna && item.admin;
      const current = item.id === route();
      const tag = adminOnSamePage ? 'button' : 'a';
      const props = adminOnSamePage
        ? `type="button" data-target="${item.id}"`
        : `href="${item.href}"`;
      const adminClass = adminOnSamePage ? ' dna-side-link' : '';
      const lock = item.id === 'gestao' ? '<small aria-hidden="true">🔒</small>' : '';
      return `<${tag} class="nav-item mop-nav-item${adminClass}${current ? ' active' : ''}" data-mop-route="${item.id}" ${props}${current ? ' aria-current="page"' : ''}><span aria-hidden="true">${item.icon}</span><span class="mop-nav-label">${item.label}</span>${lock}</${tag}>`;
    }).join('');

    const admin = normalize(displayEmail) === ADMIN_EMAIL;
    el.innerHTML = `
      <a class="brand-lockup" href="app.html" aria-label="CREDVIX — início"><span>CRED</span><strong>VIX</strong></a>
      <div class="product-name"><strong>MOP - CNC</strong><span>Sistema de Emissões</span></div>
      <nav class="sidebar-nav mop-primary-nav" aria-label="Emissões">${section(menu.filter(m => !m.admin))}</nav>
      <div class="mop-admin-group" ${admin ? '' : 'hidden'}>
        <p class="dna-nav-group-label">ADMINISTRAÇÃO</p>
        <nav class="sidebar-nav dna-sidebar-nav" aria-label="Administração">${section(menu.filter(m => m.admin))}</nav>
      </div>
      <div class="mop-sidebar-footer" aria-label="Versão da interface"><span class="mop-version-dot" aria-hidden="true"></span><span>~by: fraquinn.<br><small>${VERSION}</small></span></div>`;
  }

  function renderTopbar() {
    const el = document.querySelector('[data-mop-shell-topbar]');
    if (!el) return;
    const routeTitle = {
      app: 'Nova solicitação', history: 'Histórico de emissões', help: 'Ajuda',
      gestao: 'Gestão de Perfis DNA', conferencia: 'Conferência de usuários',
      acompanhamento: 'Acompanhamento do lote', auditoria: 'Auditoria DNA'
    };
    el.innerHTML = `
      <p class="breadcrumb" id="${isDna ? 'dnaBreadcrumb' : 'mopBreadcrumb'}"></p>
      <div class="topbar-actions mop-topbar-actions">
        <div class="user-chip mop-user-chip" aria-live="polite">
          <span class="avatar" aria-hidden="true">CV</span>
          <div class="mop-identity">
            <strong id="userName"></strong>
            <small id="mopUserSubtitle">Identidade em verificação</small>
          </div>
        </div>
        <button class="button button--ghost button--sm" id="logoutButton" type="button">Sair</button>
      </div>`;
    const title = document.getElementById(isDna ? 'dnaBreadcrumb' : 'mopBreadcrumb');
    title.textContent = 'Início › ' + (routeTitle[route()] || routeTitle.app);
    setDisplayedUser(displayEmail);
  }

  function setDisplayedUser(email) {
    const node = document.getElementById('userName');
    const sub = document.getElementById('mopUserSubtitle');
    if (node) node.textContent = email || 'Verificando acesso…';
    if (sub) sub.textContent = email ? (normalize(email) === ADMIN_EMAIL ? 'Administrador • acesso exclusivo' : 'Usuário autenticado') : 'Identidade em verificação';
  }

  function syncRoute() {
    const current = route();
    document.querySelectorAll('[data-mop-route]').forEach(el => {
      const active = el.dataset.mopRoute === current;
      el.classList.toggle('active', active);
      if (active) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
    const crumb = document.getElementById(isDna ? 'dnaBreadcrumb' : 'mopBreadcrumb');
    const currentEl = document.querySelector(`[data-mop-route="${current}"] .mop-nav-label`);
    if (crumb && currentEl) crumb.textContent = 'Início › ' + currentEl.textContent;
  }

  function setUser(user) {
    const email = typeof user === 'string' ? user : user?.email;
    if (!email) return;
    verifiedEmail = email;
    cachedEmail = email;
    displayEmail = email;
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ email, when: Date.now() })); } catch (_) {}
    setDisplayedUser(email);
    const admin = document.querySelector('.mop-admin-group');
    if (admin) admin.hidden = normalize(email) !== ADMIN_EMAIL;
    document.documentElement.classList.remove('mop-shell-loading');
  }

  function clearUser() {
    verifiedEmail = null;
    cachedEmail = null;
    displayEmail = null;
    try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
    const admin = document.querySelector('.mop-admin-group');
    if (admin) admin.hidden = true;
    setDisplayedUser(null);
  }

  function bootstrap() {
    renderSidebar();
    renderTopbar();
    syncRoute();
    /* A identidade guardada é só para apresentação: nunca autoriza ações. */
    if (cachedEmail) document.documentElement.classList.remove('mop-shell-loading');
    const logout = document.getElementById('logoutButton');
    if (logout) logout.addEventListener('click', () => clearUser(), { capture: true });
    /* A página DNA tem verificação própria; o botão usa o mesmo signOut local. */
    if (isDna && logout) logout.addEventListener('click', async () => {
      await window.MOP_SUPABASE.auth.signOut({ scope: 'local' });
      location.replace('index.html');
    });
    window.addEventListener('hashchange', syncRoute);
  }

  window.MOP_SHELL = { VERSION, menu, route, syncRoute, setUser, clearUser };
  if (document.querySelector('[data-mop-shell-sidebar]')) bootstrap();
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  else bootstrap();
})();