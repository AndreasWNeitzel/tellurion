// Gravitational lensing playground. Renders the image-plane pattern
// (pull-back of a source-plane pattern through the inverse lens map)
// plus discrete image solutions for a movable point source. Drag the
// canvas to reposition the source. Reference: Schneider, Ehlers, Falco
// 1992; Schneider, Kochanek, Wambsganss 2006.

import {
  lensPointMass, solvePointMassImages, sourcePattern,
  criticalCaustic, solveShearImages,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rBeta = document.getElementById('readout-beta');
const rRadii = document.getElementById('readout-radii');
const rMag = document.getElementById('readout-mag');
const sBx = document.getElementById('slider-bx'), vBx = document.getElementById('value-bx');
const sBy = document.getElementById('slider-by'), vBy = document.getElementById('value-by');
const selPat = document.getElementById('select-pattern'), vPat = document.getElementById('value-pattern');
const sUmin = document.getElementById('slider-umin'), vUmin = document.getElementById('value-umin');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');
const btnMicrolens = document.getElementById('btn-microlensing');
const btnCaustics = document.getElementById('btn-caustics');
const sShear = document.getElementById('slider-shear'), vShear = document.getElementById('value-shear');

const st = {
  bx: 0.3, by: 0.1, pattern: 'stripes', running: !prefersReducedMotion(),
  VIEW: 3.0,
  // Microlensing-event animation: when active, the source moves on a
  // straight trajectory with impact parameter u_min, sweeping right-to-
  // left across the field. A Paczynski-style lightcurve is plotted in
  // a side panel. This is the merge of the standalone microlensing
  // playground into the hero.
  microlensing: false,
  uMin: 0.20,
  tNorm: -1.5,         // sweep parameter in units of t_E (Einstein-time)
  lightcurveHistory: [],
  // Caustics view: a point lens plus external shear (the Chang-Refsdal
  // lens). Its caustic is a four-cusped astroid; a source inside it
  // produces four images, outside it two. This is the third merged
  // functionality (caustics) alongside the lensed tiling and the
  // microlensing lightcurve.
  caustics: false,
  shear: 0.25,
};

// Cache of the critical/caustic curves; recomputed only when the
// shear changes (the Newton scan is not free).
let causticCache = { shear: -1, critical: null, caustic: null };
function getCausticCurves() {
  if (causticCache.shear !== st.shear) {
    const cc = criticalCaustic(st.shear, 420);
    causticCache = { shear: st.shear, critical: cc.critical, caustic: cc.caustic };
  }
  return causticCache;
}

function w2s(x, y) {
  const scale = Math.min(W, H) * 0.5 / st.VIEW;
  return { x: W * 0.5 + x * scale, y: H * 0.5 - y * scale };
}
function s2w(sx, sy) {
  const scale = Math.min(W, H) * 0.5 / st.VIEW;
  return [(sx - W * 0.5) / scale, -(sy - H * 0.5) / scale];
}

// Lensed image cache. The image-plane -> source-plane back-tracing is
// expensive (RES^2 lens evaluations) but ONLY depends on st.pattern,
// not the source position. Keep an off-screen buffer and only redraw
// when the pattern selector changes.
let imgBuf = null;
let imgOff = null;
let imgPatternKey = '';
const RES = 700;       // image-plane grid resolution (was 200; the
                        // canvas is ~ 760 px wide so 700 lines up close
                        // to 1 sample per pixel, eliminating the
                        // chunky-pixel look the user complained about).

function renderLensedImage() {
  if (imgPatternKey === st.pattern && imgOff) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(imgOff, 0, 0, W, H);
    return;
  }
  if (!imgBuf || imgBuf.width !== RES) {
    imgBuf = ctx.createImageData(RES, RES);
  }
  const data = imgBuf.data;
  for (let yy = 0; yy < RES; yy += 1) {
    const theta_y = -st.VIEW + (yy / (RES - 1)) * 2 * st.VIEW;
    for (let xx = 0; xx < RES; xx += 1) {
      const theta_x = -st.VIEW + (xx / (RES - 1)) * 2 * st.VIEW;
      const [bx_src, by_src] = lensPointMass(theta_x, theta_y);
      const v = sourcePattern(bx_src, by_src, st.pattern);     // in [-1, 1]
      // Diverging blue-white-red colormap (matplotlib RdBu_r). Map v in
      // [-1, 1] to t in [0, 1]; the colormap returns {r, g, b} bytes.
      const c = rdbu(0.5 + 0.5 * Math.max(-1, Math.min(1, v)));
      const idx = (yy * RES + xx) * 4;
      data[idx] = c.r; data[idx + 1] = c.g; data[idx + 2] = c.b; data[idx + 3] = 255;
    }
  }
  imgOff = document.createElement('canvas');
  imgOff.width = RES; imgOff.height = RES;
  imgOff.getContext('2d').putImageData(imgBuf, 0, 0);
  imgPatternKey = st.pattern;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(imgOff, 0, 0, W, H);
}

