// shared/js/controls-layout.js
// On wide viewports (>= --bp-rails-full / 1400 px) move the playground
// controls panel into the right rail so the visitor can interact with
// the sliders without scrolling past the canvas. On narrower viewports
// the panel returns to its original spot under the canvas + caption.
//
// The script is idempotent: it inspects the DOM on every viewport
// change and only moves nodes when their parent does not already match
// the regime. The original DOM order is reconstructed from a sentinel
// comment node that we leave in place when the panel is hoisted into
// the rail; this keeps the move reversible without storing references
// or assuming a specific sibling structure.
//
// Mobile is unaffected: the @media (max-width: 768px) block in
// playground-v2.css keeps the panel in flex-column order inside the
// center column, beneath the canvas frame.
const BP_RAIL = 1400;
const SENTINEL_DATA = 'controls-original-slot';

function findRail()    { return document.querySelector('.playground-rail'); }
function findCenter()  { return document.querySelector('.playground-center'); }
function findControls(){ return document.querySelector('.playground-controls'); }

function placeSentinel(controls) {
  // If a sentinel is already present we are mid-cycle: do nothing.
  let s = document.querySelector(`[data-pg-slot="${SENTINEL_DATA}"]`);
  if (s) return s;
  s = document.createComment(`pg:${SENTINEL_DATA}`);
  // CommentNodes do not match querySelector. Use a hidden span as the
  // sentinel so we can find it again with a selector.
  s = document.createElement('span');
  s.setAttribute('data-pg-slot', SENTINEL_DATA);
  s.setAttribute('aria-hidden', 'true');
  s.hidden = true;                                       // no layout impact
  controls.parentNode.insertBefore(s, controls);
  return s;
}

function placeControls() {
  const controls = findControls();
  const rail = findRail();
  const center = findCenter();
  if (!controls || !rail || !center) return;

  const wantInRail = window.innerWidth >= BP_RAIL;
  const isInRail = controls.parentElement === rail;
  if (wantInRail === isInRail) return;                   // already correct

  if (wantInRail) {
    placeSentinel(controls);
    rail.insertBefore(controls, rail.firstChild);
    controls.classList.add('in-rail');
  } else {
    const slot = document.querySelector(`[data-pg-slot="${SENTINEL_DATA}"]`);
    if (slot && slot.parentNode) {
      slot.parentNode.insertBefore(controls, slot);
      slot.remove();
    } else {
      // Fallback: drop after the caption if the sentinel disappeared
      // (e.g. a playground that rewrites .playground-center wholesale).
      const caption = center.querySelector('.playground-caption');
      if (caption && caption.nextSibling) center.insertBefore(controls, caption.nextSibling);
      else center.appendChild(controls);
    }
    controls.classList.remove('in-rail');
  }
}

// Debounce resize. matchMedia change fires once per regime crossing,
// but a continuous drag of the dev-tools split would otherwise rerun
// the move on every pixel.
let raf = 0;
function onResize() {
  if (raf) return;
  raf = requestAnimationFrame(() => { raf = 0; placeControls(); });
}

function init() {
  placeControls();
  window.addEventListener('resize', onResize);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}
