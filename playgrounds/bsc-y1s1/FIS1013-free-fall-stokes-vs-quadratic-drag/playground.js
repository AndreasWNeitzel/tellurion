// playground.js
// Free fall under three drag laws: vacuum (no drag, never stops accelerating),
// Stokes (linear, F = -b v), and quadratic (F = -c|v|v). The drag balls reach
// terminal velocity; the vacuum ball does not.
//
// Vertical 4:5 composition:
//   1. SCENE: three balls dropped together fall in their own lanes and visibly
//      separate, the vacuum ball pulling ahead while the drag balls settle into
//      a steady fall.
//   2. SPEED: |v(t)| for all three. The drag curves flatten onto their terminal
//      velocity asymptotes (drawn and labelled); the vacuum line climbs forever.

import { createFall, stepFall, terminalVelocityStokes, terminalVelocityQuadratic, G } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutVts = document.getElementById('readout-vts') || { textContent: '' };
const readoutVtq = document.getElementById('readout-vtq') || { textContent: '' };

const sliderY0 = document.getElementById('slider-y0');
const sliderB = document.getElementById('slider-b');
const sliderC = document.getElementById('slider-c');
const valueY0 = document.getElementById('value-y0');
const valueB = document.getElementById('value-b');
const valueC = document.getElementById('value-c');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

const PHYSICS_DT = 1 / 240;
const MODES = ['none', 'stokes', 'quadratic'];
const NAME = { none: 'vacuum', stokes: 'Stokes', quadratic: 'quadratic' };
let accumulator = 0;
let lastTime = (typeof performance !== 'undefined' ? performance.now() : 0);
let running = !prefersReducedMotion();
let holdT = 0;

let y0 = parseFloat(sliderY0.value);
let b = parseFloat(sliderB.value);
let c = parseFloat(sliderC.value);

let sims = [];
const HIST_MAX = 4000;
const histT = [new Float32Array(HIST_MAX), new Float32Array(HIST_MAX), new Float32Array(HIST_MAX)];
const histV = [new Float32Array(HIST_MAX), new Float32Array(HIST_MAX), new Float32Array(HIST_MAX)];
let histLen = [0, 0, 0];

function reset() {
  sims = MODES.map((mode) => createFall({ mode, y0, b, c }));
  histLen = [0, 0, 0];
  holdT = 0;
}

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.3 },
    { name: 'plot', weight: 1.7 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  const g = (k, d) => css.getPropertyValue(k).trim() || d;
  return {
    bg: g('--bg', '#07090f'), panel: '#0a0c12', fg: g('--fg', '#e8e8e8'),
    muted: 'rgba(255,255,255,0.5)', accent: g('--accent', '#f1d28a'),
    cool: '#5bc0eb', warm: '#f4a261', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.10)',
  };
}
const LANE_COL = (col) => [col.accent, col.cool, col.warm];   // vacuum, stokes, quadratic

function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

function drawScene(col) {
  const r = REG.scene;
  panel(col, r, null);
  const cols = LANE_COL(col);
  const top = r.y + 44, ground = r.y + r.h - 30;
  const yScale = (ground - top) / y0;             // metres -> px
  const yPix = (y) => ground - y * yScale;
  // Ground.
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(r.x + 12, ground); ctx.lineTo(r.x + r.w - 12, ground); ctx.stroke();

  for (let i = 0; i < 3; i += 1) {
    const cx = r.x + (i + 1) * r.w / 4;
    const yNow = Math.max(0, sims[i] ? sims[i].y : y0);
    // Streak above the ball proportional to speed (motion blur).
    const spd = sims[i] ? Math.abs(sims[i].v) : 0;
    const streak = Math.min((ground - top) * 0.5, spd * yScale * 0.12);
    const py = yPix(yNow);
    const grd = ctx.createLinearGradient(cx, py - streak, cx, py);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(1, cols[i]);
    ctx.strokeStyle = grd; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, py - streak); ctx.lineTo(cx, py); ctx.stroke();
    // Ball.
    ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(cx, py, 8, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    // Lane label.
    ctx.fillStyle = cols[i]; ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(NAME[MODES[i]], cx, ground + 6);
  }
  // Title + drop height.
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('dropped from the same height', r.x + 8, r.y + 7);
  ctx.font = fontString(canvas, 'mono', 'mono'); ctx.textAlign = 'right'; ctx.fillStyle = col.fg;
  ctx.fillText(`y0 ${y0.toFixed(0)} m`, r.x + r.w - 8, r.y + 7);
}

