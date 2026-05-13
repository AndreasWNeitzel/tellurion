// playground.js
// Predator-prey: phase portrait + time series.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createPredPrey, stepPredPrey, equilibrium, hopfThreshold } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderK      = document.getElementById('slider-K');
const sliderSpeed  = document.getElementById('slider-speed');
const valueK       = document.getElementById('value-K');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const FIXED_PARAMS = { r: 0.5, a: 1.0, b: 0.3, e: 0.5, d: 0.2 };

const state = {
  K: 1.5,
  speed: 3,
  sim: null,
  trail: [],
  trace: [],
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  const params = { ...FIXED_PARAMS, K: state.K };
  const eq = equilibrium(params);
  const x0 = eq ? eq.x + 0.05 : 0.3;
  const y0 = eq ? eq.y + 0.05 : 0.3;
  state.sim = createPredPrey({ ...params, x0, y0 });
  state.trail = [];
  state.trace = [];
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  const eq = equilibrium({ ...FIXED_PARAMS, K: state.K });
  const KH = hopfThreshold(FIXED_PARAMS);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`K = ${state.K.toFixed(2)}   K_H = ${KH.toFixed(2)}   t = ${state.sim.t.toFixed(2)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  const regime = state.K < KH ? 'stable focus (damped spiral)' : 'limit cycle';
  ctx.fillText(`x* = ${eq ? eq.x.toFixed(3) : 'NA'}, y* = ${eq ? eq.y.toFixed(3) : 'NA'}   regime: ${regime}`, 30, 40);

  const padL = 30, padR = 30;
  const panelW = (W - padL - padR - 30) / 2;
  const panelY = 60;
  const panelH = H - panelY - 70;

  // Phase portrait
  const phaseX = padL;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(phaseX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(phaseX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  const xMax = Math.max(state.K * 1.05, 0.6);
  const yMax = Math.max(eq ? eq.y * 3 : 0.6, 0.6);
  function ppX(xx) { return phaseX + 4 + (panelW - 8) * (xx / xMax); }
  function ppY(yy) { return panelY + panelH - 4 - (panelH - 16) * (yy / yMax); }
  // axes ticks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(phaseX, panelY + panelH - 4); ctx.lineTo(phaseX + panelW, panelY + panelH - 4);
  ctx.moveTo(phaseX + 4, panelY); ctx.lineTo(phaseX + 4, panelY + panelH);
  ctx.stroke();
  // Trail
  if (state.trail.length >= 2) {
    ctx.strokeStyle = 'rgba(127, 177, 216, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < state.trail.length; i += 1) {
      const px = ppX(state.trail[i][0]);
      const py = ppY(state.trail[i][1]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Current
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(ppX(state.sim.x), ppY(state.sim.y), 5, 0, Math.PI * 2);
  ctx.fill();
  // Equilibrium marker
  if (eq) {
    ctx.strokeStyle = state.K < KH ? '#a3d4a3' : '#d68a69';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(ppX(eq.x), ppY(eq.y), 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('phase (x, y)', phaseX + 6, panelY + 14);

  // Time series
  const traceX = padL + panelW + 30;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(traceX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(traceX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  if (state.trace.length >= 2) {
    const tWindow = 80.0;
    const tStart = Math.max(0, state.sim.t - tWindow);
    function tPx(t) { return traceX + 4 + (panelW - 8) * (t - tStart) / tWindow; }
    const yMaxT = Math.max(...[...state.trace.slice(-2000).map(p => Math.max(p.x, p.y))], 1.0) * 1.1;
    function yPx(v) { return panelY + panelH - 4 - (panelH - 16) * (v / yMaxT); }
    for (const [key, color] of [['x', tok.accentCool], ['y', tok.accentWarm]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let first = true;
      for (const pt of state.trace) {
        if (pt.t < tStart) continue;
        const px = tPx(pt.t);
        const py = yPx(pt[key]);
        if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tok.accentCool;
  ctx.textAlign = 'left';
  ctx.fillText('x(t) prey', traceX + 6, panelY + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('y(t) predator', traceX + 80, panelY + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepPredPrey(state.sim, 0.02);
    if (state.sim.nSteps % 2 === 0) {
      state.trail.push([state.sim.x, state.sim.y]);
      state.trace.push({ t: state.sim.t, x: state.sim.x, y: state.sim.y });
      if (state.trail.length > 3000) state.trail.shift();
      if (state.trace.length > 3000) state.trace.shift();
    }
  }
}

sliderK.addEventListener('change', () => { state.K = parseFloat(sliderK.value); valueK.textContent = state.K.toFixed(2); rebuild(); drawAll(); });
sliderK.addEventListener('input', () => { valueK.textContent = parseFloat(sliderK.value).toFixed(2); });
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
    const target = Math.round(frac * 2000);
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
