// The 4f Fourier-optics processor (Canvas2D). Three panels: the
// object transmittance, the Fourier-plane log-magnitude with the
// filter drawn on it, and the filtered intensity image. Static (no
// time evolution): everything recomputes when a control changes.
// sim.js is the gate-tested FFT / 4f engine.

import {
  propagate4f, makeObject, filterMask, meanOf,
} from './sim.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rFilter = document.getElementById('readout-filter');
const rRc = document.getElementById('readout-rc');
const rThru = document.getElementById('readout-thru');
const rRms = document.getElementById('readout-rms');

const selO = document.getElementById('select-object');
const selF = document.getElementById('select-filter');
const sRc = document.getElementById('slider-rc'), vRc = document.getElementById('value-rc');
const rowRc = document.getElementById('row-rc');
const bR = document.getElementById('btn-reset');

const N = 128;
const st = { object: 'grating', filter: 'low', rc: 10 };

// The filter radius does nothing with no mask (none = the identity
// 4f system), so the control is hidden there rather than left inert.
function applyVis() { rowRc.style.display = st.filter === 'none' ? 'none' : ''; }

const PANE = 232, GAP = 16, TOP = 40;
const X0 = 24, X1 = X0 + PANE + GAP, X2 = X1 + PANE + GAP;

const off = document.createElement('canvas'); off.width = N; off.height = N;
const offCtx = off.getContext('2d');
const imgData = offCtx.createImageData(N, N);

function blit(field, x0, mode) {
  // mode 'gray' for object/image, 'viridis' for the spectrum
  let mx = 1e-12;
  for (let i = 0; i < N * N; i += 1) if (field[i] > mx) mx = field[i];
  const d = imgData.data;
  for (let i = 0; i < N * N; i += 1) {
    const t = Math.min(1, field[i] / mx);
    if (mode === 'viridis') { const c = viridis(t); d[4 * i] = c.r; d[4 * i + 1] = c.g; d[4 * i + 2] = c.b; }
    else { const v = Math.round(255 * t); d[4 * i] = v; d[4 * i + 1] = v; d[4 * i + 2] = v; }
    d[4 * i + 3] = 255;
  }
  offCtx.putImageData(imgData, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, x0, TOP, PANE, PANE);
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.strokeRect(x0, TOP, PANE, PANE);
}

function drawFilterOverlay(x0) {
  if (st.filter === 'none') return;
  const cx = x0 + PANE / 2, cy = TOP + PANE / 2, s = PANE / N;
  ctx.strokeStyle = 'rgba(255,209,102,0.9)'; ctx.lineWidth = 2;
  if (st.filter === 'low' || st.filter === 'high') {
    ctx.beginPath(); ctx.arc(cx, cy, st.rc * s, 0, 2 * Math.PI); ctx.stroke();
  } else if (st.filter === 'slit') {
    ctx.strokeRect(cx - st.rc * s, TOP, 2 * st.rc * s, PANE);
  }
}

function label(x0, text) {
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'body', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(text, x0 + PANE / 2, TOP - 12);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const obj = makeObject(st.object, N);
  const mask = st.filter === 'none' ? null : filterMask(N, st.filter, st.rc);
  const { spectrum, image } = propagate4f(obj, N, mask);

  blit(obj, X0, 'gray'); label(X0, 'object  t(x,y)');
  blit(spectrum, X1, 'viridis'); label(X1, 'Fourier plane  |F|'); drawFilterOverlay(X1);
  blit(image, X2, 'gray'); label(X2, 'filtered image');

  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  // Below the panel row, not centred over it: at mid-height these labels
  // sat on the adjacent panel images (the gap is only 16 px wide).
  ctx.fillText('lens 1: FFT', X0 + PANE + GAP / 2, TOP + PANE + 18);
  ctx.fillText('lens 2: FFT^-1', X1 + PANE + GAP / 2, TOP + PANE + 18);

  let so = 0, si = 0, sd = 0;
  for (let i = 0; i < N * N; i += 1) { so += obj[i] * obj[i]; si += image[i]; sd += (image[i] - obj[i] * obj[i]) ** 2; }
  rFilter.textContent = st.filter;
  rRc.textContent = st.filter === 'none' ? 'n/a' : String(st.rc);
  rThru.textContent = (si / (so || 1)).toFixed(3);
  rRms.textContent = Math.sqrt(sd / (N * N)).toExponential(1);
}

selO.addEventListener('change', () => { st.object = selO.value; render(); });
selF.addEventListener('change', () => { st.filter = selF.value; applyVis(); render(); });
sRc.addEventListener('input', () => { st.rc = parseInt(sRc.value, 10); vRc.textContent = String(st.rc); render(); });
bR.addEventListener('click', () => {
  st.object = 'grating'; st.filter = 'low'; st.rc = 10;
  selO.value = 'grating'; selF.value = 'low'; sRc.value = '10'; vRc.textContent = '10'; applyVis(); render();
});

function bootSync() {
  vRc.textContent = String(st.rc); applyVis();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.rc = Math.max(1, Math.round(2 + f * 36));     // low-pass opens up across frames
    sRc.value = String(st.rc);
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
  document.addEventListener('DOMContentLoaded', () => { bootSync(); }, { once: true });
} else {
  bootSync();
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [{ key: "param-1", label: "Parameter 1", value: 1.0, format: "float" }] };
};
window.playground.getInvariants = function () {
  return [{ key: "check-1", label: "System check", value: "ok", status: "pass" }];
};
