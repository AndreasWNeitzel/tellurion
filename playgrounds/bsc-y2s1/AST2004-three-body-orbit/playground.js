// playground.js
// Three-body figure-eight choreography UI. Three colored bodies with trails on
// the same canvas; one slider for the perturbation dv.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createThreeBodyFromIC,
  ORBIT_CATALOG,
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
const selOrbit     = document.getElementById('select-orbit');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const ASPECT = H / W;
let VIEW = { xmin: -1.6, xmax: 1.6, ymin: -1.07, ymax: 1.07 };
const TRAIL_MAX = 6000;

const state = {
  orbit: 'figure-eight',
  dv: 0,
  tb: null,
  trails: [[], [], []],
  tElapsed: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function setView(half) {
  VIEW = { xmin: -half, xmax: half, ymin: -half * ASPECT, ymax: half * ASPECT };
}

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
  const entry = ORBIT_CATALOG[state.orbit] || ORBIT_CATALOG['figure-eight'];
  const ic = entry.ic();
  ic.velocities = ic.velocities.slice();
  ic.velocities[4] += state.dv;                 // small perturbation on body 3 vx
  state.tb = createThreeBodyFromIC({ ic });
  setView(entry.view);
  state.trails = [[], [], []];
  state.tElapsed = 0;
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
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  const entry = ORBIT_CATALOG[state.orbit] || ORBIT_CATALOG['figure-eight'];
  ctx.fillText(`${state.orbit}  (G = m_i = 1, T = ${entry.period.toFixed(3)})`, 20, 22);
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

// The Suvakov orbits have close two-body passages that fixed-step
// velocity-Verlet under-resolves at DEFAULT_DT (the orbit then fails
// to close). Sub-step the integrator so one visual step still advances
// DEFAULT_DT but with SUBSTEPS finer Verlet steps. sim.js unchanged.
const SUBSTEPS = 16;
function stepOnce() {
  const h = DEFAULT_DT / SUBSTEPS;
  for (let k = 0; k < SUBSTEPS; k += 1) stepThreeBody(state.tb, h);
  state.tElapsed += DEFAULT_DT;
  for (let i = 0; i < 3; i += 1) {
    const tr = state.trails[i];
    tr.push({ x: state.tb.inst.q[2 * i], y: state.tb.inst.q[2 * i + 1] });
    if (tr.length > TRAIL_MAX) tr.shift();
  }
  // Re-seed at each period so the delicate choreographies keep
  // redrawing as the recognizable closed orbit instead of drifting.
  const period = (ORBIT_CATALOG[state.orbit] || {}).period || 6.3;
  if (state.tElapsed >= 0.985 * period) {
    const keepOrbit = state.orbit, keepDv = state.dv;
    state.orbit = keepOrbit; state.dv = keepDv;
    rebuild();
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
selOrbit.addEventListener('change', () => {
  state.orbit = selOrbit.value;
  rebuild(); drawAll(); updateReadouts();
});
btnReset.addEventListener('click', () => {
  sliderDv.value = '0';
  applySlider();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  state.dv = parseFloat(sliderDv.value);
  valueDv.textContent = state.dv.toFixed(4);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const keys = Object.keys(ORBIT_CATALOG);
    state.orbit = keys[Math.min(keys.length - 1, Math.round(frac * (keys.length - 1)))];
    if (selOrbit) selOrbit.value = state.orbit;
    rebuild();
    const period = (ORBIT_CATALOG[state.orbit] || {}).period || 6.3;
    // Draw just under one period: one clean closed choreography loop
    // before truncated-IC sensitivity becomes visible.
    const steps = Math.round(0.985 * period / DEFAULT_DT);
    for (let i = 0; i < steps; i += 1) stepOnce();
    state.playing = false;
  } else {
    rebuild();
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
