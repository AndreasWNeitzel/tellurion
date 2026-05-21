import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// CR3BP in the synodic frame. Renders the two primaries, the five Lagrange
// points, and a set of test-particle trails. Click to drop a particle at a
// chosen location with zero rotating-frame velocity.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import {
  createCR3BP, stepCR3BP, diagnosticsCR3BP, lagrangePoints,
  effectivePotential,
  DEFAULT_DT, DEFAULT_MU, SQRT3_HALF, MU_ROUTH,
} from './sim.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderMu     = document.getElementById('slider-mu');
const sliderSpeed  = document.getElementById('slider-speed');
const valueMu      = document.getElementById('value-mu');
const valueSpeed   = document.getElementById('value-speed');
const btnL4        = document.getElementById('btn-L4');
const btnL5        = document.getElementById('btn-L5');
const btnClear     = document.getElementById('btn-clear');

const W = canvas.width, H = canvas.height;
const VIEW_R = 1.6;
const CX = W / 2, CY = H / 2;
const PX_PER_UNIT = Math.min(W, H) / (2 * VIEW_R);
const STEPS_PER_FRAME_BASE = 80;
const TRAIL_MAX = 4000;

const state = {
  mu: DEFAULT_MU,
  speed: 1.0,
  particles: [],
  lagrange: null,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  fg: cssVar('--fg', '#1A1B1C'),
  fgMuted: cssVar('--fg-muted', '#5C5E61'),
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function toPx(x, y) {
  return { px: CX + x * PX_PER_UNIT - 0.5 * PX_PER_UNIT, py: CY - y * PX_PER_UNIT };
}

// Cached effective-potential (pseudo-potential / zero-velocity) field.
// Rebuilt only when mu changes.
let fieldCanvas = null, fieldMu = -1;
let fieldGrid = null, fieldFW = 0, fieldFH = 0, fieldLevels = [];
const FSTEP = 3;                                  // downsample factor

// sim.effectivePotential returns -Omega. Work with Omega directly:
//   Omega(x,y) = (x^2 + y^2)/2 + (1-mu)/r1 + mu/r2.
function omegaAt(x, y, mu) { return -effectivePotential(x, y, mu); }

function buildField() {
  const fw = Math.ceil(W / FSTEP), fh = Math.ceil(H / FSTEP);
  const img = new ImageData(fw, fh);
  const vals = new Float64Array(fw * fh);
  for (let j = 0; j < fh; j += 1) {
    for (let i = 0; i < fw; i += 1) {
      const px = i * FSTEP, py = j * FSTEP;
      const x = (px - CX + 0.5 * PX_PER_UNIT) / PX_PER_UNIT;
      const y = (CY - py) / PX_PER_UNIT;
      const w = omegaAt(x, y, state.mu);
      vals[j * fw + i] = Number.isFinite(w) ? w : 1e9;
    }
  }
  // Anchor the colormap to the physically meaningful band. Omega has its
  // global minimum at L4/L5 and diverges (+inf) at the primaries and far
  // out, so a raw or percentile map drowns the saddle topology in the
  // rotational bowl. Clip to [Omega(L4) .. Omega(L1)+margin]: that is the
  // exact range that contains the five critical points, so the curved
  // ridge through L4/L5 and the L1/L2/L3 necks fill the colormap.
  const Lp = state.lagrange ?? lagrangePoints(state.mu);
  const wOf = (p) => omegaAt(p[0], p[1], state.mu);
  const wL4 = wOf(Lp.L4);
  const wL1 = wOf(Lp.L1), wL2 = wOf(Lp.L2), wL3 = wOf(Lp.L3);
  const lo = wL4;
  const hi = Math.max(wL1, wL2, wL3) + 0.08 * (Math.max(wL1, wL2, wL3) - wL4 || 1);
  const span = (hi - lo) || 1;
  for (let k = 0; k < vals.length; k += 1) {
    // Bright (yellow) at the L4/L5 minimum, dark at the diverging walls.
    const t = 1 - Math.max(0, Math.min(1, (vals[k] - lo) / span));
    const c = viridis(t);
    const o = k * 4;
    img.data[o] = c.r; img.data[o + 1] = c.g; img.data[o + 2] = c.b; img.data[o + 3] = 175;
  }
  const off = new OffscreenCanvas(fw, fh);
  off.getContext('2d').putImageData(img, 0, 0);
  fieldCanvas = off; fieldMu = state.mu;
  fieldGrid = vals; fieldFW = fw; fieldFH = fh;
  // Zero-velocity curves at the Jacobi energies of the collinear points:
  // these are the recognizable necks that open at L1, then L2, then L3.
  fieldLevels = [wL3, wL2, wL1];
}

// Marching squares over the downsampled Omega grid: stroke the
// zero-velocity (Hill-region boundary) contour at each collinear level.
function drawZVC() {
  if (!fieldGrid) return;
  const fw = fieldFW, fh = fieldFH;
  ctx.lineWidth = 1.1;
  for (let li = 0; li < fieldLevels.length; li += 1) {
    const lev = fieldLevels[li];
    ctx.strokeStyle = `rgba(255,255,255,${0.22 + 0.16 * li})`;
    ctx.beginPath();
    for (let j = 0; j < fh - 1; j += 1) {
      for (let i = 0; i < fw - 1; i += 1) {
        const a = fieldGrid[j * fw + i];
        const b = fieldGrid[j * fw + i + 1];
        const cc = fieldGrid[(j + 1) * fw + i + 1];
        const d = fieldGrid[(j + 1) * fw + i];
        if (a > 1e8 || b > 1e8 || cc > 1e8 || d > 1e8) continue;
        const x0 = i * FSTEP, y0 = j * FSTEP, x1 = (i + 1) * FSTEP, y1 = (j + 1) * FSTEP;
        const pts = [];
        const ip = (va, vb, xa, ya, xb, yb) => {
          const t = (lev - va) / (vb - va);
          pts.push([xa + t * (xb - xa), ya + t * (yb - ya)]);
        };
        if ((a < lev) !== (b < lev)) ip(a, b, x0, y0, x1, y0);
        if ((b < lev) !== (cc < lev)) ip(b, cc, x1, y0, x1, y1);
        if ((cc < lev) !== (d < lev)) ip(cc, d, x1, y1, x0, y1);
        if ((d < lev) !== (a < lev)) ip(d, a, x0, y1, x0, y0);
        if (pts.length === 2) {
          ctx.moveTo(pts[0][0], pts[0][1]);
          ctx.lineTo(pts[1][0], pts[1][1]);
        }
      }
    }
    ctx.stroke();
  }
}

function rebuildLagrange() {
  state.lagrange = lagrangePoints(state.mu);
  fieldMu = -1;                                   // invalidate field cache
}

function addParticle(q, v) {
  state.particles.push({
    sim: createCR3BP({ mu: state.mu, ic: { q, v } }),
    trail: [],
    color: '#f1d28a',
  });
  if (state.particles.length > 5) state.particles.shift();
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // Effective-potential field (the "field itself" requested in review):
  // bright ridges at L4/L5, saddles at L1/L2/L3, wells at the primaries.
  if (fieldMu !== state.mu || !fieldCanvas) buildField();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(fieldCanvas, 0, 0, W, H);
  drawZVC();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, CY); ctx.lineTo(W, CY);
  ctx.moveTo(CX - 0.5 * PX_PER_UNIT, 0); ctx.lineTo(CX - 0.5 * PX_PER_UNIT, H);
  ctx.stroke();

  for (const p of state.particles) {
    if (p.trail.length < 2) continue;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 0.9;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    const f = toPx(p.trail[0].x, p.trail[0].y);
    ctx.moveTo(f.px, f.py);
    for (let i = 1; i < p.trail.length; i += 1) {
      const pp = toPx(p.trail[i].x, p.trail[i].y);
      ctx.lineTo(pp.px, pp.py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    const last = p.trail[p.trail.length - 1];
    const lp = toPx(last.x, last.y);
    ctx.fillStyle = '#ff8060';
    ctx.beginPath();
    ctx.arc(lp.px, lp.py, 2.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // primaries: heavy yellow at (-mu, 0), small blue at (1 - mu, 0)
  const m1 = toPx(-state.mu, 0);
  ctx.fillStyle = '#ffd96a';
  ctx.beginPath();
  ctx.arc(m1.px, m1.py, 8, 0, 2 * Math.PI);
  ctx.fill();
  const m2 = toPx(1 - state.mu, 0);
  ctx.fillStyle = tok.accent;
  ctx.beginPath();
  ctx.arc(m2.px, m2.py, 4 + 12 * state.mu, 0, 2 * Math.PI);
  ctx.fill();

  // Lagrange points
  const L = state.lagrange;
  const labels = ['L1', 'L2', 'L3', 'L4', 'L5'];
  const pts = [L.L1, L.L2, L.L3, L.L4, L.L5];
  ctx.font = fontString(canvas, 'tick', 'mono');
  for (let i = 0; i < 5; i += 1) {
    const pp = toPx(pts[i][0], pts[i][1]);
    ctx.fillStyle = '#dcdcdc';
    ctx.beginPath();
    ctx.arc(pp.px, pp.py, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#dcdcdc';
    ctx.textAlign = 'left';
    ctx.fillText(labels[i], pp.px + 5, pp.py + 3);
  }

  drawReadout();
}

function drawReadout() {
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const stable = state.mu < MU_ROUTH;
  const rows = [
    ['mu',         state.mu.toFixed(5)],
    ['mu_Routh',   MU_ROUTH.toFixed(5)],
    ['L4 stable',  stable ? 'yes' : 'no'],
    ['n particles', String(state.particles.length)],
  ];
  let y = 22;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 14, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, 230, y);
    y += 14;
  }
}

function tickN(nSteps) {
  const trailStride = Math.max(1, Math.floor(nSteps / 200));
  for (const p of state.particles) {
    for (let s = 0; s < nSteps; s += 1) {
      stepCR3BP(p.sim, DEFAULT_DT);
      if ((s % trailStride) === 0) {
        p.trail.push({ x: p.sim.inst.q[0], y: p.sim.inst.q[1] });
        if (p.trail.length > TRAIL_MAX) p.trail.shift();
      }
    }
  }
}

canvas.addEventListener('click', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const cx = (ev.clientX - rect.left) * scaleX;
  const cy = (ev.clientY - rect.top) * scaleY;
  const x = (cx - CX + 0.5 * PX_PER_UNIT) / PX_PER_UNIT;
  const y = (CY - cy) / PX_PER_UNIT;
  addParticle([x, y], [0, 0]);
});

sliderMu.addEventListener('input', () => {
  state.mu = parseFloat(sliderMu.value);
  valueMu.textContent = state.mu.toFixed(5);
  rebuildLagrange();
  // Rebuild existing particles to use the new mu while preserving position
  for (const p of state.particles) {
    const x = p.sim.inst.q[0], y = p.sim.inst.q[1];
    const vx = p.sim.inst.qdot[0], vy = p.sim.inst.qdot[1];
    p.sim = createCR3BP({ mu: state.mu, ic: { q: [x, y], v: [vx, vy] } });
  }
  drawAll();
});
sliderSpeed.addEventListener('input', () => {
  state.speed = parseFloat(sliderSpeed.value);
  valueSpeed.textContent = state.speed.toFixed(1);
});

btnL4.addEventListener('click', () => {
  addParticle([0.5 - state.mu + 1e-3, SQRT3_HALF + 1e-3], [0, 0]);
});
btnL5.addEventListener('click', () => {
  addParticle([0.5 - state.mu + 1e-3, -SQRT3_HALF - 1e-3], [0, 0]);
});
btnClear.addEventListener('click', () => {
  state.particles = [];
  drawAll();
});
const btnPlayPause = document.getElementById('btn-playpause');
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    state.playing = !state.playing;
    btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  });
}

function bootSync() {
  rebuildLagrange();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    addParticle([0.5 - state.mu + 1e-3, SQRT3_HALF + 1e-3], [0, 0]);
    addParticle([0.5 - state.mu + 1e-3, -SQRT3_HALF - 1e-3], [0, 0]);
    const target = Math.round(frac * 40_000);
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
  // Seed two L4/L5 particles by default so the page is interesting on first load.
  addParticle([0.5 - state.mu + 1e-3, SQRT3_HALF + 1e-3], [0, 0]);
  addParticle([0.5 - state.mu + 1e-3, -SQRT3_HALF - 1e-3], [0, 0]);
  drawAll();
}

function tick() {
  if (state.playing) {
    const stepsThisFrame = Math.max(1, Math.round(STEPS_PER_FRAME_BASE * state.speed));
    tickN(stepsThisFrame);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
