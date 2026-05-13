// playground.js
// Three-body figure-eight choreography UI. Three colored bodies with trails on
// the same canvas; one slider for the perturbation dv.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import {
  createThreeBody,
  stepThreeBody,
  threeBodyDiagnostics,
  DEFAULT_DT,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  dv:       document.getElementById('readout-dv'),
  E:        document.getElementById('readout-E'),
  dE:       document.getElementById('readout-dE'),
  P:        document.getElementById('readout-P'),
  L:        document.getElementById('readout-L'),
  t:        document.getElementById('readout-t'),
};
const sliderDv     = document.getElementById('slider-dv');
const valueDv      = document.getElementById('value-dv');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const VIEW = { xmin: -1.6, xmax: 1.6, ymin: -1.07, ymax: 1.07 };
const TRAIL_MAX = 6000;

const state = {
  dv: 0,
  tb: null,
  trails: [[], [], []],
  playing: !DETERMINISTIC,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:         cssVar('--bg', '#FBFBF9'),
  surface:    cssVar('--surface', '#FFFFFF'),
  fg:         cssVar('--fg', '#1A1B1C'),
  fgMuted:    cssVar('--fg-muted', '#5C5E61'),
  fgFaint:    cssVar('--fg-faint', '#9A9C9F'),
  cat1:       cssVar('--cat-1', '#4C72B0'),
  cat2:       cssVar('--cat-2', '#DD8452'),
  cat3:       cssVar('--cat-3', '#55A868'),
  grid:       cssVar('--grid', '#9A9C9F4D'),
};
const colors = [tokens.cat1, tokens.cat2, tokens.cat3];

function rebuild() {
  state.tb = createThreeBody({ dvX: state.dv });
  state.trails = [[], [], []];
}

function px(x, y) {
  return {
    px: ((x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin)) * W,
    py: (1 - (y - VIEW.ymin) / (VIEW.ymax - VIEW.ymin)) * H,
  };
}

function drawAll() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // grid
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = -1.5; x <= 1.5; x += 0.5) {
    const { px: xp } = px(x, 0);
    ctx.moveTo(xp, 0); ctx.lineTo(xp, H);
  }
  for (let y = -1; y <= 1; y += 0.5) {
    const { py: yp } = px(0, y);
    ctx.moveTo(0, yp); ctx.lineTo(W, yp);
  }
  ctx.stroke();

  // axes
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  const o = px(0, 0);
  ctx.moveTo(0, o.py); ctx.lineTo(W, o.py);
  ctx.moveTo(o.px, 0); ctx.lineTo(o.px, H);
  ctx.stroke();

  // trails (3 bodies)
  for (let i = 0; i < 3; i += 1) {
    const tr = state.trails[i];
    if (tr.length < 2) continue;
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    const first = px(tr[0].x, tr[0].y);
    ctx.moveTo(first.px, first.py);
    for (let k = 1; k < tr.length; k += 1) {
      const q = px(tr[k].x, tr[k].y);
      ctx.lineTo(q.px, q.py);
    }
    ctx.stroke();
  }

  // bodies
  if (state.tb) {
    for (let i = 0; i < 3; i += 1) {
      const x = state.tb.inst.q[2 * i];
      const y = state.tb.inst.q[2 * i + 1];
      const p = px(x, y);
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(p.px, p.py, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Chenciner-Montgomery figure-eight (G = m_i = 1)', 20, 20);
}

function updateReadouts() {
  readouts.dv.textContent = state.dv.toFixed(4);
  if (!state.tb) return;
  const d = threeBodyDiagnostics(state.tb);
  readouts.E.textContent  = d.energy.toFixed(6);
  readouts.dE.textContent = Math.abs(d.energyDrift).toExponential(2);
  readouts.P.textContent  = d.momentumMag.toExponential(2);
  readouts.L.textContent  = d.angularMomentum.toExponential(2);
  readouts.t.textContent  = d.t.toFixed(2);
  readouts.dE.classList.toggle('warn', Math.abs(d.energyDrift) > 1e-3);
}

function stepOnce() {
  stepThreeBody(state.tb, DEFAULT_DT);
  for (let i = 0; i < 3; i += 1) {
    const tr = state.trails[i];
    tr.push({ x: state.tb.inst.q[2 * i], y: state.tb.inst.q[2 * i + 1] });
    if (tr.length > TRAIL_MAX) tr.shift();
  }
}

function applySlider() {
  state.dv = parseFloat(sliderDv.value);
  valueDv.textContent = state.dv.toFixed(4);
  rebuild();
  drawAll();
  updateReadouts();
}

sliderDv.addEventListener('input', applySlider);
btnReset.addEventListener('click', () => {
  sliderDv.value = '0';
  applySlider();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

const CAPTURE_TOTAL_T = 25.3;  // ~4 periods (T = 6.326)

function bootSync() {
  state.dv = parseFloat(sliderDv.value);
  valueDv.textContent = state.dv.toFixed(4);
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const steps = Math.round(frac * CAPTURE_TOTAL_T / DEFAULT_DT);
    for (let i = 0; i < steps; i += 1) stepOnce();
    state.playing = false;
  }
  drawAll();
  updateReadouts();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, seed: SEED, dv: state.dv };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

let lastFrameTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
let accumulator   = 0;

function tick(now) {
  if (!state.playing) {
    lastFrameTime = now;
    requestAnimationFrame(tick);
    return;
  }
  const frameDt = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  accumulator += frameDt;
  let safety = 0;
  while (accumulator >= DEFAULT_DT && safety < 240) {
    stepOnce();
    accumulator -= DEFAULT_DT;
    safety += 1;
  }
  drawAll();
  updateReadouts();
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
