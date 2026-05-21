import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Compare Bohr-Sommerfeld energy ladder to exact reference for V = |x|^p / p.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { POTENTIALS, bohrSommerfeldLadder, EXACT_LEVELS } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderP      = document.getElementById('slider-p');
const sliderNmax   = document.getElementById('slider-nmax');
const valueP       = document.getElementById('value-p');
const valueNmax    = document.getElementById('value-nmax');

const W = canvas.width, H = canvas.height;
const state = { p: 2.0, nMax: 6 };

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function exactLevels(p, nMax) {
  if (Math.abs(p - 2) < 0.01) {
    const out = new Array(nMax);
    for (let n = 0; n < nMax; n += 1) out[n] = EXACT_LEVELS[2](n);
    return out;
  }
  if (Math.abs(p - 4) < 0.01) {
    return EXACT_LEVELS[4].slice(0, nMax);
  }
  return null;   // No exact reference for arbitrary p; only BS shown.
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const PLOT_X = 80, PLOT_W = W - 160;
  const PLOT_Y = 40, PLOT_H = H - 100;
  // V(x) plot region on the left, energy ladder on the right.
  // Half panel: V(x) profile + BS turning points

  const xMaxView = 4.0;
  const eMax = Math.max(8, state.nMax + 2);
  const potFn = POTENTIALS.power(state.p);
  // Compute ladders
  const bs = bohrSommerfeldLadder(potFn, state.nMax, eMax + 5);
  const ex = exactLevels(state.p, state.nMax);

  // Draw V(x)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  function toLeftPx(x, e) {
    return {
      px: PLOT_X + PLOT_W * 0.5 * (x - (-xMaxView)) / (2 * xMaxView),
      py: PLOT_Y + (PLOT_H) * (1 - e / eMax),
    };
  }
  const NPLOT = 200;
  for (let i = 0; i < NPLOT; i += 1) {
    const x = -xMaxView + (2 * xMaxView) * (i / (NPLOT - 1));
    const v = potFn(x);
    const p = toLeftPx(x, Math.min(eMax, v));
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText('V(x) = |x|^p / p', PLOT_X + PLOT_W * 0.25, PLOT_Y - 8);

  // Draw BS levels as horizontal lines on the V(x) panel
  for (let n = 0; n < state.nMax; n += 1) {
    if (bs[n] > eMax) break;
    const a = toLeftPx(-xMaxView, bs[n]);
    const b = toLeftPx(xMaxView, bs[n]);
    ctx.strokeStyle = tok.accent;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py);
    ctx.stroke();
  }

  // Energy-ladder panel on the right
  const E_X0 = PLOT_X + PLOT_W * 0.55;
  const E_X1 = PLOT_X + PLOT_W;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(E_X0 + 0.5, PLOT_Y + 0.5, E_X1 - E_X0 - 1, PLOT_H - 1);

  function eToY(e) { return PLOT_Y + PLOT_H * (1 - e / eMax); }

  // BS ladder on the left side of the ladder panel
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.5;
  for (let n = 0; n < state.nMax; n += 1) {
    if (bs[n] > eMax) break;
    const y = eToY(bs[n]);
    ctx.beginPath();
    ctx.moveTo(E_X0 + 10, y); ctx.lineTo(E_X0 + (E_X1 - E_X0) * 0.45, y);
    ctx.stroke();
    ctx.fillStyle = tok.accent;
    ctx.textAlign = 'left';
    ctx.fillText(`n=${n}, ${bs[n].toFixed(3)}`, E_X0 + 12, y - 3);
  }

  // Exact ladder on the right
  if (ex) {
    ctx.strokeStyle = tok.accentWarm;
    ctx.lineWidth = 1.5;
    for (let n = 0; n < state.nMax; n += 1) {
      if (ex[n] > eMax) break;
      const y = eToY(ex[n]);
      ctx.beginPath();
      ctx.moveTo(E_X0 + (E_X1 - E_X0) * 0.55, y); ctx.lineTo(E_X1 - 10, y);
      ctx.stroke();
      ctx.fillStyle = tok.accentWarm;
      ctx.textAlign = 'right';
      ctx.fillText(`${ex[n].toFixed(3)}`, E_X1 - 14, y - 3);
    }
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('(no exact reference for arbitrary p)', (E_X0 + E_X1) / 2, eToY(eMax * 0.5));
  }

  // Legend
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = tok.accent;
  ctx.textAlign = 'left';
  ctx.fillText('Bohr-Sommerfeld (WKB)', E_X0 + 8, PLOT_Y - 8);
  ctx.fillStyle = tok.accentWarm;
  ctx.textAlign = 'right';
  ctx.fillText('Exact', E_X1 - 8, PLOT_Y - 8);

  // Readout
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  const rows = [
    ['p',     state.p.toFixed(2)],
    ['nMax',  String(state.nMax)],
    ['BS(0)', bs[0].toFixed(4)],
    ['BS(n=nMax-1)', bs[state.nMax - 1].toFixed(4)],
  ];
  if (ex) rows.push(['Exact(0)', ex[0].toFixed(4)], ['BS error at n=0', (bs[0] - ex[0]).toExponential(2)]);
  let y = PLOT_Y + PLOT_H + 22;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, PLOT_X, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, PLOT_X + 220, y);
    y += 14;
    if (y > H - 4) break;
  }
}

sliderP.addEventListener('input', () => {
  state.p = parseFloat(sliderP.value);
  valueP.textContent = state.p.toFixed(2);
  drawAll();
});
sliderNmax.addEventListener('input', () => {
  state.nMax = parseInt(sliderNmax.value, 10);
  valueNmax.textContent = String(state.nMax);
  drawAll();
});

function bootSync() {
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const ps = [2, 3, 4, 5, 6];
    state.p = ps[Math.min(ps.length - 1, Math.round(frac * (ps.length - 1)))];
    sliderP.value = state.p.toFixed(2);
    valueP.textContent = state.p.toFixed(2);
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
