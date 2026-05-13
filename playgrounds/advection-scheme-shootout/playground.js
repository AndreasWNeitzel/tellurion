// playground.js
// Side-by-side 1D linear advection in four numerical schemes plus exact.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  initSquare, exactSolution, NX, X_MIN, X_MAX, DX,
  stepFTCS, stepUpwind, stepLaxWendroff, stepMacCormack,
  totalVariation, l2Error,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderC      = document.getElementById('slider-c');
const sliderCFL    = document.getElementById('slider-cfl');
const sliderSpeed  = document.getElementById('slider-speed');
const valueC       = document.getElementById('value-c');
const valueCFL     = document.getElementById('value-cfl');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  c: 1.0,
  cfl: 0.8,
  speed: 3,
  u0: null,
  ftcs: null, upwind: null, lw: null, mac: null,
  t: 0,
  steps: 0,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function rebuild() {
  state.u0 = initSquare();
  state.ftcs = new Float64Array(state.u0);
  state.upwind = new Float64Array(state.u0);
  state.lw = new Float64Array(state.u0);
  state.mac = new Float64Array(state.u0);
  state.t = 0; state.steps = 0;
}

function tickN(n) {
  if (!state.u0) return;
  const dt = state.cfl * DX / state.c;
  for (let s = 0; s < n; s += 1) {
    stepFTCS(state.ftcs, state.c, dt);
    stepUpwind(state.upwind, state.c, dt);
    stepLaxWendroff(state.lw, state.c, dt);
    stepMacCormack(state.mac, state.c, dt);
    state.t += dt;
    state.steps += 1;
  }
}

function drawPanel(u, label, idx, color) {
  const PANEL_W = W / 2 - 30;
  const PANEL_H = (H - 80) / 2 - 10;
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  const x0 = 30 + col * (PANEL_W + 30);
  const y0 = 40 + row * (PANEL_H + 30);
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(x0, y0, PANEL_W, PANEL_H);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, PANEL_W - 1, PANEL_H - 1);

  const ymin = -0.4, ymax = 1.4;
  function toPx(i, y) {
    return {
      px: x0 + PANEL_W * (i / (NX - 1)),
      py: y0 + PANEL_H * (1 - (y - ymin) / (ymax - ymin)),
    };
  }

  // Exact (dashed green)
  const uExact = exactSolution(state.u0, state.c, state.t);
  ctx.strokeStyle = 'rgba(120, 200, 120, 0.55)';
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let i = 0; i < NX; i += 1) {
    const p = toPx(i, uExact[i]);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Scheme
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < NX; i += 1) {
    const p = toPx(i, u[i]);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(label, x0 + 8, y0 + 14);
  const tv = totalVariation(u);
  const err = l2Error(u, uExact);
  ctx.textAlign = 'right';
  ctx.fillText(`TV=${tv.toFixed(2)}`, x0 + PANEL_W - 8, y0 + 14);
  ctx.fillText(`L2=${err.toFixed(3)}`, x0 + PANEL_W - 8, y0 + 28);
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${state.t.toFixed(3)}   steps = ${state.steps}   CFL = ${state.cfl.toFixed(2)}   c = ${state.c.toFixed(2)}`, 30, 20);
  // FTCS will go unstable past CFL ~ 0, so cap display values to avoid drawing nothing
  drawPanel(state.ftcs, 'FTCS (unstable)',   0, tok.accentWarm);
  drawPanel(state.upwind, 'Upwind (1st)',    1, tok.accent);
  drawPanel(state.lw,    'Lax-Wendroff',     2, tok.accent);
  drawPanel(state.mac,   'MacCormack',       3, tok.accent);
}

sliderC.addEventListener('input', () => { state.c = parseFloat(sliderC.value); valueC.textContent = state.c.toFixed(2); });
sliderCFL.addEventListener('input', () => { state.cfl = parseFloat(sliderCFL.value); valueCFL.textContent = state.cfl.toFixed(2); });
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
    const target = Math.round(frac * 200);
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
