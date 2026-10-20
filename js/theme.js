(function () {
  'use strict';

  const STORAGE_KEY = 'mop-cnc-theme';
  const VALID = new Set(['light', 'dark', 'system']);
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function getPreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return VALID.has(saved) ? saved : 'light';
    } catch (_) {
      return 'light';
    }
  }

  function resolveTheme(preference) {
    return preference === 'system'
      ? (media.matches ? 'dark' : 'light')
      : preference;
  }

  function applyTheme(preference, persist) {
    const safePreference = VALID.has(preference) ? preference : 'light';
    const resolved = resolveTheme(safePreference);

    document.documentElement.dataset.themePreference = safePreference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, safePreference);
      } catch (_) {
        // O tema continua funcional mesmo quando o navegador bloqueia storage.
      }
    }

    document.querySelectorAll('[data-theme-choice]').forEach((button) => {
      const active = button.dataset.themeChoice === safePreference;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function buildSwitcher() {
    const switcher = document.createElement('div');
    switcher.className = 'theme-switcher';
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', 'Tema da interface');

    const options = [
      ['light', '☀', 'Claro'],
      ['system', '◐', 'Sistema'],
      ['dark', '☾', 'Escuro']
    ];

    for (const [value, icon, label] of options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'theme-choice';
      button.dataset.themeChoice = value;
      button.setAttribute('aria-label', `Tema ${label}`);
      button.setAttribute('title', `Tema ${label}`);
      button.innerHTML = `<span class="theme-choice-icon" aria-hidden="true">${icon}</span><span class="theme-choice-label">${label}</span>`;
      button.addEventListener('click', () => applyTheme(value, true));
      switcher.appendChild(button);
    }

    return switcher;
  }

  function mountSwitcher() {
    if (document.querySelector('.theme-switcher')) return;

    const topbarActions = document.querySelector('.topbar-actions');
    if (topbarActions) {
      topbarActions.prepend(buildSwitcher());
      applyTheme(getPreference(), false);
      return;
    }

    const loginPanel = document.querySelector('.login-panel');
    if (loginPanel) {
      const wrapper = document.createElement('div');
      wrapper.className = 'theme-switcher-login';
      wrapper.appendChild(buildSwitcher());
      loginPanel.appendChild(wrapper);
      applyTheme(getPreference(), false);
    }
  }

  const initialPreference = getPreference();
  applyTheme(initialPreference, false);

  media.addEventListener?.('change', () => {
    if (getPreference() === 'system') applyTheme('system', false);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountSwitcher, { once: true });
  } else {
    mountSwitcher();
  }

  window.MOPTheme = {
    getPreference,
    setPreference: (value) => applyTheme(value, true)
  };
})();
