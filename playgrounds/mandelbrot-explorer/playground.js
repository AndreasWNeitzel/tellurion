// playground.js
// Mandelbrot explorer UI. Renders into an offscreen ImageData on every view
// change; draws the buffer plus on-canvas crosshair and a hover readout.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { escapeTime, MAX_ITER } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  cr:       document.getElementById('readout-cr'),
  ci:       document.getElementById('readout-ci'),
  width:    document.getElementById('readout-width'),
  iter:     document.getElementById('readout-iter'),
  status:   document.getElementById('readout-status'),
};
const sliderWidth  = document.getElementById('slider-width');
const valueWidth   = document.getElementById('value-width');
const btnReset     = document.getElementById('btn-reset');

const W = canvas.width, H = canvas.height;
const ASPECT = H / W;

const state = {
  cx: -0.5,
  cy: 0,
  width: 3.5,
  imageData: null,
  hover: null,
  dragging: false,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:      cssVar('--bg', '#FBFBF9'),
  surface: cssVar('--surface', '#FFFFFF'),
  fg:      cssVar('--fg', '#1A1B1C'),
  fgMuted: cssVar('--fg-muted', '#5C5E61'),
  fgFaint: cssVar('--fg-faint', '#9A9C9F'),
  accent:  cssVar('--accent', '#1B6CA8'),
  grid:    cssVar('--grid', '#9A9C9F4D'),
};

function hexToRgb(h) {
  const s = h.startsWith('#') ? h.slice(1) : h;
  if (s.length === 3) return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16)];
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function render() {
  const surf = hexToRgb(tokens.surface);
  const fg   = hexToRgb(tokens.fg);
  const img  = ctx.createImageData(W, H);
  const data = img.data;
  for (let py = 0; py < H; py += 1) {
    const ci = state.cy + (0.5 - py / H) * state.width * ASPECT;
    for (let px = 0; px < W; px += 1) {
      const cr = state.cx + (px / W - 0.5) * state.width;
      const { mu } = escapeTime(cr, ci);
      const idx = (py * W + px) * 4;
      if (mu >= MAX_ITER) {
        data[idx]     = fg[0];
        data[idx + 1] = fg[1];
        data[idx + 2] = fg[2];
      } else {
        // monochrome ramp: short escape -> fg, long escape -> surface
        const t = Math.max(0, Math.min(1, mu / MAX_ITER));
        // log-shaped scaling so the periphery has more contrast
        const s = Math.pow(t, 0.3);
        data[idx]     = Math.round(fg[0] + s * (surf[0] - fg[0]));
        data[idx + 1] = Math.round(fg[1] + s * (surf[1] - fg[1]));
        data[idx + 2] = Math.round(fg[2] + s * (surf[2] - fg[2]));
      }
      data[idx + 3] = 255;
    }
  }
  state.imageData = img;
}

function drawAll() {
  if (state.imageData) ctx.putImageData(state.imageData, 0, 0);
  // crosshair at center
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
  ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
  ctx.stroke();
  if (state.hover) {
    ctx.strokeStyle = tokens.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(state.hover.px, state.hover.py, 4, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Mandelbrot set (drag to recenter)', 12, 18);
}

function updateReadouts() {
  readouts.cr.textContent    = state.cx.toFixed(6);
  readouts.ci.textContent    = state.cy.toFixed(6);
  readouts.width.textContent = state.width.toFixed(4);
  if (state.hover) {
    readouts.iter.textContent   = state.hover.iter === MAX_ITER ? `${MAX_ITER} (set)` : String(state.hover.iter);
    readouts.status.textContent = state.hover.iter === MAX_ITER ? 'in set' : 'escapes';
  } else {
    readouts.iter.textContent   = 'NA';
    readouts.status.textContent = 'hover';
  }
}

function canvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const ev   = evt.touches ? evt.touches[0] : evt;
  const sx   = canvas.width  / rect.width;
  const sy   = canvas.height / rect.height;
  return { x: (ev.clientX - rect.left) * sx, y: (ev.clientY - rect.top) * sy };
}

function pixelToC(p) {
  const cr = state.cx + (p.x / W - 0.5) * state.width;
  const ci = state.cy + (0.5 - p.y / H) * state.width * ASPECT;
  return { cr, ci };
}

canvas.addEventListener('pointermove', (e) => {
  const p = canvasPos(e);
  const { cr, ci } = pixelToC(p);
  const r = escapeTime(cr, ci);
  state.hover = { px: p.x, py: p.y, iter: r.iter };
  drawAll();
  updateReadouts();
});
canvas.addEventListener('pointerleave', () => {
  state.hover = null;
  drawAll();
  updateReadouts();
});
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPos(e);
  const { cr, ci } = pixelToC(p);
  state.cx = cr;
  state.cy = ci;
  render();
  drawAll();
  updateReadouts();
  e.preventDefault();
});
canvas.addEventListener('dblclick', () => {
  state.cx = -0.5;
  state.cy = 0;
  render();
  drawAll();
  updateReadouts();
});

function applySlider() {
  state.width = parseFloat(sliderWidth.value);
  valueWidth.textContent = state.width.toFixed(2);
  render();
  drawAll();
  updateReadouts();
}
sliderWidth.addEventListener('input', applySlider);

btnReset.addEventListener('click', () => {
  state.cx = -0.5;
  state.cy = 0;
  sliderWidth.value = '3.5';
  applySlider();
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Sweep zooms exponentially from full view to Seahorse Valley.
    const SEAHORSE_X = -0.7269, SEAHORSE_Y = 0.1889;
    const wStart = 3.5, wEnd = 0.06;
    state.width = wStart * Math.pow(wEnd / wStart, frac);
    state.cx = (-0.5) * (1 - frac) + SEAHORSE_X * frac;
    state.cy = 0          * (1 - frac) + SEAHORSE_Y * frac;
    sliderWidth.value = Math.max(0.5, state.width).toString();
    valueWidth.textContent = state.width.toFixed(3);
  } else {
    state.width = parseFloat(sliderWidth.value);
    valueWidth.textContent = state.width.toFixed(2);
  }
  render();
  drawAll();
  updateReadouts();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, seed: SEED, width: state.width };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
