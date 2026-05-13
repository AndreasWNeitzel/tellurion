// theme-toggle.js
// Cycles document data-theme through 'light', 'dark', 'system'. Persists the
// selection in localStorage under 'portfolio-theme'. Emits CustomEvent('change',
// { detail: { theme } }) on every change.

const STORAGE_KEY = 'portfolio-theme';
const ORDER = ['system', 'light', 'dark'];

function readStored() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return ORDER.includes(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export function mountThemeToggle(container) {
  let theme = readStored();
  applyTheme(theme);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.classList.add('theme-toggle');
  btn.setAttribute('aria-label', 'Cycle theme: light, dark, or system');
  function setLabel() {
    btn.textContent = `Theme: ${theme}`;
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }
  setLabel();
  container.appendChild(btn);

  function cycle() {
    const idx = ORDER.indexOf(theme);
    theme = ORDER[(idx + 1) % ORDER.length];
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage unavailable */ }
    applyTheme(theme);
    setLabel();
    container.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { theme } }));
  }

  btn.addEventListener('click', cycle);

  return {
    el: btn,
    get theme() { return theme; },
    destroy() { btn.remove(); },
  };
}
