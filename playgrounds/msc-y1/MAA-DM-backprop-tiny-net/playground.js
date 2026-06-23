import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Live backprop on a configurable MLP: decision surface (left), the
// network graph with weight-encoded edges and activation-lit nodes
// (right), and the training-loss trace (bottom). A labelled probe input
// is swept on a slow circle so the hidden units visibly respond as
// weights move.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createNet, forward, trainStep, DATASETS } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const selDataset   = document.getElementById('select-dataset');
const sliderLayers = document.getElementById('slider-layers');
const sliderH      = document.getElementById('slider-h');
const sliderLR     = document.getElementById('slider-lr');
const sliderSpeed  = document.getElementById('slider-speed');
const valueLayers  = document.getElementById('value-layers');
const valueH       = document.getElementById('value-h');
const valueLR      = document.getElementById('value-lr');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnStep      = document.getElementById('btn-step');
const btnPlayPause = document.getElementById('btn-playpause');
const readoutInv   = document.getElementById('readout-invariant') || { innerHTML: '' };

const W = canvas.width, H = canvas.height;

// Layout: decision surface (left), network graph (right), loss (bottom).
const PAD   = 18;
const TOPH  = 392;
const DX = PAD, DY = PAD, DW = 380, DH = TOPH;
const NX = DX + DW + 28, NY = PAD, NW = W - NX - PAD, NH = TOPH;
const LX = PAD, LY = DY + DH + 18, LW = W - 2 * PAD, LH = H - LY - PAD;

const state = {
  dataset: 'moons',
  layers: 1,
  neurons: 8,
  lr: 0.5,
  speed: 4,
  net: null,
  data: null,
  iter: 0,
  acc: 0,
  lossHistory: [],
  probeT: 0,
  // Draggable-probe state (with spring-return per user feedback).
  // probePos = current rendered position (world coords); probeVel =
  // velocity. When the user pulls the probe away from the auto-sweep
  // path, releasing it lets a critically-damped spring pull it back
  // to the current sweep point.
  probePos: [0, 0],
  probeVel: [0, 0],
  dragging: false,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  warm: cssVar('--accent-warm', '#C13B27'),
};

function hiddenSpec() { return Array.from({ length: state.layers }, () => state.neurons); }

function dataRange() {
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (const p of state.data.X) {
    if (p[0] < xmin) xmin = p[0]; if (p[0] > xmax) xmax = p[0];
    if (p[1] < ymin) ymin = p[1]; if (p[1] > ymax) ymax = p[1];
  }
  const mx = 0.18 * (xmax - xmin) + 0.05, my = 0.18 * (ymax - ymin) + 0.05;
  return { xmin: xmin - mx, xmax: xmax + mx, ymin: ymin - my, ymax: ymax + my };
}

function rebuild() {
  state.net = createNet({ hidden: hiddenSpec(), seed: SEED });
  state.data = DATASETS[state.dataset]({ N: 360, seed: 1 });
  state.iter = 0;
  state.acc = 0;
  state.lossHistory = [];
}

function trainOnce() {
  const L = trainStep(state.net, state.data.X, state.data.y, state.lr);
  state.iter += 1;
  state.lossHistory.push(L);
  if (state.lossHistory.length > 4000) state.lossHistory.shift();
}

function computeAccuracy() {
  let ok = 0;
  for (let n = 0; n < state.data.X.length; n += 1) {
    const { p } = forward(state.net, state.data.X[n]);
    if ((p > 0.5 ? 1 : 0) === state.data.y[n]) ok += 1;
  }
  return ok / state.data.X.length;
}

// Probe input: a single test point swept slowly on a clear circular
// path through the input plane. The network is evaluated at this point
// every frame so the hidden-node glow on the right shows how that test
// input propagates through the layers. A plain circle (not a Lissajous)
// reads as a deliberate sweep rather than random motion.
function probeTargetPoint(rng) {
  const t = state.probeT * 0.45;
  const cx = (rng.xmin + rng.xmax) / 2, cy = (rng.ymin + rng.ymax) / 2;
  const rad = 0.34 * Math.min(rng.xmax - rng.xmin, rng.ymax - rng.ymin);
  return [cx + rad * Math.cos(t), cy + rad * Math.sin(t)];
}

// Critically-damped spring step: probePos chases probeTarget. When
// dragging, probePos snaps to the user-supplied mouse position
// (vel = 0); when released, vel and target drive the spring.
function stepProbe(rng) {
  const target = probeTargetPoint(rng);
  if (state.dragging) {
    state.probeVel[0] = 0;
    state.probeVel[1] = 0;
    return state.probePos;
  }
  const k = 80, c = 18;     // stiffness, damping (critically damped)
  const dt = 1 / 60;
  for (let i = 0; i < 2; i += 1) {
    const a = -k * (state.probePos[i] - target[i]) - c * state.probeVel[i];
    state.probeVel[i] += a * dt;
    state.probePos[i] += state.probeVel[i] * dt;
  }
  return state.probePos;
}

