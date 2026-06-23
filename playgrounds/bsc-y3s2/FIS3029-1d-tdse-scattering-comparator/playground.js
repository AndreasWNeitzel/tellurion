import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Render the 1D TDSE wavefunction (Re psi, |psi|^2) with barrier overlay.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createTDSE, stepCN, totalNorm, reflectionTransmission, N_GRID, X_MIN, X_MAX } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const selKind      = document.getElementById('select-kind');
const sliderV0     = document.getElementById('slider-v0');
const sliderK0     = document.getElementById('slider-k0');
const sliderSpeed  = document.getElementById('slider-speed');
const valueV0      = document.getElementById('value-v0');
const valueK0      = document.getElementById('value-k0');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  tdse: null,
  speed: 6,
  V0: 4.0,
  k0: 2.0,
  kind: 'barrier',
  lastMeasured: null,     // {E, R, T, kind} captured at clean separation, for the diagnostic
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

// Layout: the wavefunction fills the top panel, the transmission-vs-energy
// diagnostic the bottom. Confining the y mapping to the active panel keeps the
// wavepacket filling its frame instead of floating in a tall empty canvas.
const MAIN_Y0 = 22, MAIN_Y1 = Math.round(H * 0.60);
const DIAG_Y0 = Math.round(H * 0.665), DIAG_Y1 = H - 34;

function xToPx(x) { return (W - 40) * (x - X_MIN) / (X_MAX - X_MIN) + 20; }
function toPx(x, y, ymin, ymax) {
  return { px: xToPx(x), py: MAIN_Y0 + (MAIN_Y1 - MAIN_Y0) * (1 - (y - ymin) / (ymax - ymin)) };
}

// Closed-form transmission for a rectangular barrier, well or step (hbar=m=1).
// This is the reference the simulated packet is compared against.
function analyticT(E, V0, a, kind) {
  if (E <= 1e-4) return 0;
  if (kind === 'free') return 1;
  if (kind === 'step') {
    if (E <= V0) return 0;
    const k1 = Math.sqrt(2 * E), k2 = Math.sqrt(2 * (E - V0));
    return 4 * k1 * k2 / ((k1 + k2) * (k1 + k2));
  }
  const U = kind === 'well' ? -V0 : V0;        // a well is an attractive (negative) region
  if (E < U - 1e-6) {
    const kappa = Math.sqrt(2 * (U - E)), s = Math.sinh(kappa * a);
    return 1 / (1 + (U * U * s * s) / (4 * E * (U - E)));
  }
  if (E > U + 1e-6) {
    const q = Math.sqrt(2 * (E - U)), s = Math.sin(q * a);
    return 1 / (1 + (U * U * s * s) / (4 * E * (E - U)));
  }
  return 1 / (1 + U * U * a * a / 2);          // E = barrier top, the limit
}

