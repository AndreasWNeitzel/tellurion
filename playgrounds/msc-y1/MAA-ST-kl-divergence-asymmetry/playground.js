import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// KL-divergence asymmetry visualization. P is a bimodal mixture, Q is a
// single Gaussian whose mu, sigma the user controls. The plot shows
// D(P||Q) and D(Q||P) live and labels the argmin of each.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { pBimodal, qGaussian, klPQ, klQP, findArgmins, GRID_XMIN, GRID_XMAX, GRID_N } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderMu     = document.getElementById('slider-mu');
const sliderSig    = document.getElementById('slider-sigma');
const sliderSep    = document.getElementById('slider-sep');
const valueMu      = document.getElementById('value-mu');
const valueSig     = document.getElementById('value-sigma');
const valueSep     = document.getElementById('value-sep');
const btnCover     = document.getElementById('btn-cover');
const btnSeek      = document.getElementById('btn-seek');

const W = canvas.width, H = canvas.height;

const state = {
  mu: 0.0,
  sigma: 2.5,
  sep: 2.0,
  argmins: null,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function updateArgmins() {
  const { p } = pBimodal({ mu1: -state.sep, mu2: state.sep });
  state.argmins = findArgmins({ p });
}

// Diagnostic-curve colors (distinct from P=blue, Q=orange).
const FWD = '#5CC8A0'; // D(P||Q) forward KL, mass-covering
const REV = '#B07CC6'; // D(Q||P) reverse KL, mode-seeking

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // --- Top: density plot (P bimodal, Q single Gaussian) ---
  const X0 = 60, X1 = W - 60;
  const Y0 = 46, Y1 = 596;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);

  const { p } = pBimodal({ mu1: -state.sep, mu2: state.sep });
  const { q } = qGaussian({ mu: state.mu, sigma: state.sigma });
  const xs = new Float64Array(GRID_N);
  for (let i = 0; i < GRID_N; i += 1) xs[i] = GRID_XMIN + (GRID_XMAX - GRID_XMIN) * (i / (GRID_N - 1));

  // Find max for scaling
  let yMax = 0;
  for (let i = 0; i < GRID_N; i += 1) {
    if (p[i] > yMax) yMax = p[i];
    if (q[i] > yMax) yMax = q[i];
  }
  yMax *= 1.10;

  function toPx(x, y) {
    return {
      px: X0 + (X1 - X0) * (x - GRID_XMIN) / (GRID_XMAX - GRID_XMIN),
      py: Y1 - (Y1 - Y0) * (y / yMax),
    };
  }

  // axis x = 0
  const zero = toPx(0, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(zero.px, Y0); ctx.lineTo(zero.px, Y1);
  ctx.stroke();

  // P (filled)
  ctx.fillStyle = 'rgba(110, 165, 215, 0.30)';
  ctx.beginPath();
  const first = toPx(xs[0], 0);
  ctx.moveTo(first.px, first.py);
  for (let i = 0; i < GRID_N; i += 1) {
    const pp = toPx(xs[i], p[i]);
    ctx.lineTo(pp.px, pp.py);
  }
  const last = toPx(xs[GRID_N - 1], 0);
  ctx.lineTo(last.px, last.py);
  ctx.closePath();
  ctx.fill();
  // P outline
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < GRID_N; i += 1) {
    const pp = toPx(xs[i], p[i]);
    if (i === 0) ctx.moveTo(pp.px, pp.py); else ctx.lineTo(pp.px, pp.py);
  }
  ctx.stroke();

  // Q outline (orange)
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < GRID_N; i += 1) {
    const pp = toPx(xs[i], q[i]);
    if (i === 0) ctx.moveTo(pp.px, pp.py); else ctx.lineTo(pp.px, pp.py);
  }
  ctx.stroke();

  // In-plot series labels
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillStyle = tok.accent;
  ctx.fillText('P  target (bimodal)', X0 + 10, Y0 + 18);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('Q  fit (single Gaussian)', X0 + 10, Y0 + 36);

  // Tick labels on x
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (const xt of [-6, -3, 0, 3, 6]) {
    const t = toPx(xt, 0);
    ctx.fillText(String(xt), t.px, Y1 + 14);
  }

  // Live KL readouts
  const pq = klPQ(p, q);
  const qp = klQP(p, q);
  state.klPQ = pq;
  state.klQP = qp;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.textAlign = 'left';
  ctx.fillText('D(P || Q) = ' + pq.toFixed(4) + ' nats  (mass-covering)', X0, Y0 - 14);
  ctx.textAlign = 'right';
  ctx.fillText('D(Q || P) = ' + qp.toFixed(4) + ' nats  (mode-seeking)', X1, Y0 - 14);

  // --- Bottom: divergence landscape, each direction at its own optimal width ---
  // D(P||Q)(mu) at the forward-optimal (broad) sigma has ONE central minimum
  // (mass-covering); D(Q||P)(mu) at the reverse-optimal (narrow) sigma has TWO
  // minima sitting on the modes (mode-seeking). That split is the asymmetry.
  const LX0 = 60, LX1 = W - 60;
  const LY0 = 690, LY1 = 1004;
  const muMin = -6.5, muMax = 6.5, M = 180;
  const sigF = state.argmins ? state.argmins.argminPQ.sigma : 2.1;
  const sigR = state.argmins ? state.argmins.argminQP.sigma : 0.6;
  const fwd = new Float64Array(M);
  const rev = new Float64Array(M);
  let minF = { v: Infinity, mu: 0 }, minR = { v: Infinity, mu: 0 };
  for (let i = 0; i < M; i += 1) {
    const mu = muMin + (muMax - muMin) * (i / (M - 1));
    const { q: qF } = qGaussian({ mu, sigma: sigF });
    const { q: qR } = qGaussian({ mu, sigma: sigR });
    fwd[i] = klPQ(p, qF);
    rev[i] = klQP(p, qR);
    if (fwd[i] < minF.v) minF = { v: fwd[i], mu };
    if (rev[i] < minR.v) minR = { v: rev[i], mu };
  }
  // Clip the y-axis so the off-mode blow-ups flatten instead of escaping.
  const yMaxL = 4.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(LX0, LY0, LX1 - LX0, LY1 - LY0);
  const toL = (mu, v) => ({
    px: LX0 + (LX1 - LX0) * (mu - muMin) / (muMax - muMin),
    py: LY1 - (LY1 - LY0) * Math.min(v, yMaxL) / yMaxL,
  });
  // y gridlines
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.textAlign = 'right';
  for (const yv of [0, 1, 2, 3, 4]) {
    const py = LY1 - (LY1 - LY0) * yv / yMaxL;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath(); ctx.moveTo(LX0, py); ctx.lineTo(LX1, py); ctx.stroke();
    ctx.fillText(String(yv), LX0 - 6, py + 4);
  }
  // mode reference lines at +/- sep
  ctx.strokeStyle = 'rgba(110, 165, 215, 0.22)';
  ctx.setLineDash([3, 4]);
  for (const m of [-state.sep, state.sep]) {
    const t = toL(m, 0);
    ctx.beginPath(); ctx.moveTo(t.px, LY0); ctx.lineTo(t.px, LY1); ctx.stroke();
  }
  ctx.setLineDash([]);
  // forward curve
  const drawCurve = (arr, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2.0; ctx.beginPath();
    for (let i = 0; i < M; i += 1) {
      const mu = muMin + (muMax - muMin) * (i / (M - 1));
      const pt = toL(mu, arr[i]);
      if (i === 0) ctx.moveTo(pt.px, pt.py); else ctx.lineTo(pt.px, pt.py);
    }
    ctx.stroke();
  };
  drawCurve(fwd, FWD);
  drawCurve(rev, REV);
  // minima markers
  const mark = (mu, v, color) => {
    const pt = toL(mu, v);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(pt.px, pt.py, 4, 0, Math.PI * 2); ctx.fill();
  };
  mark(minF.mu, minF.v, FWD);
  // reverse KL is symmetric: mark both modes
  mark(minR.mu, minR.v, REV);
  mark(-minR.mu, minR.v, REV);
  // live mu marker (current Q position)
  const liveX = toL(state.mu, 0).px;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.setLineDash([2, 3]); ctx.lineWidth = 1.0;
  ctx.beginPath(); ctx.moveTo(liveX, LY0); ctx.lineTo(liveX, LY1); ctx.stroke();
  ctx.setLineDash([]);
  // legend + labels
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('divergence vs Q mean  (each direction at its optimal width)', LX0, LY0 - 12);
  ctx.fillStyle = FWD;
  ctx.fillText(`D(P||Q), sigma=${sigF.toFixed(2)}: one central minimum -> covers both modes`, LX0 + 8, LY0 + 18);
  ctx.fillStyle = REV;
  ctx.fillText(`D(Q||P), sigma=${sigR.toFixed(2)}: two minima -> locks onto one mode`, LX0 + 8, LY0 + 36);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (const xt of [-6, -3, 0, 3, 6]) {
    const t = toL(xt, 0);
    ctx.fillText(String(xt), t.px, LY1 + 16);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('Q mean  mu', (LX0 + LX1) / 2, LY1 + 32);
}