// Paczynski magnification A(u) for a single point lens.
function paczynskiMag(u) {
  const uu = Math.max(u, 1e-9);
  return (uu * uu + 2) / (uu * Math.sqrt(uu * uu + 4));
}

function drawMicrolensingPanel(muTot) {
  // Bottom-right corner: small lightcurve A(t) plot.
  const pw = 220, ph = 130;
  const px = W - pw - 16, py = H - ph - 16;
  ctx.fillStyle = 'rgba(15, 22, 36, 0.85)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.30)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText('microlensing event A(t)', px + 6, py + 14);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(200, 210, 240, 0.65)';
  ctx.fillText(`u_min = ${st.uMin.toFixed(2)}   t / t_E = ${st.tNorm.toFixed(2)}`, px + 6, py + 28);
  // Axis: t/t_E in [-3, 3], A in [0.9, A_peak * 1.1].
  const APeak = paczynskiMag(st.uMin);
  const aMin = 0.9, aMax = Math.max(2.0, APeak * 1.1);
  const ax = px + 28, ay = py + 36;
  const aw = pw - 36, ah = ph - 54;
  function xOfT(t) { return ax + ((t + 3) / 6) * aw; }
  function yOfA(a) { return ay + ah - ((a - aMin) / (aMax - aMin)) * ah; }
  // Grid.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'; ctx.lineWidth = 1;
  for (let t = -3; t <= 3; t += 1) {
    ctx.beginPath(); ctx.moveTo(xOfT(t), ay); ctx.lineTo(xOfT(t), ay + ah); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.30)';
  ctx.beginPath(); ctx.moveTo(ax, yOfA(1)); ctx.lineTo(ax + aw, yOfA(1)); ctx.stroke();
  // Analytic curve A(t).
  ctx.strokeStyle = 'rgba(126, 212, 193, 0.95)'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) {
    const t = -3 + (i / 120) * 6;
    const u = Math.sqrt(st.uMin * st.uMin + t * t);
    const a = Math.max(aMin, Math.min(aMax, paczynskiMag(u)));
    if (i === 0) ctx.moveTo(xOfT(t), yOfA(a)); else ctx.lineTo(xOfT(t), yOfA(a));
  }
  ctx.stroke();
  // Current-time dot.
  const aNow = Math.max(aMin, Math.min(aMax, paczynskiMag(Math.sqrt(st.uMin*st.uMin + st.tNorm*st.tNorm))));
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(xOfT(st.tNorm), yOfA(aNow), 4, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(xOfT(st.tNorm), yOfA(aNow), 4, 0, 6.28); ctx.stroke();
  // y-axis ticks.
  ctx.fillStyle = 'rgba(200, 210, 240, 0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right';
  ctx.fillText('1', ax - 3, yOfA(1) + 3);
  ctx.fillText(APeak.toFixed(1), ax - 3, yOfA(APeak) + 3);
  ctx.textAlign = 'center';
  ctx.fillText('-3', xOfT(-3), ay + ah + 10);
  ctx.fillText('0', xOfT(0), ay + ah + 10);
  ctx.fillText('+3', xOfT(3), ay + ah + 10);
  ctx.fillText('t/t_E', ax + aw / 2, ay + ah + 22);
  ctx.textAlign = 'left';
}

