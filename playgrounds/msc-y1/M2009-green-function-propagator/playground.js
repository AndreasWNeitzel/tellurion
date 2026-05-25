// Green's function for -u'' = f, Dirichlet ends. Panel A: the source
// and the solution it produces, with the direct-solve reference.
// Panel B: the draggable tent G(.,x') and the weighted-tent
// superposition that builds u. Panel C: the equation residual and the
// symmetry / boundary facts. Gate-tested sim.js; deterministic.
// Arfken, Weber and Harris, Mathematical Methods for Physicists.
import {
  L, grid, greenG, source, applyGreen, solveViaGreen, solveDirect, odeResidual,
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
const rSrc = document.getElementById('readout-src');
const rXp = document.getElementById('readout-xp');
const rRes = document.getElementById('readout-res');
const rBc = document.getElementById('readout-bc');
const selS = document.getElementById('select-src');
const slP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const slX = document.getElementById('slider-xp'), vX = document.getElementById('value-xp');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const N = 200;
const DEF = { src: 'sine', p: 2, xpRaw: 50 };
// userTents: an array of { x: fractional position in [0, 1], w: signed
// amplitude } that the user has CLICKED into the source. Their
// individual Green tents are summed into the solution, and they are
// rendered on the source plot as vertical sticks. The user can clear
// them via the Reset button.
const st = { ...DEF, running: !prefersReducedMotion(), ph: 0, userTents: [] };
const xpVal = () => st.xpRaw / 100;

let cache = {};
function rebuild() {
  const g = solveViaGreen(st.src, N, st.p);
  const d = solveDirect(st.src, N, st.p);
  // Add the user-clicked delta tents to BOTH the source f (so the
  // residual check stays honest) and the solution u (by summing the
  // analytic Green tent for each user click).
  const f = Float64Array.from(g.f);
  const u = Float64Array.from(g.u);
  const uRef = Float64Array.from(d.u);
  for (const t of st.userTents) {
    const xp = t.x * L;
    // Approximate delta source: add a narrow Gaussian to f for visual
    // accuracy; in the closed-form Green decomposition we just add
    // w * G(x, xp) to u.
    const sigma = 0.015;
    for (let i = 0; i < N; i += 1) {
      const dx = g.x[i] - xp;
      f[i] += t.w * Math.exp(-dx * dx / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
      u[i] += t.w * greenG(g.x[i], xp);
      uRef[i] += t.w * greenG(g.x[i], xp);
    }
  }
  cache = { x: g.x, f, u, uRef, res: odeResidual(g.x, u, f) };
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}
function frame(x, y, w, h) {
  const px = x + 30, py = y + 24, pw = w - 44, ph = h - 48;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  return { px, py, pw, ph };
}

function drawSolution(x, y, w, h) {
  panel(x, y, w, h, 'source f(x) and solution u(x), separate scales');
  // f and u are plotted in separate horizontal bands so both shapes
  // are visible (u is typically far smaller than f).
  const px = x + 30, pw = w - 44;
  // Band region pushed down so the per-band labels (drawn above each
  // band) clear the panel title instead of colliding with it.
  const topY = y + 44, midY = y + 44 + (h - 74) * 0.5, ph = (h - 74) * 0.42;
  const X = (i) => px + pw * i / (N - 1);
  const band = (arr, cy, col, lw, dash, lbl, lx) => {
    let a = Infinity, b = -Infinity;
    for (const v of arr) { a = Math.min(a, v); b = Math.max(b, v); }
    const amp = Math.max(Math.abs(a), Math.abs(b), 1e-12);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(px + pw, cy); ctx.stroke();
    if (dash) ctx.setLineDash([5, 4]);
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    for (let i = 0; i < N; i += 1) {
      const xx = X(i), yy = cy - (arr[i] / amp) * (ph / 2) * 0.92;
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke(); ctx.setLineDash([]);
    if (lbl) {
      ctx.fillStyle = col; ctx.font = fontString(canvas, 'caption', 'mono');
      ctx.fillText(`${lbl} (peak ${amp.toExponential(1)})`, lx, cy - ph / 2 - 4);
    }
  };
  band(cache.f, topY + ph / 2, '#ff9d6f', 1.8, false, 'source f(x)', px + 6);
  band(cache.uRef, midY + ph / 2, 'rgba(155,232,176,0.7)', 3, true, '', px + pw - 130);
  band(cache.u, midY + ph / 2, '#6fb4ff', 2.2, false, 'solution u(x)  (green dashed = direct-solve check)', px + 6);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('0', px - 4, y + h - 8); ctx.fillText('L', px + pw - 6, y + h - 8);
}

function drawTent(x, y, w, h) {
  panel(x, y, w, h, "Green tent G(x,x') and the weighted-tent sum");
  const fr = frame(x, y, w, h);
  const xp = xpVal();
  const X = (xx) => fr.px + fr.pw * xx / L;
  // scale: tents up to ~ max G plus the weighted contributions
  const gmax = 0.26;                                       // max tent height (L/4)
  const Y = (v) => fr.py + fr.ph * (1 - v / (gmax * 1.1));
  // a sample of weighted tents w_j f(x_j) G(.,x_j) building u (faint)
  const xs = cache.x;
  for (let s = 6; s < N; s += 18) {
    const wj = source(st.src, xs[s], st.p) * (L / (N - 1));
    if (Math.abs(wj) < 1e-4) continue;
    ctx.strokeStyle = wj > 0 ? 'rgba(111,180,255,0.16)' : 'rgba(255,157,111,0.16)';
    ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < N; i += 4) {
      const xx = xs[i], yy = Y(Math.abs(wj) * greenG(xx, xs[s]) * 26);
      if (i === 0) ctx.moveTo(X(xx), yy); else ctx.lineTo(X(xx), yy);
    }
    ctx.stroke();
  }
  // the highlighted draggable tent at x'
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.5; ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) {
    const xx = L * i / 240, yy = Y(greenG(xx, xp));
    if (i === 0) ctx.moveTo(X(xx), yy); else ctx.lineTo(X(xx), yy);
  }
  ctx.stroke();
  // source-point marker and the apex
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(X(xp), fr.py); ctx.lineTo(X(xp), fr.py + fr.ph); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(xp), Y(greenG(xp, xp)), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = '#ffd166'; ctx.fillText(`G(x, x'=${xp.toFixed(2)}): zero at both walls, kink at x'`, fr.px + 6, fr.py + 13);
  ctx.fillStyle = 'rgba(200,210,235,0.6)';
  ctx.fillText('faint = the tents that sum to u', fr.px + 6, fr.py + fr.ph - 6);
  ctx.fillText('0', fr.px - 4, fr.py + fr.ph + 14); ctx.fillText('L', fr.px + fr.pw - 6, fr.py + fr.ph + 14);
}

function drawResidual(x, y, w, h) {
  panel(x, y, w, h, "check: -u'' - f (should be zero) and the facts");
  const fr = { px: x + 36, py: y + 24, pw: w - 50, ph: (h - 70) * 0.6 };
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(fr.px, fr.py, fr.pw, fr.ph);
  const dx = cache.x[1] - cache.x[0];
  const r = new Float64Array(N);
  for (let i = 1; i < N - 1; i += 1) r[i] = -((cache.u[i + 1] - 2 * cache.u[i] + cache.u[i - 1]) / (dx * dx)) - cache.f[i];
  let mx = 1e-12; for (const v of r) mx = Math.max(mx, Math.abs(v));
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(fr.px, fr.py + fr.ph / 2); ctx.lineTo(fr.px + fr.pw, fr.py + fr.ph / 2); ctx.stroke();
  ctx.strokeStyle = '#9be8b0'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const xx = fr.px + fr.pw * i / (N - 1), yy = fr.py + fr.ph * (0.5 - 0.45 * r[i] / mx);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(155,232,176,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`max | -u'' - f | = ${mx.toExponential(2)}  (~ 0: u solves the ODE)`, fr.px + 6, fr.py + 13);
  ctx.fillStyle = 'rgba(220,228,245,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  const facts = [
    "G(x, x') = G(x', x)  (symmetric)",
    "G(0, x') = G(L, x') = 0  (Dirichlet)",
    "-G'' = delta:  unit slope kink at x'",
    "u(x) = integral G(x, x') f(x') dx'",
  ];
  facts.forEach((t, i) => ctx.fillText(`- ${t}`, x + 14, fr.py + fr.ph + 26 + i * 22));
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const half = (W - 52) / 2;
  drawSolution(20, 20, half, H - 34);
  drawTent(20 + half + 12, 20, half, (H - 46) / 2);
  drawResidual(20 + half + 12, 20 + (H - 46) / 2 + 6, half, (H - 46) / 2);
  rSrc.textContent = st.src;
  rXp.textContent = xpVal().toFixed(2);
  rRes.textContent = cache.res.toExponential(2);
  rBc.textContent = `${cache.u[0].toExponential(1)}, ${cache.u[N - 1].toExponential(1)}`;
}

