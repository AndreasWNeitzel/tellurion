// Ghost cursor (spec Part F). A faint 20px ring that lags the system
// cursor with a spring, grows over interactive targets, and squishes
// on click. It never replaces the native cursor. Not rendered on
// touch devices or under prefers-reduced-motion.
//
// Disable in one place (spec H4):
const CURSOR_ENABLED = true;

const HOVER_SEL = '.card, .rcard, a, button, .chip, input, select, [role="button"]';

export function mountCursor() {
  if (!CURSOR_ENABLED) return null;
  if (document.getElementById('ghost-cursor')) return null;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || 'ontouchstart' in window || !window.matchMedia('(pointer:fine)').matches) return null;

  const el = document.createElement('div');
  el.id = 'ghost-cursor';
  el.style.cssText = [
    'position:fixed', 'left:0', 'top:0', 'width:20px', 'height:20px',
    'margin:-10px 0 0 -10px', 'border:1px solid rgba(255,255,255,0.2)',
    'border-radius:50%', 'pointer-events:none', 'z-index:9998',
    'opacity:0', 'transition:width 200ms ease,height 200ms ease,border-color 200ms ease,opacity 200ms ease',
    'will-change:transform',
  ].join(';');
  document.body.appendChild(el);

  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let cx = tx, cy = ty, shown = false;
  window.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!shown) { shown = true; el.style.opacity = '1'; }
  }, { passive: true });
  window.addEventListener('mouseleave', () => { shown = false; el.style.opacity = '0'; });

  let size = 20;
  const setSize = (s, border) => {
    size = s;
    el.style.width = s + 'px'; el.style.height = s + 'px';
    el.style.margin = `${-s / 2}px 0 0 ${-s / 2}px`;
    el.style.borderColor = border;
  };
  document.addEventListener('mouseover', (e) => {
    if (e.target && e.target.closest && e.target.closest(HOVER_SEL)) setSize(32, 'rgba(255,255,255,0.35)');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target && e.target.closest && e.target.closest(HOVER_SEL)
      && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(HOVER_SEL))) {
      setSize(20, 'rgba(255,255,255,0.2)');
    }
  });
  window.addEventListener('mousedown', () => {
    const restore = size;
    setSize(16, el.style.borderColor);
    setTimeout(() => setSize(restore, el.style.borderColor), 150);
  });

  const loop = () => {
    cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;   // spring lag
    el.style.transform = `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  return el;
}
