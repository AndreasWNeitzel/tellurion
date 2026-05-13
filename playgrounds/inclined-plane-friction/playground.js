// Inclined-plane friction playground.
// Left half of the canvas shows the ramp and the block; right half shows
// v(t) numerical vs analytic and the static-equilibrium readout. The
// numerical curve overlays the analytic one to machine precision once
// the block is sliding (velocity-Verlet is exact for constant accel).

import {
  createBlock, stepBlock,
  criticalAngle, kineticAcceleration,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant');
const readoutTc    = document.getElementById('readout-tc');

const sliderTheta  = document.getElementById('slider-theta');
const sliderMus    = document.getElementById('slider-mus');
const sliderMuk    = document.getElementById('slider-muk');
const sliderSpeed  = document.getElementById('slider-speed');
const valueTheta   = document.getElementById('value-theta');
const valueMus     = document.getElementById('value-mus');
const valueMuk     = document.getElementById('value-muk');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlay      = document.getElementById('btn-playpause');

const PHYSICS_DT = 1 / 480;
const TOTAL_T = 4.0;
let accumulator  = 0;
let lastTime     = (typeof performance !== 'undefined' ? performance.now() : Date.now());
let running      = true;
let speedMul     = parseInt(sliderSpeed.value, 10);

const SLOPE_LENGTH = 5.0;
let sim = createBlock({
  theta: degToRad(parseFloat(sliderTheta.value)),
  muS:   parseFloat(sliderMus.value),
  muK:   parseFloat(sliderMuk.value),
  slopeLength: SLOPE_LENGTH,
});

const HIST_MAX = 1200;
const histT = new Float32Array(HIST_MAX);
const histV = new Float32Array(HIST_MAX);
let histLen = 0;
function pushHistory(t, v) {
  if (histLen < HIST_MAX) {
    histT[histLen] = t; histV[histLen] = v; histLen += 1;
  } else {
    histT.copyWithin(0, 1); histV.copyWithin(0, 1);
    histT[HIST_MAX - 1] = t; histV[HIST_MAX - 1] = v;
  }
}

function degToRad(d) { return d * Math.PI / 180; }
function radToDeg(r) { return r * 180 / Math.PI; }

function reinitFromControls() {
  const theta = degToRad(parseFloat(sliderTheta.value));
  const muS = parseFloat(sliderMus.value);
  const muK = parseFloat(sliderMuk.value);
  sim = createBlock({ theta, muS, muK, slopeLength: SLOPE_LENGTH });
  histLen = 0;
}

[sliderTheta, sliderMus, sliderMuk].forEach(s => s.addEventListener('input', () => {
  valueTheta.textContent = parseFloat(sliderTheta.value).toFixed(1);
  valueMus.textContent   = parseFloat(sliderMus.value).toFixed(2);
  valueMuk.textContent   = parseFloat(sliderMuk.value).toFixed(2);
  reinitFromControls();
}));
sliderSpeed.addEventListener('input', () => {
  speedMul = parseInt(sliderSpeed.value, 10);
  valueSpeed.textContent = String(speedMul);
});
btnReset.addEventListener('click', () => reinitFromControls());
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

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

function drawRamp(c, x0, y0, w, h) {
  const theta = sim.theta;
  const slopeLen = Math.min(w, h) * 0.78;
  const topX = x0 + 14;
  const topY = y0 + 18;
  const botX = topX + slopeLen * Math.cos(theta);
  const botY = topY + slopeLen * Math.sin(theta);

  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + 6, botY); ctx.lineTo(x0 + w - 6, botY); ctx.stroke();

  ctx.strokeStyle = c.muted;
  ctx.beginPath();
  for (let i = 0; i < 16; i += 1) {
    const tx = topX + (botX - topX) * (i / 15);
    const ty = topY + (botY - topY) * (i / 15);
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - 8, ty + 12);
  }
  ctx.stroke();

  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(botX, botY); ctx.stroke();

  const frac = Math.min(1, sim.x / SLOPE_LENGTH);
  const bx = topX + (botX - topX) * frac;
  const by = topY + (botY - topY) * frac;
  const blockSize = 26;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(theta);
  ctx.fillStyle = sim.moving ? c.accent : c.blue;
  ctx.fillRect(-blockSize / 2, -blockSize, blockSize, blockSize);
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-blockSize / 2, -blockSize, blockSize, blockSize);
  ctx.restore();

  ctx.fillStyle = c.muted;
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText(`theta = ${radToDeg(theta).toFixed(1)} deg`, x0 + 12, y0 + h - 32);
  const tc = criticalAngle(sim.muS);
  ctx.fillStyle = (sim.theta > tc) ? c.accent : c.blue;
  ctx.fillText(`theta_c = ${radToDeg(tc).toFixed(1)} deg (${sim.theta > tc ? 'sliding' : 'static'})`, x0 + 12, y0 + h - 14);
}

