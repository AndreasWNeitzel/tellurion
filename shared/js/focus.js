// shared/js/focus.js
// Focus-mode controller for the Playground Layout System v2.
//
// A toggle at the top-right of the canvas frame expands the
// simulation to cinema width, slides the rail offscreen, and fades
// out the surrounding chrome. ESC exits. Focus mode is NOT persisted
// (spec 9.5): every playground starts in default mode.
//
// The data-focus attribute on .playground-layout drives all focus
// CSS; this module only flips that attribute, manages the toggle
// button's label/icon/ARIA, moves keyboard focus, and adds
// display:none to the faded sections once their opacity transition
// has finished (so they leave the grid flow cleanly).

const FADE_MS = 250;

// Sections that fade out in focus mode (spec 9.2).
const FADED = [
  '.playground-header', '.playground-intro', '.playground-caption',
  '.playground-what-to-try', '.playground-equations', '.playground-related',
];

const ICON_EXPAND = '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3'
  + 'M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"></path>';
const ICON_COLLAPSE = '<path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3'
  + 'M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"></path>';

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function svgShell(inner) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"'
    + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
}

export function mountFocus() {
  const layout = document.querySelector('.playground-layout');
  if (!layout) return;
  const toggle = layout.querySelector('.playground-focus-toggle');
  if (!toggle) return;
  const canvas = layout.querySelector('.playground-canvas');
  const fadedEls = FADED.flatMap((sel) => Array.from(layout.querySelectorAll(sel)));

  let inFocus = false;
  let hideTimer = 0;

  function enter() {
    if (inFocus) return;
    inFocus = true;
    clearTimeout(hideTimer);
    layout.setAttribute('data-focus', 'true');
    toggle.classList.add('focus-exit');
    toggle.setAttribute('aria-pressed', 'true');
    toggle.setAttribute('aria-label', 'Exit focus mode');
    toggle.innerHTML = svgShell(ICON_COLLAPSE) + '<span class="t-small">Exit</span>';
    // After the fade-out, drop the faded sections from the grid flow.
    const ms = prefersReducedMotion() ? 0 : FADE_MS + 10;
    hideTimer = setTimeout(() => {
      if (inFocus) for (const el of fadedEls) el.style.display = 'none';
    }, ms);
    // Keyboard users land on the canvas (spec 9.6).
    if (canvas && typeof canvas.focus === 'function') {
      if (!canvas.hasAttribute('tabindex')) canvas.setAttribute('tabindex', '-1');
      canvas.focus();
    }
  }

  function exit() {
    if (!inFocus) return;
    inFocus = false;
    clearTimeout(hideTimer);
    // Put the faded sections back in the flow BEFORE the opacity
    // transition runs, so they animate from 0 to 1 visibly.
    for (const el of fadedEls) el.style.display = '';
    layout.setAttribute('data-focus', 'false');
    toggle.classList.remove('focus-exit');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', 'Enter focus mode');
    toggle.innerHTML = svgShell(ICON_EXPAND);
    toggle.focus();
  }

  toggle.addEventListener('click', () => { inFocus ? exit() : enter(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && inFocus) exit();
  });

  // Expose for programmatic control and tests.
  window.playgroundFocus = { enter, exit, isActive: () => inFocus };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountFocus, { once: true });
  } else {
    mountFocus();
  }
}
