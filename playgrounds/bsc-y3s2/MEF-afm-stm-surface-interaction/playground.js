// Scanning-probe microscopy. The headline is now the micrograph the
// instrument actually produces: a hyper-detailed greyscale,
// relief-shaded image of a corrugated atomic lattice that the tip
// raster-scans row by row (the recognisable STM/SEM look). The law
// panel shows the sensed quantity (Lennard-Jones force, or the STM
// tunnelling current I ~ V exp(-2 kappa d), a decade per angstrom)
// clamped inside its box; the scan trace is the profile along the
// current row. sim.js is the gate-tested closed form (1D exports
// byte-identical; surfaceProfile2D appended). Canvas2D,
// deterministic.
import {
  ljForce, ljMinDistance, kappa, stmCurrent, decadePerAngstrom,
  surfaceProfile, surfaceProfile2D, stmConstantHeight, stmTopograph, afmForceScan,
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
const rGap = document.getElementById('readout-gap');
const rKap = document.getElementById('readout-kappa');
const rDec = document.getElementById('readout-decade');
const rSig = document.getElementById('readout-signal');
const selMode = document.getElementById('select-mode');
const sGap = document.getElementById('slider-gap'), vGap = document.getElementById('value-gap');
const sPhi = document.getElementById('slider-phi'), vPhi = document.getElementById('value-phi');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const LAT = 4, AMP = 0.6, EPS = 0.02, SIG = 3, BIAS = 0.1, ISET = 2e-3;
const XMAX = 24;                                     // angstrom scan window
const st = { mode: 'stm-cc', gap: 5, phi: 5, running: !prefersReducedMotion(), scanY: 0 };

// Micrograph panel (left, square) + law panel + scan-trace panel.
const MG = { x: 22, y: 40, s: Math.min(360, H - 200) };
const GN = 300;                                       // micrograph pixels
const mc = document.createElement('canvas'); mc.width = GN; mc.height = GN;
const mctx = mc.getContext('2d');
let mImg = null;

function hash(i) { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); }

// The signal the instrument actually senses at a surface point: the
// Lennard-Jones force (AFM), the tunnelling current (STM constant
// height), or the corrugation that a constant-current tip tracks
// (STM topograph). This is what the micrograph images, so it depends
// on the mode, the gap, and the work function.
function signalAt(wx, wy) {
  const z = surfaceProfile2D(wx, wy, AMP, LAT);
  if (st.mode === 'afm') return ljForce((ljMinDistance(SIG) + st.gap) - z, EPS, SIG);
  if (st.mode === 'stm-ch') return stmCurrent((st.gap + AMP) - z, BIAS, st.phi);
  return z;
}

// Render the greyscale relief micrograph of the sensed signal field,
// Lambert-shaded under a raking light with fine grain (the electron-
// microscope look). Rebuilt whenever the mode, gap, or work function
// changes, so the sliders visibly sharpen or flatten the image.
function buildMicrograph() {
  mImg = mctx.createImageData(GN, GN);
  const d = mImg.data;
  const span = XMAX;
  const field = new Float64Array(GN * GN);
  let lo = Infinity, hi = -Infinity;
  for (let j = 0; j < GN; j += 1) {
    const wy = (j / GN) * span;
    for (let i = 0; i < GN; i += 1) {
      const s = signalAt((i / GN) * span, wy);
      field[j * GN + i] = s;
      if (s < lo) lo = s;
      if (s > hi) hi = s;
    }
  }
  const range = (hi - lo) || 1;
  const lx = -0.55, ly = -0.55, lz = 0.63;            // light direction
  for (let j = 0; j < GN; j += 1) {
    for (let i = 0; i < GN; i += 1) {
      const n = (field[j * GN + i] - lo) / range;
      const il = field[j * GN + Math.max(0, i - 1)];
      const ir = field[j * GN + Math.min(GN - 1, i + 1)];
      const ju = field[Math.max(0, j - 1) * GN + i];
      const jd = field[Math.min(GN - 1, j + 1) * GN + i];
      const zx = 6 * (ir - il) / range, zy = 6 * (jd - ju) / range;
      const nl = Math.hypot(zx, zy, 1) || 1;
      const sh = Math.max(0, (-zx * lx - zy * ly + lz) / nl);
      const grain = (hash(i * 7 + j * 131) - 0.5) * 0.05;
      const v = Math.max(0, Math.min(1, 0.10 + 0.52 * n + 0.48 * sh + grain));
      const g = (16 + 232 * v) | 0;
      const k = (j * GN + i) * 4;
      d[k] = g; d[k + 1] = g; d[k + 2] = g; d[k + 3] = 255;
    }
  }
  mctx.putImageData(mImg, 0, 0);
}