function drawVPlot(c, x0, y0, w, h) {
  const padL = 36, padB = 24, padT = 10, padR = 8;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);

  const tMax = Math.max(0.5, sim.t);
  const aMax = Math.max(1e-3, kineticAcceleration(sim.theta, sim.muK));
  const vMax = Math.max(0.5, aMax * tMax * 1.05);

  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = y0 + padT + (plotH * i / 4);
    ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + plotW, y); ctx.stroke();
  }
  for (let i = 0; i <= 4; i += 1) {
    const x = x0 + padL + (plotW * i / 4);
    ctx.beginPath(); ctx.moveTo(x, y0 + padT); ctx.lineTo(x, y0 + padT + plotH); ctx.stroke();
  }

  ctx.fillStyle = c.muted;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('t (s)', x0 + padL + plotW - 28, y0 + h - 8);
  ctx.save();
  ctx.translate(x0 + 12, y0 + padT + 24);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('v (m/s)', 0, 0);
  ctx.restore();
  ctx.fillText(`0   ${tMax.toFixed(1)}`, x0 + padL, y0 + h - 8);
  ctx.fillText(vMax.toFixed(1), x0 + padL - 28, y0 + padT + 8);
  ctx.fillText('0', x0 + padL - 14, y0 + padT + plotH);

  ctx.strokeStyle = c.orange;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (aMax > 0) {
    const t1 = tMax;
    const x1 = x0 + padL;
    const y1 = y0 + padT + plotH - (0 / vMax) * plotH;
    const x2 = x0 + padL + plotW;
    const y2 = y0 + padT + plotH - ((aMax * t1) / vMax) * plotH;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < histLen; i += 1) {
    const t = histT[i];
    const v = histV[i];
    const xx = x0 + padL + (t / tMax) * plotW;
    const yy = y0 + padT + plotH - (v / vMax) * plotH;
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  ctx.fillStyle = c.orange; ctx.fillRect(x0 + padL + 8, y0 + padT + 8, 12, 3);
  ctx.fillStyle = c.muted;
  ctx.fillText('analytic', x0 + padL + 24, y0 + padT + 12);
  ctx.fillStyle = c.accent; ctx.fillRect(x0 + padL + 8, y0 + padT + 24, 12, 3);
  ctx.fillStyle = c.muted;
  ctx.fillText('numerical', x0 + padL + 24, y0 + padT + 28);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const W = canvas.width, H = canvas.height;
  drawRamp(c, 0, 0, W * 0.5, H);
  drawVPlot(c, W * 0.5, 0, W * 0.5, H);

  ctx.fillStyle = c.muted;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`t = ${sim.t.toFixed(2)} s`, 12, H - 14);
}

function updateReadout() {
  const aMax = kineticAcceleration(sim.theta, sim.muK);
  const va = aMax > 0 ? aMax * sim.t : 0;
  let rel = 0;
  if (sim.moving && va > 0.05) rel = Math.abs(sim.v - va) / va;
  readoutInv.textContent = rel.toExponential(2);
  readoutTc.textContent = criticalAngle(sim.muS).toFixed(4);
}

function physicsTick() {
  for (let k = 0; k < speedMul; k += 1) {
    if (sim.t >= TOTAL_T) {
      const theta = sim.theta, muS = sim.muS, muK = sim.muK;
      sim = createBlock({ theta, muS, muK, slopeLength: SLOPE_LENGTH });
      histLen = 0;
      break;
    }
    stepBlock(sim, PHYSICS_DT);
    if (sim.nSteps % 4 === 0) pushHistory(sim.t, sim.v);
  }
}

function tick(now) {
  const frameDt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  if (running) {
    accumulator += frameDt;
    while (accumulator >= PHYSICS_DT) {
      physicsTick();
      accumulator -= PHYSICS_DT;
    }
  }
  render();
  updateReadout();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const stepsNeeded = Math.round(frac * TOTAL_T / PHYSICS_DT);
    for (let i = 0; i < stepsNeeded; i += 1) {
      stepBlock(sim, PHYSICS_DT);
      if (sim.nSteps % 4 === 0) pushHistory(sim.t, sim.v);
    }
    render();
    updateReadout();
  } else {
    render();
    updateReadout();
  }

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, simClock: sim.t };
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