function drawPlot(col) {
  const r = REG.plot;
  panel(col, r, 'speed over time');
  const cols = LANE_COL(col);
  const padL = 42, padR = 64, padT = 26, padB = 24;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, pw = x1 - x0;
  const y1 = r.y + r.h - padB, y0p = r.y + padT, ph = y1 - y0p;
  const vtS = terminalVelocityStokes(b), vtQ = terminalVelocityQuadratic(c);
  // Fixed v range so terminal-velocity asymptotes always show; vacuum reaches sqrt(2 g y0).
  const vMax = Math.max(Math.sqrt(2 * G * y0), vtS, vtQ) * 1.08;
  let tMax = 2;
  for (let i = 0; i < 3; i += 1) if (histLen[i]) tMax = Math.max(tMax, histT[i][histLen[i] - 1]);
  const fx = (t) => x0 + Math.min(t / tMax, 1) * pw;
  const fy = (v) => y1 - Math.min(v / vMax, 1) * ph;

  // Gridlines.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 4; k += 1) {
    const v = vMax * k / 4, py = fy(v);
    ctx.strokeStyle = col.grid; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke();
    ctx.fillText(String(Math.round(v)), x0 - 4, py);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let k = 0; k <= 4; k += 1) ctx.fillText(`${(tMax * k / 4).toFixed(1)}`, x0 + pw * k / 4, y1 + 4);

  // Terminal-velocity asymptotes + labels (right margin).
  const asym = (vt, color, label) => {
    if (vt > vMax) return;
    const py = fy(vt);
    ctx.strokeStyle = color; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = color; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x1 + 3, py);
  };
  asym(vtS, cols[1], `v_t ${vtS.toFixed(0)}`);
  asym(vtQ, cols[2], `v_t ${vtQ.toFixed(0)}`);

  // Curves.
  for (let i = 0; i < 3; i += 1) {
    if (histLen[i] < 2) continue;
    ctx.strokeStyle = cols[i]; ctx.lineWidth = 2; ctx.beginPath();
    for (let k = 0; k < histLen[i]; k += 1) {
      const xx = fx(histT[i][k]), yy = fy(Math.abs(histV[i][k]));
      if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  // Axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'sans'); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText('t (s)', x1, y1 + 20);
  ctx.save(); ctx.translate(r.x + 12, (y0p + y1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('|v| (m/s)', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  if (!sims.length) return;
  drawScene(col);
  drawPlot(col);
}

function pushHist(i) {
  const L = histLen[i];
  if (L < HIST_MAX) { histT[i][L] = sims[i].t; histV[i][L] = sims[i].v; histLen[i] = L + 1; }
}
function physicsTick() {
  let allLanded = true;
  for (let i = 0; i < 3; i += 1) {
    if (sims[i].y > 0) { allLanded = false; stepFall(sims[i], PHYSICS_DT); if (sims[i].nSteps % 6 === 0) pushHist(i); }
  }
  if (allLanded) { holdT += 1; if (holdT > 90) reset(); }
}

sliderY0.addEventListener('input', () => { y0 = parseFloat(sliderY0.value); valueY0.textContent = y0.toFixed(0); reset(); });
sliderB.addEventListener('input', () => { b = parseFloat(sliderB.value); valueB.textContent = b.toFixed(2); reset(); });
sliderC.addEventListener('input', () => { c = parseFloat(sliderC.value); valueC.textContent = c.toFixed(3); reset(); });
btnReset.addEventListener('click', reset);
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

if (typeof ResizeObserver !== 'undefined') {
  let raf = 0;
  const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { relayout(); render(); }); });
  ro.observe(canvas);
}

function updateReadout() {
  readoutVts.textContent = terminalVelocityStokes(b).toFixed(2);
  readoutVtq.textContent = terminalVelocityQuadratic(c).toFixed(2);
}

function bootSync() {
  relayout();
  reset();
  valueY0.textContent = y0.toFixed(0);
  valueB.textContent = b.toFixed(2);
  valueC.textContent = c.toFixed(3);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const steps = Math.round(frac * 7.0 / PHYSICS_DT);
    for (let s = 0; s < steps; s += 1) physicsTick();
    render(); updateReadout();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME };
      }));
    }
    return;
  }
  render(); updateReadout();
}

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1); lastTime = now;
  if (running) { accumulator += dt; while (accumulator >= PHYSICS_DT) { physicsTick(); accumulator -= PHYSICS_DT; } }
  render(); updateReadout();
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const vS = terminalVelocityStokes(b), vQ = terminalVelocityQuadratic(c);
  return {
    fields: [
      { key: 'drop-height', label: 'Drop height (m)', value: y0, format: 'float' },
      { key: 'stokes-coeff', label: 'Stokes coeff b', value: b, format: 'float' },
      { key: 'quad-coeff', label: 'Quadratic coeff c', value: c, format: 'float' },
      { key: 'vt-stokes', label: 'terminal v Stokes (m/s)', value: vS, format: 'float' },
      { key: 'vt-quad', label: 'terminal v quadratic (m/s)', value: vQ, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const vS = terminalVelocityStokes(b), vQ = terminalVelocityQuadratic(c);
  return [{
    key: 'terminal-velocity',
    label: 'both drag laws have a finite terminal velocity',
    value: `${vS.toFixed(1)}, ${vQ.toFixed(1)} m/s`,
    status: vS > 0 && vQ > 0 ? 'pass' : 'drift',
  }];
};
