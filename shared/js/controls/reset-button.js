// reset-button.js
// Single-purpose reset button. Emits CustomEvent('reset') from its container.
// Keyboard shortcut: R (lowercase or shift).

const RESET_KEY = 'r';

export function mountResetButton(container, { label = 'Reset', shortcut = RESET_KEY } = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.setAttribute('aria-label', `${label} (keyboard shortcut: ${shortcut.toUpperCase()})`);
  btn.classList.add('reset-button');
  container.appendChild(btn);

  function emit() {
    container.dispatchEvent(new CustomEvent('reset', { bubbles: true, detail: { source: 'reset-button' } }));
  }

  btn.addEventListener('click', emit);

  function onKey(e) {
    // Ignore keystrokes that originate from typeable inputs so a user typing
    // an 'r' in a text field doesn't fire reset.
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
    if (e.key === shortcut || e.key === shortcut.toUpperCase()) {
      e.preventDefault();
      emit();
    }
  }
  window.addEventListener('keydown', onKey);

  return {
    el: btn,
    destroy() {
      window.removeEventListener('keydown', onKey);
      btn.remove();
    },
  };
}
