import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// UI binding for the lyapunov-spectrum playground. Two panels:
//   left: attractor scatter in (x, y) for the current (a, b)
//   right: parameter (a, b) panel with a draggable handle
// Live readouts show a, b, lambda_1, lambda_2, lambda_1+lambda_2, ln|b|, and N.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  lyapunovSpectrum,
  attractorPoints,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  a:        document.getElementById('readout-a'),
  b:        document.getElementById('readout-b'),
  lambda1:  document.getElementById('readout-lambda1'),
  lambda2:  document.getElementById('readout-lambda2'),
  sum:      document.getElementById('readout-sum'),
  target:   document.getElementById('readout-target'),
  N:        document.getElementById('readout-N'),
};
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const ATT = { x: 40, y: 30, w: 480, h: 400, xmin: -1.6, xmax: 1.6, ymin: -0.5, ymax: 0.5 };
const PAR = { x: 560, y: 30, w: 130, h: 130, amin: 1.0, amax: 1.5, bmin: 0.1, bmax: 0.4 };

const state = {
  a: 1.4,
  b: 0.3,
  result: null,
  attractor: null,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  dragging: false,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:         cssVar('--bg', '#FBFBF9'),
  surface:    cssVar('--surface', '#FFFFFF'),
  fg:         cssVar('--fg', '#1A1B1C'),
  fgMuted:    cssVar('--fg-muted', '#5C5E61'),
  fgFaint:    cssVar('--fg-faint', '#9A9C9F'),
  accent:     cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  grid:       cssVar('--grid', '#9A9C9F4D'),
};

function recompute() {
  state.result    = lyapunovSpectrum(state.a, state.b, { burnIn: 1000, accum: 100_000 });
  state.attractor = attractorPoints(state.a, state.b, { burnIn: 200, count: 5000 });
}

function pxAtt(xv, yv) {
  return {
    px: ATT.x + ((xv - ATT.xmin) / (ATT.xmax - ATT.xmin)) * ATT.w,
    py: ATT.y + (1 - (yv - ATT.ymin) / (ATT.ymax - ATT.ymin)) * ATT.h,
  };
}

function pxPar(av, bv) {
  return {
    px: PAR.x + ((av - PAR.amin) / (PAR.amax - PAR.amin)) * PAR.w,
    py: PAR.y + (1 - (bv - PAR.bmin) / (PAR.bmax - PAR.bmin)) * PAR.h,
  };
}