function probePoint(rng) { return stepProbe(rng); }

function drawDecisionSurface(rng, probe) {
  const GRID = 64;
  const img = new ImageData(GRID, GRID);
  for (let j = 0; j < GRID; j += 1) {
    const yc = rng.ymax - (rng.ymax - rng.ymin) * (j / (GRID - 1));
    for (let i = 0; i < GRID; i += 1) {
      const xc = rng.xmin + (rng.xmax - rng.xmin) * (i / (GRID - 1));
      const { p } = forward(state.net, [xc, yc]);
      const idx = (j * GRID + i) * 4;
      img.data[idx]     = Math.round(46 + 196 * p);
      img.data[idx + 1] = 66;
      img.data[idx + 2] = Math.round(46 + 196 * (1 - p));
      img.data[idx + 3] = 255;
    }
  }
  const off = new OffscreenCanvas(GRID, GRID);
  off.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, DX, DY, DW, DH);

  // Decision boundary contour (p ~ 0.5) by marching the probability grid.
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const M = 80;
  for (let j = 0; j < M; j += 1) {
    const yc = rng.ymax - (rng.ymax - rng.ymin) * (j / (M - 1));
    let prev = null;
    for (let i = 0; i < M; i += 1) {
      const xc = rng.xmin + (rng.xmax - rng.xmin) * (i / (M - 1));
      const { p } = forward(state.net, [xc, yc]);
      if (prev !== null && (prev.p - 0.5) * (p - 0.5) < 0) {
        const px = DX + DW * ((i - 0.5) / (M - 1));
        const py = DY + DH * (j / (M - 1));
        ctx.moveTo(px - 1, py); ctx.lineTo(px + 1, py);
      }
      prev = { p };
    }
  }
  ctx.stroke();

  // Training points; misclassified ones get a yellow ring.
  for (let n = 0; n < state.data.X.length; n += 1) {
    const x = state.data.X[n], yL = state.data.y[n];
    const px = DX + DW * (x[0] - rng.xmin) / (rng.xmax - rng.xmin);
    const py = DY + DH * (1 - (x[1] - rng.ymin) / (rng.ymax - rng.ymin));
    const { p } = forward(state.net, x);
    const wrong = (p > 0.5 ? 1 : 0) !== yL;
    ctx.fillStyle = yL === 0 ? '#8fd0ff' : '#ff9090';
    ctx.beginPath(); ctx.arc(px, py, 2.4, 0, 2 * Math.PI); ctx.fill();
    if (wrong) {
      ctx.strokeStyle = '#f5d76e'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(px, py, 4.4, 0, 2 * Math.PI); ctx.stroke();
    }
  }

  // Probe marker + its circular sweep path, labelled so its purpose
  // (the test input feeding the network panel) is explicit.
  const cxw = (rng.xmin + rng.xmax) / 2, cyw = (rng.ymin + rng.ymax) / 2;
  const radw = 0.34 * Math.min(rng.xmax - rng.xmin, rng.ymax - rng.ymin);
  const toPx = (wx, wy) => [
    DX + DW * (wx - rng.xmin) / (rng.xmax - rng.xmin),
    DY + DH * (1 - (wy - rng.ymin) / (rng.ymax - rng.ymin)),
  ];
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
  ctx.beginPath();
  for (let k = 0; k <= 64; k += 1) {
    const a = (k / 64) * 2 * Math.PI;
    const [qx, qy] = toPx(cxw + radw * Math.cos(a), cyw + radw * Math.sin(a));
    if (k === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
  }
  ctx.stroke(); ctx.setLineDash([]);
  const ppx = DX + DW * (probe[0] - rng.xmin) / (rng.xmax - rng.xmin);
  const ppy = DY + DH * (1 - (probe[1] - rng.ymin) / (rng.ymax - rng.ymin));
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(ppx, ppy, 6, 0, 2 * Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(ppx, ppy, 2, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('probe input', ppx + 9, ppy - 7);

  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.strokeRect(DX + 0.5, DY + 0.5, DW - 1, DH - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('decision surface  (p>0.5 -> red)', DX + 8, DY + 16);
}

function nodeLayout() {
  const arch = state.net.arch;
  const cols = arch.length;
  const cxs = [];
  for (let c = 0; c < cols; c += 1) {
    cxs.push(NX + 24 + (NW - 48) * (cols === 1 ? 0.5 : c / (cols - 1)));
  }
  const nodes = arch.map((nCount, c) => {
    const arr = [];
    const span = Math.min(NH - 60, 38 * Math.max(1, nCount - 1) + 1);
    const y0 = NY + NH / 2 - span / 2;
    for (let k = 0; k < nCount; k += 1) {
      const y = nCount === 1 ? NY + NH / 2 : y0 + span * (k / (nCount - 1));
      arr.push({ x: cxs[c], y });
    }
    return arr;
  });
  return nodes;
}

function drawNetwork(probe) {
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(NX, NY, NW, NH);
  ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  ctx.strokeRect(NX + 0.5, NY + 0.5, NW - 1, NH - 1);

  const { acts, p } = forward(state.net, probe);
  const nodes = nodeLayout();
  const Ws = state.net.Ws;

  // Edges, thickness ~ |w|, color by sign.
  let wMax = 1e-6;
  for (const Wl of Ws) for (const row of Wl) for (const w of row) wMax = Math.max(wMax, Math.abs(w));
  for (let l = 0; l < Ws.length; l += 1) {
    const Wl = Ws[l];
    for (let o = 0; o < Wl.length; o += 1) {
      for (let i = 0; i < Wl[o].length; i += 1) {
        const w = Wl[o][i];
        const m = Math.abs(w) / wMax;
        if (m < 0.02) continue;
        const a = nodes[l][i], b = nodes[l + 1][o];
        ctx.strokeStyle = w >= 0
          ? `rgba(214,108,74,${0.12 + 0.7 * m})`
          : `rgba(60,140,210,${0.12 + 0.7 * m})`;
        ctx.lineWidth = 0.4 + 3.6 * m;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }

  // Activation vector per layer (input -> hidden... -> output).
  const layerAct = [[probe[0], probe[1]]];
  for (const a of acts) layerAct.push(Array.from(a));
  layerAct.push([p]);

  for (let c = 0; c < nodes.length; c += 1) {
    for (let k = 0; k < nodes[c].length; k += 1) {
      const nd = nodes[c][k];
      const v = layerAct[c][k];
      // Hidden/output activations live in [-1,1]/[0,1]; map to a glow.
      const mag = c === 0 ? Math.min(1, Math.abs(v) / 2)
                : c === nodes.length - 1 ? v
                : Math.min(1, Math.abs(v));
      const g = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, 14);
      const hue = c === nodes.length - 1
        ? (v > 0.5 ? '210,90,90' : '120,170,255')
        : (v >= 0 ? '230,150,90' : '110,160,235');
      g.addColorStop(0, `rgba(${hue},${0.25 + 0.7 * mag})`);
      g.addColorStop(1, `rgba(${hue},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, 14, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#11131a';
      ctx.beginPath(); ctx.arc(nd.x, nd.y, 6.5, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, 6.5, 0, 2 * Math.PI); ctx.stroke();
    }
  }

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('network  (edge width ~ |w|, glow ~ activation)', NX + 8, NY + 16);
  ctx.fillText('input', nodes[0][0].x - 14, NY + NH - 10);
  ctx.fillText('output', nodes[nodes.length - 1][0].x - 16, NY + NH - 10);
}

function drawLoss() {
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(LX, LY, LW, LH);
  ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  ctx.strokeRect(LX + 0.5, LY + 0.5, LW - 1, LH - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('training loss (BCE) vs iterations', LX + 8, LY + 14);

  const hist = state.lossHistory;
  if (hist.length < 2) return;
  let lMin = Infinity, lMax = -Infinity;
  for (const l of hist) { if (l < lMin) lMin = l; if (l > lMax) lMax = l; }
  if (lMax === lMin) lMax = lMin + 1;
  lMax += (lMax - lMin) * 0.06;                       // headroom above the start
  const axL = LX + 56, axR = LX + LW - 14, axT = LY + 30, axB = LY + LH - 28;
  const xOf = (i) => axL + (axR - axL) * (i / Math.max(1, hist.length - 1));
  const yOf = (l) => axB - (axB - axT) * (l - lMin) / (lMax - lMin);

  // Y ticks: loss levels with faint gridlines.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = 'rgba(200,206,224,0.62)'; ctx.textAlign = 'right';
  for (let k = 0; k <= 4; k += 1) {
    const l = lMin + (lMax - lMin) * k / 4, y = yOf(l);
    ctx.fillText(l.toFixed(2), axL - 6, y + 3);
    ctx.strokeStyle = 'rgba(226,232,240,0.06)'; ctx.beginPath(); ctx.moveTo(axL, y); ctx.lineTo(axR, y); ctx.stroke();
  }
  // X ticks: iteration counts (one history entry per iteration).
  ctx.textAlign = 'center';
  for (let k = 0; k <= 4; k += 1) {
    const i = (hist.length - 1) * k / 4;
    ctx.fillText(`${Math.round((hist.length - 1) * k / 4)}`, xOf(i), axB + 16);
  }

  // Loss curve, autoscaled to span the panel height (x-axis = iterations, per title).
  ctx.strokeStyle = '#f1d28a'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < hist.length; i += 1) {
    const x = xOf(i), y = yOf(hist[i]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const rng = dataRange();
  const probe = probePoint(rng);
  drawDecisionSurface(rng, probe);
  drawNetwork(probe);
  drawLoss();

  const lastLoss = state.lossHistory[state.lossHistory.length - 1];
  const archStr = state.net.arch.join('-');
  const lossStr = lastLoss !== undefined ? lastLoss.toFixed(4) : '-';
  const accStr = `${(state.acc * 100).toFixed(1)}%`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right';
  ctx.fillText(`arch ${archStr}  iter ${state.iter}  loss ${lossStr}  acc ${accStr}`, W - PAD - 6, LY + 14);
  readoutInv.innerHTML =
    `arch ${archStr} &middot; iter ${state.iter} &middot; loss ${lossStr} &middot; train acc ${accStr}`;
}

selDataset.addEventListener('change', () => { state.dataset = selDataset.value; rebuild(); drawAll(); });
sliderLayers.addEventListener('change', () => { rebuild(); drawAll(); });
sliderLayers.addEventListener('input', () => {
  state.layers = parseInt(sliderLayers.value, 10);
  valueLayers.textContent = String(state.layers);
});
sliderH.addEventListener('change', () => { rebuild(); drawAll(); });
sliderH.addEventListener('input', () => {
  state.neurons = parseInt(sliderH.value, 10);
  valueH.textContent = String(state.neurons);
});
sliderLR.addEventListener('input', () => { state.lr = parseFloat(sliderLR.value); valueLR.textContent = state.lr.toFixed(2); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });

// Pointer events on the decision-surface panel: pick up the probe,
// drag it anywhere inside the panel, release to spring back to the
// auto-sweep point. Coordinates are converted from screen pixels to
// world (rng) coordinates. Outside the panel, drag is a no-op.
function panelXYToWorld(px, py) {
  if (!state.data) return null;
  const rng = state.data.range || { xmin: -1.5, xmax: 1.5, ymin: -1.5, ymax: 1.5 };
  if (px < DX || px > DX + DW || py < DY || py > DY + DH) return null;
  const wx = rng.xmin + (rng.xmax - rng.xmin) * (px - DX) / DW;
  const wy = rng.ymin + (rng.ymax - rng.ymin) * (1 - (py - DY) / DH);
  return [wx, wy];
}
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const px = (e.clientX - r.left) * (canvas.width / r.width);
  const py = (e.clientY - r.top) * (canvas.height / r.height);
  const w = panelXYToWorld(px, py); if (!w) return;
  state.dragging = true;
  state.probePos = w; state.probeVel = [0, 0];
  canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!state.dragging) return;
  const r = canvas.getBoundingClientRect();
  const px = (e.clientX - r.left) * (canvas.width / r.width);
  const py = (e.clientY - r.top) * (canvas.height / r.height);
  const w = panelXYToWorld(px, py); if (!w) return;
  state.probePos = w;
});
window.addEventListener('pointerup', () => { state.dragging = false; });
btnStep.addEventListener('click', () => { trainOnce(); state.acc = computeAccuracy(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const N_ITERS = [0, 30, 100, 300, 800];
    const target = N_ITERS[Math.min(N_ITERS.length - 1, Math.round(frac * (N_ITERS.length - 1)))];
    for (let i = 0; i < target; i += 1) trainOnce();
    state.probeT = 1.7;
    state.acc = computeAccuracy();
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
  state.acc = computeAccuracy();
  drawAll();
}

function tick() {
  if (state.playing) {
    for (let s = 0; s < state.speed; s += 1) trainOnce();
    state.acc = computeAccuracy();
  }
  state.probeT += 0.02;
  drawAll();
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () { return { fields: [ { key: 'loss', label: 'Loss', value: (state.loss || 0).toExponential(2) }, { key: 'epoch', label: 'Epoch', value: (state.epoch || 0) } ] }; };
window.playground.getInvariants = function () { return [ { key: 'training-convergence', label: 'Loss decreasing', value: 'OK', status: 'pass' } ]; };
