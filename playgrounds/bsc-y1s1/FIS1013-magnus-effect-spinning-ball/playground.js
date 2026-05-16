// playground.js
// Magnus-effect trajectory comparison: three trajectories (no spin, current,
// opposite) on common axes, with a live moving ball.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
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
  spinAngle: 0,
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

  // Animated current ball: a shaded pseudo-3D sphere with seam markings
  // that rotate at the spin rate (and in the spin's direction) so the
  // backspin/topspin that drives the Magnus force is visible.
  if (state.sim.y >= 0) {
    const cx = xP(state.sim.x), cy = yP(state.sim.y), R = 11;
    const sph = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    sph.addColorStop(0, '#ffe7c8'); sph.addColorStop(0.55, tok.accentWarm); sph.addColorStop(1, '#7a3318');
    ctx.fillStyle = sph;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();
    // Two baseball-style seams, foreshortened by the spin phase so the
    // sphere visibly rotates.
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.clip();
    ctx.strokeStyle = 'rgba(60,20,10,0.75)'; ctx.lineWidth = 1.6;
    for (const off of [0, Math.PI]) {
      const ph = state.spinAngle + off;
      ctx.beginPath();
      for (let k = -10; k <= 10; k += 1) {
        const u = k / 10;                       // along the seam
        const sx = cx + R * Math.cos(ph) * 0.95 * Math.cos(u * 1.3) - R * 0.0;
        const sy = cy + R * u * 0.95;
        const px2 = cx + (sx - cx) * Math.cos(ph) + R * 0.25 * Math.sin(ph) * Math.sin(u * 2.0);
        if (k === -10) ctx.moveTo(px2, sy); else ctx.lineTo(px2, sy);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
    // Spin-direction arrow above the ball.
    ctx.strokeStyle = tok.accentWarm; ctx.lineWidth = 1.4;
    const dir = Math.sign(state.spin) || 1;
    ctx.beginPath(); ctx.arc(cx, cy - R - 9, 6, -0.4 * dir, Math.PI + 0.4 * dir, dir < 0); ctx.stroke();
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
    state.spinAngle += state.spin * 0.0009;     // visible sphere rotation
    if (state.sim.y < 0) {
      // Reset to relaunch
      state.sim = createBall({ v0: state.v0, angleDeg: state.angle, spin: state.spin });
      state.spinAngle = 0;
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

// Slowed 4x further on review: one physics step every other frame
// (~0.5 step/frame, vs the previous 2) so the curved flight and the
// visible spin are easy to follow. Capture path returns before tick(),
// so this does not affect goldens.
let frameCount = 0;
function tick() {
  if (state.playing) {
    frameCount += 1;
    if (frameCount % 2 === 0) tickN(1);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
