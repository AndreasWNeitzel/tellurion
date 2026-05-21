import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Three canonical bound-state wells with selected eigenfunction overlaid.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  infiniteWellPsi, infiniteWellE,
  finiteWellLevels, finiteWellPsi,
  harmonicWellPsi, harmonicWellE,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const selWell      = document.getElementById('select-well');
const sliderN      = document.getElementById('slider-n');
const sliderV0     = document.getElementById('slider-V0');
const sliderA      = document.getElementById('slider-a');
const valueN       = document.getElementById('value-n');
const valueV0      = document.getElementById('value-V0');
const valueA       = document.getElementById('value-a');

const W = canvas.width, H = canvas.height;

const state = {
  well: 'infinite',
  n: 1,
  V0: 15,
  a: 1.0,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function viewLimits() {
  if (state.well === 'infinite') return { xmin: -0.5, xmax: 2.5, Emax: infiniteWellE(8, 2) * 1.1 };
  if (state.well === 'finite') return { xmin: -3 * state.a, xmax: 3 * state.a, Emax: state.V0 * 1.1 };
  return { xmin: -5, xmax: 5, Emax: 9.5 };
}

function buildXs() {
  const { xmin, xmax } = viewLimits();
  const N = 400;
  const xs = new Float64Array(N);
  for (let i = 0; i < N; i += 1) xs[i] = xmin + (xmax - xmin) * (i / (N - 1));
  return xs;
}

function potential(x) {
  if (state.well === 'infinite') {
    return (x < 0 || x > 2) ? 1e9 : 0;
  }
  if (state.well === 'finite') {
    return Math.abs(x) > state.a ? state.V0 : 0;
  }
  // harmonic V = 0.5 x^2 (with hbar = m = omega = 1)
  return 0.5 * x * x;
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const lim = viewLimits();
  const X0 = 60, X1 = W - 60;
  const Y0 = 30, Y1 = H - 50;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);

  function toPx(x, e) {
    return {
      px: X0 + (X1 - X0) * (x - lim.xmin) / (lim.xmax - lim.xmin),
      py: Y1 - (Y1 - Y0) * (e / lim.Emax),
    };
  }

  // Draw potential V(x) as solid grey curve. For infinite well draw walls.
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const NP = 600;
  let started = false;
  for (let i = 0; i < NP; i += 1) {
    const x = lim.xmin + (lim.xmax - lim.xmin) * (i / (NP - 1));
    const V = potential(x);
    if (V > lim.Emax * 1.05) {
      if (started) { ctx.stroke(); started = false; }
      continue;
    }
    const p = toPx(x, V);
    if (!started) { ctx.moveTo(p.px, p.py); started = true; }
    else ctx.lineTo(p.px, p.py);
  }
  if (started) ctx.stroke();

  // For infinite well, draw left and right walls explicitly.
  if (state.well === 'infinite') {
    const w0 = toPx(0, 0);
    const wTop = toPx(0, lim.Emax);
    const w1 = toPx(2, 0);
    const wTop1 = toPx(2, lim.Emax);
    ctx.beginPath();
    ctx.moveTo(w0.px, w0.py); ctx.lineTo(wTop.px, wTop.py);
    ctx.moveTo(w1.px, w1.py); ctx.lineTo(wTop1.px, wTop1.py);
    ctx.stroke();
  }

  // Compute energy levels
  let levels = [];
  if (state.well === 'infinite') {
    for (let n = 1; n <= 8; n += 1) levels.push({ n, E: infiniteWellE(n, 2) });
  } else if (state.well === 'finite') {
    const ls = finiteWellLevels(state.a, state.V0);
    for (let i = 0; i < ls.length; i += 1) levels.push({ n: i + 1, E: ls[i].E, level: ls[i] });
  } else {
    for (let n = 0; n <= 8; n += 1) levels.push({ n: n + 1, E: harmonicWellE(n) });
  }

  // Draw all energy levels as faint horizontal lines.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.lineWidth = 0.6;
  ctx.font = fontString(canvas, 'tick', 'mono');
  for (const lv of levels) {
    if (lv.E > lim.Emax) continue;
    const yl = toPx(0, lv.E).py;
    ctx.beginPath();
    ctx.moveTo(X0, yl); ctx.lineTo(X1, yl);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
    ctx.textAlign = 'right';
    ctx.fillText(`n=${lv.n}  E=${lv.E.toFixed(2)}`, X0 - 6, yl + 3);
  }

  // Selected wavefunction
  const idx = Math.max(0, Math.min(levels.length - 1, state.n - 1));
  const sel = levels[idx];
  const xs = buildXs();
  let psi;
  if (state.well === 'infinite') {
    psi = new Float64Array(xs.length);
    for (let i = 0; i < xs.length; i += 1) psi[i] = infiniteWellPsi(sel.n, xs[i], 2);
  } else if (state.well === 'finite') {
    psi = finiteWellPsi(sel.level, state.a, state.V0, xs);
  } else {
    psi = new Float64Array(xs.length);
    for (let i = 0; i < xs.length; i += 1) psi[i] = harmonicWellPsi(state.n - 1, xs[i]);
  }

  // Plot psi shifted to E_n with vertical scale chosen so amplitude is ~ 0.7 unit.
  let psiMax = 0;
  for (let i = 0; i < psi.length; i += 1) if (Math.abs(psi[i]) > psiMax) psiMax = Math.abs(psi[i]);
  const ampUnit = 0.7 * (lim.Emax / 10);
  const scale = psiMax > 0 ? ampUnit / psiMax : 1;
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < xs.length; i += 1) {
    const p = toPx(xs[i], sel.E + scale * psi[i]);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(110, 165, 215, 0.25)';
  ctx.beginPath();
  const fStart = toPx(xs[0], sel.E);
  ctx.moveTo(fStart.px, fStart.py);
  for (let i = 0; i < xs.length; i += 1) {
    const p = toPx(xs[i], sel.E + scale * psi[i]);
    ctx.lineTo(p.px, p.py);
  }
  const fEnd = toPx(xs[xs.length - 1], sel.E);
  ctx.lineTo(fEnd.px, fEnd.py);
  ctx.closePath();
  ctx.fill();

  // Highlight selected level
  const yh = toPx(0, sel.E).py;
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(X0, yh); ctx.lineTo(X1, yh);
  ctx.stroke();

  // Top-right readout
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'right';
  ctx.fillText(`well: ${state.well}`, X1, 18);
  ctx.fillText(`selected: n = ${sel.n}  E = ${sel.E.toFixed(3)}`, X1, 32);
  ctx.fillText(`bound states: ${levels.filter(l => l.E < lim.Emax).length}`, X1, 46);

  // x-axis tick
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i += 1) {
    const x = lim.xmin + (lim.xmax - lim.xmin) * (i / 4);
    const tt = toPx(x, 0);
    ctx.fillText(x.toFixed(1), tt.px, Y1 + 14);
  }
}

selWell.addEventListener('change', () => {
  state.well = selWell.value;
  // Reset n to 1 to avoid being out of range.
  state.n = 1;
  sliderN.value = '1';
  valueN.textContent = '1';
  drawAll();
});
sliderN.addEventListener('input', () => {
  state.n = parseInt(sliderN.value, 10);
  valueN.textContent = String(state.n);
  drawAll();
});
sliderV0.addEventListener('input', () => {
  state.V0 = parseInt(sliderV0.value, 10);
  valueV0.textContent = String(state.V0);
  drawAll();
});
sliderA.addEventListener('input', () => {
  state.a = parseFloat(sliderA.value);
  valueA.textContent = state.a.toFixed(2);
  drawAll();
});

function bootSync() {
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const stages = [
      { well: 'infinite', n: 1 },
      { well: 'infinite', n: 4 },
      { well: 'finite',   n: 1 },
      { well: 'finite',   n: 3 },
      { well: 'harmonic', n: 4 },
    ];
    const s = stages[Math.min(stages.length - 1, Math.round(frac * (stages.length - 1)))];
    state.well = s.well; state.n = s.n;
    selWell.value = state.well;
    sliderN.value = String(state.n);
    valueN.textContent = String(state.n);
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