// Caustics view: critical curves (image plane) and caustic curves
// (source plane) of the sheared point lens, with the live image
// solutions for the draggable source.
function renderCaustics() {
  ctx.fillStyle = '#070810';
  ctx.fillRect(0, 0, W, H);
  // Faint axes through the lens.
  const o = w2s(0, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, o.y); ctx.lineTo(W, o.y);
  ctx.moveTo(o.x, 0); ctx.lineTo(o.x, H); ctx.stroke();
  // Einstein ring reference.
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.22)'; ctx.setLineDash([3, 4]);
  const Re = w2s(1, 0).x - o.x;
  ctx.beginPath(); ctx.arc(o.x, o.y, Re, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);

  const { critical, caustic } = getCausticCurves();
  // Critical curve (image plane), cyan.
  ctx.fillStyle = 'rgba(91, 192, 235, 0.9)';
  for (const [x, y] of critical) {
    const p = w2s(x, y);
    ctx.fillRect(p.x - 1, p.y - 1, 2.2, 2.2);
  }
  // Caustic curve (source plane), the gold astroid.
  ctx.fillStyle = 'rgba(255, 196, 90, 0.95)';
  for (const [bx, by] of caustic) {
    const p = w2s(bx, by);
    ctx.fillRect(p.x - 1, p.y - 1, 2.4, 2.4);
  }

  // Lens.
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(o.x, o.y, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.arc(o.x, o.y, 7, 0, 2 * Math.PI); ctx.stroke();

  // Images of the current source.
  const images = solveShearImages(st.bx, st.by, st.shear);
  ctx.fillStyle = '#ffd166';
  for (const im of images) {
    const p = w2s(im.x, im.y);
    ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI); ctx.stroke();
  }
  // Source marker.
  const sp = w2s(st.bx, st.by);
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,100,100,0.6)';
  ctx.beginPath(); ctx.arc(sp.x, sp.y, 11, 0, 2 * Math.PI); ctx.stroke();

  // HUD.
  ctx.fillStyle = 'rgba(6, 8, 14, 0.78)';
  ctx.fillRect(0, 0, W, 56);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`point lens + external shear γ = ${st.shear.toFixed(2)}   (Chang-Refsdal)`, 24, 20);
  const nImg = images.length;
  ctx.fillStyle = nImg >= 4 ? '#9be8b0' : 'rgba(255,255,255,0.8)';
  ctx.fillText(`${nImg} images  -  source ${nImg >= 4 ? 'INSIDE' : 'outside'} the astroid caustic`, 24, 38);
  ctx.fillStyle = 'rgba(200,210,240,0.7)';
  ctx.fillText('drag the source; cyan = critical curve, gold = caustic', 24, 52);
  // Legend keys bottom-left.
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('— critical curve (image plane)', 24, H - 30);
  ctx.fillStyle = '#ffc45a'; ctx.fillText('— caustic / astroid (source plane)', 24, H - 14);

  rBeta.textContent = `(${st.bx.toFixed(2)}, ${st.by.toFixed(2)})`;
  rRadii.textContent = `${nImg} images`;
  const muTot = images.reduce((s, im) => s + im.mu, 0);
  rMag.textContent = muTot.toFixed(2);
}

function render() {
  if (st.caustics) { renderCaustics(); return; }

  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  renderLensedImage();

  // Lens at origin (black hole-ish).
  const lp = w2s(0, 0);
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(lp.x, lp.y, 10, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
  ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
  const Re = w2s(1, 0).x - lp.x;
  ctx.beginPath(); ctx.arc(lp.x, lp.y, Re, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);

  // Solve images.
  const images = solvePointMassImages(st.bx, st.by);
  ctx.fillStyle = '#ffd166';
  for (const im of images) {
    if (!Number.isFinite(im.x) || !Number.isFinite(im.y)) continue;
    const p = w2s(im.x, im.y);
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI); ctx.stroke();
  }

  // Source marker (red).
  const sp = w2s(st.bx, st.by);
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
  ctx.beginPath(); ctx.arc(sp.x, sp.y, 12, 0, 2 * Math.PI); ctx.stroke();

  // Labels. The lensed colourmap behind the HUD is high-contrast, so
  // the text needs a dark backing strip to stay legible.
  ctx.fillStyle = 'rgba(6, 8, 14, 0.72)';
  ctx.fillRect(0, 0, W, 50);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`source β = (${st.bx.toFixed(2)}, ${st.by.toFixed(2)})    Einstein ring θ_E = 1`, 24, 22);
  ctx.fillText(`drag to move the source; yellow dots are the two images`, 24, 40);

  const muTot = images.reduce((s, im) => s + im.mag, 0);

  // ===== MICROLENSING LIGHTCURVE PANEL (when microlensing mode is on) =====
  if (st.microlensing) {
    drawMicrolensingPanel(muTot);
  }

  rBeta.textContent = `(${st.bx.toFixed(2)}, ${st.by.toFixed(2)})`;
  rRadii.textContent = `${images[0] ? Math.sqrt(images[0].x*images[0].x + images[0].y*images[0].y).toFixed(2) : '-'} / ${images[1] ? Math.sqrt(images[1].x*images[1].x + images[1].y*images[1].y).toFixed(2) : '-'}`;
  rMag.textContent = muTot.toFixed(2);
}

