// Free-fall drag playground.
// Left half: three balls falling vertically. Right half: |v(t)| curves.
// Three simultaneous fall sims, identical y0, different drag.

import {
  createFall, stepFall,
  terminalVelocityStokes, terminalVelocityQuadratic,
  G,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutVts  = document.getElementById('readout-vts');
const readoutVtq  = document.getElementById('readout-vtq');

const sliderY0 = document.getElementById('slider-y0');
const sliderB  = document.getElementById('slider-b');
const sliderC  = document.getElementById('slider-c');
const valueY0  = document.getElementById('value-y0');
const valueB   = document.getElementById('value-b');
const valueC   = document.getElementById('value-c');
const btnReset = document.getElementById('btn-reset');
const btnPlay  = document.getElementById('btn-playpause');

const PHYSICS_DT = 1 / 240;
let accumulator = 0;
let lastTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
let running = !prefersReducedMotion();

let y0 = parseFloat(sliderY0.value);
let b  = parseFloat(sliderB.value);
let c  = parseFloat(sliderC.value);

let sims = [
  createFall({ mode: 'none',      y0, b, c }),
  createFall({ mode: 'stokes',    y0, b, c }),
  createFall({ mode: 'quadratic', y0, b, c }),
];

const HIST_MAX = 1500;
const histT = [new Float32Array(HIST_MAX), new Float32Array(HIST_MAX), new Float32Array(HIST_MAX)];
const histV = [new Float32Array(HIST_MAX), new Float32Array(HIST_MAX), new Float32Array(HIST_MAX)];
let histLen = [0, 0, 0];

function reset() {
  sims = [
    createFall({ mode: 'none',      y0, b, c }),
    createFall({ mode: 'stokes',    y0, b, c }),
    createFall({ mode: 'quadratic', y0, b, c }),
  ];
  histLen = [0, 0, 0];
}

sliderY0.addEventListener('input', () => { y0 = parseFloat(sliderY0.value); valueY0.textContent = String(y0.toFixed(0)); reset(); });
sliderB.addEventListener('input',  () => { b  = parseFloat(sliderB.value);  valueB.textContent  = b.toFixed(2);   reset(); });
sliderC.addEventListener('input',  () => { c  = parseFloat(sliderC.value);  valueC.textContent  = c.toFixed(3);   reset(); });
btnReset.addEventListener('click', reset);
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

function drawScene(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);

  const ground = y_off + h - 40;
  const top    = y_off + 20;
  const yScale = (ground - top) / y0;
  function yPix(y) { return ground - y * yScale; }

  // Ground.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + 6, ground); ctx.lineTo(x0 + w - 6, ground); ctx.stroke();

  // Three columns for the three balls.
  const cols = [c.accent, c.blue, c.orange];
  const labels = ['vacuum', 'Stokes', 'quadratic'];
  for (let i = 0; i < 3; i += 1) {
    const cx = x0 + (i + 1) * w / 4;
    const y = Math.max(0, sims[i].y);
    const py = yPix(y);
    ctx.fillStyle = cols[i];
    ctx.beginPath(); ctx.arc(cx, py, 8, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = c.fg;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(labels[i], cx - 22, ground + 14);
  }
  ctx.fillStyle = c.muted;
  ctx.fillText(`y_0 = ${y0.toFixed(0)} m`, x0 + 12, top - 4);
}

function drawPlot(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);

  const padL = 48, padR = 12, padT = 18, padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Determine plot range. Use vacuum time at landing or whichever sim's history is longest.
  let tMax = 0, vMax = 0;
  for (let i = 0; i < 3; i += 1) {
    if (histLen[i] === 0) continue;
    tMax = Math.max(tMax, histT[i][histLen[i] - 1]);
    for (let k = 0; k < histLen[i]; k += 1) vMax = Math.max(vMax, Math.abs(histV[i][k]));
  }
  tMax = Math.max(1, tMax);
  vMax = Math.max(2, vMax * 1.05);

  function xFor(t) { return x0 + padL + plotW * (t / tMax); }
  function yFor(v) { return y_off + padT + plotH * (1 - v / vMax); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const x = x0 + padL + plotW * i / 4;
    ctx.beginPath(); ctx.moveTo(x, y_off + padT); ctx.lineTo(x, y_off + padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`${(i * tMax / 4).toFixed(1)}`, x - 8, y_off + padT + plotH + 12);
  }
  for (let i = 0; i <= 4; i += 1) {
    const y = y_off + padT + plotH * i / 4;
    ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`${((4 - i) * vMax / 4).toFixed(1)}`, x0 + padL - 28, y + 3);
  }

  ctx.fillStyle = c.muted;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('t (s)', x0 + padL + plotW - 24, y_off + padT + plotH + 24);
  ctx.save(); ctx.translate(x0 + 12, y_off + padT + plotH / 2 + 30); ctx.rotate(-Math.PI / 2);
  ctx.fillText('|v| (m/s)', 0, 0); ctx.restore();

  // Terminal velocity reference lines.
  const vtS = terminalVelocityStokes(b);
  const vtQ = terminalVelocityQuadratic(c);
  if (vtS < vMax) {
    ctx.strokeStyle = c.blue;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 + padL, yFor(vtS)); ctx.lineTo(x0 + padL + plotW, yFor(vtS)); ctx.stroke();
    ctx.setLineDash([]);
  }
  if (vtQ < vMax) {
    ctx.strokeStyle = c.orange;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 + padL, yFor(vtQ)); ctx.lineTo(x0 + padL + plotW, yFor(vtQ)); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Curves.
  const cols = [c.accent, c.blue, c.orange];
  for (let i = 0; i < 3; i += 1) {
    if (histLen[i] === 0) continue;
    ctx.strokeStyle = cols[i];
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < histLen[i]; k += 1) {
      const xx = xFor(histT[i][k]);
      const yy = yFor(Math.abs(histV[i][k]));
      if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  drawScene(c, 0, 0, W * 0.45, H);
  drawPlot(c, W * 0.45, 0, W * 0.55, H);
}

function updateReadout() {
  readoutVts.textContent = terminalVelocityStokes(b).toFixed(2);
  readoutVtq.textContent = terminalVelocityQuadratic(c).toFixed(2);
}

function pushHist(i) {
  const L = histLen[i];
  if (L < HIST_MAX) {
    histT[i][L] = sims[i].t;
    histV[i][L] = sims[i].v;
    histLen[i] = L + 1;
  } else {
    histT[i].copyWithin(0, 1);
    histV[i].copyWithin(0, 1);
    histT[i][HIST_MAX - 1] = sims[i].t;
    histV[i][HIST_MAX - 1] = sims[i].v;
  }
}

function physicsTick() {
  for (let i = 0; i < 3; i += 1) {
    if (sims[i].y > 0) {
      stepFall(sims[i], PHYSICS_DT);
      if (sims[i].nSteps % 6 === 0) pushHist(i);
    }
  }
}

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  if (running) {
    accumulator += dt;
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
    const totalSim = 6.0;
    const steps = Math.round(frac * totalSim / PHYSICS_DT);
    for (let s = 0; s < steps; s += 1) physicsTick();
  }
  valueY0.textContent = String(y0.toFixed(0));
  valueB.textContent  = b.toFixed(2);
  valueC.textContent  = c.toFixed(3);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, y0, b, c };
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