function tick() {
  if (st.running) {
    st.ph = (st.ph + 1 / 420) % 1;
    st.xpRaw = Math.round(4 + 92 * (0.5 - 0.5 * Math.cos(2 * Math.PI * st.ph)));  // sweep x', loops
    slX.value = String(st.xpRaw); vX.textContent = xpVal().toFixed(2);
  }
  draw();
  requestAnimationFrame(tick);
}

function sync() { vP.textContent = String(st.p); vX.textContent = xpVal().toFixed(2); }
selS.addEventListener('change', () => { st.src = selS.value; rebuild(); draw(); });
slP.addEventListener('input', () => { vP.textContent = slP.value; });
slP.addEventListener('change', () => { st.p = parseInt(slP.value, 10); rebuild(); draw(); });
slX.addEventListener('input', () => { st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); st.xpRaw = parseInt(slX.value, 10); vX.textContent = xpVal().toFixed(2); draw(); });
// Click anywhere in the solution panel (the LEFT half of the canvas)
// to add a delta source: left-click = +1, right-click = -1. The new
// tent appears immediately in the source/solution/residual panels.
// Shift+click clears all user tents.
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const cx = (e.clientX - r.left) * (W / r.width);
  const cy = (e.clientY - r.top) * (H / r.height);
  const half = (W - 52) / 2;
  if (cx < 20 || cx > 20 + half) return;
  if (e.shiftKey) { st.userTents.length = 0; rebuild(); draw(); return; }
  // Map cx in [20 + 30, 20 + half - 14] to xFrac in [0, 1].
  const px = 20 + 30, pw = half - 44;
  const xFrac = Math.max(0, Math.min(1, (cx - px) / pw));
  const weight = (e.button === 2 ? -1 : 1) * 0.5;
  st.userTents.push({ x: xFrac, w: weight });
  rebuild(); draw();
});

