import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Side-by-side 1D linear advection in four numerical schemes plus exact.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
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
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

// hex (#rrggbb) -> 'rgb(r, g, b)' helper for the waterfall ribbons.
function hexToRgbStr(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// Per-scheme time history (rolling buffer) so we can render the
// waterfall 3D surface u(x, t) for each scheme.
const WATERFALL_DEPTH = 32;
const history = { ftcs: [], upwind: [], lw: [], mac: [] };
function pushHistory() {
  for (const k of ['ftcs', 'upwind', 'lw', 'mac']) {
    history[k].push(new Float64Array(state[k]));
    if (history[k].length > WATERFALL_DEPTH) history[k].shift();
  }
}

function rebuild() {
  state.u0 = initSquare();
  state.ftcs = new Float64Array(state.u0);
  state.upwind = new Float64Array(state.u0);
  state.lw = new Float64Array(state.u0);
  state.mac = new Float64Array(state.u0);
  state.t = 0; state.steps = 0;
  history.ftcs.length = 0; history.upwind.length = 0; history.lw.length = 0; history.mac.length = 0;
  pushHistory();
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
    if (state.steps % 3 === 0) pushHistory();
  }
}

// Render a 3D waterfall surface for one scheme. Each historical
// time-slice is drawn as a ribbon offset back-and-up in screen
// space, so the scheme's evolution u(x, t) reads as a tilted
// surface. Used INSIDE each scheme panel so the existing 4-panel
// layout becomes 4 surface renderings.
function drawWaterfall(x0, y0, panelW, panelH, hist, color, ymin, ymax) {
  if (!hist || hist.length === 0) return;
  // Project (i, k) -> (sx, sy) with isometric-ish offsets.
  const dxBack = panelW * 0.25;        // total back-shift across depth
  const dyBack = panelH * 0.22;
  const N = hist[0].length;
  for (let k = 0; k < hist.length; k += 1) {
    const u = hist[k];
    const t = k / Math.max(1, hist.length - 1);   // 0 = oldest, 1 = newest
    const offX = (1 - t) * dxBack;                 // older slices pushed back-right
    const offY = -(1 - t) * dyBack;
    const alpha = 0.18 + 0.82 * t;                 // older = fainter
    ctx.strokeStyle = color.replace('rgb', 'rgba').replace(')', `,${alpha})`);
    ctx.lineWidth = (k === hist.length - 1) ? 1.6 : 0.9;
    ctx.beginPath();
    for (let i = 0; i < N; i += 1) {
      const px = x0 + offX + (panelW - dxBack) * (i / (N - 1));
      const py = y0 + offY + panelH * (1 - (u[i] - ymin) / (ymax - ymin));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
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

  // 3D WATERFALL: render the scheme's u(x, t_k) for the last
  // WATERFALL_DEPTH time slices as ribbons offset back-and-up, giving
  // the 3D surface impression the user asked for. The current
  // time-slice is drawn brightest; older slices fade.
  const histKey = ['ftcs', 'upwind', 'lw', 'mac'][idx];
  const baseRGB = color.startsWith('#') ? hexToRgbStr(color) : color;
  drawWaterfall(x0, y0, PANEL_W, PANEL_H, history[histKey], baseRGB, ymin, ymax);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
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
  ctx.font = fontString(canvas, 'caption', 'mono');
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
