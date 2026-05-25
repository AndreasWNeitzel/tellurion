// shared/js/controls-layout.js
// Two viewport-driven placements for .playground-controls:
//
//  >= 1400 px (desktop)   the panel moves into .playground-rail as its
//                         first child so the visitor can adjust sliders
//                         next to the canvas without scrolling.
//  <= 768 px (phone)      a floating "Controls" chip appears at the
//                         bottom-left of the viewport and toggles a
//                         translucent HUD overlay containing the panel.
//                         The panel stays in its inline DOM slot until
//                         the chip is tapped; only then does it move
//                         into the HUD body, and it returns to the slot
//                         when the HUD is dismissed.
//  in between              the panel sits in its inline slot below the
//                         canvas frame.
//
// Both moves are idempotent and reversible via a hidden sentinel span
// that marks the original DOM position.
const BP_RAIL = 1400;
const SENTINEL_DATA = 'controls-original-slot';

// "Phone" = portrait <=768 px OR short-and-landscape (the screen we
// want the Controls chip on). The 768 px width breakpoint alone fails
// on modern phones whose landscape width exceeds 768 (iPhone 12 = 844,
// iPhone 14 Pro Max = 932), so the chip was missing on real landscape
// devices even though Playwright's iPhone-12-landscape emulator (750)
// triggered it. The orientation+max-height clause catches all phones
// in landscape regardless of width while still excluding tablets,
// which are >=600 px tall even in landscape.
function isPhoneViewport() {
  if (window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches) return true;
  return window.innerWidth <= 768;
}

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
  raf = requestAnimationFrame(() => { raf = 0; placeControls(); syncMobileHud(); });
}

// ---------------------------------------------------------------------------
// Mobile HUD: a translucent slide-up overlay that owns the controls panel.
// ---------------------------------------------------------------------------
// On a phone viewport the controls panel always lives inside the HUD body;
// the inline slot below the canvas is left empty. The visitor opens the HUD
// via a "Controls" chip at the bottom-left of the viewport and dismisses it
// via the close button, the grip-area backdrop, or Escape. Pulling the panel
// out of the page flow gives the canvas the full screen above the chip.
function mountMobileHud() {
  if (!isPhoneViewport()) return;                          // not a phone
  if (document.querySelector('.controls-hud')) return;     // already mounted

  const chip = document.createElement('button');
  chip.className = 'controls-hud-chip';
  chip.type = 'button';
  chip.setAttribute('aria-label', 'Open controls');
  chip.setAttribute('aria-expanded', 'false');
  chip.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<line x1="4" y1="7" x2="14" y2="7"/>'
    + '<circle cx="17" cy="7" r="2.2"/>'
    + '<line x1="4" y1="17" x2="9" y2="17"/>'
    + '<circle cx="12" cy="17" r="2.2"/>'
    + '<line x1="14" y1="17" x2="20" y2="17"/>'
    + '</svg>'
    + '<span class="controls-hud-chip-label">Controls</span>';

  const hud = document.createElement('div');
  hud.className = 'controls-hud';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML =
    '<div class="controls-hud-backdrop" data-hud-dismiss></div>'
    + '<div class="controls-hud-panel" role="dialog" aria-modal="true" aria-label="Controls">'
    +   '<div class="controls-hud-header">'
    +     '<span class="controls-hud-grip" aria-hidden="true"></span>'
    +     '<span class="controls-hud-title">Controls</span>'
    +     '<button type="button" class="controls-hud-close" aria-label="Close controls" data-hud-dismiss>&times;</button>'
    +   '</div>'
    +   '<div class="controls-hud-body"></div>'
    + '</div>';

  document.body.appendChild(chip);
  document.body.appendChild(hud);

  const body = hud.querySelector('.controls-hud-body');

  // Move controls into the HUD body at mount so the inline slot stays
  // empty until the visitor returns to a wider viewport.
  const controls = findControls();
  if (controls && controls.parentElement !== body) {
    placeSentinel(controls);
    body.appendChild(controls);
    controls.classList.add('in-hud');
  }

  function open() {
    hud.classList.add('controls-hud-open');
    hud.setAttribute('aria-hidden', 'false');
    chip.setAttribute('aria-expanded', 'true');
    chip.classList.add('controls-hud-chip-hidden');
    const close = hud.querySelector('.controls-hud-close');
    if (close && typeof close.focus === 'function') {
      try { close.focus({ preventScroll: true }); } catch { /* old browser */ }
    }
  }

  function close() {
    hud.classList.remove('controls-hud-open');
    hud.setAttribute('aria-hidden', 'true');
    chip.setAttribute('aria-expanded', 'false');
    chip.classList.remove('controls-hud-chip-hidden');
  }

  chip.addEventListener('click', open);
  hud.addEventListener('click', (e) => {
    if (e.target.matches('[data-hud-dismiss]')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hud.classList.contains('controls-hud-open')) close();
  });
}

function tearDownMobileHud() {
  if (isPhoneViewport()) return;                           // still phone
  const hud = document.querySelector('.controls-hud');
  const chip = document.querySelector('.controls-hud-chip');
  if (!hud && !chip) return;
  // If controls live in the HUD body, move them out before removing.
  const controls = hud && hud.querySelector('.playground-controls');
  if (controls) {
    const slot = document.querySelector(`[data-pg-slot="${SENTINEL_DATA}"]`);
    if (slot && slot.parentNode) {
      slot.parentNode.insertBefore(controls, slot);
      slot.remove();
    }
    controls.classList.remove('in-hud');
  }
  hud && hud.remove();
  chip && chip.remove();
}

function syncMobileHud() {
  if (isPhoneViewport()) mountMobileHud();
  else tearDownMobileHud();
}

function init() {
  placeControls();
  syncMobileHud();
  window.addEventListener('resize', onResize);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}
