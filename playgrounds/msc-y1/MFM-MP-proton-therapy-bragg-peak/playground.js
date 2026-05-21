// Proton therapy depth dose. Panel A: the pristine Bragg peak against
// the photon depth-dose, or the spread-out Bragg peak. Panel B: the
// SOBP as a weighted superposition of pristine peaks. Panel C: the
// dose deposited along a patient depth, sparing tissue beyond the
// tumour. Gate-tested sim.js; deterministic. Wilson 1946; Bortfeld 1997.
import {
  braggKleemanRange, protonDepthDose, xrayDepthDose, sobp,
  depthGrid, peakDepth, distalDepth,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rE = document.getElementById('readout-e');
const rR = document.getElementById('readout-r');
const rMode = document.getElementById('readout-mode');
const rPe = document.getElementById('readout-pe');
const slE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const selM = document.getElementById('select-mode');
const slP = document.getElementById('slider-pw'), vP = document.getElementById('value-pw');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const ZMAX = 38, NZ = 760;
const Z = depthGrid(ZMAX, NZ);
const DEF = { e: 150, mode: 'pristine', pw: 35 };
const st = { ...DEF, running: !prefersReducedMotion(), ph: 0 };

const cache = {};
function rebuild() {
  const p = protonDepthDose(st.e, Z);
  const xr = xrayDepthDose(Z);
  const so = sobp(st.e, 30, st.pw / 100, Z, 0.02);
  const i05 = Z.findIndex((z) => z >= 0.5);
  cache.p = p; cache.xr = xr; cache.so = so;
  cache.peakE = 1 / Math.max(1e-6, p.dose[i05]);
  cache.R = p.R;
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}
function axes(x, y, w, h) {
  const px = x + 38, py = y + 26, pw = w - 52, ph = h - 50;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  for (let d = 0; d <= ZMAX; d += 10) {
    const xx = px + pw * d / ZMAX;
    ctx.fillText(`${d}`, xx - 5, py + ph + 14);
  }
  ctx.fillText('depth in water (cm)', px + pw / 2 - 50, py + ph + 27);
  ctx.fillText('dose', x + 8, py + 8);
  return { px, py, pw, ph, X: (d) => px + pw * d / ZMAX, Y: (v) => py + ph * (1 - v / 1.06) };
}
function curve(a, A, col, lw, alpha = 1) {
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.globalAlpha = alpha; ctx.beginPath();
  for (let i = 0; i < a.length; i += 1) {
    const xx = A.X(Z[i]), yy = A.Y(a[i]);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
}

function drawMain(x, y, w, h) {
  const sobpMode = st.mode === 'sobp';
  panel(x, y, w, h, sobpMode ? 'depth dose: spread-out Bragg peak vs X-ray' : 'depth dose: pristine Bragg peak vs X-ray');
  const A = axes(x, y, w, h);
  // tumour band
  if (sobpMode) {
    const so = cache.so;
    ctx.fillStyle = 'rgba(255,209,102,0.10)';
    ctx.fillRect(A.X(so.Rmin), A.py, A.X(so.Rmax) - A.X(so.Rmin), A.ph);
    ctx.fillStyle = 'rgba(255,209,102,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('tumour target', A.X(so.Rmin) + 4, A.py + A.ph - 8);
  }
  curve(cache.xr, A, '#8aa0c8', 2);                       // photon reference
  if (sobpMode) curve(cache.so.dose, A, '#6fb4ff', 2.5);
  else curve(cache.p.dose, A, '#ffd166', 2.5);
  // legend
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(10,11,16,0.85)'; ctx.fillRect(A.px + 6, A.py + 4, 210, 30);
  ctx.fillStyle = '#8aa0c8'; ctx.fillText('X-ray (photon) PDD', A.px + 12, A.py + 16);
  ctx.fillStyle = sobpMode ? '#6fb4ff' : '#ffd166';
  ctx.fillText(sobpMode ? 'spread-out Bragg peak' : 'pristine Bragg peak', A.px + 12, A.py + 29);
  // range marker
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(A.X(cache.R), A.py); ctx.lineTo(A.X(cache.R), A.py + A.ph); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(220,228,245,0.75)';
  ctx.fillText(`R = ${cache.R.toFixed(1)} cm`, A.X(cache.R) + 4, A.py + A.ph - 8);
}

function drawSOBP(x, y, w, h) {
  panel(x, y, w, h, 'SOBP construction: weighted pristine peaks summed');
  const A = axes(x, y, w, h);
  const so = cache.so;
  let wmax = 0; for (const wv of so.weights) wmax = Math.max(wmax, wv);
  for (let k = 0; k < so.peaks.length; k += 1) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1; ctx.globalAlpha = 0.28;
    ctx.beginPath();
    for (let i = 0; i < Z.length; i += 1) {
      const xx = A.X(Z[i]), yy = A.Y(so.weights[k] / wmax * so.peaks[k][i] * 0.7);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  curve(so.dose, A, '#6fb4ff', 2.5);
  ctx.fillStyle = 'rgba(10,11,16,0.85)'; ctx.fillRect(A.px + 6, A.py + 4, 220, 30);
  ctx.fillStyle = '#ffd166'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`${so.peaks.length} weighted pristine peaks`, A.px + 12, A.py + 16);
  ctx.fillStyle = '#6fb4ff'; ctx.fillText('their sum (flat SOBP)', A.px + 12, A.py + 29);
}

function drawPatient(x, y, w, h) {
  panel(x, y, w, h, 'dose along the patient depth');
  const px = x + 16, pw = w - 32;
  const so = cache.so;
  const X = (d) => px + pw * d / ZMAX;
  const rowH = 30;
  const dose = st.mode === 'sobp' ? so.dose : cache.p.dose;
  const tumLo = st.mode === 'sobp' ? so.Rmin : Math.max(0, cache.R - 1.5);
  const tumHi = st.mode === 'sobp' ? so.Rmax : cache.R + 0.3;
  // proton strip
  for (const [yy, arr, lab, accent] of [
    [y + 40, dose, st.mode === 'sobp' ? 'proton SOBP' : 'proton', true],
    [y + 40 + rowH + 26, cache.xr, 'X-ray', false],
  ]) {
    for (let i = 0; i < Z.length - 1; i += 2) {
      const v = Math.max(0, Math.min(1, arr[i]));
      const r = Math.round(30 + 225 * v), g = Math.round(40 + 150 * v * (accent ? 1 : 0.5));
      ctx.fillStyle = `rgb(${r},${g},${Math.round(60 + 40 * (1 - v))})`;
      ctx.fillRect(X(Z[i]), yy, (pw / Z.length) * 2 + 1, rowH);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.strokeRect(px, yy, pw, rowH);
    ctx.fillStyle = 'rgba(220,228,245,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(lab, px, yy - 4);
  }
  // tumour bracket
  ctx.strokeStyle = 'rgba(255,120,120,0.8)'; ctx.lineWidth = 2;
  ctx.strokeRect(X(tumLo), y + 36, X(tumHi) - X(tumLo), y + 40 + rowH - (y + 36) + 4);
  ctx.fillStyle = 'rgba(255,150,150,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('tumour', X(tumLo) + 2, y + 34);
  // distal sparing note
  const r90 = distalDepth(dose, Z, 0.9);
  ctx.fillStyle = 'rgba(155,232,176,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`proton dose ends at ~${r90.toFixed(1)} cm; X-ray irradiates the far side`, px, y + h - 12);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const half = (W - 52) / 2;
  drawMain(20, 20, half, H - 34);
  if (st.mode === 'sobp') drawSOBP(20 + half + 12, 20, half, (H - 46) / 2);
  else {
    panel(20 + half + 12, 20, half, (H - 46) / 2, 'SOBP construction (switch mode to spread-out Bragg peak)');
    ctx.fillStyle = 'rgba(200,210,235,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('A single pristine peak is too narrow to cover a tumour.', 20 + half + 28, 20 + (H - 46) / 4);
    ctx.fillText('Select "spread-out Bragg peak" to see the superposition.', 20 + half + 28, 20 + (H - 46) / 4 + 18);
  }
  drawPatient(20 + half + 12, 20 + (H - 46) / 2 + 6, half, (H - 46) / 2);
  rE.textContent = `${st.e} MeV`;
  rR.textContent = `${cache.R.toFixed(1)} cm`;
  rMode.textContent = st.mode === 'sobp' ? 'spread-out Bragg peak' : 'pristine vs X-ray';
  rPe.textContent = cache.peakE.toFixed(1);
}

function tick() {
  if (st.running) st.ph = (st.ph + 1 / 240) % 1;
  draw();
  requestAnimationFrame(tick);
}

function sync() { vE.textContent = String(st.e); vP.textContent = String(st.pw); }
slE.addEventListener('input', () => { vE.textContent = slE.value; });
slE.addEventListener('change', () => { st.e = parseInt(slE.value, 10); rebuild(); draw(); });
selM.addEventListener('change', () => { st.mode = selM.value; draw(); });
slP.addEventListener('input', () => { vP.textContent = slP.value; });
slP.addEventListener('change', () => { st.pw = parseInt(slP.value, 10); rebuild(); draw(); });
bR.addEventListener('click', () => {
  Object.assign(st, DEF); st.running = true;
  slE.value = String(DEF.e); selM.value = DEF.mode; slP.value = String(DEF.pw);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { e: String(st.e), mode: st.mode, pw: String(st.pw) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.e) { st.e = parseInt(s.e, 10); slE.value = s.e; }
  if (s.mode) { st.mode = s.mode; selM.value = s.mode; }
  if (s.pw) { st.pw = parseInt(s.pw, 10); slP.value = s.pw; }
}

function boot() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  sync(); rebuild();
  if (CAPTURE_NAME) {
    const fr = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = fr; draw();
  } else { draw(); }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
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
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