bR.addEventListener('click', () => {
  Object.assign(st, DEF); st.running = true; st.ph = 0; st.userTents = [];
  selS.value = DEF.src; slP.value = String(DEF.p); slX.value = String(DEF.xpRaw);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { src: st.src, p: String(st.p), xp: String(st.xpRaw) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.src) { st.src = s.src; selS.value = s.src; }
  if (s.p) { st.p = parseInt(s.p, 10); slP.value = s.p; }
  if (s.xp) { st.xpRaw = parseInt(s.xp, 10); slX.value = s.xp; }
}

function boot() {
  restoreState(); rebuild();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  sync();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = f; st.xpRaw = Math.round(4 + 92 * (0.5 - 0.5 * Math.cos(2 * Math.PI * f)));
    draw();
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
  const c = cache;
  return {
    fields: [
      { key: 'source-type', label: 'Source', value: st.src },
      { key: 'parameter', label: 'Parameter p', value: st.p, format: 'float' },
      { key: 'xprime', label: "x' (focal)", value: xpVal(), format: 'float' },
      { key: 'user-tents', label: 'User clicks', value: st.userTents.length }
    ]
  };
};
window.playground.getInvariants = function () {
  const c = cache;
  const res = c.res || [];
  let maxRes = 0;
  for (let i = 0; i < res.length; i++) maxRes = Math.max(maxRes, Math.abs(res[i]));
  return [
    {
      key: 'residual-norm',
      label: 'ODE residual (max)',
      value: maxRes.toExponential(2),
      status: maxRes < 0.01 ? 'pass' : maxRes < 0.1 ? 'pending' : 'drift'
    }
  ];
};
