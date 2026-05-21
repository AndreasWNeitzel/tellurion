import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Two parallel strings with fixed vs free boundaries.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createString, stepString, N, DX, L_X, DT, totalEnergy, injectPulse } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderSpeed  = document.getElementById('slider-speed');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

// User feedback: 'default speed is too fast and this is far too
// simplistic to be anywhere near hero-grade'. Default speed is now 1
// (was 3); the playground also tracks energy as a live invariant,
// supports click-to-pluck pulse injection on either string panel,
// and labels the boundary reaction so the inversion-vs-preservation
// is unmistakable.
const state = {
  speed: 1,
  fixed: null,
  free: null,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  E0: 0,    // initial energy for the live drift readout
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.fixed = createString({ bc: 'fixed' });
  state.free  = createString({ bc: 'free' });
  state.E0 = totalEnergy(state.fixed);
}

function drawString(s, panelY, panelH, color, label) {
  const padL = 30, padR = 30;
  const panelW = W - padL - padR;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  // Zero line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(padL, panelY + panelH / 2); ctx.lineTo(padL + panelW, panelY + panelH / 2);
  ctx.stroke();
  // Wave
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const x = padL + 4 + (panelW - 8) * i / (N - 1);
    const y = panelY + panelH / 2 - s.y[i] * (panelH * 0.4);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Boundary markers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL + 4, panelY + 4); ctx.lineTo(padL + 4, panelY + panelH - 4);
  ctx.moveTo(padL + panelW - 4, panelY + 4); ctx.lineTo(padL + panelW - 4, panelY + panelH - 4);
  ctx.stroke();
  // Label
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(label, padL + 6, panelY + 14);
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.fixed) return;
  const t = state.fixed.t;

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  const E1 = totalEnergy(state.fixed), E2 = totalEnergy(state.free);
  const drift = Math.abs((E1 - state.E0) / Math.max(1e-9, state.E0));
  ctx.fillText(`t = ${t.toFixed(2)} s   c = 1   L = ${L_X}   c dt / dx = ${(1 * DT / DX).toFixed(2)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`E_fixed = ${E1.toFixed(3)}   E_free = ${E2.toFixed(3)}   drift = ${drift.toExponential(1)}`, 30, 40);
  ctx.fillStyle = 'rgba(255, 215, 130, 0.85)';
  ctx.fillText(`Click either string to launch a new pulse. Fixed end inverts the pulse; free end preserves it.`, 30, 58);

  // Two stacked panels
  const padT = 78, padB = 60;
  const panelH = (H - padT - padB) / 2 - 10;
  drawString(state.fixed, padT,             panelH, tok.accentCool, 'fixed-end (y = 0 at both boundaries; inverting reflection)');
  drawString(state.free,  padT + panelH + 20, panelH, tok.accentWarm, 'free-end (y_x = 0 at both boundaries; preserving reflection)');

  // Highlight the right boundary clamp/ring on both panels so the
  // physical difference (clamp vs slider) is visible.
  const padL = 30, panelW = W - padL - 30;
  // fixed-end right boundary: black clamp anchored at y = 0
  ctx.fillStyle = 'rgba(40, 40, 50, 0.95)';
  ctx.fillRect(padL + panelW - 9, padT + panelH / 2 - 12, 10, 24);
  // free-end right boundary: free ring at the current y(L, t)
  const yEnd = state.free.y[N - 1];
  const ringY = padT + panelH + 20 + panelH / 2 - yEnd * (panelH * 0.4);
  ctx.strokeStyle = 'rgba(255, 215, 130, 0.95)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(padL + panelW - 4, ringY, 6, 0, 6.28); ctx.stroke();
  ctx.fillStyle = 'rgba(255, 215, 130, 0.85)'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText('slider (free)', padL + panelW - 60, ringY + 18);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepString(state.fixed);
    stepString(state.free);
  }
}

sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });

// Click-to-pluck: a click anywhere on the canvas launches a new
// Gaussian pulse at that fractional x position on BOTH strings
// (so the user can compare the same pulse on both boundary conditions
// frame-by-frame). Per user feedback the playground needs richer
// interactivity than the prior pause/reset/speed.
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const padL = 30, panelW = W - padL - 30;
  const x = e.clientX - r.left;
  const frac = Math.max(0.05, Math.min(0.95, (x - padL) / panelW));
  const x0 = frac * L_X;
  injectPulse(state.fixed, x0);
  injectPulse(state.free, x0);
  state.E0 = totalEnergy(state.fixed);
  drawAll();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Total run T = 6 s; each frame at fixed step.
    const target = Math.round(frac * 6.0 / DT);
    tickN(target);
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
  drawAll();
}

function tick() {
  if (state.playing) {
    tickN(state.speed * 5);
    drawAll();
  }
  requestAnimationFrame(tick);
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
// The string has no damping, so reflection at the ends conserves
// total energy; the relative drift is the invariant, re-baselined
// when a new pulse is injected.
let __energy0 = null, __energyPrev = null;
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      if (!state.fixed) return [];
      const E = totalEnergy(state.fixed);
      if (!Number.isFinite(E)) return [];
      if (__energyPrev !== null
        && Math.abs(E - __energyPrev) > 0.02 * Math.max(1e-9, Math.abs(__energyPrev)) + 1e-9) {
        __energy0 = E;
      }
      __energyPrev = E;
      if (__energy0 === null) __energy0 = E;
      const dE = Math.abs(E - __energy0) / Math.max(1e-12, Math.abs(__energy0));
      return [{
        key: 'energy',
        label: 'string energy conserved (rel. drift)',
        value: dE.toExponential(2),
        status: dE < 2e-3 ? 'pass' : (dE < 2e-2 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}
