// playground.js
// Cart with pendulum render + energy and phase panels.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  createCart, stepCart, energy, horizontalMomentum,
  M_CART, M_BOB, L_PEN,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderTheta  = document.getElementById('slider-theta');
const sliderSpeed  = document.getElementById('slider-speed');
const valueTheta   = document.getElementById('value-theta');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  theta0: 0.8,
  speed: 3,
  sim: null,
  E0: 0,
  trail: [],     // bob trail
  phase: [],     // (theta, x) phase
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sim = createCart({ theta: state.theta0, thetadot: 0, x: 0, xdot: 0 });
  state.E0 = energy(state.sim);
  state.trail = [];
  state.phase = [];
}

function drawScene() {
  // Top half of canvas: cart on rail with pendulum.
  const sceneY = 60, sceneH = 240;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(30, sceneY, W - 60, sceneH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(30.5, sceneY + 0.5, W - 61, sceneH - 1);

  // Rail (horizontal line at center)
  const railY = sceneY + sceneH * 0.55;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.beginPath();
  ctx.moveTo(40, railY); ctx.lineTo(W - 40, railY);
  ctx.stroke();

  // Cart position (center of canvas + scaled x)
  const cxBase = W / 2;
  const scale = 60;     // pixels per length unit
  const cartX = cxBase + state.sim.x * scale;
  const cartW = 60, cartH = 28;
  ctx.fillStyle = tok.accentCool;
  ctx.fillRect(cartX - cartW / 2, railY - cartH, cartW, cartH);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.strokeRect(cartX - cartW / 2, railY - cartH, cartW, cartH);
  // Wheels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath(); ctx.arc(cartX - cartW * 0.3, railY, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cartX + cartW * 0.3, railY, 5, 0, Math.PI * 2); ctx.fill();

  // Pivot on top of cart
  const pivotX = cartX, pivotY = railY - cartH;
  // Pendulum bob: theta measured from straight down (theta = 0 is hanging).
  const bobX = pivotX + L_PEN * scale * Math.sin(state.sim.theta);
  const bobY = pivotY + L_PEN * scale * Math.cos(state.sim.theta);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.70)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY); ctx.lineTo(bobX, bobY);
  ctx.stroke();
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(bobX, bobY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.stroke();

  // Bob trail
  ctx.strokeStyle = 'rgba(214, 138, 105, 0.40)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let i = 0; i < state.trail.length; i += 1) {
    const t = state.trail[i];
    if (i === 0) ctx.moveTo(t.x, t.y); else ctx.lineTo(t.x, t.y);
  }
  ctx.stroke();
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;
  const E = energy(state.sim);
  const p = horizontalMomentum(state.sim);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${state.sim.t.toFixed(2)}   theta = ${state.sim.theta.toFixed(3)}   x = ${state.sim.x.toFixed(3)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`E_drift = ${((E - state.E0) / Math.abs(state.E0 || 1)).toExponential(2)}   p_x = ${p.toFixed(3)}   M = ${M_CART}, m = ${M_BOB}, L = ${L_PEN}`, 30, 40);

  drawScene();

  // Bottom: phase portrait (x, theta)
  const phaseY = 320, phaseH = H - phaseY - 60;
  const phaseX = 30, phaseW = W - 60;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(phaseX, phaseY, phaseW, phaseH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(phaseX + 0.5, phaseY + 0.5, phaseW - 1, phaseH - 1);
  // Phase trail
  const xMax = Math.max(...state.phase.map(p => Math.abs(p.x)), 1);
  const tMax = Math.max(...state.phase.map(p => Math.abs(p.th)), 1);
  function ppX(x) { return phaseX + phaseW / 2 + (x / xMax) * (phaseW / 2 - 6); }
  function ppY(th) { return phaseY + phaseH / 2 - (th / tMax) * (phaseH / 2 - 6); }
  ctx.strokeStyle = 'rgba(127, 177, 216, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < state.phase.length; i += 1) {
    const pt = state.phase[i];
    if (i === 0) ctx.moveTo(ppX(pt.x), ppY(pt.th)); else ctx.lineTo(ppX(pt.x), ppY(pt.th));
  }
  ctx.stroke();
  // Current
  if (state.phase.length > 0) {
    const cur = state.phase[state.phase.length - 1];
    ctx.fillStyle = '#f1d28a';
    ctx.beginPath();
    ctx.arc(ppX(cur.x), ppY(cur.th), 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('phase (x_cart, theta)', phaseX + 6, phaseY + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepCart(state.sim, 0.005);
    if (state.sim.nSteps % 1 === 0) {
      const pivotY = 60 + 240 * 0.55 - 28;
      const cxBase = W / 2;
      const scale = 60;
      const cartX = cxBase + state.sim.x * scale;
      const bx = cartX + L_PEN * scale * Math.sin(state.sim.theta);
      const by = pivotY + L_PEN * scale * Math.cos(state.sim.theta);
      state.trail.push({ x: bx, y: by });
      state.phase.push({ x: state.sim.x, th: state.sim.theta });
      if (state.trail.length > 600) state.trail.shift();
      if (state.phase.length > 1200) state.phase.shift();
    }
  }
}

sliderTheta.addEventListener('change', () => { state.theta0 = parseFloat(sliderTheta.value); valueTheta.textContent = state.theta0.toFixed(2); rebuild(); drawAll(); });
sliderTheta.addEventListener('input', () => { valueTheta.textContent = parseFloat(sliderTheta.value).toFixed(2); });
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
