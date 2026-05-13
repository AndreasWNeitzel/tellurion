// playground.js
// Magnus-effect trajectory comparison: three trajectories (no spin, current,
// opposite) on common axes, with a live moving ball.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { createBall, stepBall, trajectory } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderV      = document.getElementById('slider-v');
const sliderAng    = document.getElementById('slider-ang');
const sliderSpin   = document.getElementById('slider-spin');
const valueV       = document.getElementById('value-v');
const valueAng     = document.getElementById('value-ang');
const valueSpin    = document.getElementById('value-spin');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  v0: 25,
  angle: 20,
  spin: 50,
  sim: null,
  trails: { current: [], zero: [], opposite: [] },
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function precomputeTrajectories() {
  const opts = { v0: state.v0, angleDeg: state.angle };
  state.trails.current  = trajectory({ ...opts, spin: state.spin });
  state.trails.zero     = trajectory({ ...opts, spin: 0 });
  state.trails.opposite = trajectory({ ...opts, spin: -state.spin });
}

function rebuild() {
  state.sim = createBall({ v0: state.v0, angleDeg: state.angle, spin: state.spin });
  precomputeTrajectories();
}

function bbox() {
  let xMax = 10, yMax = 5;
  for (const key of ['current', 'zero', 'opposite']) {
    for (const p of state.trails[key]) {
      if (p.x > xMax) xMax = p.x;
      if (p.y > yMax) yMax = p.y;
    }
  }
  return { xMax: xMax * 1.05, yMax: yMax * 1.4 };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;
  const bb = bbox();

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`v_0 = ${state.v0}   angle = ${state.angle} deg   spin = ${state.spin}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`range with spin: ${state.trails.current[state.trails.current.length - 1].x.toFixed(2)} m   without: ${state.trails.zero[state.trails.zero.length - 1].x.toFixed(2)} m`, 30, 40);

  const padL = 30, padR = 30, padT = 60, padB = 70;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, drawW, drawH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, drawW - 1, drawH - 1);

  function xP(x) { return padL + 4 + (drawW - 8) * (x / bb.xMax); }
  function yP(y) { return padT + drawH - 4 - (drawH - 12) * (y / bb.yMax); }
  // Ground line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.beginPath();
  ctx.moveTo(padL, yP(0)); ctx.lineTo(padL + drawW, yP(0));
  ctx.stroke();

  // Trails
  const traces = [
    { key: 'zero',     color: '#f1d28a', dashed: true,  label: 'no spin' },
    { key: 'opposite', color: tok.accentCool, dashed: false, label: 'opposite' },
    { key: 'current',  color: tok.accentWarm, dashed: false, label: 'current spin' },
  ];
  for (const t of traces) {
    ctx.strokeStyle = t.color;
    ctx.lineWidth = 1.5;
    if (t.dashed) ctx.setLineDash([5, 4]); else ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i < state.trails[t.key].length; i += 1) {
      const p = state.trails[t.key][i];
      if (i === 0) ctx.moveTo(xP(p.x), yP(Math.max(0, p.y)));
      else         ctx.lineTo(xP(p.x), yP(Math.max(0, p.y)));
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Animated current ball
  if (state.sim.y >= 0) {
    const pPx = { x: xP(state.sim.x), y: yP(state.sim.y) };
    ctx.fillStyle = tok.accentWarm;
    ctx.beginPath();
    ctx.arc(pPx.x, pPx.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1; ctx.stroke();
  }

  // Legend
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f1d28a';
  ctx.fillText('no spin (dashed)', padL + 6, padT + 14);
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('opposite spin', padL + 170, padT + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('current spin', padL + 320, padT + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepBall(state.sim, 0.01);
    if (state.sim.y < 0) {
      // Reset to relaunch
      state.sim = createBall({ v0: state.v0, angleDeg: state.angle, spin: state.spin });
    }
  }
}

sliderV.addEventListener('change', () => { state.v0 = parseInt(sliderV.value, 10); valueV.textContent = String(state.v0); rebuild(); drawAll(); });
sliderV.addEventListener('input', () => { valueV.textContent = String(parseInt(sliderV.value, 10)); });
sliderAng.addEventListener('change', () => { state.angle = parseInt(sliderAng.value, 10); valueAng.textContent = `${state.angle} deg`; rebuild(); drawAll(); });
sliderAng.addEventListener('input', () => { valueAng.textContent = `${parseInt(sliderAng.value, 10)} deg`; });
sliderSpin.addEventListener('change', () => { state.spin = parseInt(sliderSpin.value, 10); valueSpin.textContent = String(state.spin); rebuild(); drawAll(); });
sliderSpin.addEventListener('input', () => { valueSpin.textContent = String(parseInt(sliderSpin.value, 10)); });
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
    const target = Math.round(frac * 250);
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
    tickN(4);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
