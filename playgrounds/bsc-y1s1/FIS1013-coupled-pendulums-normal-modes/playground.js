// Coupled pendulums playground. Top half: two physical pendulums
// hanging from a horizontal bar. Bottom half: theta_1(t), theta_2(t).

import {
  createCoupled, stepCoupled,
  omegaSym, omegaAnti, beatPeriod, energy,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutW    = document.getElementById('readout-w');
const readoutTb   = document.getElementById('readout-tb');

const sliderK  = document.getElementById('slider-k');
const sliderDL = document.getElementById('slider-dl');
const valueK   = document.getElementById('value-k');
const valueDL  = document.getElementById('value-dl');
const btnAsym  = document.getElementById('btn-asym');
const btnSym   = document.getElementById('btn-sym');
const btnAnti  = document.getElementById('btn-anti');

const PHYSICS_DT = 1 / 240;
let accumulator = 0;
let lastTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());

const L = 1.0, m = 1.0;
let k = parseFloat(sliderK.value);
let dL = parseFloat(sliderDL.value);

let sim = createCoupled({ L, m, k, d: dL * L, theta1: 0.25, theta2: 0 });

const HIST_MAX = 1200;
const histT = new Float32Array(HIST_MAX);
const histT1 = new Float32Array(HIST_MAX);
const histT2 = new Float32Array(HIST_MAX);
let histLen = 0;

function pushHist() {
  if (histLen < HIST_MAX) {
    histT[histLen] = sim.t; histT1[histLen] = sim.theta1; histT2[histLen] = sim.theta2; histLen += 1;
  } else {
    histT.copyWithin(0, 1); histT1.copyWithin(0, 1); histT2.copyWithin(0, 1);
    histT[HIST_MAX - 1] = sim.t;
    histT1[HIST_MAX - 1] = sim.theta1;
    histT2[HIST_MAX - 1] = sim.theta2;
  }
}

function reinitWith(t1, t2) {
  sim = createCoupled({ L, m, k, d: dL * L, theta1: t1, theta2: t2 });
  histLen = 0;
}

sliderK.addEventListener('input', () => { k = parseFloat(sliderK.value); valueK.textContent = k.toFixed(1); reinitWith(sim.theta1, sim.theta2); });
sliderDL.addEventListener('input', () => { dL = parseFloat(sliderDL.value); valueDL.textContent = dL.toFixed(2); reinitWith(sim.theta1, sim.theta2); });
btnAsym.addEventListener('click', () => reinitWith(0.25, 0));
btnSym.addEventListener('click', () => reinitWith(0.18, 0.18));
btnAnti.addEventListener('click', () => reinitWith(0.18, -0.18));

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    orange: '#f4a261',
    grid:   '#23252a',
  };
}

function drawScene(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);

  const bar_y = y_off + 20;
  const pivot1_x = x0 + w * 0.36;
  const pivot2_x = x0 + w * 0.64;
  const Lpx = h * 0.6;

  // Horizontal bar.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0 + 30, bar_y); ctx.lineTo(x0 + w - 30, bar_y); ctx.stroke();

  // Pendulum 1.
  const bob1_x = pivot1_x + Lpx * Math.sin(sim.theta1);
  const bob1_y = bar_y + Lpx * Math.cos(sim.theta1);
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pivot1_x, bar_y); ctx.lineTo(bob1_x, bob1_y); ctx.stroke();
  ctx.fillStyle = c.accent;
  ctx.beginPath(); ctx.arc(bob1_x, bob1_y, 14, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.stroke();

  // Pendulum 2.
  const bob2_x = pivot2_x + Lpx * Math.sin(sim.theta2);
  const bob2_y = bar_y + Lpx * Math.cos(sim.theta2);
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pivot2_x, bar_y); ctx.lineTo(bob2_x, bob2_y); ctx.stroke();
  ctx.fillStyle = c.blue;
  ctx.beginPath(); ctx.arc(bob2_x, bob2_y, 14, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.stroke();

  // Coupling spring at distance d on each rod.
  const d_frac = dL;
  const a1 = pivot1_x + Lpx * d_frac * Math.sin(sim.theta1);
  const ay1 = bar_y + Lpx * d_frac * Math.cos(sim.theta1);
  const a2 = pivot2_x + Lpx * d_frac * Math.sin(sim.theta2);
  const ay2 = bar_y + Lpx * d_frac * Math.cos(sim.theta2);
  ctx.strokeStyle = c.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const N = 10;
  for (let i = 0; i <= N; i += 1) {
    const t = i / N;
    const sx = a1 + (a2 - a1) * t;
    const sy = ay1 + (ay2 - ay1) * t + (i % 2 === 0 ? -6 : 6);
    if (i === 0) ctx.moveTo(a1, ay1);
    else if (i === N) ctx.lineTo(a2, ay2);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
}

function drawTrace(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);

  const padL = 48, padR = 12, padT = 14, padB = 24;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  if (histLen < 2) return;

  const tMax = histT[histLen - 1];
  const tMin = Math.max(0, tMax - 6.0);
  const thetaMax = 0.35;

  function xFor(t) { return x0 + padL + plotW * (t - tMin) / (tMax - tMin); }
  function yFor(th) { return y_off + padT + plotH * (1 - (th + thetaMax) / (2 * thetaMax)); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = y_off + padT + plotH * i / 4;
    ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + plotW, y); ctx.stroke();
  }

  // Zero line.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0 + padL, yFor(0)); ctx.lineTo(x0 + padL + plotW, yFor(0)); ctx.stroke();

  // theta_1.
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < histLen; i += 1) {
    if (histT[i] < tMin) continue;
    const xx = xFor(histT[i]);
    const yy = yFor(histT1[i]);
    if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // theta_2.
  ctx.strokeStyle = c.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  started = false;
  for (let i = 0; i < histLen; i += 1) {
    if (histT[i] < tMin) continue;
    const xx = xFor(histT[i]);
    const yy = yFor(histT2[i]);
    if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Legend.
  ctx.fillStyle = c.muted;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('theta_1', x0 + padL + 8, y_off + padT + 14);
  ctx.fillStyle = c.accent;
  ctx.fillRect(x0 + padL + 50, y_off + padT + 8, 12, 3);
  ctx.fillStyle = c.muted;
  ctx.fillText('theta_2', x0 + padL + 80, y_off + padT + 14);
  ctx.fillStyle = c.blue;
  ctx.fillRect(x0 + padL + 122, y_off + padT + 8, 12, 3);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  drawScene(c, 0, 0, W, H * 0.6);
  drawTrace(c, 0, H * 0.6, W, H * 0.4);
}

function updateReadout() {
  const wp = omegaSym(L);
  const wm = omegaAnti(L, m, k, dL * L);
  const Tb = beatPeriod(L, m, k, dL * L);
  readoutW.textContent = `${wp.toFixed(2)}, ${wm.toFixed(2)}`;
  readoutTb.textContent = Number.isFinite(Tb) ? Tb.toFixed(2) : 'inf';
}

function physicsTick() {
  stepCoupled(sim, PHYSICS_DT);
  if (sim.nSteps % 5 === 0) pushHist();
}

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  accumulator += dt;
  while (accumulator >= PHYSICS_DT) {
    physicsTick();
    accumulator -= PHYSICS_DT;
  }
  render();
  updateReadout();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const Tb = beatPeriod(L, m, k, dL * L);
    const steps = Math.round((frac * Tb) / PHYSICS_DT);
    for (let s = 0; s < steps; s += 1) physicsTick();
  }
  valueK.textContent = k.toFixed(1);
  valueDL.textContent = dL.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, k, dL };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
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
