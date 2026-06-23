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

// Auto-climb the eigenstate ladder: the selected level sweeps up and down
// through the bound states of the current well, so the wavefunction gains and
// sheds nodes and travels the full energy axis. Any control pauses it.
let _nf = 1, nDir = 1, _last = (typeof performance !== 'undefined' ? performance.now() : 0);
let playing = !(DETERMINISTIC || prefersReducedMotion());
function maxNForWell() {
  if (state.well === 'infinite') return 8;
  if (state.well === 'harmonic') return 9;
  return Math.max(1, finiteWellLevels(state.a, state.V0).length);
}

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

function psiForLevel(lv, xs) {
  if (state.well === 'infinite') {
    const arr = new Float64Array(xs.length);
    for (let i = 0; i < xs.length; i += 1) arr[i] = infiniteWellPsi(lv.n, xs[i], 2);
    return arr;
  }
  if (state.well === 'finite') return finiteWellPsi(lv.level, state.a, state.V0, xs);
  const arr = new Float64Array(xs.length);
  for (let i = 0; i < xs.length; i += 1) arr[i] = harmonicWellPsi(lv.n - 1, xs[i]);
  return arr;
}

function computeLevels() {
  const levels = [];
  if (state.well === 'infinite') {
    for (let n = 1; n <= 8; n += 1) levels.push({ n, E: infiniteWellE(n, 2) });
  } else if (state.well === 'finite') {
    const ls = finiteWellLevels(state.a, state.V0);
    for (let i = 0; i < ls.length; i += 1) levels.push({ n: i + 1, E: ls[i].E, level: ls[i] });
  } else {
    for (let n = 0; n <= 8; n += 1) levels.push({ n: n + 1, E: harmonicWellE(n) });
  }
  return levels;
}

