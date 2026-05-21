// Rayleigh-Taylor instability playground.

import {
  atwoodNumber, growthRate, bubbleVelocity, linearVelocity,
  nonlinearVelocity, rk4Step, makeRng, BOX_X, BOX_Y_HALF,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rA = document.getElementById('readout-A');
const rK = document.getElementById('readout-k');
const rG = document.getElementById('readout-g');
const rSig = document.getElementById('readout-sig');
const rStage = document.getElementById('readout-stage');

const sA = document.getElementById('slider-A'), vA = document.getElementById('value-A');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  A: 0.50,
  k: 3,
  g: 1.0,
  speed: 2,
  running: !prefersReducedMotion(),
  rng: makeRng(0xC0FFEE),
  tracers: [],
  t: 0,
  amplitude: 0.005,        // current linear amplitude
};

const N_TRACERS = 2400;

function world2screen(x, y) {
  // x in [0, 2 pi], y in [-1, 1].
  const sx = (x / (BOX_X * Math.PI)) * W;
  const sy = (1 - (y + BOX_Y_HALF) / (2 * BOX_Y_HALF)) * H;
  return { x: sx, y: sy };
}

function reseedTracers() {
  st.tracers = [];
  for (let i = 0; i < N_TRACERS; i++) {
    const x = st.rng() * BOX_X * Math.PI;
    let y;
    if (i < N_TRACERS / 2) {
      // Heavy fluid (red), top half.
      y = 0.05 + st.rng() * 0.9;
    } else {
      // Light fluid (cyan), bottom half.
      y = -0.05 - st.rng() * 0.9;
    }
    st.tracers.push({ x, y, heavy: i < N_TRACERS / 2 });
  }
  st.amplitude = 0.005;
}

function currentVelocity(x, y) {
  // Linear contribution.
  const kw = st.k;     // dimensionless wavenumber
  const vLin = linearVelocity(x, y, kw, st.amplitude);
  // Nonlinear correction once amplitude * k > 0.3.
  const beta = Math.min(1, st.amplitude * kw / 0.4);
  const vNL = nonlinearVelocity(x, y, kw, st.A, st.g);
  return {
    u: (1 - beta) * vLin.u + beta * vNL.u,
    v: (1 - beta) * vLin.v + beta * vNL.v,
  };
}

function stepTracers(dt) {
  // Update linear amplitude.
  const sigma = growthRate(st.k, st.A, st.g);
  st.amplitude = Math.min(0.6, st.amplitude * Math.exp(sigma * dt));
  // Advect each tracer.
  const dts = dt * 0.8 * st.speed;
  for (const p of st.tracers) {
    const r = rk4Step(p.x, p.y, dts, (x, y) => currentVelocity(x, y));
    p.x = r.x;
    p.y = r.y;
  }
}

function drawBackground() {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  // Gradient hints: top half slightly red-tinted, bottom slightly cyan-tinted.
  const top = ctx.createLinearGradient(0, 0, 0, H / 2);
  top.addColorStop(0, 'rgba(255, 80, 90, 0.10)');
  top.addColorStop(1, 'rgba(255, 80, 90, 0.04)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, H / 2);
  const bot = ctx.createLinearGradient(0, H / 2, 0, H);
  bot.addColorStop(0, 'rgba(80, 220, 255, 0.04)');
  bot.addColorStop(1, 'rgba(80, 220, 255, 0.10)');
  ctx.fillStyle = bot;
  ctx.fillRect(0, H / 2, W, H / 2);
  // Centerline.
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.15)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.setLineDash([]);
}