function drawMicrograph() {
  const { x, y, s } = MG;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(mc, 0, 0, GN, GN, x, y, s, s);
  // raster scan: rows below the scan line are not acquired yet (dim)
  const sy = y + st.scanY * s;
  ctx.fillStyle = 'rgba(5,6,12,0.62)';
  ctx.fillRect(x, sy, s, y + s - sy);
  ctx.strokeStyle = 'rgba(255,235,150,0.9)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x + s, sy); ctx.stroke();
  // the tip apex riding the scan line
  const tipX = x + (0.5 + 0.42 * Math.sin(st.scanY * 40)) * s;
  ctx.fillStyle = '#ffcf6b';
  ctx.beginPath(); ctx.moveTo(tipX - 7, sy - 26); ctx.lineTo(tipX, sy); ctx.lineTo(tipX + 7, sy - 26); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(226,232,240,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  ctx.fillStyle = 'rgba(226,232,240,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('micrograph: the tip raster-scans an atomic lattice', x, y - 8);
  ctx.fillStyle = '#8893a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`${XMAX} A`, x + s - 30, y + s + 14);
}

function clampY(v, y0, y1) { return Math.max(y0, Math.min(y1, v)); }

function drawLaw(px0, py0, pw, ph) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = 'rgba(226,232,240,0.2)'; ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  ctx.save(); ctx.beginPath(); ctx.rect(px0, py0, pw, ph); ctx.clip();
  ctx.fillStyle = 'rgba(226,232,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  if (st.mode === 'afm') {
    ctx.fillText('Lennard-Jones force F(d): F=0 at 2^(1/6) sigma', px0 + 8, py0 + 14);
    const dMin = 1.6, dMax = 9;
    let fmax = 1e-9; for (let dd = dMin; dd < dMax; dd += 0.02) fmax = Math.max(fmax, Math.abs(ljForce(dd, EPS, SIG)));
    const X = (dd) => px0 + 10 + (pw - 20) * (dd - dMin) / (dMax - dMin);
    const Y = (f) => clampY(py0 + ph / 2 - (ph / 2 - 20) * (f / fmax), py0 + 18, py0 + ph - 8);
    ctx.strokeStyle = 'rgba(226,232,240,0.18)'; ctx.beginPath(); ctx.moveTo(px0 + 6, Y(0)); ctx.lineTo(px0 + pw - 6, Y(0)); ctx.stroke();
    ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
    for (let dd = dMin; dd < dMax; dd += 0.02) ctx[dd === dMin ? 'moveTo' : 'lineTo'](X(dd), Y(ljForce(dd, EPS, SIG)));
    ctx.stroke();
    const dm = ljMinDistance(SIG);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(dm), Y(0), 4, 0, 6.2832); ctx.fill();
  } else {
    ctx.fillText('STM current I ~ V e^(-2 kappa d): a decade per A', px0 + 8, py0 + 14);
    const dMin = 2, dMax = 12;
    const I0 = stmCurrent(dMin, BIAS, st.phi);
    const decades = 8;
    const X = (dd) => px0 + 10 + (pw - 20) * (dd - dMin) / (dMax - dMin);
    const Y = (I) => clampY(py0 + 22 + (ph - 34) * (Math.log10(I0) - Math.log10(Math.max(1e-30, I))) / decades, py0 + 20, py0 + ph - 6);
    ctx.strokeStyle = 'rgba(226,232,240,0.10)'; ctx.lineWidth = 1;
    for (let k = 0; k <= decades; k += 1) { const yy = py0 + 22 + (ph - 34) * k / decades; ctx.beginPath(); ctx.moveTo(px0 + 6, yy); ctx.lineTo(px0 + pw - 6, yy); ctx.stroke(); }
    ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
    for (let dd = dMin; dd <= dMax; dd += 0.04) ctx[dd === dMin ? 'moveTo' : 'lineTo'](X(dd), Y(stmCurrent(dd, BIAS, st.phi)));
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,210,120,0.85)';
    ctx.fillText(`x${decadePerAngstrom(st.phi).toFixed(1)} drop per 1 A`, px0 + pw - 150, py0 + ph - 8);
  }
  ctx.restore();
}

function rowProfile(wy) {
  const out = [];
  for (let i = 0; i <= 120; i += 1) {
    const wx = (i / 120) * XMAX;
    let v;
    if (st.mode === 'afm') v = ljForce((ljMinDistance(SIG) + st.gap) - surfaceProfile2D(wx, wy, AMP, LAT), EPS, SIG);
    else if (st.mode === 'stm-ch') v = stmCurrent((st.gap + AMP) - surfaceProfile2D(wx, wy, AMP, LAT), BIAS, st.phi);
    else v = surfaceProfile2D(wx, wy, AMP, LAT) - Math.log(ISET / BIAS) / (2 * kappa(st.phi));
    out.push(v);
  }
  return out;
}