// Bottom diagnostic: the full energy spectrum E_n vs n. This carries the
// physics the stacked plot only hints at, that the infinite well climbs as
// n^2, the harmonic oscillator is an evenly spaced ladder, and the finite
// well holds only a handful of bound states before the continuum.
function drawSpectrum(levels, sel, X0, X1) {
  const Yd0 = Math.round(H * 0.745), Yd1 = H - 42;
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 0.5;
  ctx.strokeRect(X0, Yd0, X1 - X0, Yd1 - Yd0);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.textAlign = 'left';
  const law = state.well === 'infinite' ? 'energy spectrum: E_n grows as n^2 (rises ever steeper)'
            : state.well === 'harmonic' ? 'energy spectrum: E_n = (n - 1/2) hw, an evenly spaced ladder'
            : 'energy spectrum: a finite well holds only a few bound levels, then a continuum';
  ctx.fillText(law, X0 + 4, Yd0 - 6);
  const nMax = Math.max(...levels.map((l) => l.n));
  const eMax = Math.max(...levels.map((l) => l.E)) * 1.08;
  const sx = (n) => X0 + (X1 - X0) * (n - 0.4) / (nMax + 0.4);
  const sy = (e) => Yd1 - 18 - (Yd1 - Yd0 - 30) * (e / eMax);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(X0, Yd1 - 18); ctx.lineTo(X1, Yd1 - 18); ctx.stroke();
  for (const lv of levels) {
    const isSel = lv.n === sel.n;
    const x = sx(lv.n), y = sy(lv.E);
    ctx.strokeStyle = isSel ? tok.accentWarm : 'rgba(120,150,200,0.55)';
    ctx.lineWidth = isSel ? 2.2 : 1.2;
    ctx.beginPath(); ctx.moveTo(x, Yd1 - 18); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = isSel ? tok.accentWarm : 'rgba(150,180,225,0.85)';
    ctx.beginPath(); ctx.arc(x, y, isSel ? 4.2 : 2.6, 0, 2 * Math.PI); ctx.fill();
    if (isSel || lv.n % 2 === 1 || nMax <= 6) {
      ctx.fillStyle = isSel ? 'rgba(255,180,160,0.95)' : 'rgba(255,255,255,0.45)';
      ctx.textAlign = 'center'; ctx.fillText(String(lv.n), x, Yd1 - 4);
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'right';
  ctx.fillText('E', X0 - 4, Yd0 + 12);
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const lim = viewLimits();
  const X0 = 120, X1 = W - 40;
  const Y0 = 34, Y1 = Math.round(H * 0.70);   // main well panel

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
  if (state.well === 'infinite') {
    const w0 = toPx(0, 0), wTop = toPx(0, lim.Emax), w1 = toPx(2, 0), wTop1 = toPx(2, lim.Emax);
    ctx.beginPath();
    ctx.moveTo(w0.px, w0.py); ctx.lineTo(wTop.px, wTop.py);
    ctx.moveTo(w1.px, w1.py); ctx.lineTo(wTop1.px, wTop1.py);
    ctx.stroke();
  }

  const levels = computeLevels();
  const visible = levels.filter((l) => l.E <= lim.Emax);
  const idx = Math.max(0, Math.min(levels.length - 1, state.n - 1));
  const sel = levels[idx];
  const xs = buildXs();

  // Stack EVERY eigenfunction at its own energy level: the canonical
  // particle-in-a-well figure. The selected state is bright and filled and
  // sweeps the ladder; the rest sit faint at their energies, so the panel is
  // full of structure instead of a single curve in a sea of black.
  const ampUnit = 0.34 * (lim.Emax / Math.max(2, visible.length));
  ctx.font = fontString(canvas, 'tick', 'mono');
  for (const lv of visible) {
    const isSel = lv.n === sel.n;
    const yl = toPx(0, lv.E).py;
    ctx.strokeStyle = isSel ? 'rgba(193,59,39,0.85)' : 'rgba(255,255,255,0.14)';
    ctx.lineWidth = isSel ? 1.1 : 0.6;
    ctx.beginPath(); ctx.moveTo(X0, yl); ctx.lineTo(X1, yl); ctx.stroke();
    ctx.fillStyle = isSel ? 'rgba(255,180,160,0.95)' : 'rgba(255,255,255,0.40)';
    ctx.textAlign = 'right';
    ctx.fillText(`n=${lv.n}`, X0 - 6, yl + 3);

    const psi = psiForLevel(lv, xs);
    let pmax = 0; for (let i = 0; i < psi.length; i += 1) if (Math.abs(psi[i]) > pmax) pmax = Math.abs(psi[i]);
    const sc = pmax > 0 ? ampUnit / pmax : 1;
    if (isSel) {
      ctx.fillStyle = 'rgba(110,165,215,0.22)';
      ctx.beginPath();
      const s0 = toPx(xs[0], lv.E); ctx.moveTo(s0.px, s0.py);
      for (let i = 0; i < xs.length; i += 1) { const p = toPx(xs[i], lv.E + sc * psi[i]); ctx.lineTo(p.px, p.py); }
      const sE = toPx(xs[xs.length - 1], lv.E); ctx.lineTo(sE.px, sE.py); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = tok.accent; ctx.lineWidth = 2.2;
    } else {
      ctx.strokeStyle = 'rgba(120,150,200,0.42)'; ctx.lineWidth = 1.0;
    }
    ctx.beginPath();
    for (let i = 0; i < xs.length; i += 1) { const p = toPx(xs[i], lv.E + sc * psi[i]); if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py); }
    ctx.stroke();
  }

  // Top-right readout
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'right';
  ctx.fillText(`well: ${state.well}`, X1, 18);
  ctx.fillText(`selected n=${sel.n}  E=${sel.E.toFixed(3)}`, X1, 32);
  ctx.fillText(`bound states: ${visible.length}`, X1, 46);

  // Axis labels and ticks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i += 1) {
    const x = lim.xmin + (lim.xmax - lim.xmin) * (i / 4);
    const tt = toPx(x, 0);
    ctx.fillText(x.toFixed(1), tt.px, Y1 + 14);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'left';
  ctx.fillText('x (position)', X1 - 78, Y1 + 28);
  ctx.save(); ctx.translate(X0 - 84, (Y0 + Y1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('energy E (wavefunctions stacked at E_n)', 0, 0); ctx.restore();

  drawSpectrum(levels, sel, X0, X1);
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
  playing = false;                                       // user picked a level; stop the climb
  state.n = parseInt(sliderN.value, 10);
  _nf = state.n;
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

function tick(now) {
  if (playing) {
    const dt = Math.min(0.05, (now - _last) / 1000 || 0);
    const nMax = maxNForWell();
    _nf += nDir * dt * 1.1;                               // ~0.9 s per level
    if (_nf >= nMax) { _nf = nMax; nDir = -1; } else if (_nf <= 1) { _nf = 1; nDir = 1; }
    const n = Math.round(_nf);
    if (n !== state.n) { state.n = n; sliderN.value = String(n); valueN.textContent = String(n); }
  }
  _last = now;
  drawAll();
  requestAnimationFrame(tick);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME && playing) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME && playing) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'well-type', label: 'potential type', value: state.well, format: 'string' },
    { key: 'quantum-number', label: 'quantum level n', value: state.n, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  return [ { key: 'n-positive', label: 'n >= 1', value: state.n >= 1 ? 'pass' : 'drift', status: state.n >= 1 ? 'pass' : 'drift' } ];
};
