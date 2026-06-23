import { thomas, makePoissonRHS, residual, jacobiStep, gaussSeidelStep, conjugateGradientStep, applyA } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const selS = document.getElementById('select-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let N = 32, solver = 'jacobi', x_iter, b, x_exact, hist = [], r_cg, p_cg, running = true;
function reset() {
  N = parseInt(sN.value);
  b = makePoissonRHS(N);
  x_iter = new Float64Array(N);
  x_exact = thomas(b);
  hist = [];
  r_cg = b.slice(); p_cg = b.slice();
}
reset();
sN.addEventListener('input', () => { vN.textContent = sN.value; reset(); });
selS.addEventListener('change', () => { solver = selS.value; reset(); });
btnR.addEventListener('click', () => { reset(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function step() {
  if (solver === 'jacobi') x_iter = jacobiStep(x_iter, b);
  else if (solver === 'gs') x_iter = gaussSeidelStep(x_iter, b);
  else if (solver === 'cg') { const out = conjugateGradientStep(x_iter, r_cg, p_cg, b); x_iter = out.x; r_cg = out.r; p_cg = out.p; }
  hist.push(residual(x_iter, b) + 1e-30);
  if (hist.length > 200) hist.shift();
}
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = 40;
  const top1 = pad, mid = H / 2 - 10, bot1 = mid - 10;
  const top2 = mid + 10, bot2 = H - pad;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad + 30, top1); ctx.lineTo(pad + 30, bot1); ctx.lineTo(W - pad, bot1); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('u(x): cyan = exact, orange = iterative', pad + 30, top1 + 10);
  const xToPx = (i) => pad + 30 + i / (N - 1) * (W - pad - pad - 30);
  let umax = 1e-12; for (let i = 0; i < N; i += 1) umax = Math.max(umax, Math.abs(x_exact[i]));
  // Both curves share the exact-solution scale so the iterative (orange)
  // sits visibly below the exact (cyan) until it converges. 0.88 fills the
  // panel; the u = 0 Dirichlet endpoints rest on the baseline.
  const uAmp = (bot1 - top1) * 0.88;
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const py = bot1 - x_exact[i] / umax * uAmp;
    if (i === 0) ctx.moveTo(xToPx(i), py); else ctx.lineTo(xToPx(i), py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const py = bot1 - x_iter[i] / umax * uAmp;
    if (i === 0) ctx.moveTo(xToPx(i), py); else ctx.lineTo(xToPx(i), py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad + 30, top2); ctx.lineTo(pad + 30, bot2); ctx.lineTo(W - pad, bot2); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText(`log10 ||r||  (iters: ${hist.length})`, pad + 30, top2 + 10);
  if (hist.length > 0) {
    let lmin = Infinity, lmax = -Infinity;
    for (const rr of hist) { const l = Math.log10(rr + 1e-30); if (l < lmin) lmin = l; if (l > lmax) lmax = l; }
    // Scale to the actual range spanned by the visible window so the descent
    // fills the panel (the previous code floored the span at one decade, which
    // stranded slow Jacobi runs in the top sliver). A small floor only guards
    // the converged-flat case, where the line then rests at the bottom.
    const span = Math.max(lmax - lmin, 0.4);
    const plotH = bot2 - top2 - 14;
    const lToPy = (lr) => bot2 - (lr - lmin) / span * plotH;
    ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.5; ctx.beginPath();
    hist.forEach((r, i) => {
      const px = pad + 30 + i / Math.max(1, hist.length - 1) * (W - pad - pad - 30);
      if (i === 0) ctx.moveTo(px, lToPy(Math.log10(r + 1e-30))); else ctx.lineTo(px, lToPy(Math.log10(r + 1e-30)));
    });
    ctx.stroke();
    // decade labels on the residual axis for absolute grounding
    ctx.fillStyle = '#6b7280'; ctx.textAlign = 'right';
    ctx.fillText(`1e${lmax.toFixed(1)}`, pad + 28, top2 + 16);
    ctx.fillText(`1e${lmin.toFixed(1)}`, pad + 28, bot2 - 2);
    ctx.textAlign = 'left';
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  const r = residual(x_iter, b);
  ctx.fillText(`||r|| = ${r.toExponential(2)}, exact ||r|| = ${residual(x_exact, b).toExponential(2)}`, pad + 30, H - 14);
  rR.textContent = r.toExponential(2);
}
// Jacobi/Gauss-Seidel on the Poisson stencil have spectral radius close to
// 1, so single-stepping never visibly converges. Take many steps per frame
// (CG still converges in ~N steps; the sliding residual window keeps up).
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) for (let i = 0; i < 12; i += 1) step(); render(); requestAnimationFrame(tick); }
function bootSync() { for (let i = 0; i < Math.round(CAPTURE_FRAC * 700); i += 1) step(); render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const r = residual(x_iter, b);
  return { fields: [
    { key: 'system-size', label: 'System size N', value: N, format: 'float' },
    { key: 'solver-method', label: 'Solver method', value: solver, format: undefined },
    { key: 'iterations', label: 'Iteration count', value: hist.length, format: 'float' },
    { key: 'residual', label: 'Residual ||r||', value: r, format: 'float' },
  ]};
};
window.playground.getInvariants = function () {
  const r = residual(x_iter, b);
  const r_exact = residual(x_exact, b);
  const converging = r < 1 || (hist.length > 1 && r < hist[hist.length - 2]);
  return [{ key: 'convergence', label: 'Iterative method converges', value: converging ? 'pass' : 'drift', status: converging ? 'pass' : 'drift' }];
};
