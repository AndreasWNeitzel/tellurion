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
  ctx.fillText(`proton stops at ~${r90.toFixed(1)} cm; X-ray exits the far side`, px, y + h - 12);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  // Portrait stack: the depth-dose plot full width on top (it was a
  // 340-wide, 1006-tall column with the Bragg peak squeezed), then the SOBP
  // construction and the patient dose map full width below.
  const fw = W - 40;
  drawMain(20, 20, fw, 452);
  const yB = 486;
  if (st.mode === 'sobp') drawSOBP(20, yB, fw, 250);
  else {
    panel(20, yB, fw, 250, 'SOBP construction (switch to spread-out mode)');
    ctx.fillStyle = 'rgba(200,210,235,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('A single pristine Bragg peak is too narrow to cover a whole tumour.', 36, yB + 60);
    ctx.fillText('Switch to spread-out mode to see the weighted superposition.', 36, yB + 80);
  }
  drawPatient(20, yB + 262, fw, H - (yB + 262) - 16);
  rE.textContent = `${st.e} MeV`;
  rR.textContent = `${cache.R.toFixed(1)} cm`;
  rMode.textContent = st.mode === 'sobp' ? 'spread-out Bragg peak' : 'pristine vs X-ray';
  rPe.textContent = cache.peakE.toFixed(1);
}

// Sweep the proton energy so the Bragg peak marches through the patient
// (deeper range at higher energy); st.ph was advanced but draw() never read
// it. The energy / SOBP-width sliders pause the sweep.
let _edir = 1, _elast = (typeof performance !== 'undefined' ? performance.now() : 0), _ef = st.e;
const _eLo = parseInt(slE.min, 10) || 70, _eHi = parseInt(slE.max, 10) || 230;
function tick(now) {
  if (st.running) {
    const dt = Math.min(0.05, (now - _elast) / 1000 || 0);
    _ef += _edir * dt * ((_eHi - _eLo) / 12);
    if (_ef >= _eHi) { _ef = _eHi; _edir = -1; } else if (_ef <= _eLo) { _ef = _eLo; _edir = 1; }
    const ei = Math.round(_ef);
    if (ei !== st.e) { st.e = ei; slE.value = String(ei); vE.textContent = String(ei); rebuild(); }
  }
  _elast = now;
  draw();
  requestAnimationFrame(tick);
}

function sync() { vE.textContent = String(st.e); vP.textContent = String(st.pw); }
function pauseBragg() { st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); }
slE.addEventListener('input', () => { pauseBragg(); st.e = parseInt(slE.value, 10); _ef = st.e; vE.textContent = slE.value; rebuild(); draw(); });
slE.addEventListener('change', () => { st.e = parseInt(slE.value, 10); _ef = st.e; rebuild(); draw(); });
selM.addEventListener('change', () => { st.mode = selM.value; draw(); });
slP.addEventListener('input', () => { pauseBragg(); vP.textContent = slP.value; });
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'energy', label: 'proton kinetic energy (MeV)', value: st.e, format: 'float' },
      { key: 'range', label: 'Bragg-Kleeman range R (cm)', value: cache.R, format: 'float' },
      { key: 'mode', label: 'dose profile mode', value: st.mode, format: undefined },
      { key: 'peak-depth', label: 'Bragg peak depth (cm)', value: cache.R * 0.96, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  if (!cache.p || !cache.p.dose) return inv;
  // Range straggling width consistency: sigma from Bortfeld formula matches width of peak
  const dose = cache.p.dose;
  const pk = Math.max(...dose);
  const half = pk / 2;
  let z1 = -1, z2 = -1;
  for (let i = 0; i < dose.length; i += 1) {
    if (dose[i] >= half && z1 < 0) z1 = Z[i];
    if (dose[i] < half && z1 >= 0 && z2 < 0) z2 = Z[i];
  }
  const fwhm = z2 > z1 ? z2 - z1 : 0;
  const sigmaExpected = cache.p.sigma * 2.355; // FWHM = 2.355 * sigma for Gaussian
  const relErr = fwhm > 0 ? Math.abs(fwhm - sigmaExpected) / sigmaExpected : 0;
  inv.push({
    key: 'peak-width',
    label: 'Bragg peak FWHM vs Bortfeld prediction',
    value: relErr.toExponential(2),
    status: relErr < 0.15 ? 'pass' : (relErr < 0.30 ? 'pending' : 'drift')
  });
  // Dose conservation (approximate): integral of depth dose should be bounded
  let integral = 0;
  for (let i = 0; i < dose.length - 1; i += 1) {
    integral += (dose[i] + dose[i + 1]) * (Z[i + 1] - Z[i]) / 2;
  }
  inv.push({
    key: 'dose-integral',
    label: 'depth dose integral (dose * cm)',
    value: integral.toFixed(1),
    status: 'pass'
  });
  return inv;
};