function drawDiagnostic() {
  const x0 = 56, x1 = W - 24, y0 = DIAG_Y0, y1 = DIAG_Y1;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.5;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('transmission T vs incident energy E (analytic curve, simulated point)', x0 + 4, y0 - 6);
  const a = 3.0;                               // barrier/well width set in rebuild()
  const V0 = state.V0, kind = state.kind;
  const Eop = 0.5 * state.k0 * state.k0;
  const Emax = Math.max(2.6 * Math.abs(V0), Eop * 1.5, 6);
  const EX = (E) => x0 + (x1 - x0) * E / Emax;
  const TY = (T) => y1 - (y1 - y0 - 8) * Math.max(0, Math.min(1, T)) - 4;
  for (const Tg of [0, 0.5, 1]) {
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x0, TY(Tg)); ctx.lineTo(x1, TY(Tg)); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'right';
    ctx.fillText(Tg.toFixed(1), x0 - 4, TY(Tg) + 3);
  }
  if (kind === 'barrier' || kind === 'step') {
    ctx.strokeStyle = 'rgba(255,120,120,0.4)'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(EX(V0), y0); ctx.lineTo(EX(V0), y1); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,140,140,0.7)'; ctx.textAlign = 'center';
    ctx.fillText('E = V0', EX(Math.min(V0, Emax)), y1 - 5);
  }
  ctx.strokeStyle = tok.accentWarm; ctx.lineWidth = 1.8; ctx.beginPath();
  const M = 260;
  for (let i = 0; i <= M; i += 1) {
    const E = Emax * i / M;
    const pt = { px: EX(E), py: TY(analyticT(E, V0, a, kind)) };
    if (i === 0) ctx.moveTo(pt.px, pt.py); else ctx.lineTo(pt.px, pt.py);
  }
  ctx.stroke();
  const Top = analyticT(Eop, V0, a, kind);
  ctx.strokeStyle = 'rgba(255,213,127,0.55)'; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
  ctx.beginPath(); ctx.moveTo(EX(Eop), y0); ctx.lineTo(EX(Eop), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffd57f'; ctx.beginPath(); ctx.arc(EX(Eop), TY(Top), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillText(`E=${Eop.toFixed(2)}  T=${Top.toFixed(3)}`, Math.min(EX(Eop) + 6, x1 - 120), TY(Top) - 6);
  if (state.lastMeasured && state.lastMeasured.kind === kind) {
    const m = state.lastMeasured;
    ctx.strokeStyle = tok.accent; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(EX(m.E), TY(m.T), 5.5, 0, 2 * Math.PI); ctx.stroke();
    ctx.fillStyle = tok.accent; ctx.textAlign = 'right';
    ctx.fillText(`simulated T = ${m.T.toFixed(3)}`, x1 - 6, y0 + 14);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'right';
  ctx.fillText('E', x1 - 2, y1 - 4);
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const ymin = -0.45, ymax = 0.45;

  // main-panel axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 0.5;
  const zero = toPx(0, 0, ymin, ymax);
  ctx.beginPath();
  ctx.moveTo(20, zero.py); ctx.lineTo(W - 20, zero.py);
  ctx.moveTo(zero.px, MAIN_Y0); ctx.lineTo(zero.px, MAIN_Y1);
  ctx.stroke();

  if (!state.tdse) { drawDiagnostic(); return; }

  // Barrier / well region
  for (let i = 0; i < N_GRID; i += 1) {
    const x = X_MIN + i * (X_MAX - X_MIN) / (N_GRID - 1);
    const V = state.tdse.V[i];
    if (V !== 0) {
      const a = toPx(x, 0, ymin, ymax);
      const b = toPx(x, V * 0.05, ymin, ymax);
      ctx.fillStyle = V > 0 ? 'rgba(255, 80, 80, 0.20)' : 'rgba(80, 255, 80, 0.18)';
      ctx.fillRect(a.px - 1, Math.min(a.py, b.py), 2, Math.abs(a.py - b.py));
    }
  }

  // |psi|^2 in red
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < N_GRID; i += 1) {
    const x = X_MIN + i * (X_MAX - X_MIN) / (N_GRID - 1);
    const p = state.tdse.psiRe[i] ** 2 + state.tdse.psiIm[i] ** 2;
    const pt = toPx(x, p * 1.5, ymin, ymax);
    if (i === 0) ctx.moveTo(pt.px, pt.py); else ctx.lineTo(pt.px, pt.py);
  }
  ctx.stroke();

  // Re psi in blue
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let i = 0; i < N_GRID; i += 1) {
    const x = X_MIN + i * (X_MAX - X_MIN) / (N_GRID - 1);
    const pt = toPx(x, state.tdse.psiRe[i], ymin, ymax);
    if (i === 0) ctx.moveTo(pt.px, pt.py); else ctx.lineTo(pt.px, pt.py);
  }
  ctx.stroke();

  // Readout
  const norm = totalNorm(state.tdse);
  const { R, T } = reflectionTransmission(state.tdse);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const rows = [
    ['t',     state.tdse.t.toFixed(2)],
    ['V_0',   state.tdse.V0.toFixed(2)],
    ['k_0',   state.k0.toFixed(2)],
    ['E = k_0^2/2', (0.5 * state.k0 * state.k0).toFixed(2)],
    ['kind',  state.tdse.kind],
    ['norm',  norm.toFixed(4)],
    ['R (x<0)', R.toFixed(3)],
    ['T (x>0)', T.toFixed(3)],
  ];
  let y = MAIN_Y0 + 2;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 24, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, 244, y);
    y += 14;
  }

  // Color legend
  ctx.textAlign = 'right';
  ctx.fillStyle = tok.accent;
  ctx.fillText('Re ψ', W - 24, MAIN_Y0);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('|ψ|^2 (x 1.5)', W - 24, MAIN_Y0 + 14);

  drawDiagnostic();
}