sliderMu.addEventListener('input', () => {
  state.mu = parseFloat(sliderMu.value);
  valueMu.textContent = state.mu.toFixed(2);
  drawAll();
});
sliderSig.addEventListener('input', () => {
  state.sigma = parseFloat(sliderSig.value);
  valueSig.textContent = state.sigma.toFixed(2);
  drawAll();
});
sliderSep.addEventListener('change', () => {
  state.sep = parseFloat(sliderSep.value);
  valueSep.textContent = state.sep.toFixed(1);
  updateArgmins();
  drawAll();
});
sliderSep.addEventListener('input', () => {
  valueSep.textContent = parseFloat(sliderSep.value).toFixed(1);
});
btnCover.addEventListener('click', () => {
  if (!state.argmins) return;
  state.mu = state.argmins.argminPQ.mu;
  state.sigma = state.argmins.argminPQ.sigma;
  sliderMu.value = state.mu.toFixed(2);
  sliderSig.value = state.sigma.toFixed(2);
  valueMu.textContent = state.mu.toFixed(2);
  valueSig.textContent = state.sigma.toFixed(2);
  drawAll();
});
btnSeek.addEventListener('click', () => {
  if (!state.argmins) return;
  state.mu = state.argmins.argminQP.mu;
  state.sigma = state.argmins.argminQP.sigma;
  sliderMu.value = state.mu.toFixed(2);
  sliderSig.value = state.sigma.toFixed(2);
  valueMu.textContent = state.mu.toFixed(2);
  valueSig.textContent = state.sigma.toFixed(2);
  drawAll();
});