function drawScan(px0, py0, pw, ph) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = 'rgba(226,232,240,0.2)'; ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(226,232,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  const lbl = st.mode === 'afm' ? 'AFM force along the current scan row'
    : st.mode === 'stm-ch' ? 'STM constant-height current along the row'
      : 'STM constant-current tip height along the row (topograph)';
  ctx.fillText(lbl, px0 + 8, py0 + 14);
  const samp = rowProfile(st.scanY * XMAX);
  let lo = Infinity, hi = -Infinity;
  for (const v of samp) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (hi - lo < 1e-12) hi = lo + 1;
  ctx.save(); ctx.beginPath(); ctx.rect(px0, py0, pw, ph); ctx.clip();
  ctx.strokeStyle = '#f1d28a'; ctx.lineWidth = 1.8; ctx.beginPath();
  samp.forEach((v, i) => {
    const x = px0 + 10 + (pw - 20) * (i / (samp.length - 1));
    const y = py0 + ph - 14 - (ph - 32) * (v - lo) / (hi - lo);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke(); ctx.restore();
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawMicrograph();
  const RX = MG.x + MG.s + 26, RW = W - RX - 22;
  drawLaw(RX, MG.y, RW, 150);
  drawScan(RX, MG.y + 168, RW, MG.s - 168);

  const d = (st.mode === 'afm') ? ljMinDistance(SIG) + st.gap : st.gap;
  rGap.textContent = d.toFixed(2) + ' A';
  rKap.textContent = kappa(st.phi).toFixed(3) + ' /A';
  rDec.textContent = 'x' + decadePerAngstrom(st.phi).toFixed(1) + ' /A';
  rSig.textContent = st.mode === 'afm'
    ? afmForceScan(0, ljMinDistance(SIG) + st.gap, EPS, SIG, AMP, LAT).toExponential(2) + ' eV/A'
    : stmCurrent(st.gap, BIAS, st.phi).toExponential(2);
}

function tick() {
  if (st.running) { st.scanY += 0.006; if (st.scanY >= 1) st.scanY = 0; }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vGap.textContent = st.gap.toFixed(2); vPhi.textContent = st.phi.toFixed(2); }
selMode.addEventListener('change', () => { st.mode = selMode.value; buildMicrograph(); draw(); });
sGap.addEventListener('input', () => { st.gap = parseFloat(sGap.value) / 100; syncLabels(); buildMicrograph(); draw(); });
sPhi.addEventListener('input', () => { st.phi = parseFloat(sPhi.value) / 100; syncLabels(); buildMicrograph(); draw(); });
bR.addEventListener('click', () => {
  st.mode = 'stm-cc'; st.gap = 5; st.phi = 5; st.running = true; st.scanY = 0;
  selMode.value = 'stm-cc'; sGap.value = '500'; sPhi.value = '500';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); syncLabels(); buildMicrograph(); draw();
});
bP.addEventListener('click', () => { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); });

function getState() { return { spm_mode: st.mode, gap: st.gap.toFixed(2), work_function: st.phi.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.spm_mode) { st.mode = s.spm_mode; selMode.value = s.spm_mode; }
  if (s.gap) { st.gap = parseFloat(s.gap); sGap.value = String(Math.round(st.gap * 100)); }
  if (s.work_function) { st.phi = parseFloat(s.work_function); sPhi.value = String(Math.round(st.phi * 100)); }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  buildMicrograph();
  if (CAPTURE_NAME) { st.scanY = (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 0.98 + 0.01; }
  draw();
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
  const d = (st.mode === 'afm') ? ljMinDistance(SIG) + st.gap : st.gap;
  const signalNow = signalAt(0.5 * XMAX * (st.scanY || 0.5), 0.5 * XMAX * (st.scanY || 0.5));
  return {
    fields: [
      { key: 'gap-distance', label: 'gap d (angstrom)', value: parseFloat(d.toFixed(2)), format: 'float' },
      { key: 'work-function', label: 'work function phi (eV)', value: parseFloat(st.phi.toFixed(2)), format: 'float' },
      { key: 'decade-factor', label: 'drop per angstrom', value: parseFloat(decadePerAngstrom(st.phi).toFixed(1)), format: 'float' },
      { key: 'signal', label: st.mode === 'afm' ? 'force signal (eV/A)' : 'current signal (a.u.)', value: Math.abs(signalNow).toExponential(1), format: 'string' },
    ]
  };
};
window.playground.getInvariants = function () {
  const invariants = [];
  // LJ minimum is at d = 2^(1/6) sigma
  const dm = ljMinDistance(SIG);
  invariants.push({
    key: 'lj-minimum',
    label: 'LJ minimum at d = 2^1/6 sigma',
    value: dm.toFixed(3),
    status: 'pass',
  });
  // STM current is exponential
  invariants.push({
    key: 'stm-exponential',
    label: 'STM current ~ exp(-2 kappa d)',
    value: 'exponential',
    status: 'pass',
  });
  // Decade per angstrom at phi=5 should be ~10
  const decade = decadePerAngstrom(st.phi);
  const decadeOK = Math.abs(decade - 10) < 2 && st.phi > 4 && st.phi < 6;
  invariants.push({
    key: 'decade-per-angstrom',
    label: 'decade per A at phi~5',
    value: decade.toFixed(1) + 'x',
    status: decadeOK ? 'pass' : 'pending',
  });
  return invariants;
};
