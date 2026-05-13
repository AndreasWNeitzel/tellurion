// playground.js
// UI binding for the logistic map cobweb and bifurcation playground.
// All numerics live in ./sim.js; this file is rendering, input, and live readouts.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import {
  iterateOrbit,
  lyapunovExponent,
  detectPeriod,
  locateSuperstableCascade,
  deltaFromCascade,
  R_INF,
} from './sim.js';

// URL parameters
const params         = new URLSearchParams(location.search);
const SEED           = parseInt(params.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

// DOM handles
const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  r:       document.getElementById('readout-r'),
  period:  document.getElementById('readout-period'),
  lambda:  document.getElementById('readout-lambda'),
  delta:   document.getElementById('readout-delta'),
};
const btnPlayPause = document.getElementById('btn-playpause');
const btnReset     = document.getElementById('btn-reset');
const x0Input      = document.getElementById('input-x0');

// Layout constants (pixel coordinates inside the 720x480 canvas)
const COBWEB = { x: 50,  y: 30,  w: 300, h: 300 };
const BIF    = { x: 400, y: 30,  w: 300, h: 400, rmin: 2.0, rmax: 4.0 };
const SCATTER_KEEP   = 200;
const SCATTER_BURN   = 256;
const SCATTER_NCOLS  = BIF.w;
const LYAPUNOV_N_UI  = 4000;
const LYAPUNOV_BURN  = 1000;
const COBWEB_STEPS   = 256;

// State
const state = {
  r: 3.2,
  x0: 0.1,
  playing: !DETERMINISTIC,
  dragging: false,
  bifImage: null,
  period: 1,
  lambda: 0,
  delta: NaN,
  cascadeR: null,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:        cssVar('--bg', '#FBFBF9'),
  surface:   cssVar('--surface', '#FFFFFF'),
  fg:        cssVar('--fg', '#1A1B1C'),
  fgMuted:   cssVar('--fg-muted', '#5C5E61'),
  fgFaint:   cssVar('--fg-faint', '#9A9C9F'),
  accent:    cssVar('--accent', '#1B6CA8'),
  accentSoft:cssVar('--accent-soft', '#1B6CA822'),
  accentWarm:cssVar('--accent-warm', '#C13B27'),
  grid:      cssVar('--grid', '#9A9C9F4D'),
};

//
// Bifurcation panel: precompute once into an offscreen canvas.
//

function renderBifurcation() {
  const off = document.createElement('canvas');
  off.width = BIF.w;
  off.height = BIF.h;
  const offCtx = off.getContext('2d', { alpha: false });
  offCtx.fillStyle = tokens.surface;
  offCtx.fillRect(0, 0, BIF.w, BIF.h);

  const density = new Uint16Array(BIF.w * BIF.h);
  for (let col = 0; col < SCATTER_NCOLS; col += 1) {
    const r = BIF.rmin + (col / (SCATTER_NCOLS - 1)) * (BIF.rmax - BIF.rmin);
    let x = 0.1;
    for (let i = 0; i < SCATTER_BURN; i += 1) x = r * x * (1 - x);
    for (let i = 0; i < SCATTER_KEEP; i += 1) {
      x = r * x * (1 - x);
      const row = Math.floor((1 - x) * (BIF.h - 1));
      if (row >= 0 && row < BIF.h) {
        const idx = row * BIF.w + col;
        if (density[idx] < 0xFFFF) density[idx] += 1;
      }
    }
  }

  const img = offCtx.createImageData(BIF.w, BIF.h);
  const bgRGB = hexToRgb(tokens.surface);
  const fgRGB = hexToRgb(tokens.fg);
  const denom = Math.log(SCATTER_KEEP * 0.6);
  for (let i = 0; i < density.length; i += 1) {
    const d = density[i];
    const t = d === 0 ? 0 : Math.min(1, Math.log1p(d) / denom);
    const j = i * 4;
    img.data[j    ] = lerp(bgRGB[0], fgRGB[0], t);
    img.data[j + 1] = lerp(bgRGB[1], fgRGB[1], t);
    img.data[j + 2] = lerp(bgRGB[2], fgRGB[2], t);
    img.data[j + 3] = 255;
  }
  offCtx.putImageData(img, 0, 0);
  state.bifImage = off;
}