let _lastWall = performance.now();
function tick(now) {
  const wt = now || performance.now();
  const dt = Math.min(0.05, (wt - _lastWall) / 1000);
  _lastWall = wt;
  if (st.microlensing && st.running) {
    // Sweep t/t_E from -3 to +3 over ~ 12 seconds (one full event).
    st.tNorm += dt * (6 / 12);
    if (st.tNorm > 3) st.tNorm = -3;
    // Update source position along the trajectory: x = t, y = u_min.
    st.bx = st.tNorm;
    st.by = st.uMin;
    sBx.value = String(st.bx);
    sBy.value = String(st.by);
    syncLabels();
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vBx.textContent = st.bx.toFixed(2);
  vBy.textContent = st.by.toFixed(2);
  vPat.textContent = st.pattern;
}

sBx.addEventListener('input', () => { st.bx = parseFloat(sBx.value); syncLabels(); });
sBy.addEventListener('input', () => { st.by = parseFloat(sBy.value); syncLabels(); });
selPat.addEventListener('change', () => { st.pattern = selPat.value; syncLabels(); });
if (sUmin) sUmin.addEventListener('input', () => {
  st.uMin = parseFloat(sUmin.value);
  if (vUmin) vUmin.textContent = st.uMin.toFixed(2);
});
if (btnMicrolens) btnMicrolens.addEventListener('click', () => {
  st.microlensing = !st.microlensing;
  btnMicrolens.setAttribute('aria-pressed', String(st.microlensing));
  btnMicrolens.textContent = st.microlensing ? 'Free source' : 'Microlensing';
  if (st.microlensing) { st.tNorm = -3; st.caustics = false; syncCausticsBtn(); }
});
function syncCausticsBtn() {
  if (!btnCaustics) return;
  btnCaustics.setAttribute('aria-pressed', String(st.caustics));
  btnCaustics.textContent = st.caustics ? 'Lensed image' : 'Caustics';
}
if (btnCaustics) btnCaustics.addEventListener('click', () => {
  st.caustics = !st.caustics;
  if (st.caustics) {
    // Leaving microlensing mode; start the source just outside the
    // caustic so the 2 -> 4 image transition is one drag away.
    st.microlensing = false;
    btnMicrolens.setAttribute('aria-pressed', 'false');
    btnMicrolens.textContent = 'Microlensing';
    st.bx = 0.45; st.by = 0.0;
    sBx.value = String(st.bx); sBy.value = String(st.by);
    syncLabels();
  }
  syncCausticsBtn();
});
if (sShear) sShear.addEventListener('input', () => {
  st.shear = parseFloat(sShear.value);
  if (vShear) vShear.textContent = st.shear.toFixed(2);
});
btnReset.addEventListener('click', () => {
  st.bx = 0.3; st.by = 0.1; st.pattern = 'stripes';
  sBx.value = '0.3'; sBy.value = '0.1'; selPat.value = 'stripes';
  syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const sx = (e.clientX - rect.left) * (W / rect.width);
  const sy = (e.clientY - rect.top) * (H / rect.height);
  const [wx, wy] = s2w(sx, sy);
  st.bx = wx; st.by = wy;
  sBx.value = String(st.bx); sBy.value = String(st.by);
  syncLabels();
});
canvas.addEventListener('pointermove', (e) => {
  if (e.buttons !== 1) return;
  const rect = canvas.getBoundingClientRect();
  const sx = (e.clientX - rect.left) * (W / rect.width);
  const sy = (e.clientY - rect.top) * (H / rect.height);
  const [wx, wy] = s2w(sx, sy);
  st.bx = wx; st.by = wy;
  sBx.value = String(st.bx); sBy.value = String(st.by);
  syncLabels();
});

function getState() { return { beta_x: st.bx, beta_y: st.by, lens_kind: 'point' }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.beta_x) { st.bx = parseFloat(s.beta_x); sBx.value = String(st.bx); }
  if (s.beta_y) { st.by = parseFloat(s.beta_y); sBy.value = String(st.by); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    // Sweep source position across captures so the goldens span
    // "far outside" -> "Einstein ring" -> "two images" -> "far other side".
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.bx = -1.5 + f * 3.0;
    st.by = 0.05;
    sBx.value = String(st.bx); sBy.value = String(st.by);
    syncLabels();
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
