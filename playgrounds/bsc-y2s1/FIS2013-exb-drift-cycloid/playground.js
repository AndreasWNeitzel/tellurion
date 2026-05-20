// playground.js
// ExB drift cycloid trajectory.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createExB, stepExB, cyclotronPeriod } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderE      = document.getElementById('slider-E');
const sliderB      = document.getElementById('slider-B');
const sliderSpeed  = document.getElementById('slider-speed');
const valueE       = document.getElementById('value-E');
const valueB       = document.getElementById('value-B');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  E: 0.5,
  B: 1.0,
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
  state.sim = createExB({ E: state.E, B: state.B });
  state.trail = [];
}

function worldToPx(x, y) {
  const padL = 30, padR = 30, padT = 70, padB = 80;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  const wbox = 12;
  const scale = Math.min(drawW / wbox, drawH / wbox);
  return {
    px: padL + drawW * 0.3 + x * scale,
    py: padT + drawH * 0.3 - y * scale,
  };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  const T_c = cyclotronPeriod(state.B);
  const drift = state.E / state.B;
  const cycloidAmp = state.E / (state.B * state.B);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`E = ${state.E.toFixed(2)}   B = ${state.B.toFixed(2)}   t = ${state.sim.t.toFixed(2)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`v_drift = -E / B = ${(-drift).toFixed(3)} (in y)   cycloid amp = E / B^2 = ${cycloidAmp.toFixed(3)}   T_c = ${T_c.toFixed(3)}`, 30, 40);

  const padL = 30, padR = 30, padT = 70, padB = 80;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, W - padL - padR, H - padT - padB);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, W - padL - padR - 1, H - padT - padB - 1);

  // B-field "dots"
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  for (let i = 0; i < 14; i += 1) {
    for (let j = 0; j < 10; j += 1) {
      const x = -3 + i * 0.6;
      const y = 3 - j * 0.8;
      const p = worldToPx(x, y);
      ctx.beginPath();
      ctx.arc(p.px, p.py, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // E-field arrow row
  ctx.strokeStyle = 'rgba(241, 210, 138, 0.50)';
  ctx.lineWidth = 1.0;
  for (let j = 0; j < 6; j += 1) {
    const y = 3 - j * 1.5;
    const p0 = worldToPx(-3, y);
    const p1 = worldToPx(-2.5, y);
    ctx.beginPath();
    ctx.moveTo(p0.px, p0.py); ctx.lineTo(p1.px, p1.py);
    ctx.stroke();
    // arrowhead
    ctx.beginPath();
    ctx.moveTo(p1.px, p1.py);
    ctx.lineTo(p1.px - 5, p1.py - 3);
    ctx.lineTo(p1.px - 5, p1.py + 3);
    ctx.closePath();
    ctx.fillStyle = 'rgba(241, 210, 138, 0.50)';
    ctx.fill();
  }
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(241, 210, 138, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText('E -> +x', worldToPx(-3, 3.5).px, worldToPx(-3, 3.5).py);

  // Trail
  if (state.trail.length >= 2) {
    ctx.strokeStyle = 'rgba(127, 177, 216, 0.70)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < state.trail.length; i += 1) {
      const p = worldToPx(state.trail[i][0], state.trail[i][1]);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  // Particle
  const pPx = worldToPx(state.sim.x, state.sim.y);
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(pPx.px, pPx.py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Analytic drift vector arrow from particle position
  const dEndWorld = { x: state.sim.x, y: state.sim.y - drift * 0.7 };
  const dEnd = worldToPx(dEndWorld.x, dEndWorld.y);
  ctx.strokeStyle = 'rgba(127, 177, 216, 0.85)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(pPx.px, pPx.py);
  ctx.lineTo(dEnd.px, dEnd.py);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(dEnd.px, dEnd.py);
  ctx.lineTo(dEnd.px - 4, dEnd.py - 7);
  ctx.lineTo(dEnd.px + 4, dEnd.py - 7);
  ctx.closePath();
  ctx.fillStyle = 'rgba(127, 177, 216, 0.85)';
  ctx.fill();

  // Legend
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(241, 210, 138, 0.75)';
  ctx.fillText('E (in +x)', 60, H - 24);
  ctx.fillStyle = 'rgba(127, 177, 216, 0.85)';
  ctx.fillText('drift v_d = -y', 180, H - 24);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('particle (q = +1)', 320, H - 24);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepExB(state.sim, 0.01);
    if (state.sim.nSteps % 1 === 0) {
      state.trail.push([state.sim.x, state.sim.y]);
      if (state.trail.length > 1500) state.trail.shift();
    }
  }
}

sliderE.addEventListener('change', () => { state.E = parseFloat(sliderE.value); valueE.textContent = state.E.toFixed(2); rebuild(); drawAll(); });
sliderE.addEventListener('input', () => { valueE.textContent = parseFloat(sliderE.value).toFixed(2); });
sliderB.addEventListener('change', () => { state.B = parseFloat(sliderB.value); valueB.textContent = state.B.toFixed(2); rebuild(); drawAll(); });
sliderB.addEventListener('input', () => { valueB.textContent = parseFloat(sliderB.value).toFixed(2); });
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
    const target = Math.round(frac * 800);
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