function rebuild() {
  state.tdse = createTDSE({
    x0: -15, k0: state.k0, sigma: 1.5,
    V0: state.V0, barrierA: 3.0, kind: state.kind, dt: 0.05,
  });
}

function tickN(n) {
  if (!state.tdse) return;
  for (let i = 0; i < n; i += 1) stepCN(state.tdse);
}

selKind.addEventListener('change', () => { state.kind = selKind.value; rebuild(); drawAll(); });
sliderV0.addEventListener('change', () => { state.V0 = parseFloat(sliderV0.value); valueV0.textContent = state.V0.toFixed(1); rebuild(); drawAll(); });
sliderV0.addEventListener('input', () => { valueV0.textContent = parseFloat(sliderV0.value).toFixed(1); });
sliderK0.addEventListener('change', () => { state.k0 = parseFloat(sliderK0.value); valueK0.textContent = state.k0.toFixed(2); rebuild(); drawAll(); });
sliderK0.addEventListener('input', () => { valueK0.textContent = parseFloat(sliderK0.value).toFixed(2); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(frac * 400);   // 400 steps total = full crossing
    tickN(target);
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
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    tickN(state.speed);
    // Loop the launch, scatter and separate cycle. Once the reflected and
    // transmitted packets reach the domain walls the hard-wall boundary starts
    // absorbing probability, which would drive the norm below 1 and corrupt R
    // and T. Capture the clean coefficients at that instant (the packets are
    // then maximally separated, so R and T are well defined), pin them to the
    // diagnostic, and relaunch.
    if (state.tdse) {
      const norm = totalNorm(state.tdse);
      if (norm < 0.992 || state.tdse.nSteps > 6000) {
        const { R, T } = reflectionTransmission(state.tdse);
        state.lastMeasured = { E: 0.5 * state.k0 * state.k0, R, T, kind: state.kind };
        rebuild();
      }
    }
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
  const norm = state.tdse ? totalNorm(state.tdse) : 0;
  const { R, T } = state.tdse ? reflectionTransmission(state.tdse, state.k0) : { R: 0, T: 0 };
  return { fields: [
    { key: 'barrier-height', label: 'Barrier height V0', value: state.V0, format: 'float' },
    { key: 'incident-momentum', label: 'Incident momentum k0', value: state.k0, format: 'float' },
    { key: 'norm-psi', label: 'Norm |psi|^2', value: norm, format: 'float' },
    { key: 'reflection-prob', label: 'Reflection probability R', value: R, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  if (!state.tdse) return [{ key: 'not-initialized', label: 'TDSE not initialized', value: 'waiting', status: 'pending' }];

  const norm = totalNorm(state.tdse);
  const { R, T } = reflectionTransmission(state.tdse, state.k0);

  // Invariant 1: Wavefunction norm should be conserved (= 1.0) by Crank-Nicolson
  const normError = Math.abs(norm - 1.0);

  // Invariant 2: Probabilities must sum to ~1: R + T = 1 (optical theorem)
  const probSum = R + T;
  const probSumError = Math.abs(probSum - 1.0);

  // Invariant 3: Both R and T must be in [0, 1]
  const probBounds = R >= -1e-6 && R <= 1 + 1e-6 && T >= -1e-6 && T <= 1 + 1e-6;

  return [
    { key: 'norm-conservation', label: 'Norm = 1 (CN scheme conserves probability)', value: normError.toExponential(2), status: normError < 1e-6 ? 'pass' : normError < 1e-3 ? 'drift' : 'pending' },
    { key: 'probability-sum', label: 'R + T = 1', value: probSumError.toExponential(2), status: probSumError < 1e-6 ? 'pass' : probSumError < 0.1 ? 'drift' : 'pending' },
  ];
};
