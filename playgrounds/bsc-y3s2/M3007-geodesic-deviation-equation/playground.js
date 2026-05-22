// Geodesic deviation, shown as a parallel bundle of geodesics whose
// normal separation is governed by the Jacobi equation xi'' + K xi = 0.
// The surface control sets the Gaussian curvature K, so the same bundle
// refocuses (K > 0), stays parallel (K = 0), or diverges (K < 0). sim.js
// (jacobiFactor / conjugateDistance / jacobiResidual) is the model.
import { SURFACES, jacobiFactor, conjugateDistance, jacobiResidual } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const selSurface = document.getElementById('select-surface');
const valSurface = document.getElementById('value-surface');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const rD = document.getElementById('readout-d');

const S_MAX = Math.PI;          // arc-length window
const NPAIR = 4;                // geodesic pairs each side of the central one
const SCENE = { x: 56, y: 44, w: W - 112, h: 270 };
const PLOT = { x: 56, y: 352, w: W - 112, h: 108 };

const st = {
  dphi: 0.18,
  surface: 'sphere',
  s: S_MAX * 0.5,
  running: !(DETERMINISTIC || prefersReducedMotion()),
};
let lastSep = 0;

sD.addEventListener('input', () => { st.dphi = parseFloat(sD.value); vD.textContent = st.dphi.toFixed(2); });
selSurface.addEventListener('input', () => {
  st.surface = selSurface.value;
  valSurface.textContent = SURFACES[st.surface].label;
});
btnR.addEventListener('click', () => { st.s = 0; });
btnP.addEventListener('click', () => {
  st.running = !st.running;
  btnP.textContent = st.running ? 'Pause' : 'Play';
  btnP.setAttribute('aria-pressed', String(!st.running));
});

function curK() { return SURFACES[st.surface].K; }

// vertical pixels per unit xi: fit the widest geodesic over the whole arc.
function vScale(K) {
  let maxXi = 1e-6;
  for (let j = 0; j <= 48; j += 1) {
    const xi = NPAIR * st.dphi * Math.abs(jacobiFactor((j / 48) * S_MAX, K));
    if (xi > maxXi) maxXi = xi;
  }
  return (SCENE.h * 0.42) / maxXi;
}

function drawPlot(K) {
  const px = (s) => PLOT.x + (s / S_MAX) * PLOT.w;
  let fmin = 1, fmax = 1;
  for (let j = 0; j <= 60; j += 1) {
    const f = jacobiFactor((j / 60) * S_MAX, K);
    if (f < fmin) fmin = f;
    if (f > fmax) fmax = f;
  }
  const pad = 0.15 * Math.max(0.3, fmax - fmin);
  const lo = fmin - pad, hi = fmax + pad;
  const py = (f) => PLOT.y + PLOT.h - ((f - lo) / (hi - lo)) * PLOT.h;

  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
  ctx.strokeRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
  if (lo < 0 && hi > 0) {
    ctx.strokeStyle = 'rgba(239,71,111,0.45)';
    ctx.beginPath(); ctx.moveTo(PLOT.x, py(0)); ctx.lineTo(PLOT.x + PLOT.w, py(0)); ctx.stroke();
  }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let j = 0; j <= 180; j += 1) {
    const s = (j / 180) * S_MAX;
    const x = px(s), y = py(jacobiFactor(s, K));
    if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#7ef7c8';
  ctx.beginPath(); ctx.arc(px(st.s), py(jacobiFactor(st.s, K)), 3.4, 0, 6.2832); ctx.fill();
  ctx.fillStyle = 'rgba(160,170,185,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('normalised separation f(s) = xi(s) / xi0', PLOT.x + 6, PLOT.y - 6);
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const K = curK();
  const vs = vScale(K);
  const midY = SCENE.y + SCENE.h / 2;
  const sx = (s) => SCENE.x + (s / S_MAX) * SCENE.w;
  const sy = (xi) => midY - xi * vs;

  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'heading');
  ctx.fillText('Geodesic deviation: curvature bends a parallel bundle', SCENE.x, 26);

  // central reference geodesic
  ctx.strokeStyle = 'rgba(150,160,175,0.45)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(sx(0), midY); ctx.lineTo(sx(S_MAX), midY); ctx.stroke();

  // conjugate point (positive curvature only)
  const sConj = conjugateDistance(K);
  if (Number.isFinite(sConj) && sConj <= S_MAX) {
    ctx.strokeStyle = 'rgba(239,71,111,0.6)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx(sConj), SCENE.y); ctx.lineTo(sx(sConj), SCENE.y + SCENE.h); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef476f'; ctx.font = fontString(canvas, 'caption');
    ctx.fillText('conjugate point', sx(sConj) + 6, SCENE.y + 13);
  }

  // the geodesic congruence
  for (let i = 1; i <= NPAIR; i += 1) {
    for (const sign of [1, -1]) {
      ctx.strokeStyle = i === NPAIR ? '#ffd166' : 'rgba(91,192,235,0.7)';
      ctx.lineWidth = i === NPAIR ? 2.3 : 1.4;
      ctx.beginPath();
      for (let j = 0; j <= 180; j += 1) {
        const s = (j / 180) * S_MAX;
        const xi = sign * i * st.dphi * jacobiFactor(s, K);
        const x = sx(s), y = sy(xi);
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // sweeping marker showing the present separation
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(sx(st.s), SCENE.y); ctx.lineTo(sx(st.s), SCENE.y + SCENE.h); ctx.stroke();
  for (let i = -NPAIR; i <= NPAIR; i += 1) {
    const xi = i * st.dphi * jacobiFactor(st.s, K);
    ctx.fillStyle = '#7ef7c8';
    ctx.beginPath(); ctx.arc(sx(st.s), sy(xi), 3.2, 0, 6.2832); ctx.fill();
  }

  // axis labels
  ctx.fillStyle = 'rgba(160,170,185,0.8)'; ctx.font = fontString(canvas, 'caption');
  ctx.fillText('arc length s', sx(S_MAX) - 74, SCENE.y + SCENE.h + 16);

  lastSep = 2 * NPAIR * st.dphi * Math.abs(jacobiFactor(st.s, K));
  drawPlot(K);
  rD.textContent = lastSep.toFixed(3);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (st.running) { st.s += dt * 0.7; if (st.s > S_MAX) st.s = 0; }
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
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
} else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const K = curK();
  const sConj = conjugateDistance(K);
  return {
    fields: [
      { key: 'surface', label: 'surface', value: SURFACES[st.surface].label },
      { key: 'curvature', label: 'Gaussian curvature $K$', value: K, format: 'float' },
      { key: 'initial-sep', label: 'initial spacing $\\xi_0$', value: st.dphi, format: 'float' },
      { key: 'separation', label: 'outer-pair separation $\\xi(s)$', value: lastSep, format: 'float' },
      { key: 'conjugate', label: 'conjugate distance', value: Number.isFinite(sConj) ? sConj : 'none', format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const K = curK();
  let worst = 0;
  for (let j = 1; j < 24; j += 1) {
    const r = Math.abs(jacobiResidual((j / 24) * S_MAX, K));
    if (r > worst) worst = r;
  }
  return [{
    key: 'jacobi',
    label: 'Jacobi equation $\\ddot{\\xi} + K\\,\\xi = 0$ holds along the bundle',
    value: worst.toExponential(2),
    status: worst < 1e-3 ? 'pass' : (worst < 1e-1 ? 'pending' : 'drift'),
  }];
};
