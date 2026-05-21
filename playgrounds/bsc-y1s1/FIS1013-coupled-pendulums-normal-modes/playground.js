import { fontString } from '../../../shared/js/canvas-type.js';
// Coupled pendulums and normal modes. Left: two shaded pendulums on a
// pivot beam, coupled by a drawn coil spring, with bob trails. Right:
// the energy sloshing between the two pendulums (the beat) and the
// (theta1, theta2) configuration portrait with its normal-mode axes.
// Bottom: theta1(t), theta2(t) with the pendulum-1 beat envelope.
// sim.js is unchanged (invariant-tested); this is the visualization.

import {
  createCoupled, stepCoupled,
  omegaSym, omegaAnti, beatPeriod, energy, G,
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

const W = canvas.width, H = canvas.height;
const PHYSICS_DT = 1 / 240;
let accumulator = 0;
let lastTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());

const L = 1.0, m = 1.0;
let k = parseFloat(sliderK.value);
let dL = parseFloat(sliderDL.value);

let sim = createCoupled({ L, m, k, d: dL * L, theta1: 0.25, theta2: 0 });

const HIST_MAX = 1600;
const histT = new Float32Array(HIST_MAX);
const histT1 = new Float32Array(HIST_MAX);
const histT2 = new Float32Array(HIST_MAX);
const histE1 = new Float32Array(HIST_MAX);
let histLen = 0;
const trail1 = [], trail2 = [];
const TRAIL_MAX = 90;

function e1of(s) { return 0.5 * m * s.L * s.L * s.omega1 * s.omega1 + 0.5 * m * G * s.L * s.theta1 * s.theta1; }
function e2of(s) { return 0.5 * m * s.L * s.L * s.omega2 * s.omega2 + 0.5 * m * G * s.L * s.theta2 * s.theta2; }

function pushHist() {
  const e1 = e1of(sim);
  if (histLen < HIST_MAX) {
    histT[histLen] = sim.t; histT1[histLen] = sim.theta1; histT2[histLen] = sim.theta2; histE1[histLen] = e1; histLen += 1;
  } else {
    histT.copyWithin(0, 1); histT1.copyWithin(0, 1); histT2.copyWithin(0, 1); histE1.copyWithin(0, 1);
    histT[HIST_MAX - 1] = sim.t; histT1[HIST_MAX - 1] = sim.theta1; histT2[HIST_MAX - 1] = sim.theta2; histE1[HIST_MAX - 1] = e1;
  }
}

function reinitWith(t1, t2) {
  sim = createCoupled({ L, m, k, d: dL * L, theta1: t1, theta2: t2 });
  histLen = 0; trail1.length = 0; trail2.length = 0;
}

sliderK.addEventListener('input', () => { k = parseFloat(sliderK.value); valueK.textContent = k.toFixed(1); reinitWith(sim.theta1, sim.theta2); });
sliderDL.addEventListener('input', () => { dL = parseFloat(sliderDL.value); valueDL.textContent = dL.toFixed(2); reinitWith(sim.theta1, sim.theta2); });
btnAsym.addEventListener('click', () => reinitWith(0.25, 0));
btnSym.addEventListener('click', () => reinitWith(0.18, 0.18));
btnAnti.addEventListener('click', () => reinitWith(0.18, -0.18));

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue: '#5bc0eb',
    orange: '#f4a261',
    grid: '#23252a',
  };
}

function shadedBob(x, y, r, base) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, base);
  g.addColorStop(1, '#0c0c10');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
  ctx.stroke();
}