function drawTracers() {
  for (const p of st.tracers) {
    const s = world2screen(p.x, p.y);
    const col = p.heavy ? [255, 130, 110] : [120, 220, 255];
    ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.7)`;
    ctx.fillRect(s.x - 0.8, s.y - 0.8, 1.6, 1.6);
  }
}

function drawGravityArrow() {
  // Indicate g direction.
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.6)';
  ctx.fillStyle = 'rgba(220, 230, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W - 30, 28);
  ctx.lineTo(W - 30, 70);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W - 30, 70);
  ctx.lineTo(W - 35, 62);
  ctx.lineTo(W - 25, 62);
  ctx.closePath();
  ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('g', W - 36, 22);
}

function drawLabels() {
  ctx.fillStyle = 'rgba(255, 130, 110, 0.9)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('heavy (red)', 14, 22);
  ctx.fillStyle = 'rgba(120, 220, 255, 0.9)';
  ctx.fillText('light (cyan)', 14, H - 12);
  // Stage label.
  const sigma = growthRate(st.k, st.A, st.g);
  const stage = (st.amplitude < 0.04) ? 'linear'
              : (st.amplitude < 0.2) ? 'transitional'
              : 'nonlinear (spikes + bubbles)';
  ctx.fillStyle = 'rgba(255, 240, 200, 0.85)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`A = ${st.A.toFixed(2)}, k = ${st.k}, sigma = ${sigma.toFixed(2)}, amp = ${st.amplitude.toFixed(3)}`, 14, H / 2 - 6);
  ctx.fillText(`stage: ${stage}`, 14, H / 2 + 14);
}

function updateReadout() {
  const sigma = growthRate(st.k, st.A, st.g);
  rA.textContent = st.A.toFixed(2);
  rK.textContent = String(st.k);
  rG.textContent = st.g.toFixed(2);
  rSig.textContent = sigma.toFixed(3);
  const stage = (st.amplitude < 0.04) ? 'linear'
              : (st.amplitude < 0.2) ? 'transitional'
              : 'nonlinear';
  rStage.textContent = stage;
}

// Rule-13 diagnostic: the perturbation amplitude a(t) on a log axis.
// In the linear regime it grows as a_0 e^{sigma t} (a straight line
// whose slope is the growth rate sigma); the line bends over as the
// instability saturates into the nonlinear bubble-and-spike regime.
const ampHistory = [];
function drawAmpDiagnostic() {
  const W = canvas.width, H = canvas.height;
  const pw = 244, ph = 132, px = W - pw - 14, py = H - ph - 14;
  ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText('amplitude  log₁₀ a(t)', px + 8, py + 14);
  if (ampHistory.length < 2) return;
  const ax = px + 34, ay = py + 22, aw = pw - 46, ah = ph - 40;
  const lLo = -3, lHi = 0;
  const t0 = ampHistory[0].t, t1 = ampHistory[ampHistory.length - 1].t;
  const xOf = (t) => ax + (t1 > t0 ? (t - t0) / (t1 - t0) : 0) * aw;
  const yOf = (l) => ay + ah - ((Math.max(lLo, Math.min(lHi, l)) - lLo) / (lHi - lLo)) * ah;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let l = lLo; l <= lHi; l += 1) {
    ctx.beginPath(); ctx.moveTo(ax, yOf(l)); ctx.lineTo(ax + aw, yOf(l)); ctx.stroke();
  }
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < ampHistory.length; i += 1) {
    const p = ampHistory[i];
    const x = xOf(p.t), y = yOf(Math.log10(Math.max(1e-4, p.a)));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,210,240,0.75)'; ctx.font = fontString(canvas, 'caption', 'mono');
  for (let l = lLo; l <= lHi; l += 1) ctx.fillText(`${l}`, px + 6, yOf(l) + 3);
  ctx.fillText('t', ax + aw / 2, py + ph - 4);
}

function draw() {
  drawBackground();
  drawTracers();
  drawGravityArrow();
  drawLabels();
  // Sample a(t) for the diagnostic.
  if (ampHistory.length === 0 || st.t - ampHistory[ampHistory.length - 1].t > 0.04) {
    ampHistory.push({ t: st.t, a: st.amplitude });
    if (ampHistory.length > 400) ampHistory.shift();
  }
  drawAmpDiagnostic();
  updateReadout();
}

function readSliders() {
  const newA = parseFloat(sA.value);
  const aChanged = (newA !== st.A);
  st.A = newA;
  st.k = parseInt(sK.value, 10);
  st.g = parseFloat(sG.value);
  st.speed = parseInt(sSpeed.value, 10);
  vA.textContent = st.A.toFixed(2);
  vK.textContent = String(st.k);
  vG.textContent = st.g.toFixed(2);
  vSpeed.textContent = String(st.speed);
  if (aChanged) {
    st.amplitude = 0.005;
    reseedTracers();
  }
}

[sA, sK, sG, sSpeed].forEach(el => el.addEventListener('input', readSliders));
btnReset.addEventListener('click', () => { st.t = 0; reseedTracers(); ampHistory.length = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  atwood: { get: () => st.A, set: v => { st.A = parseFloat(v); sA.value = v; }, parse: parseFloat },
  gravity: { get: () => st.g, set: v => { st.g = parseFloat(v); sG.value = v; }, parse: parseFloat },
  k_mode: { get: () => st.k, set: v => { st.k = parseInt(v, 10); sK.value = v; }, parse: parseInt },
};
parseUrlState(SHARE_KEYS);
readSliders();
reseedTracers();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  // Run for 0 to 7 seconds based on fraction.
  const T_target = 0.8 + 6.5 * (CAPTURE_FRAC || 0);
  let tt = 0;
  while (tt < T_target) {
    stepTracers(0.05);
    tt += 0.05;
    st.t = tt;
  }
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) {
      stepTracers(dt);
      st.t += dt;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
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
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
// Linear Rayleigh-Taylor theory assumes an incompressible flow, so
// the linear-mode velocity field must be divergence-free; the
// sampled numerical divergence is the invariant.
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const h = 1e-3, k = st.k, amp = st.amplitude;
      let maxDiv = 0;
      for (let i = 0; i < 24; i += 1) {
        const x = ((i * 0.6180339) % 1) * BOX_X * Math.PI;
        const y = (((i * 0.3819660) % 1) * 2 - 1) * BOX_Y_HALF * 0.9;
        const div = (linearVelocity(x + h, y, k, amp).u - linearVelocity(x - h, y, k, amp).u) / (2 * h)
          + (linearVelocity(x, y + h, k, amp).v - linearVelocity(x, y - h, k, amp).v) / (2 * h);
        if (Math.abs(div) > maxDiv) maxDiv = Math.abs(div);
      }
      return [{
        key: 'incompressible',
        label: 'linear-mode velocity is incompressible',
        value: maxDiv.toExponential(2),
        status: maxDiv < 1e-3 ? 'pass' : (maxDiv < 1e-1 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}