function drawAttractor() {
  const { x: ox, y: oy, w, h } = ATT;
  ctx.fillStyle = tokens.surface;
  ctx.fillRect(ox, oy, w, h);
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(ox + 0.5, oy + 0.5, w - 1, h - 1);

  ctx.beginPath();
  const zero = pxAtt(0, 0);
  ctx.moveTo(ox, zero.py); ctx.lineTo(ox + w, zero.py);
  ctx.moveTo(zero.px, oy); ctx.lineTo(zero.px, oy + h);
  ctx.stroke();

  ctx.fillStyle = tokens.fgFaint;
  ctx.font = fontString(canvas, 'tick');
  ctx.textAlign = 'center';
  for (const xt of [-1, 0, 1]) {
    const { px } = pxAtt(xt, 0);
    ctx.fillText(xt.toFixed(0), px, oy + h + 13);
  }
  ctx.textAlign = 'right';
  for (const yt of [-0.4, 0, 0.4]) {
    const { py } = pxAtt(0, yt);
    ctx.fillText(yt.toFixed(1), ox - 4, py + 3);
  }

  if (state.attractor && state.attractor.length > 0) {
    ctx.fillStyle = tokens.accent;
    for (let i = 0; i < state.attractor.length; i += 2) {
      const xv = state.attractor[i];
      const yv = state.attractor[i + 1];
      if (xv < ATT.xmin || xv > ATT.xmax || yv < ATT.ymin || yv > ATT.ymax) continue;
      const { px, py } = pxAtt(xv, yv);
      ctx.fillRect(px - 0.5, py - 0.5, 1, 1);
    }
  } else {
    ctx.fillStyle = tokens.accentWarm;
    ctx.textAlign = 'center';
    ctx.font = fontString(canvas, 'body');
    ctx.fillText('orbit unbounded at these parameters', ox + w / 2, oy + h / 2);
  }

  ctx.fillStyle = tokens.fgMuted;
  ctx.font = fontString(canvas, 'caption');
  ctx.textAlign = 'left';
  ctx.fillText('Henon attractor', ox, oy - 10);
  ctx.textAlign = 'right';
  ctx.fillText(`a = ${state.a.toFixed(4)}   b = ${state.b.toFixed(4)}`, ox + w, oy - 10);

  ctx.textAlign = 'center';
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = fontString(canvas, 'tick');
  ctx.fillText('x', ox + w / 2, oy + h + 26);
  ctx.save();
  ctx.translate(ox - 26, oy + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('y', 0, 0);
  ctx.restore();
}

function drawParameterPanel() {
  const { x: ox, y: oy, w, h } = PAR;
  ctx.fillStyle = tokens.surface;
  ctx.fillRect(ox, oy, w, h);
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(ox + 0.5, oy + 0.5, w - 1, h - 1);

  ctx.beginPath();
  for (const aTick of [1.1, 1.2, 1.3, 1.4]) {
    const { px } = pxPar(aTick, PAR.bmin);
    ctx.moveTo(px, oy); ctx.lineTo(px, oy + h);
  }
  for (const bTick of [0.15, 0.2, 0.25, 0.3, 0.35]) {
    const { py } = pxPar(PAR.amin, bTick);
    ctx.moveTo(ox, py); ctx.lineTo(ox + w, py);
  }
  ctx.stroke();

  ctx.fillStyle = tokens.fgFaint;
  ctx.font = fontString(canvas, 'tick');
  ctx.textAlign = 'center';
  for (const aTick of [1.0, 1.25, 1.5]) {
    const { px } = pxPar(aTick, 0);
    ctx.fillText(aTick.toFixed(2), px, oy + h + 11);
  }
  ctx.textAlign = 'right';
  for (const bTick of [0.1, 0.25, 0.4]) {
    const { py } = pxPar(0, bTick);
    ctx.fillText(bTick.toFixed(2), ox - 3, py + 3);
  }

  const { px, py } = pxPar(state.a, state.b);
  ctx.strokeStyle = tokens.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(px, py, 7, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = tokens.accent;
  ctx.beginPath(); ctx.arc(px, py, 2.5, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = tokens.fgMuted;
  ctx.font = fontString(canvas, 'caption');
  ctx.textAlign = 'left';
  ctx.fillText('Parameter (a, b)', ox, oy - 10);
  ctx.textAlign = 'center';
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = fontString(canvas, 'tick');
  ctx.fillText('a', ox + w / 2, oy + h + 22);
  ctx.save();
  ctx.translate(ox - 22, oy + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('b', 0, 0);
  ctx.restore();
}

function drawAll() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawAttractor();
  drawParameterPanel();
}

function updateReadouts() {
  readouts.a.textContent = state.a.toFixed(6);
  readouts.b.textContent = state.b.toFixed(6);
  const r = state.result;
  if (r && r.bounded && !r.lowConfidence) {
    readouts.lambda1.textContent = r.lambda1.toFixed(4);
    readouts.lambda2.textContent = r.lambda2.toFixed(4);
    readouts.sum.textContent     = r.sum.toFixed(4);
    readouts.target.textContent  = r.sumTarget.toFixed(4);
    readouts.N.textContent       = String(r.n);
    readouts.lambda1.classList.remove('warn');
    readouts.lambda2.classList.remove('warn');
  } else if (r && r.bounded) {
    readouts.lambda1.textContent = 'low-conf';
    readouts.lambda2.textContent = 'low-conf';
    readouts.sum.textContent     = r.sum.toFixed(4);
    readouts.target.textContent  = r.sumTarget.toFixed(4);
    readouts.N.textContent       = String(r.n);
    readouts.lambda1.classList.add('warn');
    readouts.lambda2.classList.add('warn');
  } else {
    readouts.lambda1.textContent = 'unbounded';
    readouts.lambda2.textContent = 'unbounded';
    readouts.sum.textContent     = 'NA';
    readouts.target.textContent  = r ? r.sumTarget.toFixed(4) : 'NA';
    readouts.N.textContent       = '0';
    readouts.lambda1.classList.add('warn');
    readouts.lambda2.classList.add('warn');
  }
}

function canvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const ev   = evt.touches ? evt.touches[0] : evt;
  const sx   = canvas.width  / rect.width;
  const sy   = canvas.height / rect.height;
  return { x: (ev.clientX - rect.left) * sx, y: (ev.clientY - rect.top) * sy };
}

function inPar(p) {
  return p.x >= PAR.x && p.x <= PAR.x + PAR.w
      && p.y >= PAR.y && p.y <= PAR.y + PAR.h;
}

let _pendingRecompute = false;
function setFromPar(p) {
  const ta = Math.max(0, Math.min(1, (p.x - PAR.x) / PAR.w));
  const tb = Math.max(0, Math.min(1, 1 - (p.y - PAR.y) / PAR.h));
  state.a = PAR.amin + ta * (PAR.amax - PAR.amin);
  state.b = PAR.bmin + tb * (PAR.bmax - PAR.bmin);
  // Debounce: at most one recompute per animation frame while the user drags.
  if (_pendingRecompute) return;
  _pendingRecompute = true;
  requestAnimationFrame(() => {
    _pendingRecompute = false;
    recompute();
    drawAll();
    updateReadouts();
  });
}

canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPos(e);
  if (inPar(p)) {
    state.dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    setFromPar(p);
    e.preventDefault();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (state.dragging) setFromPar(canvasPos(e));
});
canvas.addEventListener('pointerup', () => { state.dragging = false; });
canvas.addEventListener('pointercancel', () => { state.dragging = false; });

btnReset.addEventListener('click', () => {
  state.a = 1.4;
  state.b = 0.3;
  recompute();
  drawAll();
  updateReadouts();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.a = PAR.amin + frac * (PAR.amax - PAR.amin);
    state.b = PAR.bmin + frac * (PAR.bmax - PAR.bmin);
    state.playing = false;
  }
  recompute();
  drawAll();
  updateReadouts();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, seed: SEED, a: state.a, b: state.b };
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
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