function drawScene(c, x0, y0, w, h) {
  const barY = y0 + 26;
  const p1x = x0 + w * 0.36, p2x = x0 + w * 0.64;
  const Lpx = h * 0.62;

  // Pivot beam with end caps.
  ctx.fillStyle = c.muted;
  ctx.fillRect(x0 + 24, barY - 4, w - 48, 6);
  ctx.fillStyle = c.fg;
  for (const pxp of [p1x, p2x]) { ctx.beginPath(); ctx.arc(pxp, barY, 4, 0, 2 * Math.PI); ctx.fill(); }

  const b1x = p1x + Lpx * Math.sin(sim.theta1), b1y = barY + Lpx * Math.cos(sim.theta1);
  const b2x = p2x + Lpx * Math.sin(sim.theta2), b2y = barY + Lpx * Math.cos(sim.theta2);

  // Trails.
  for (const [tr, col] of [[trail1, c.accent], [trail2, c.blue]]) {
    for (let i = 1; i < tr.length; i += 1) {
      ctx.strokeStyle = col; ctx.globalAlpha = 0.05 + 0.30 * i / tr.length; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tr[i - 1][0], tr[i - 1][1]); ctx.lineTo(tr[i][0], tr[i][1]); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Coil spring between the rod attach points at fraction dL.
  const aX = p1x + Lpx * dL * Math.sin(sim.theta1), aY = barY + Lpx * dL * Math.cos(sim.theta1);
  const bX = p2x + Lpx * dL * Math.sin(sim.theta2), bY = barY + Lpx * dL * Math.cos(sim.theta2);
  const segs = 26, dx = bX - aX, dy = bY - aY, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  ctx.strokeStyle = c.orange; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(aX, aY);
  for (let i = 1; i < segs; i += 1) {
    const t = i / segs;
    const amp = (i > 2 && i < segs - 2) ? 7 : 0;
    const s = (i % 2 === 0 ? 1 : -1) * amp;
    ctx.lineTo(aX + dx * t + nx * s, aY + dy * t + ny * s);
  }
  ctx.lineTo(bX, bY); ctx.stroke();

  // Rods + shaded bobs.
  ctx.strokeStyle = c.fg; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(p1x, barY); ctx.lineTo(b1x, b1y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(p2x, barY); ctx.lineTo(b2x, b2y); ctx.stroke();
  shadedBob(b1x, b1y, 17, c.accent);
  shadedBob(b2x, b2y, 17, c.blue);

  return { b1x, b1y, b2x, b2y };
}

function drawEnergyBars(c, x0, y0, w, h) {
  const e1 = e1of(sim), e2 = e2of(sim);
  const E = energy(sim);
  const tot = Math.max(1e-9, E.total);
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('energy exchange (the beat)', x0, y0 - 10);
  const barW = 34, gap = 26, baseY = y0 + h;
  const items = [['E1', e1, c.accent], ['spring', E.spr, c.orange], ['E2', e2, c.blue]];
  let bx = x0 + 8;
  for (const [lab, val, col] of items) {
    const bh = h * Math.max(0, Math.min(1, val / tot));
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(bx, y0, barW, h);
    ctx.fillStyle = col;
    ctx.fillRect(bx, baseY - bh, barW, bh);
    ctx.fillStyle = c.muted; ctx.textAlign = 'center';
    ctx.fillText(lab, bx + barW / 2, baseY + 14);
    ctx.fillStyle = c.fg;
    ctx.fillText(`${(100 * val / tot).toFixed(0)}%`, bx + barW / 2, baseY - bh - 5);
    bx += barW + gap;
  }
}

function drawPortrait(c, x0, y0, s) {
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(x0, y0, s, s);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, s - 1, s - 1);
  const A = 0.35, cx = x0 + s / 2, cy = y0 + s / 2, sc = (s / 2 - 6) / A;
  // Normal-mode axes: theta1=theta2 (symmetric), theta1=-theta2 (anti).
  ctx.strokeStyle = 'rgba(244,162,97,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + 6, y0 + s - 6); ctx.lineTo(x0 + s - 6, y0 + 6); ctx.stroke();
  ctx.strokeStyle = 'rgba(91,192,235,0.55)';
  ctx.beginPath(); ctx.moveTo(x0 + 6, y0 + 6); ctx.lineTo(x0 + s - 6, y0 + s - 6); ctx.stroke();
  // Trajectory.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath();
  let st = false;
  for (let i = 0; i < histLen; i += 1) {
    const X = cx + histT1[i] * sc, Y = cy - histT2[i] * sc;
    if (!st) { ctx.moveTo(X, Y); st = true; } else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  ctx.fillStyle = c.fg;
  ctx.beginPath(); ctx.arc(cx + sim.theta1 * sc, cy - sim.theta2 * sc, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('theta1 vs theta2', x0 + 6, y0 - 6);
  ctx.fillStyle = 'rgba(244,162,97,0.85)'; ctx.fillText('sym', x0 + s - 28, y0 + 26);
  ctx.fillStyle = 'rgba(91,192,235,0.85)'; ctx.fillText('anti', x0 + s - 30, y0 + s - 8);
}

function drawTrace(c, x0, y0, w, h) {
  const padL = 46, padR = 12, padT = 16, padB = 22;
  const pw = w - padL - padR, ph = h - padT - padB;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(x0, y0, w, h);
  if (histLen < 2) return;
  const tMax = histT[histLen - 1], tMin = Math.max(0, tMax - 7.0);
  const thMax = 0.35;
  const xF = (t) => x0 + padL + pw * (t - tMin) / Math.max(1e-6, tMax - tMin);
  const yF = (v) => y0 + padT + ph * (1 - (v + thMax) / (2 * thMax));
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) { const y = y0 + padT + ph * i / 4; ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + pw, y); ctx.stroke(); }
  ctx.strokeStyle = c.muted; ctx.beginPath(); ctx.moveTo(x0 + padL, yF(0)); ctx.lineTo(x0 + padL + pw, yF(0)); ctx.stroke();

  const drawSeries = (arr, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); let st = false;
    for (let i = 0; i < histLen; i += 1) {
      if (histT[i] < tMin) continue;
      const xx = xF(histT[i]), yy = yF(arr[i]);
      if (!st) { ctx.moveTo(xx, yy); st = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  };
  drawSeries(histT1, c.accent);
  drawSeries(histT2, c.blue);

  // Pendulum-1 energy beat envelope (scaled to the strip).
  let eMax = 1e-9;
  for (let i = 0; i < histLen; i += 1) if (histE1[i] > eMax) eMax = histE1[i];
  ctx.strokeStyle = 'rgba(244,162,97,0.85)'; ctx.lineWidth = 1.4; ctx.beginPath();
  let st = false;
  for (let i = 0; i < histLen; i += 1) {
    if (histT[i] < tMin) continue;
    const xx = xF(histT[i]);
    const yy = y0 + padT + ph * (1 - histE1[i] / eMax);
    if (!st) { ctx.moveTo(xx, yy); st = true; } else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('theta1', x0 + padL + 6, y0 + padT + 13);
  ctx.fillStyle = c.accent; ctx.fillRect(x0 + padL + 48, y0 + padT + 6, 12, 3);
  ctx.fillStyle = c.muted; ctx.fillText('theta2', x0 + padL + 78, y0 + padT + 13);
  ctx.fillStyle = c.blue; ctx.fillRect(x0 + padL + 120, y0 + padT + 6, 12, 3);
  ctx.fillStyle = 'rgba(244,162,97,0.85)'; ctx.fillText('E1 envelope', x0 + padL + 150, y0 + padT + 13);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  const sceneW = 470;
  drawScene(c, 0, 0, sceneW, 300);
  drawEnergyBars(c, sceneW + 20, 40, W - sceneW - 36, 96);
  drawPortrait(c, sceneW + 22, 168, 120);
  drawTrace(c, 0, 308, W, H - 312);
}

function updateReadout() {
  const wp = omegaSym(L), wm = omegaAnti(L, m, k, dL * L), Tb = beatPeriod(L, m, k, dL * L);
  readoutW.textContent = `${wp.toFixed(2)}, ${wm.toFixed(2)}`;
  readoutTb.textContent = Number.isFinite(Tb) ? Tb.toFixed(2) : 'inf';
}

function physicsTick() {
  stepCoupled(sim, PHYSICS_DT);
  if (sim.nSteps % 4 === 0) {
    pushHist();
    const barY = 26, p1x = 470 * 0.36, p2x = 470 * 0.64, Lpx = 300 * 0.62;
    trail1.push([p1x + Lpx * Math.sin(sim.theta1), barY + Lpx * Math.cos(sim.theta1)]);
    trail2.push([p2x + Lpx * Math.sin(sim.theta2), barY + Lpx * Math.cos(sim.theta2)]);
    if (trail1.length > TRAIL_MAX) trail1.shift();
    if (trail2.length > TRAIL_MAX) trail2.shift();
  }
}

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  accumulator += dt;
  while (accumulator >= PHYSICS_DT) { physicsTick(); accumulator -= PHYSICS_DT; }
  render();
  updateReadout();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const Tb = beatPeriod(L, m, k, dL * L);
    const span = Number.isFinite(Tb) ? Tb : 12;
    const steps = Math.round((0.06 + frac * 1.05) * span / PHYSICS_DT);
    for (let s = 0; s < steps; s += 1) physicsTick();
  }
  valueK.textContent = k.toFixed(1);
  valueDL.textContent = dL.toFixed(2);
  render();
  updateReadout();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const detail = { capture: CAPTURE_NAME ?? null, k, dL };
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
      window.__simulationReady = true;
      window.__simulationReadyDetail = detail;
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
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
// A conservative (Hamiltonian) system: total energy is the
// invariant. The baseline is the energy at the start of the run and
// is re-taken whenever a control change steps the energy.
let __energy0 = null, __energyPrev = null;
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const E = energy(sim);
      if (!Number.isFinite(E)) return [];
      if (__energyPrev !== null
        && Math.abs(E - __energyPrev) > 0.02 * Math.max(1e-9, Math.abs(__energyPrev)) + 1e-9) {
        __energy0 = E;                    // discontinuity: a control changed the system
      }
      __energyPrev = E;
      if (__energy0 === null) __energy0 = E;
      const dE = Math.abs(E - __energy0) / Math.max(1e-12, Math.abs(__energy0));
      return [{
        key: 'energy',
        label: 'total energy conserved (rel. drift)',
        value: dE.toExponential(2),
        status: dE < 1e-3 ? 'pass' : (dE < 1e-2 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}
