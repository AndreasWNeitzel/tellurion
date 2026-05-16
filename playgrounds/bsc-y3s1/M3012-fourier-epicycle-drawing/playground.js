// Fourier epicycle drawing.
// DFT of a closed planar path. Each Fourier coefficient C_k draws a circle of
// radius |C_k| rotating at angular frequency 2*pi*k/N; the tip of the last arm
// traces the path. Circles sorted largest-first so the chain reads cleanly.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? DEFAULT_SEED, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const rng = makeRng(SEED);

// Built-in target paths in unit square [-1,1]^2, sampled at N evenly-spaced t.
const N = 256;

function samplePath(name, n) {
  const out = new Array(n);
  for (let i = 0; i < n; i += 1) {
    const t = i / n;
    let x, y;
    switch (name) {
      case 'heart': {
        const a = 2 * Math.PI * t;
        x = 16 * Math.pow(Math.sin(a), 3);
        y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
        x *= 0.05; y *= 0.05;
        break;
      }
      case 'figure-eight': {
        const a = 2 * Math.PI * t;
        x = Math.sin(a);
        y = Math.sin(2 * a) * 0.6;
        break;
      }
      case 'star-5': {
        const a = 2 * Math.PI * t;
        const r = 0.6 + 0.3 * Math.cos(5 * a);
        x = r * Math.cos(a);
        y = r * Math.sin(a);
        break;
      }
      case 'letter-A': {
        const segs = [
          [-0.6, 0.8], [0, -0.8], [0.6, 0.8], [-0.6, 0.8],
          [-0.3, 0.0], [0.3, 0.0], [-0.3, 0.0], [-0.6, 0.8],
        ];
        const segCount = segs.length - 1;
        const sf = t * segCount;
        const k = Math.floor(sf);
        const u = sf - k;
        const a = segs[k], b = segs[k + 1];
        x = a[0] + (b[0] - a[0]) * u;
        y = a[1] + (b[1] - a[1]) * u;
        break;
      }
      case 'earth':
      default: {
        const a = 2 * Math.PI * t;
        const r = 0.7 + 0.05 * Math.sin(7 * a + 0.4) + 0.04 * Math.cos(11 * a + 1.1);
        x = r * Math.cos(a);
        y = r * Math.sin(a);
        break;
      }
    }
    out[i] = { x, y };
  }
  return out;
}

function dft(path) {
  const n = path.length;
  const coeffs = [];
  for (let k = 0; k < n; k += 1) {
    let re = 0, im = 0;
    for (let j = 0; j < n; j += 1) {
      const ph = -2 * Math.PI * k * j / n;
      const c = Math.cos(ph), s = Math.sin(ph);
      re += path[j].x * c - path[j].y * s;
      im += path[j].x * s + path[j].y * c;
    }
    // Map bins above Nyquist to negative frequencies so each epicycle
    // spins at its true signed rate. Without this, k near n-1 spins
    // ~n times per period and the continuous (animated) reconstruction
    // is a hairball that only coincides with the path at the n sample
    // instants.
    const kSigned = k <= n / 2 ? k : k - n;
    coeffs.push({ k: kSigned, re: re / n, im: im / n, amp: Math.hypot(re / n, im / n) });
  }
  // Sort by amplitude descending so largest circles are drawn first (innermost).
  coeffs.sort((a, b) => b.amp - a.amp);
  return coeffs;
}

function reconstruct(coeffs, M, tFrac) {
  // Sum the first M coefficients at parameter tFrac in [0, 1).
  let x = 0, y = 0;
  for (let i = 0; i < Math.min(M, coeffs.length); i += 1) {
    const c = coeffs[i];
    const ph = 2 * Math.PI * c.k * tFrac;
    const co = Math.cos(ph), si = Math.sin(ph);
    x += c.re * co - c.im * si;
    y += c.re * si + c.im * co;
  }
  return { x, y };
}

function rmsError(coeffs, M, path) {
  let s = 0;
  for (let i = 0; i < path.length; i += 1) {
    const t = i / path.length;
    const z = reconstruct(coeffs, M, t);
    s += (z.x - path[i].x) ** 2 + (z.y - path[i].y) ** 2;
  }
  return Math.sqrt(s / path.length);
}

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
