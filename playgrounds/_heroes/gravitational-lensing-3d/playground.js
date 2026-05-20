// Gravitational lensing playground. Renders the image-plane pattern
// (pull-back of a source-plane pattern through the inverse lens map)
// plus discrete image solutions for a movable point source. Drag the
// canvas to reposition the source. Reference: Schneider, Ehlers, Falco
// 1992; Schneider, Kochanek, Wambsganss 2006.

import { lensPointMass, solvePointMassImages, sourcePattern } from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

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
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  bx: 0.3, by: 0.1, pattern: 'stripes', running: true,
  VIEW: 3.0,
};

function w2s(x, y) {
  const scale = Math.min(W, H) * 0.5 / st.VIEW;
  return { x: W * 0.5 + x * scale, y: H * 0.5 - y * scale };
}
function s2w(sx, sy) {
  const scale = Math.min(W, H) * 0.5 / st.VIEW;
  return [(sx - W * 0.5) / scale, -(sy - H * 0.5) / scale];
}

let imgBuf = null;
const RES = 200;       // image-plane grid resolution

function renderLensedImage() {
  if (!imgBuf) imgBuf = ctx.createImageData(RES, RES);
  const data = imgBuf.data;
  for (let yy = 0; yy < RES; yy += 1) {
    const theta_y = -st.VIEW + (yy / (RES - 1)) * 2 * st.VIEW;
    for (let xx = 0; xx < RES; xx += 1) {
      const theta_x = -st.VIEW + (xx / (RES - 1)) * 2 * st.VIEW;
      const [bx_src, by_src] = lensPointMass(theta_x, theta_y);
      const v = sourcePattern(bx_src, by_src, st.pattern);
      // Color: warm/cool diverging on (-1, 1).
      let r, g, b;
      if (v >= 0) {
        const u = v;
        r = Math.round(40 + 200 * u);
        g = Math.round(50 + 120 * u);
        b = Math.round(60 + 40 * u);
      } else {
        const u = -v;
        r = Math.round(60 + 40 * u);
        g = Math.round(90 + 110 * u);
        b = Math.round(130 + 100 * u);
      }
      const idx = (yy * RES + xx) * 4;
      data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
    }
  }
  // Composite onto canvas.
  const off = document.createElement('canvas');
  off.width = RES; off.height = RES;
  off.getContext('2d').putImageData(imgBuf, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, W, H);
}

function render() {
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

  // Labels.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`source β = (${st.bx.toFixed(2)}, ${st.by.toFixed(2)})    Einstein ring θ_E = 1`, 24, 22);
  ctx.fillText(`drag to move the source; yellow dots are the two images`, 24, 40);

  const muTot = images.reduce((s, im) => s + im.mag, 0);
  rBeta.textContent = `(${st.bx.toFixed(2)}, ${st.by.toFixed(2)})`;
  rRadii.textContent = `${images[0] ? Math.sqrt(images[0].x*images[0].x + images[0].y*images[0].y).toFixed(2) : '-'} / ${images[1] ? Math.sqrt(images[1].x*images[1].x + images[1].y*images[1].y).toFixed(2) : '-'}`;
  rMag.textContent = muTot.toFixed(2);
}

function tick() {
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
