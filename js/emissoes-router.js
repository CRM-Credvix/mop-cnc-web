/* MOP-CNC Emissões: soft routing without changing business logic or APIs. */
(() => {
  'use strict';
  const PAGES = Object.freeze({
    'app.html': { key: 'app', script: 'mountApp' },
    'historico.html': { key: 'history', script: 'mountHistory' },
    'pedido.html': { key: 'history', script: 'mountDetail' }
  });
  const cache = new Map();
  const root = document.querySelector('.app-main');
  let activeController = null;
  let generation = 0;
  let authenticatedUser = null;

  function descriptor(url) {
    if (url.origin !== location.origin) return null;
    const file = url.pathname.split('/').pop().toLowerCase();
    return PAGES[file] || null;
  }
  function fileHref(url) { return url.pathname + url.search + url.hash; }
  function currentMain() { return root.querySelector('main.content'); }

  async function template(url, signal) {
    const key = url.pathname;
    if (cache.has(key)) return cache.get(key).cloneNode(true);
    const response = await fetch(`${url.pathname}?mopView=20261023-01`, {
      credentials: 'same-origin', signal, cache: 'default', headers: { 'Accept': 'text/html' }
    });
    if (!response.ok) throw new Error('Falha ao buscar a tela: ' + response.status);
    const documentNew = new DOMParser().parseFromString(await response.text(), 'text/html');
    const main = documentNew.querySelector('main.content');
    if (!main) throw new Error('A página não contém main.content');
    cache.set(key, main);
    return main.cloneNode(true);
  }

  async function mount(url, signal) {
    const desc = descriptor(url);
    if (!desc) return;
    const initializer = window.MOP_EMISSOES?.[desc.script];
    if (typeof initializer !== 'function') throw new Error('Inicializador ausente: ' + desc.script);
    await initializer(authenticatedUser, { signal });
    const hash = url.hash.slice(1);
    if (hash) document.getElementById(hash)?.scrollIntoView({ block: 'start' });
  }

  async function navigate(targetUrl, options = {}) {
    const url = new URL(targetUrl, location.href);
    if (!descriptor(url)) { location.assign(url.href); return; }
    if (url.pathname === location.pathname && url.search === location.search && url.hash !== location.hash) {
      if (options.push !== false) history.pushState({ mopRoute: true }, '', fileHref(url));
      window.MOP_SHELL?.syncRoute();
      const section = url.hash ? document.getElementById(url.hash.slice(1)) : null;
      if (section) section.scrollIntoView({ block: 'start' });
      else scrollTo(0, 0);
      return;
    }
    const turn = ++generation;
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    const existing = currentMain();
    if (existing) existing.setAttribute('aria-busy', 'true');
    try {
      const incoming = await template(url, controller.signal);
      if (turn !== generation || controller.signal.aborted) return;
      const swap = () => {
        currentMain()?.replaceWith(incoming);
        if (options.push !== false) history.pushState({ mopRoute: true }, '', fileHref(url));
        document.title = (url.pathname.endsWith('/historico.html') ? 'Histórico de emissões' : url.pathname.endsWith('/pedido.html') ? 'Detalhes do pedido' : 'Nova solicitação') + ' | MOP - CNC';
        window.MOP_SHELL?.syncRoute();
        scrollTo(0, 0);
      };
      if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        await document.startViewTransition(swap).updateCallbackDone;
      } else swap();
      if (turn !== generation) return;
      incoming.removeAttribute('aria-busy');
      await mount(url, controller.signal);
    } catch (err) {
      if (err?.name === 'AbortError' || turn !== generation) return;
      /* Fail safe: regular navigation still executes each page's original logic. */
      location.assign(url.href);
    } finally {
      if (turn === generation) {
        activeController = null;
        currentMain()?.removeAttribute('aria-busy');
      }
    }
  }

  function interceptClick(event) {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.shiftKey || event.metaKey || event.altKey) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, location.href);
    if (!descriptor(url)) return;
    event.preventDefault();
    void navigate(url.href, { push: true });
  }

  async function boot() {
    try {
      authenticatedUser = await window.MOP_DATA.requireUser();
      if (!authenticatedUser) return;
      window.MOP_SHELL?.setUser(authenticatedUser);
      document.addEventListener('click', interceptClick);
      window.addEventListener('popstate', () => void navigate(location.href, { push: false }));
      const url = new URL(location.href);
      await mount(url, new AbortController().signal);
    } catch (_) {
      window.MOP_DATA.showPageError('Não foi possível inicializar a tela. Recarregue a página.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else void boot();
})();