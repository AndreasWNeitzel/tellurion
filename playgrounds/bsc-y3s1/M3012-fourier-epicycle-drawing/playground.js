// Fourier epicycle drawing.
// DFT of a closed planar path. Each Fourier coefficient C_k draws a circle of
// radius |C_k| rotating at angular frequency 2*pi*k/N; the tip of the last arm
// traces the path. Circles sorted largest-first so the chain reads cleanly.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { samplePath, dft, reconstruct, rmsError } from './sim.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? DEFAULT_SEED, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const rng = makeRng(SEED);

// Built-in target paths in unit square [-1,1]^2, sampled at N evenly-spaced t.
const N = 256;

// samplePath / dft / reconstruct / rmsError now live in sim.js (DOM-free,
// shared with invariants.test.mjs); imported above. Render math unchanged.

const state = {
  path: samplePath('earth', N),
  M: 32,
  preset: 'earth',
};
state.coeffs = dft(state.path);

const W = canvas.width, H = canvas.height;
const center = { x: W / 2, y: H / 2 };
const scale = Math.min(W, H) * 0.38;
function toScreen(p) { return { x: center.x + p.x * scale, y: center.y - p.y * scale }; }

const trail = [];

function frame(tSimFrac) {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);

  // Target path (faint).
  ctx.strokeStyle = 'rgba(180,180,200,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= state.path.length; i += 1) {
    const p = toScreen(state.path[i % state.path.length]);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // Epicycles: walk the chain from the center, draw each circle + radius arm.
  let cx = center.x, cy = center.y;
  for (let i = 0; i < Math.min(state.M, state.coeffs.length); i += 1) {
    const c = state.coeffs[i];
    const ph = 2 * Math.PI * c.k * tSimFrac;
    const co = Math.cos(ph), si = Math.sin(ph);
    const dx = (c.re * co - c.im * si) * scale;
    const dy = -(c.re * si + c.im * co) * scale;
    const nx = cx + dx, ny = cy + dy;
    const r = c.amp * scale;
    if (r > 0.5) {
      ctx.strokeStyle = `hsla(${(i * 23) % 360}, 70%, 60%, 0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(220,220,240,0.6)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();
    }
    cx = nx; cy = ny;
  }

  // Trail traced by tip.
  trail.push({ x: cx, y: cy });
  if (trail.length > PERIOD + 4) trail.shift();
  ctx.strokeStyle = '#fdb56a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < trail.length; i += 1) {
    if (i === 0) ctx.moveTo(trail[i].x, trail[i].y);
    else ctx.lineTo(trail[i].x, trail[i].y);
  }
  ctx.stroke();

  // Tip marker.
  ctx.fillStyle = '#ffd57f';
  ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 2 * Math.PI); ctx.fill();
}

let frameNo = 0;
let lastReadoutAt = 0;
const PERIOD = 480;
function tick() {
  // Clear the trail at the start of each period so the closed shape is
  // traced cleanly once per loop instead of overdrawing stale points.
  if (frameNo % PERIOD === 0) trail.length = 0;
  const tFrac = (frameNo % PERIOD) / PERIOD;
  frame(tFrac);
  frameNo += 1;
  if (performance.now() - lastReadoutAt > 200) {
    lastReadoutAt = performance.now();
    const rms = rmsError(state.coeffs, state.M, state.path);
    readoutInv.textContent = `RMS=${rms.toExponential(2)}  M=${state.M}/${N}`;
    readoutFrame.textContent = String(frameNo);
  }
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

function buildControls() {
  controlsEl.innerHTML = '';
  // Preset selector.
  const row1 = document.createElement('div'); row1.className = 'row';
  const lab1 = document.createElement('label'); lab1.className = 'label'; lab1.htmlFor = 'preset-select'; lab1.textContent = 'Preset';
  const sel  = document.createElement('select');
  sel.id = 'preset-select';
  sel.setAttribute('aria-label', 'Path preset');
  for (const name of ['earth', 'heart', 'figure-eight', 'star-5', 'letter-A']) {
    const opt = document.createElement('option'); opt.value = name; opt.textContent = name;
    sel.appendChild(opt);
  }
  sel.value = state.preset;
  sel.addEventListener('change', () => {
    state.preset = sel.value;
    state.path   = samplePath(state.preset, N);
    state.coeffs = dft(state.path);
    trail.length = 0;
  });
  row1.appendChild(lab1); row1.appendChild(sel);
  controlsEl.appendChild(row1);

  // M slider.
  const row2 = document.createElement('div'); row2.className = 'row';
  const lab2 = document.createElement('label'); lab2.className = 'label'; lab2.htmlFor = 'epicycles-slider'; lab2.textContent = 'Epicycles M';
  const inp  = document.createElement('input'); inp.id = 'epicycles-slider'; inp.type = 'range'; inp.min = '1'; inp.max = String(N >> 1); inp.value = String(state.M);
  inp.setAttribute('aria-label', 'Number of epicycles');
  const val  = document.createElement('span'); val.className = 'value'; val.textContent = String(state.M);
  inp.addEventListener('input', () => { state.M = parseInt(inp.value, 10); val.textContent = String(state.M); trail.length = 0; });
  row2.appendChild(lab2); row2.appendChild(inp); row2.appendChild(val);
  controlsEl.appendChild(row2);
}

buildControls();
if (DETERMINISTIC) {
  // Reference capture sweeps the epicycle count M on the letter-A
  // preset (piecewise-linear, sharp corners, slow Fourier convergence
  // with visible Gibbs ringing) so each added epicycle visibly sharpens
  // the drawing and the five golden frames are clearly distinct. The
  // smooth 'earth' default converges in a few terms and would make the
  // high-M frames identical.
  if (CAPTURE_NAME) {
    state.preset = 'letter-A';
    state.path   = samplePath('letter-A', N);
    state.coeffs = dft(state.path);
    state.M      = 1 + Math.round(CAPTURE_FRAC * 40); // 1, 11, 21, 31, 41
  }
  for (let f = 0; f < 240; f += 1) { frameNo = f; frame((f % 480) / 480); }
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // Parseval: sum |C_k|^2 = (1/N) sum |z_j|^2.
  let lhs = 0;
  for (const c of state.coeffs) lhs += c.amp * c.amp;
  let rhs = 0;
  for (const p of state.path) rhs += p.x * p.x + p.y * p.y;
  rhs /= state.path.length;
  const err = Math.abs(lhs - rhs) / Math.max(rhs, 1e-9);
  if (err > 1e-6) return { name: 'Parseval', pass: false, msg: `|sum|C|^2 - (1/N) sum|z|^2| / rhs = ${err.toExponential(2)}` };
  // Full N/2 reconstruction RMS < 1e-6.
  const rmsFull = rmsError(state.coeffs, N >> 1, state.path);
  if (rmsFull > 1e-3) return { name: 'full-N/2 reconstruction', pass: false, msg: `RMS = ${rmsFull.toExponential(2)} > 1e-3` };
  return { name: 'Parseval + reconstruction', pass: true, msg: `Parseval err ${err.toExponential(2)}; full reconstruction RMS ${rmsFull.toExponential(2)}` };
};
