// playground.js
// Three projectiles fired simultaneously with different drag laws.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createProjectile, stepProjectile, vacuumRange, vacuumPeak, G } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderV      = document.getElementById('slider-v');
const sliderAng    = document.getElementById('slider-ang');
const sliderSpeed  = document.getElementById('slider-speed');
const valueV       = document.getElementById('value-v');
const valueAng     = document.getElementById('value-ang');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const DRAG_B = 0.20;       // Stokes coefficient
const DRAG_C = 0.012;      // quadratic coefficient

const state = {
  v0: 20,
  angle: 45,
  speed: 2,
  sims: null,
  trails: { none: [], stokes: [], quadratic: [] },
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sims = {
    none:      createProjectile({ v0: state.v0, angleDeg: state.angle, dragMode: 'none' }),
    stokes:    createProjectile({ v0: state.v0, angleDeg: state.angle, dragMode: 'stokes', b: DRAG_B }),
    quadratic: createProjectile({ v0: state.v0, angleDeg: state.angle, dragMode: 'quadratic', c: DRAG_C }),
  };
  state.trails = { none: [], stokes: [], quadratic: [] };
}

function worldToPx(x, y) {
  const padL = 50, padR = 40, padT = 80, padB = 60;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  const xMax = Math.max(45, vacuumRange(state.v0, state.angle) * 1.1);
  const yMax = Math.max(15, vacuumPeak(state.v0, state.angle) * 1.4);
  const scaleX = drawW / xMax;
  const scaleY = drawH / yMax;
  return {
    px: padL + x * scaleX,
    py: padT + drawH - y * scaleY,
  };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sims) return;

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`v_0 = ${state.v0} m/s   angle = ${state.angle} deg   t = ${state.sims.none.t.toFixed(2)} s`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`Stokes b = ${DRAG_B}   Quadratic c = ${DRAG_C}   vacuum range = ${vacuumRange(state.v0, state.angle).toFixed(2)} m`, 30, 40);

  const padL = 50, padR = 40, padT = 80, padB = 60;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, W - padL - padR, H - padT - padB);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, W - padL - padR - 1, H - padT - padB - 1);
  // Ground line
  const ground = worldToPx(0, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.moveTo(padL, ground.py); ctx.lineTo(W - padR, ground.py);
  ctx.stroke();

  // Trails
  const colors = {
    none: '#f1d28a',
    stokes: tok.accentCool,
    quadratic: tok.accentWarm,
  };
  for (const key of ['none', 'stokes', 'quadratic']) {
    const trail = state.trails[key];
    if (trail.length < 2) continue;
    ctx.strokeStyle = colors[key];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < trail.length; i += 1) {
      const p = worldToPx(trail[i][0], Math.max(0, trail[i][1]));
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    // Current position
    const s = state.sims[key];
    if (s.y >= 0) {
      const p = worldToPx(s.x, s.y);
      ctx.fillStyle = colors[key];
      ctx.beginPath();
      ctx.arc(p.px, p.py, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Legend
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f1d28a';
  ctx.fillText('vacuum (no drag)', 60, H - 24);
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('Stokes drag (linear in v)', 230, H - 24);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('quadratic drag', 480, H - 24);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    for (const key of ['none', 'stokes', 'quadratic']) {
      const s = state.sims[key];
      if (s.y < 0 && s.t > 0.1) continue;       // stopped
      stepProjectile(s, 0.01);
      state.trails[key].push([s.x, s.y]);
      if (state.trails[key].length > 5000) state.trails[key].shift();
    }
  }
}

sliderV.addEventListener('change', () => { state.v0 = parseInt(sliderV.value, 10); valueV.textContent = String(state.v0); rebuild(); drawAll(); });
sliderV.addEventListener('input', () => { valueV.textContent = String(parseInt(sliderV.value, 10)); });
sliderAng.addEventListener('change', () => { state.angle = parseInt(sliderAng.value, 10); valueAng.textContent = `${state.angle} deg`; rebuild(); drawAll(); });
sliderAng.addEventListener('input', () => { valueAng.textContent = `${parseInt(sliderAng.value, 10)} deg`; });
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
    // Span the vacuum (longest) flight, not a fixed 600 steps: the
    // projectile lands well before 600, so frac >= 0.5 used to give
    // three pixel-identical post-landing frames. t_f = 2 v0 sin/g;
    // 0.96 keeps frac=1.0 just before touchdown so all five frames
    // are distinct and in-flight.
    const tFlight = 2 * state.v0 * Math.sin(state.angle * Math.PI / 180) / G;
    const stepsLand = Math.max(1, Math.round(tFlight / 0.01));
    const target = Math.round(frac * stepsLand * 0.96);
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

// Live pacing: step the sim at ~20 Hz rather than every 60 Hz frame so
// the flight is followable (was too fast). The deterministic capture
// path returns before tick(), so goldens are unaffected.
let liveFrame = 0;
function tick() {
  if (state.playing) {
    liveFrame += 1;
    if (liveFrame % 3 === 0) tickN(state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
