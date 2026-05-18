// URL-hash-based share state. Lossless round-trip for primitive sliders, toggles, selects.
//   encodeState({ a: 1.5, b: 'foo', c: true }) -> "?p=eyJhIjoxLjUsImIiOiJmb28iLCJjIjp0cnVlfQ=="
//   decodeState(location.hash) -> { ... }
// Base64-encoded JSON to avoid percent-escaping; '_' and '-' instead of '+' and '/'.

export function encodeState(state) {
  const json = JSON.stringify(state);
  const b64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `#p=${b64}`;
}

export function decodeState(hash) {
  if (!hash || !hash.startsWith('#p=')) return null;
  try {
    let b64 = hash.slice(3).replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return JSON.parse(atob(b64));
  } catch (e) { return null; }
}

export function parseUrlState() { return decodeState(window.location.hash); }

export function applyState(state, sliders) {
  if (!state) return;
  for (const [k, v] of Object.entries(state)) {
    const el = sliders[k];
    if (!el) continue;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// Mount a Share button next to a controls container; on click, encode current state and
// copy the resulting URL to the clipboard.
export function mountShareButton(container, getState, options = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = options.label ?? 'Share';
  btn.setAttribute('aria-label', 'Copy share URL to clipboard');
  btn.style.marginInlineStart = '8px';
  btn.addEventListener('click', async () => {
    const state = getState();
    const hash = encodeState(state);
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    // Always reflect the state in the address bar so the link is
    // shareable even when the clipboard API is unavailable (insecure
    // context, denied permission, headless, unfocused window).
    let copied = false;
    try {
      window.history.replaceState(null, '', hash);
    } catch (e) { /* ignore: file: URL or restricted history */ }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        copied = true;
      }
    } catch (e) { copied = false; }
    const prev = btn.textContent;
    btn.textContent = copied ? 'Copied' : 'URL in address bar';
    setTimeout(() => { btn.textContent = prev; }, 1400);
  });
  container.appendChild(btn);
  return btn;
}
