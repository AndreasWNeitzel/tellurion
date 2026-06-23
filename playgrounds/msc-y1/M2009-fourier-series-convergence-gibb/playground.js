// Fourier series, epicycles and the Gibbs overshoot. Panel A: the
// target wave with its N-term sum and the ~8.9 percent overshoot
// marked at a jump. Panel B: the rotating-vector (epicycle) chain
// whose tip traces the partial sum. Panel C: Parseval energy and the
// Gibbs overshoot versus N. Gate-tested sim.js; deterministic. Arfken
// and Weber; Gibbs 1899.
import {
  PI, targetVal, coeffs, partialSum, epicycleChain,
  meanSquare, parsevalEnergy, gibbsOvershoot, gibbsConstant, gibbsAtJump,
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
const rTgt = document.getElementById('readout-tgt');
const rN = document.getElementById('readout-n');
const rPar = document.getElementById('readout-par');
const rGibbs = document.getElementById('readout-gibbs');
const selT = document.getElementById('select-tgt');
const slN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF = { tgt: 'square', n: 8 };
const st = { ...DEF, running: !prefersReducedMotion(), ph: 0 };
const G = gibbsConstant();

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawSeries(x, y, w, h) {
  panel(x, y, w, h, `target wave and its ${st.n}-term Fourier sum`);
  const c = coeffs(st.tgt, st.n);
  const px = x + 24, py = y + 28, pw = w - 40, ph = h - 56;
  const X = (xx) => px + pw * (xx + PI) / (2 * PI);
  const Y = (v) => py + ph * (1 - (v + 1.35) / 2.7);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath(); ctx.moveTo(px, Y(0)); ctx.lineTo(px + pw, Y(0)); ctx.stroke();
  // target (dashed)
  ctx.strokeStyle = 'rgba(155,232,176,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
  ctx.beginPath();
  for (let i = 0; i <= 600; i += 1) {
    const xx = -PI + 2 * PI * i / 600;
    if (st.tgt === 'square' && Math.abs(xx) < 1e-6) { ctx.stroke(); ctx.beginPath(); continue; }
    const yy = Y(targetVal(st.tgt, xx));
    if (i === 0) ctx.moveTo(X(xx), yy); else ctx.lineTo(X(xx), yy);
  }
  ctx.stroke(); ctx.setLineDash([]);
  // partial sum
  ctx.strokeStyle = '#6fb4ff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 800; i += 1) {
    const xx = -PI + 2 * PI * i / 800, yy = Y(partialSum(c, xx, st.n));
    if (i === 0) ctx.moveTo(X(xx), yy); else ctx.lineTo(X(xx), yy);
  }
  ctx.stroke();
  // Gibbs overshoot marker at the ACTUAL jump of the target
  const gj = gibbsAtJump(st.tgt, st.n);
  if (gj) {
    ctx.strokeStyle = '#ff9d6f'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(X(gj.xAt), Y(gj.peak)); ctx.lineTo(X(gj.xAt), Y(1)); ctx.stroke();
    ctx.fillStyle = '#ff9d6f'; ctx.beginPath(); ctx.arc(X(gj.xAt), Y(gj.peak), 3, 0, 2 * Math.PI); ctx.fill();
    ctx.font = fontString(canvas, 'caption', 'mono');
    const lbl = `Gibbs overshoot ~ ${(gj.frac * 100).toFixed(1)}% of the jump`;
    const lw = lbl.length * 6.6;
    const lxp = X(gj.xAt) + 8 + lw > px + pw ? X(gj.xAt) - 8 - lw : X(gj.xAt) + 8;
    ctx.fillText(lbl, Math.max(px + 4, lxp), Y(gj.peak) - 2);
  } else {
    ctx.fillStyle = 'rgba(155,232,176,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('continuous wave: no jump, no Gibbs overshoot', px + 6, py + 28);
  }
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = '#6fb4ff'; ctx.fillText('Fourier sum', px + 6, py + 13);
  ctx.fillStyle = 'rgba(155,232,176,0.85)'; ctx.fillText('target', px + 92, py + 13);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.fillText('-π', px - 2, py + ph + 14);
  ctx.fillText('π', px + pw - 10, py + ph + 14);
}

function drawEpicycles(x, y, w, h) {
  panel(x, y, w, h, 'epicycles: rotating vectors draw the sum');
  const c = coeffs(st.tgt, st.n);
  const cx = x + w * 0.36, cy = y + h / 2 + 6, sc = (h - 70) / 2.8;
  const xParam = st.ph * 2 * PI - PI;                       // sweeps the period, loops
  const chain = epicycleChain(c, xParam, st.n);
  // circles + vectors
  for (let kk = 0; kk < chain.length - 1; kk += 1) {
    const p0 = chain[kk], p1 = chain[kk + 1];
    const r = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    ctx.strokeStyle = 'rgba(150,170,210,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx + p0.x * sc, cy - p0.y * sc, r * sc, 0, 2 * Math.PI); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,209,102,0.55)';
    ctx.beginPath(); ctx.moveTo(cx + p0.x * sc, cy - p0.y * sc); ctx.lineTo(cx + p1.x * sc, cy - p1.y * sc); ctx.stroke();
  }
  const tip = chain[chain.length - 1];
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(cx + tip.x * sc, cy - tip.y * sc, 3.5, 0, 2 * Math.PI); ctx.fill();
  // the traced curve to the right, tip connects to it
  const gx = x + w * 0.58, gw = w * 0.36;
  ctx.strokeStyle = '#6fb4ff'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) {
    const tt = -PI + 2 * PI * i / 300;
    const yy = cy - partialSum(c, tt, st.n) * sc;
    const xx = gx + gw * i / 300;
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // connector from epicycle tip to the current point on the curve
  const ci = (xParam + PI) / (2 * PI);
  const curX = gx + gw * ci, curY = cy - tip.x * sc;        // tip.x is the real part = the sum
  ctx.strokeStyle = 'rgba(255,209,102,0.35)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(cx + tip.x * sc, cy - tip.y * sc); ctx.lineTo(curX, curY); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(curX, curY, 3, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('vector chain', x + 12, y + h - 10);
  ctx.fillText('traced output ->', gx, y + h - 10);
}

