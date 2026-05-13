// playground.js
// Foucault pendulum trace.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createFoucault, stepFoucault, omegaZ, precessionPeriod } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderLat    = document.getElementById('slider-lat');
const sliderSpeed  = document.getElementById('slider-speed');
const valueLat     = document.getElementById('value-lat');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  lat: 45,
  speed: 3,
  sim: null,
  trail: [],
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sim = createFoucault({ latDeg: state.lat, x0: 1.0, y0: 0, vx0: 0, vy0: 0 });
  state.trail = [];
}

function worldToPx(x, y) {
  const padL = 50, padR = 50, padT = 80, padB = 80;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  const wbox = 2.5;
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

  const Oz = omegaZ(state.lat);
  const Tp = state.lat === 0 ? Infinity : precessionPeriod(state.lat);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`latitude = ${state.lat} deg   t = ${state.sim.t.toFixed(1)} (s)`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  const TpStr = isFinite(Tp) ? Tp.toFixed(1) : '(no precession)';
  ctx.fillText(`omega_z = ${Oz.toFixed(3)}   T_precess = ${TpStr} s   pendulum period T_0 approx 2 pi`, 30, 40);

  // Plot frame
  const padL = 50, padR = 50, padT = 80, padB = 80;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, W - padL - padR, H - padT - padB);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, W - padL - padR - 1, H - padT - padB - 1);

  // Cross-hairs
  const c0 = worldToPx(0, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(padL, c0.py); ctx.lineTo(W - padR, c0.py);
  ctx.moveTo(c0.px, padT); ctx.lineTo(c0.px, H - padB);
  ctx.stroke();

  // Initial swing axis (dotted)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const p1 = worldToPx(-1.05, 0), p2 = worldToPx(1.05, 0);
  ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py);
  ctx.stroke();
  ctx.setLineDash([]);

  // Trail
  if (state.trail.length >= 2) {
    ctx.strokeStyle = 'rgba(127, 177, 216, 0.55)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let i = 0; i < state.trail.length; i += 1) {
      const p = worldToPx(state.trail[i][0], state.trail[i][1]);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  // Current position
  const pNow = worldToPx(state.sim.x, state.sim.y);
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(pNow.px, pNow.py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Legend
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('initial swing axis (dashed)', 60, H - 24);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('bob position', 270, H - 24);
  ctx.fillStyle = 'rgba(127, 177, 216, 0.85)';
  ctx.fillText('swept trail', 400, H - 24);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepFoucault(state.sim, 0.02);
    if (state.sim.nSteps % 1 === 0) {
      state.trail.push([state.sim.x, state.sim.y]);
      if (state.trail.length > 6000) state.trail.shift();
    }
  }
}

sliderLat.addEventListener('change', () => { state.lat = parseInt(sliderLat.value, 10); valueLat.textContent = `${state.lat} deg`; rebuild(); drawAll(); });
sliderLat.addEventListener('input', () => { valueLat.textContent = `${parseInt(sliderLat.value, 10)} deg`; });
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
    const target = Math.round(frac * 2400);
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
