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
let diagThru = 0;   // latest power throughput (image/object), updated each render

// The filter radius does nothing with no mask (none = the identity
// 4f system), so the control is hidden there rather than left inert.
function applyVis() { rowRc.style.display = st.filter === 'none' ? 'none' : ''; }

// Portrait composition: the object -> Fourier -> image row across the top,
// a central line-profile comparison (object vs filtered image) filling the
// lower half (was a 232 px row at y=40 with the bottom two thirds empty).
const PANE = 258, GAP = 14, TOP = 96;
const X0 = Math.round((W - (3 * PANE + 2 * GAP)) / 2), X1 = X0 + PANE + GAP, X2 = X1 + PANE + GAP;
const PROF = { x: 40, y: TOP + PANE + 96, w: W - 80, h: 510 };

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

// Central horizontal cut through the object and the filtered image, so the
// effect of the spatial filter on the signal is read quantitatively: a
// low-pass smooths the profile, a high-pass leaves only the edges.
function drawProfile(obj, image) {
  const { x, y, w, h } = PROF;
  const j = (N >> 1) * N;
  let omax = 1e-12, imax = 1e-12;
  for (let i = 0; i < N; i += 1) { if (obj[j + i] > omax) omax = obj[j + i]; if (image[j + i] > imax) imax = image[j + i]; }

  ctx.fillStyle = 'rgba(91,192,235,0.04)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('central line profile  (each normalised to its own peak)', x + 8, y - 9);

  const PX = (i) => x + 6 + i / (N - 1) * (w - 12);
  const PY = (v) => y + h - 10 - v * (h - 28);
  const curve = (arr, mx, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < N; i += 1) { const px = PX(i), py = PY(arr[j + i] / mx); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
  };
  curve(obj, omax, 'rgba(150,160,180,0.85)');
  curve(image, imax, '#5bc0eb');

  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.fillText('object', x + w - 150, y + 18);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('filtered image', x + w - 150, y + 36);
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.textAlign = 'center';
  ctx.fillText('x (object plane)', x + w / 2, y + h + 16);
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

  drawProfile(obj, image);

  let so = 0, si = 0, sd = 0;
  for (let i = 0; i < N * N; i += 1) { so += obj[i] * obj[i]; si += image[i]; sd += (image[i] - obj[i] * obj[i]) ** 2; }
  rFilter.textContent = st.filter;
  rRc.textContent = st.filter === 'none' ? 'n/a' : String(Math.round(st.rc));
  diagThru = si / (so || 1);
  rThru.textContent = diagThru.toFixed(3);
  rRms.textContent = Math.sqrt(sd / (N * N)).toExponential(1);
}

// Auto-sweep the filter cutoff so the spatial-filtering effect plays on
// load: the aperture on the Fourier plane opens and closes and the image
// sharpens or blurs in step. Any control input pauses it.
let playing = false, raf = 0, rcDir = 1, last = 0;
function animate(now) {
  if (!playing) return;
  if (st.filter !== 'none') {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    st.rc += rcDir * dt * 8.5;                            // ~5 s each way over 2..44 px
    if (st.rc >= 44) { st.rc = 44; rcDir = -1; } else if (st.rc <= 2) { st.rc = 2; rcDir = 1; }
    sRc.value = String(Math.round(st.rc)); vRc.textContent = String(Math.round(st.rc));
    render();
  }
  last = now;
  raf = requestAnimationFrame(animate);
}
function setPlaying(on) { playing = on; if (on) { last = performance.now(); raf = requestAnimationFrame(animate); } else if (raf) { cancelAnimationFrame(raf); raf = 0; } }
function pause() { if (playing) setPlaying(false); }

selO.addEventListener('change', () => { pause(); st.object = selO.value; render(); });
selF.addEventListener('change', () => { pause(); st.filter = selF.value; applyVis(); render(); });
sRc.addEventListener('input', () => { pause(); st.rc = parseInt(sRc.value, 10); vRc.textContent = String(st.rc); render(); });
bR.addEventListener('click', () => {
  st.object = 'grating'; st.filter = 'low'; st.rc = 10;
  selO.value = 'grating'; selF.value = 'low'; sRc.value = '10'; vRc.textContent = '10'; applyVis();
  if (!prefersReducedMotion()) setPlaying(true); else render();
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
  } else if (!prefersReducedMotion()) {
    setPlaying(true);
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
  return { fields: [
    { key: 'object', label: 'object', value: st.object },
    { key: 'filter', label: 'spatial filter', value: st.filter },
    { key: 'cutoff', label: 'cutoff radius (px)', value: st.filter === 'none' ? 'n/a' : st.rc },
    { key: 'throughput', label: 'power throughput', value: diagThru.toFixed(3), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  // Power is non-negative and a spatial filter can only remove it, so the
  // throughput stays a finite fraction; the identity 4f (no filter) passes
  // essentially all of it.
  const ok = Number.isFinite(diagThru) && diagThru >= 0;
  return [{ key: 'throughput-finite', label: 'power throughput finite and non-negative', value: diagThru.toFixed(3), status: ok ? 'pass' : 'drift' }];
};