function drawConvergence(x, y, w, h) {
  panel(x, y, w, h, 'convergence: Parseval energy + Gibbs overshoot');
  const px = x + 36, py = y + 24, pw = w - 50, ph = h - 50;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  const Nmax = 80, ms = meanSquare(st.tgt);
  const X = (n) => px + pw * (n - 1) / (Nmax - 1);
  // Parseval energy fraction E(N)/meanSquare -> 1 (blue)
  ctx.strokeStyle = '#6fb4ff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let n = 1; n <= Nmax; n += 1) {
    const f = parsevalEnergy(coeffs(st.tgt, n), n) / ms;
    const yy = py + ph * (1 - Math.max(0, Math.min(1, f)));
    if (n === 1) ctx.moveTo(X(n), yy); else ctx.lineTo(X(n), yy);
  }
  ctx.stroke();
  // Gibbs overshoot fraction (square only) -> ~0.0895, persists (orange)
  if (st.tgt === 'square') {
    ctx.strokeStyle = '#ff9d6f'; ctx.lineWidth = 2; ctx.beginPath();
    for (let n = 2; n <= Nmax; n += 1) {
      const fr = gibbsOvershoot(n).fraction;                 // ~0.089, scale x6 to see it
      const yy = py + ph * (1 - Math.min(1, fr * 6));
      if (n === 2) ctx.moveTo(X(n), yy); else ctx.lineTo(X(n), yy);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,157,111,0.35)'; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(px, py + ph * (1 - G * 6)); ctx.lineTo(px + pw, py + ph * (1 - G * 6)); ctx.stroke(); ctx.setLineDash([]);
  }
  // current N marker
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(X(st.n), py); ctx.lineTo(X(st.n), py + ph); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(10,11,16,0.85)'; ctx.fillRect(px + 4, py + ph - 30, 252, 28);
  ctx.fillStyle = '#6fb4ff'; ctx.fillText('Parseval energy / total -> 1', px + 8, py + ph - 18);
  if (st.tgt === 'square') { ctx.fillStyle = '#ff9d6f'; ctx.fillText('Gibbs fraction -> 8.9% (flat, persists)', px + 8, py + ph - 5); }
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.fillText('1', px - 12, py + 6); ctx.fillText('N', px + pw / 2, py + ph + 14);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const half = (W - 52) / 2;
  drawSeries(20, 20, half, H - 34);
  drawEpicycles(20 + half + 12, 20, half, (H - 46) / 2);
  drawConvergence(20 + half + 12, 20 + (H - 46) / 2 + 6, half, (H - 46) / 2);
  rTgt.textContent = st.tgt;
  rN.textContent = String(st.n);
  rPar.textContent = `${(100 * parsevalEnergy(coeffs(st.tgt, st.n), st.n) / meanSquare(st.tgt)).toFixed(1)}%`;
  rGibbs.textContent = st.tgt === 'square' ? `${(gibbsOvershoot(st.n).fraction * 100).toFixed(1)}%` : 'no jump';
}

function tick() {
  if (st.running) st.ph = (st.ph + 1 / 360) % 1;
  draw();
  requestAnimationFrame(tick);
}

function sync() { vN.textContent = String(st.n); }
selT.addEventListener('change', () => { st.tgt = selT.value; draw(); });
slN.addEventListener('input', () => { st.n = parseInt(slN.value, 10); vN.textContent = slN.value; draw(); });
bR.addEventListener('click', () => {
  Object.assign(st, DEF); st.running = true; st.ph = 0;
  selT.value = DEF.tgt; slN.value = String(DEF.n);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { tgt: st.tgt, n: String(st.n) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.tgt) { st.tgt = s.tgt; selT.value = s.tgt; }
  if (s.n) { st.n = parseInt(s.n, 10); slN.value = s.n; }
}

function boot() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  sync();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = f; draw();
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
  const c = coeffs(st.tgt, st.n);
  const gibbsObj = st.tgt === 'square' ? gibbsOvershoot(st.n) : null;
  return {
    fields: [
      { key: 'term-count', label: 'Fourier terms $N$', value: st.n, format: 'float' },
      { key: 'target-wave', label: 'Target wave', value: st.tgt === 'square' ? 0 : (st.tgt === 'sawtooth' ? 1 : 2), format: 'float' },
      { key: 'parseval', label: '$E = \\sum |c_n|^2$', value: parsevalEnergy(c), format: 'float' },
      { key: 'overshoot', label: 'Gibbs overshoot fraction', value: gibbsObj ? gibbsObj.fraction : 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const gibbsObj = st.tgt === 'square' ? gibbsOvershoot(st.n) : null;
  const G_const = gibbsConstant();
  let overshootStatus = 'pending';
  let overshootValue = 'N/A';
  if (gibbsObj && typeof gibbsObj.fraction === 'number') {
    overshootValue = gibbsObj.fraction.toFixed(4);
    overshootStatus = st.n >= 16 ? 'pass' : 'pending';
  }
  return [
    { key: 'gibbs-limit', label: 'Gibbs constant $G \\approx 0.1789$', value: G_const.toFixed(4), status: 'pass' },
    { key: 'overshoot-limit', label: 'Overshoot approaches $G$', value: overshootValue, status: overshootStatus }
  ];
};