function bootSync() {
  updateArgmins();
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Slide Q from broad-covering at 0 to mode-seeking at +sep through capture frames.
    const samples = [
      { mu: 0, sigma: 2.8 },         // wide centered
      { mu: 0, sigma: 1.0 },         // narrow centered (high D(P||Q))
      { mu: state.sep, sigma: 0.7 }, // mode-seeking right
      { mu: -state.sep, sigma: 0.7 },// mode-seeking left
      { mu: 0, sigma: 3.5 },         // very wide
    ];
    const s = samples[Math.min(samples.length - 1, Math.round(frac * (samples.length - 1)))];
    state.mu = s.mu;
    state.sigma = s.sigma;
    sliderMu.value = state.mu.toFixed(2);
    sliderSig.value = state.sigma.toFixed(2);
    valueMu.textContent = state.mu.toFixed(2);
    valueSig.textContent = state.sigma.toFixed(2);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
        });
      });
    }
  }
}

// Animate: sweep Q's mean back and forth through the bimodal target.
let animTime = 0;
let userOverride = false;
let paused = false;
const btnPlayPause = document.getElementById('btn-playpause');
sliderMu.addEventListener('input', () => { userOverride = true; });
sliderSig.addEventListener('input', () => { userOverride = true; });
btnCover.addEventListener('click', () => { userOverride = true; });
btnSeek.addEventListener('click', () => { userOverride = true; });
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    paused = !paused;
    btnPlayPause.textContent = paused ? 'Play' : 'Pause';
    if (!paused) userOverride = false;
  });
}
function tick() {
  if (!paused && !userOverride && !CAPTURE_NAME) {
    animTime += 0.010;
    state.mu = (state.sep + 1.5) * Math.sin(animTime);
    state.sigma = 1.2 + 0.9 * (0.5 + 0.5 * Math.sin(animTime * 0.6));
    sliderMu.value = state.mu.toFixed(2);
    sliderSig.value = state.sigma.toFixed(2);
    valueMu.textContent = state.mu.toFixed(2);
    valueSig.textContent = state.sigma.toFixed(2);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'kl-p-to-q', label: 'D_KL(P||Q)', value: state.klPQ ? state.klPQ.toFixed(3) : '0', format: 'string' },
    { key: 'kl-q-to-p', label: 'D_KL(Q||P)', value: state.klQP ? state.klQP.toFixed(3) : '0', format: 'string' },
  ] };
};
window.playground.getInvariants = function () {
  return [ { key: 'kl-nonneg', label: 'KL >= 0', value: ((state.klPQ || 0) >= 0 && (state.klQP || 0) >= 0) ? 'pass' : 'drift', status: ((state.klPQ || 0) >= 0 && (state.klQP || 0) >= 0) ? 'pass' : 'drift' } ];
};
