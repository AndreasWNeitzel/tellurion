// playground.js
// Cyclotron orbit visualization.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createCyclotron, stepCyclotron, speed,
  cyclotronRadius, cyclotronPeriod,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderB      = document.getElementById('slider-B');
const sliderV      = document.getElementById('slider-v');
const sliderQ      = document.getElementById('slider-q');
const sliderM      = document.getElementById('slider-m');
const sliderSpeed  = document.getElementById('slider-speed');
const valueB       = document.getElementById('value-B');
const valueV       = document.getElementById('value-v');
const valueQ       = document.getElementById('value-q');
const valueM       = document.getElementById('value-m');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  B: 1.0,
  v: 1.0,
  q: 1.0,
  m: 1.0,
  speed: 2,
  sim: null,
  trail: [],
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sim = createCyclotron({ B: state.B, v: state.v, q: state.q, m: state.m });
  state.trail = [];
}

function worldToPx(x, y) {
  const padL = 30, padR = 30, padT = 60, padB = 80;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  const wbox = 6;
  const scale = Math.min(drawW / wbox, drawH / wbox);
  return {
    px: padL + drawW / 2 + x * scale,
    py: padT + drawH / 2 - y * scale,
  };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  const r = cyclotronRadius(state.v, state.B);
  const T = cyclotronPeriod(state.B);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`B = ${state.B.toFixed(2)}   |v| = ${state.v.toFixed(2)}   t = ${state.sim.t.toFixed(2)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`r = m v / (q B) = ${r.toFixed(3)}   T = 2 pi m / (q B) = ${T.toFixed(3)}   omega_c = ${(2 * Math.PI / T).toFixed(3)}`, 30, 40);

  // Plot frame
  const padL = 30, padR = 30, padT = 60, padB = 80;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, W - padL - padR, H - padT - padB);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, W - padL - padR - 1, H - padT - padB - 1);

  // B-field "dots" pattern indicating out-of-page B
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  for (let i = 0; i < 16; i += 1) {
    for (let j = 0; j < 12; j += 1) {
      const x = -2.8 + i * 0.4;
      const y = -1.8 + j * 0.4;
      const p = worldToPx(x, y);
      ctx.beginPath();
      ctx.arc(p.px, p.py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Analytic circle (cyan dashed)
  const cx_world = r, cy_world = 0;
  const cxp = worldToPx(cx_world, cy_world);
  ctx.strokeStyle = 'rgba(127, 177, 216, 0.50)';
  ctx.lineWidth = 1.0;
  ctx.setLineDash([4, 4]);
  const rPx = Math.abs(worldToPx(r, 0).px - worldToPx(0, 0).px);
  ctx.beginPath();
  ctx.arc(cxp.px, cxp.py, rPx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Trail
  if (state.trail.length >= 2) {
    ctx.strokeStyle = 'rgba(241, 210, 138, 0.65)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < state.trail.length; i += 1) {
      const p = worldToPx(state.trail[i][0], state.trail[i][1]);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  // Current particle
  const pPx = worldToPx(state.sim.x, state.sim.y);
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(pPx.px, pPx.py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Velocity arrow
  const vMag = speed(state.sim);
  if (vMag > 1e-6) {
    const ux = state.sim.vx / vMag, uy = state.sim.vy / vMag;
    const arrowLenWorld = 0.5;
    const p2 = worldToPx(state.sim.x + arrowLenWorld * ux, state.sim.y + arrowLenWorld * uy);
    ctx.strokeStyle = tok.accentWarm;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(pPx.px, pPx.py);
    ctx.lineTo(p2.px, p2.py);
    ctx.stroke();
  }

  // Legend
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('B is out of page (dots)', 60, H - 24);
  ctx.fillStyle = 'rgba(127, 177, 216, 0.75)';
  ctx.fillText('analytic circle (dashed)', 260, H - 24);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('particle trail', 480, H - 24);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepCyclotron(state.sim, 0.005);
    if (state.sim.nSteps % 2 === 0) {
      state.trail.push([state.sim.x, state.sim.y]);
      if (state.trail.length > 800) state.trail.shift();
    }
  }
}

// Sliders update the LIVE sim's parameters in place (state.sim.B,
// .q, .m get rewritten on every input event). The trail and the
// particle position are preserved so the user sees a continuous
// trajectory whose curvature shifts smoothly as the slider moves.
// Only the Reset button resets position + clears the trail.
function applyLiveParams() {
  if (!state.sim) return;
  state.sim.B = state.B;
  state.sim.q = state.q;
  state.sim.m = state.m;
}
sliderB.addEventListener('input', () => { state.B = parseFloat(sliderB.value); valueB.textContent = state.B.toFixed(2); applyLiveParams(); });
sliderV.addEventListener('input', () => {
  // Speed change rescales the current velocity vector to the new |v|
  // while preserving direction; this keeps the trajectory smooth.
  const newV = parseFloat(sliderV.value);
  valueV.textContent = newV.toFixed(2);
  if (state.sim) {
    const curV = Math.hypot(state.sim.vx, state.sim.vy) || 1;
    state.sim.vx *= newV / curV;
    state.sim.vy *= newV / curV;
  }
  state.v = newV;
});
sliderQ.addEventListener('input', () => { state.q = parseFloat(sliderQ.value); valueQ.textContent = state.q.toFixed(2); applyLiveParams(); });
sliderM.addEventListener('input', () => { state.m = parseFloat(sliderM.value); valueM.textContent = state.m.toFixed(2); applyLiveParams(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const T = cyclotronPeriod(state.B);
    const target = Math.round(frac * T / 0.005);
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
