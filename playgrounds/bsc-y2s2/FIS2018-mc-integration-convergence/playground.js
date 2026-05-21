// playground.js
// Monte Carlo integration by hit-or-miss sampling. Darts accumulate
// continuously on the unit square; the running fraction inside the
// chosen shape estimates its area. A log-log convergence panel tracks
// the absolute error against the 1/sqrt(N) Monte Carlo reference.

import { fontString } from '../../../shared/js/canvas-type.js';
import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { SHAPES, shapeByKey, makeEstimator, throwDarts, areaEstimate } from './sim.js';

const urlParams     = new URLSearchParams(location.search);
const SEED          = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME  = urlParams.get('capture');
const CAPTURE_FRAC  = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const selShape    = document.getElementById('select-shape');
const valShape    = document.getElementById('value-shape');
const sliderSpeed = document.getElementById('slider-speed');
const valueSpeed  = document.getElementById('value-speed');
const btnReset    = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const RENDER_CAP = 5000;            // darts kept for rendering (tallies are exact)

const state = {
  shape: SHAPES[0],
  est: makeEstimator(SEED),
  darts: [],
  history: [],                      // {n, err}
  batch: 120,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

// Offscreen shape mask, rebuilt only when the shape changes.
const maskCanvas = document.createElement('canvas');
maskCanvas.width = 260;
maskCanvas.height = 260;
const maskCtx = maskCanvas.getContext('2d');
function buildMask() {
  const n = maskCanvas.width;
  const img = maskCtx.createImageData(n, n);
  const d = img.data;
  for (let j = 0; j < n; j += 1) {
    const y = 1 - (j + 0.5) / n;
    for (let i = 0; i < n; i += 1) {
      const x = (i + 0.5) / n;
      const k = (j * n + i) * 4;
      if (state.shape.inside(x, y)) {
        d[k] = 74; d[k + 1] = 100; d[k + 2] = 138; d[k + 3] = 150;
      }
    }
  }
  maskCtx.putImageData(img, 0, 0);
}

// Square dart board on the left; the right column carries the
// readouts and the convergence panel.
const BS = Math.min(H - 100, Math.floor(W * 0.46));
const BX = 24, BY = 58;
const bx = (x) => BX + x * BS;
const by = (y) => BY + (1 - y) * BS;

function resetEstimator() {
  state.est = makeEstimator(SEED);
  state.darts = [];
  state.history = [];
}

function accumulate(n) {
  const fresh = throwDarts(state.est, state.shape, n);
  for (const dd of fresh) state.darts.push(dd);
  if (state.darts.length > RENDER_CAP) {
    state.darts.splice(0, state.darts.length - RENDER_CAP);
  }
  const e = areaEstimate(state.est);
  state.history.push({ n: e.n, err: Math.abs(e.area - state.shape.area) });
  if (state.history.length > 1400) state.history.shift();
}

function draw() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const e = areaEstimate(state.est);

  // Dart board.
  ctx.fillStyle = 'rgba(220,228,240,0.8)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('hit-or-miss darts on the unit square', BX, BY - 10);
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(BX, BY, BS, BS);
  ctx.drawImage(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height, BX, BY, BS, BS);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.strokeRect(BX + 0.5, BY + 0.5, BS - 1, BS - 1);
  for (const dd of state.darts) {
    ctx.fillStyle = dd.hit ? 'rgba(127,214,130,0.9)' : 'rgba(232,124,124,0.5)';
    ctx.fillRect(bx(dd.x) - 1.1, by(dd.y) - 1.1, 2.2, 2.2);
  }

  // Right column: readouts.
  const RX = BX + BS + 30, RW = W - RX - 24;
  let ry = BY + 8;
  ctx.fillStyle = '#e8ecf4';
  ctx.font = fontString(canvas, 'body', 'mono', 600);
  ctx.fillText(state.shape.name, RX, ry);
  ry += 22;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(202,212,232,0.88)';
  const lines = [
    `darts N        ${e.n}`,
    `hits inside    ${state.est.nHit}`,
    `area estimate  ${e.area.toFixed(5)}`,
    `exact area     ${state.shape.area.toFixed(5)}`,
    `abs error      ${Math.abs(e.area - state.shape.area).toExponential(2)}`,
    `std error      ${e.se.toExponential(2)}`,
  ];
  for (const ln of lines) { ctx.fillText(ln, RX, ry); ry += 16; }
  ctx.fillStyle = 'rgba(255,210,120,0.85)';
  ry += 4;
  ctx.fillText(state.shape.note, RX, ry);
  ry += 20;

  // Right column: convergence panel.
  const cy0 = ry + 6, cy1 = BY + BS;
  if (cy1 - cy0 > 70) {
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(RX, cy0, RW, cy1 - cy0);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeRect(RX + 0.5, cy0 + 0.5, RW - 1, cy1 - cy0 - 1);
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.fillText('abs error vs N (log-log); dashed = 1/sqrt(N)', RX + 6, cy0 + 14);
    const nMax = Math.max(256, e.n);
    const logNMax = Math.log10(nMax);
    const lxN = (n) => RX + 34 + (RW - 48) * Math.log10(Math.max(1, n)) / logNMax;
    const errLo = -4, errHi = 0;
    const lyE = (err) => {
      const l = Math.max(errLo, Math.min(errHi, Math.log10(Math.max(1e-9, err))));
      return cy0 + 24 + (cy1 - cy0 - 38) * (errHi - l) / (errHi - errLo);
    };
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    let first = true;
    for (let n = 8; n <= nMax; n *= 1.5) {
      const px = lxN(n), py = lyE(1 / Math.sqrt(n));
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#7fd1ff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    first = true;
    for (const h of state.history) {
      const px = lxN(h.n), py = lyE(h.err);
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

let raf = 0;
function tick() {
  if (state.playing) accumulate(state.batch);
  draw();
  raf = requestAnimationFrame(tick);
}

for (const s of SHAPES) {
  const o = document.createElement('option');
  o.value = s.key;
  o.textContent = s.name;
  selShape.appendChild(o);
}
selShape.value = state.shape.key;
valShape.textContent = state.shape.area.toFixed(3);

selShape.addEventListener('change', () => {
  state.shape = shapeByKey(selShape.value);
  valShape.textContent = state.shape.area.toFixed(3);
  buildMask();
  resetEstimator();
  draw();
});
sliderSpeed.addEventListener('input', () => {
  state.batch = 40 * parseInt(sliderSpeed.value, 10);
  valueSpeed.textContent = String(state.batch);
  draw();
});
btnReset.addEventListener('click', () => { resetEstimator(); draw(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  state.batch = 40 * (parseInt(sliderSpeed.value, 10) || 3);
  valueSpeed.textContent = String(state.batch);
  buildMask();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(80 + frac * 3600);
    resetEstimator();
    let thrown = 0;
    while (thrown < target) {
      const chunk = Math.min(80, target - thrown);
      accumulate(chunk);
      thrown += chunk;
    }
    draw();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
      }));
    }
    return;
  }
  draw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) raf = requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) raf = requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
// A correct Monte Carlo estimate is statistically consistent with the
// truth: the absolute error stays within a few standard errors of
// zero. That consistency is the invariant.
window.playground = window.playground || {};
window.playground.getState = function () {
  const e = areaEstimate(state.est);
  return {
    fields: [
      { key: 'shape', label: 'shape', value: state.shape.name },
      { key: 'darts', label: 'darts thrown', value: e.n },
      { key: 'area-estimate', label: 'area estimate', value: e.area.toFixed(5), format: 'float' },
      { key: 'exact-area', label: 'exact area', value: state.shape.area.toFixed(5), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const e = areaEstimate(state.est);
  if (e.n < 50) return [];
  const err = Math.abs(e.area - state.shape.area);
  const sigmas = e.se > 0 ? err / e.se : 0;
  return [
    {
      key: 'consistency',
      label: 'estimate within 3 sigma of exact area',
      value: `${sigmas.toFixed(2)} sigma`,
      status: sigmas < 3 ? 'pass' : (sigmas < 5 ? 'pending' : 'drift'),
    },
  ];
};
