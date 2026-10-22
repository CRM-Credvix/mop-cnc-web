// Navegação visual unificada para a conta administrativa.
// Isto NAO e autorizacao de acesso a dados, APIs ou ao worker: exige RLS e checagem no backend.
(() => {
  'use strict';
  const VERSION = 'v2026-10-22-01';

  function navLink(href, icon, label, selected) {
    const a = document.createElement('a');
    a.className = 'nav-item' + (selected ? ' active' : '');
    a.href = href;
    if (selected) a.setAttribute('aria-current', 'page');
    const glyph = document.createElement('span');
    glyph.setAttribute('aria-hidden', 'true');
    glyph.textContent = icon;
    a.append(glyph, document.createTextNode(label));
    return a;
  }

  function buildNavigation(aside) {
    const path = location.pathname.split('/').pop().toLowerCase();
    const onRequest = path === 'app.html';
    const onHistory = path === 'historico.html' || path === 'pedido.html';

    aside.classList.add('dna-sidebar-shared');
    aside.replaceChildren();

    const logo = document.createElement('a');
    logo.className = 'brand-lockup';
    logo.href = 'app.html';
    logo.setAttribute('aria-label', 'Credvix - voltar a nova solicitação');
    const brand = document.createElement('span');
    brand.textContent = 'CRED';
    const orange = document.createElement('strong');
    orange.textContent = 'VIX';
    logo.append(brand, orange);

    const product = document.createElement('div');
    product.className = 'product-name';
    const productName = document.createElement('strong');
    productName.textContent = 'MOP - CNC';
    const subtitle = document.createElement('span');
    subtitle.textContent = 'Sistema de Emissões';
    product.append(productName, subtitle);

    const mainNav = document.createElement('nav');
    mainNav.className = 'sidebar-nav';
    mainNav.setAttribute('aria-label', 'Navegação principal');
    mainNav.append(
      navLink('app.html', '⌂', 'Nova solicitação', onRequest),
      navLink('historico.html', '◷', 'Histórico de emissões', onHistory),
      navLink('app.html#ajuda', '?', 'Ajuda', false)
    );

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'dna-nav-group-label';
    sectionTitle.textContent = 'ADMINISTRAÇÃO';

    const dnaNav = document.createElement('nav');
    dnaNav.className = 'sidebar-nav dna-sidebar-nav';
    dnaNav.setAttribute('aria-label', 'Módulo Gestão de Perfis DNA');
    const management = navLink('perfis-dna.html#gestao', '🛡', 'Gestão de Perfis DNA', false);
    const lock = document.createElement('small');
    lock.setAttribute('aria-hidden', 'true');
    lock.textContent = '🔒';
    management.appendChild(lock);
    dnaNav.append(
      management,
      navLink('perfis-dna.html#conferencia', '↗', 'Conferência', false),
      navLink('perfis-dna.html#acompanhamento', '⌁', 'Acompanhamento', false),
      navLink('perfis-dna.html#auditoria', '☰', 'Auditoria DNA', false)
    );

    const footer = document.createElement('div');
    footer.className = 'dna-sidebar-footer';
    const dot = document.createElement('span');
    dot.className = 'dna-sidebar-dot dna-sidebar-dot--pending';
    dot.setAttribute('aria-hidden', 'true');
    const footerText = document.createElement('div');
    const footerTitle = document.createElement('strong');
    footerTitle.textContent = 'Gestão de Perfis DNA';
    const author = document.createElement('span');
    author.textContent = '~by: fraquinn.';
    const version = document.createElement('span');
    version.className = 'dna-version-stamp';
    version.textContent = VERSION;
    footerText.append(footerTitle, author, version);
    footer.append(dot, footerText);

    aside.append(logo, product, mainNav, sectionTitle, dnaNav, footer);
    document.body.classList.add('dna-admin-navigation');
    aside.closest('.app-shell')?.classList.add('dna-admin-app-shell');
  }

  async function start() {
    try {
      const authClient = window.MOP_SUPABASE;
      if (!authClient) return;
      const { data, error } = await authClient.auth.getUser();
      if (error || !data?.user) return;
      const email = String(data.user.email || '').trim().toLowerCase();
      if (email !== 'crm@credvix.com') return;
      const sidebar = document.querySelector('.app-shell > aside.sidebar');
      if (sidebar) buildNavigation(sidebar);
    } catch (error) {
      // Falha fechada: mantem o menu original sem mostrar controles administrativos.
    }
  }

  start();
})();