function hexToRgb(h) {
  const s = h.startsWith('#') ? h.slice(1) : h;
  if (s.length === 3) {
    return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16)];
  }
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

//
// Cobweb panel: parabola, diagonal, staircase.
//

function drawCobweb() {
  const { x: ox, y: oy, w, h } = COBWEB;

  ctx.fillStyle = tokens.surface;
  ctx.fillRect(ox, oy, w, h);

  const px = (x) => ox + x * w;
  const py = (y) => oy + (1 - y) * h;

  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let k = 1; k <= 3; k += 1) {
    const t = k * 0.25;
    ctx.moveTo(px(t), oy);     ctx.lineTo(px(t), oy + h);
    ctx.moveTo(ox,    py(t));  ctx.lineTo(ox + w, py(t));
  }
  ctx.stroke();

  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(ox + 0.5, oy + 0.5, w - 1, h - 1);

  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(px(0), py(0));
  ctx.lineTo(px(1), py(1));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = tokens.fg;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const N = 200;
  for (let i = 0; i <= N; i += 1) {
    const xv = i / N;
    const yv = state.r * xv * (1 - xv);
    const X = px(xv);
    const Y = py(yv);
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();

  const orbit = iterateOrbit(state.r, state.x0, COBWEB_STEPS);
  ctx.strokeStyle = tokens.accent;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(px(orbit[0]), py(0));
  ctx.lineTo(px(orbit[0]), py(orbit[1]));
  for (let i = 1; i < orbit.length - 1; i += 1) {
    ctx.lineTo(px(orbit[i]), py(orbit[i]));
    ctx.lineTo(px(orbit[i]), py(orbit[i + 1]));
  }
  ctx.stroke();

  ctx.fillStyle = tokens.accent;
  ctx.beginPath();
  ctx.arc(px(state.x0), py(0), 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Cobweb', ox, oy - 10);
  ctx.textAlign = 'right';
  ctx.fillText(`r = ${state.r.toFixed(4)}`, ox + w, oy - 10);

  ctx.textAlign = 'center';
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.fillText('x_n', ox + w / 2, oy + h + 14);
  ctx.save();
  ctx.translate(ox - 24, oy + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('x_{n+1}', 0, 0);
  ctx.restore();
}

//
// Bifurcation panel render: blit + r-line + ticks.
//

function drawBifurcation() {
  const { x: ox, y: oy, w, h } = BIF;
  ctx.fillStyle = tokens.surface;
  ctx.fillRect(ox, oy, w, h);

  if (state.bifImage) ctx.drawImage(state.bifImage, ox, oy);

  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(ox + 0.5, oy + 0.5, w - 1, h - 1);

  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (const rTick of [2.5, 3.0, 3.5]) {
    const X = ox + (rTick - BIF.rmin) / (BIF.rmax - BIF.rmin) * w;
    ctx.moveTo(X, oy); ctx.lineTo(X, oy + h);
  }
  ctx.stroke();

  const xRinf = ox + (R_INF - BIF.rmin) / (BIF.rmax - BIF.rmin) * w;
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(xRinf, oy); ctx.lineTo(xRinf, oy + h); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = tokens.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const [rTick, label] of [[2.0, '2.0'], [2.5, '2.5'], [3.0, '3.0'], [3.5, '3.5'], [4.0, '4.0']]) {
    const X = ox + (rTick - BIF.rmin) / (BIF.rmax - BIF.rmin) * w;
    ctx.fillText(label, X, oy + h + 13);
  }
  ctx.textAlign = 'right';
  ctx.fillText('1.0', ox - 4, oy + 4);
  ctx.fillText('0.0', ox - 4, oy + h);

  const xR = ox + (state.r - BIF.rmin) / (BIF.rmax - BIF.rmin) * w;
  ctx.strokeStyle = tokens.accent;
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(xR, oy); ctx.lineTo(xR, oy + h); ctx.stroke();

  ctx.fillStyle = tokens.accent;
  ctx.beginPath(); ctx.arc(xR, oy + 4, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = tokens.surface;
  ctx.beginPath(); ctx.arc(xR, oy + 4, 2, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Bifurcation diagram (drag the vertical to set r)', ox, oy - 10);
  ctx.textAlign = 'center';
  ctx.fillStyle = tokens.fgFaint;
  ctx.fillText('r', ox + w / 2, oy + h + 28);
}

//
// Live computation.
//

function recomputeCheap() {
  state.period = detectPeriod(state.r, state.x0, { burnIn: 4096, sampleLen: 64, maxPeriod: 64 });
  state.lambda = lyapunovExponent(state.r, state.x0, LYAPUNOV_N_UI, LYAPUNOV_BURN);
}

function recomputeCascade() {
  const R = locateSuperstableCascade(6);
  state.cascadeR = R;
  state.delta = deltaFromCascade(R, 5);
}

//
// Drawing pipeline.
//

function drawAll() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCobweb();
  drawBifurcation();
}

function updateReadouts() {
  readouts.r.textContent      = state.r.toFixed(6);
  readouts.period.textContent =
    state.period === 0 ? 'chaotic' :
    state.period === 1 ? '1' :
    String(state.period);
  readouts.lambda.textContent = state.lambda.toFixed(4);
  readouts.delta.textContent  = Number.isFinite(state.delta) ? state.delta.toFixed(4) : 'NA';
}

//
// Input: drag the vertical r-line.
//

function canvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const ev   = evt.touches ? evt.touches[0] : evt;
  const sx   = canvas.width  / rect.width;
  const sy   = canvas.height / rect.height;
  return { x: (ev.clientX - rect.left) * sx, y: (ev.clientY - rect.top) * sy };
}

function inBif(p) {
  return p.x >= BIF.x && p.x <= BIF.x + BIF.w
      && p.y >= BIF.y && p.y <= BIF.y + BIF.h;
}

function setRfromPixel(px) {
  const t = Math.max(0, Math.min(1, (px - BIF.x) / BIF.w));
  state.r = clamp(BIF.rmin + t * (BIF.rmax - BIF.rmin), 0.001, 4);
  recomputeCheap();
  drawAll();
  updateReadouts();
}

function onPointerDown(e) {
  const p = canvasPos(e);
  if (inBif(p)) {
    state.dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    setRfromPixel(p.x);
    e.preventDefault();
  }
}
function onPointerMove(e) { if (state.dragging) setRfromPixel(canvasPos(e).x); }
function onPointerUp()    { state.dragging = false; }

canvas.addEventListener('pointerdown',   onPointerDown);
canvas.addEventListener('pointermove',   onPointerMove);
canvas.addEventListener('pointerup',     onPointerUp);
canvas.addEventListener('pointercancel', onPointerUp);

canvas.tabIndex = 0;
canvas.addEventListener('keydown', (e) => {
  let step = 0;
  if (e.key === 'ArrowLeft')  step = -1;
  if (e.key === 'ArrowRight') step = +1;
  if (step !== 0) {
    const dr = e.shiftKey ? 0.001 : 0.01;
    state.r = clamp(state.r + step * dr, 0.001, 4);
    recomputeCheap();
    drawAll();
    updateReadouts();
    e.preventDefault();
  }
});

btnReset.addEventListener('click', () => {
  state.r = 3.2;
  state.x0 = 0.1;
  x0Input.value = state.x0.toFixed(3);
  recomputeCheap();
  drawAll();
  updateReadouts();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});
x0Input.addEventListener('change', () => {
  const v = parseFloat(x0Input.value);
  if (Number.isFinite(v) && v > 0 && v < 1) {
    state.x0 = v;
    recomputeCheap();
    drawAll();
    updateReadouts();
  } else {
    x0Input.value = state.x0.toFixed(3);
  }
});

//
// Capture mode and main loop.
//

if (CAPTURE_NAME) {
  const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
  state.r = clamp(2.0 + 2.0 * frac, BIF.rmin + 1e-3, BIF.rmax - 1e-9);
  state.playing = false;
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

function boot() {
  x0Input.value = state.x0.toFixed(3);
  renderBifurcation();
  recomputeCheap();
  recomputeCascade();
  drawAll();
  updateReadouts();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, r: state.r, seed: SEED };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
