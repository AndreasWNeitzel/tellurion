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

// Numerical "shooting" reference for the SAME Hamiltonian the rest of the
// card uses, H = -psi''/2 + V with V = |x|^p / p. A Numerov sweep integrates
// psi from the left wall across the well for a trial E; the endpoint psi(+L)
// changes sign at every eigenvalue, so scanning E and bisecting each crossing
// yields the bound levels in order. This is what the card title means by
// "shooting", and unlike a closed-form table it works for any p, so the
// reference column is never empty. (sim.js EXACT_LEVELS holds a closed form
// only for p = 2 and, in a different convention, p = 4; this solver is the
// self-consistent reference for the displayed potential at every p.)
const _numCache = { key: null, val: null };
function numerovLevels(p, nMax) {
  const L = 9.0;
  const Vwall = Math.pow(L, p) / p;
  const eCap = Math.min(Vwall * 0.88, 80);
  const key = `${p.toFixed(3)}|${nMax}`;
  if (_numCache.key === key) return _numCache.val;
  const N = 1000, h = (2 * L) / N;
  const V = (x) => Math.pow(Math.abs(x), p) / p;
  function shootEnd(E) {
    let psiPrev = 0.0, psi = 1e-8;
    const f0 = (xx) => 1 + (h * h / 12) * 2 * (E - V(xx));
    let x1 = -L + h, fPrev = f0(-L), fCur = f0(x1);
    for (let i = 1; i < N; i += 1) {
      const x2 = x1 + h, fNext = f0(x2);
      const psiNext = ((12 - 10 * fCur) * psi - fPrev * psiPrev) / fNext;
      psiPrev = psi; psi = psiNext; fPrev = fCur; fCur = fNext; x1 = x2;
      if (Math.abs(psi) > 1e12) { psi *= 1e-12; psiPrev *= 1e-12; }   // rescale, sign preserved
    }
    return psi;
  }
  const levels = [];
  const dE = Math.max(0.012, eCap / 600);
  let prevV = shootEnd(1e-4);
  for (let E = 1e-4 + dE; E <= eCap && levels.length < nMax; E += dE) {
    const v = shootEnd(E);
    if (prevV * v < 0) {
      let a = E - dE, b = E, fa = prevV;
      for (let it = 0; it < 46; it += 1) {
        const m = 0.5 * (a + b), fm = shootEnd(m);
        if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
      }
      levels.push(0.5 * (a + b));
    }
    prevV = v;
  }
  _numCache.key = key; _numCache.val = levels;
  return levels;
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const PLOT_X = 80, PLOT_W = W - 160;
  const PLOT_Y = 40, PLOT_H = H - 100;
  // V(x) plot region on the left, energy ladder on the right.
  // Half panel: V(x) profile + BS turning points

  const xMaxView = 4.0;
  const potFn = POTENTIALS.power(state.p);
  // Compute ladders. The shooting solver runs first so the energy axis can be
  // scaled to the actual top level (otherwise high-p wells, whose levels climb
  // fast, would push the upper states off a fixed axis and leave a void).
  const ex = numerovLevels(state.p, state.nMax);
  const topShoot = ex.length ? ex[ex.length - 1] : (state.nMax + 1);
  const eMax = Math.max(6, topShoot * 1.12);
  const bs = bohrSommerfeldLadder(potFn, state.nMax, eMax + 5);

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

  // Shooting (numerical) ladder on the right, plus a thin connector to each
  // matching BS level so the WKB error is visible as the vertical gap.
  ctx.lineWidth = 1.5;
  for (let n = 0; n < state.nMax && n < ex.length; n += 1) {
    if (ex[n] > eMax) break;
    const y = eToY(ex[n]);
    ctx.strokeStyle = tok.accentWarm;
    ctx.beginPath();
    ctx.moveTo(E_X0 + (E_X1 - E_X0) * 0.55, y); ctx.lineTo(E_X1 - 10, y);
    ctx.stroke();
    ctx.fillStyle = tok.accentWarm;
    ctx.textAlign = 'right';
    ctx.fillText(`${ex[n].toFixed(3)}`, E_X1 - 14, y - 3);
    // connector showing the BS-to-shooting gap (the WKB error for level n)
    if (n < bs.length && bs[n] <= eMax) {
      const yb = eToY(bs[n]);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(E_X0 + (E_X1 - E_X0) * 0.45, yb);
      ctx.lineTo(E_X0 + (E_X1 - E_X0) * 0.55, y);
      ctx.stroke();
      ctx.lineWidth = 1.5;
    }
  }

  // Legend
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = tok.accent;
  ctx.textAlign = 'left';
  ctx.fillText('Bohr-Sommerfeld', E_X0 + 8, PLOT_Y - 8);
  ctx.fillStyle = tok.accentWarm;
  ctx.textAlign = 'right';
  ctx.fillText('shooting', E_X1 - 8, PLOT_Y - 8);

  // Readout: the WKB error shrinks as n grows (semiclassical limit), so show
  // it at both the ground state and the top level.
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  const nHi = Math.min(state.nMax, ex.length) - 1;
  const rows = [
    ['p',     state.p.toFixed(2)],
    ['nMax',  String(state.nMax)],
    ['E0 BS / shoot', `${bs[0].toFixed(3)} / ${ex[0].toFixed(3)}`],
    ['WKB rel err n=0', (Math.abs(bs[0] - ex[0]) / ex[0] * 100).toFixed(2) + '%'],
  ];
  if (nHi > 0) rows.push(['WKB rel err n=' + nHi, (Math.abs(bs[nHi] - ex[nHi]) / ex[nHi] * 100).toFixed(2) + '%']);
  let y = PLOT_Y + PLOT_H + 22;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, PLOT_X, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, PLOT_X + 250, y);
    y += 14;
    if (y > H - 4) break;
  }
}

// Auto-sweep the potential power so the well morphs from harmonic (p=2)
// toward a box (high p) on load, and the WKB-vs-exact level agreement evolves
// with it. Either slider pauses the sweep.
let playing = !(DETERMINISTIC || prefersReducedMotion()), pDir = 1, _last = performance.now();
const pLo = parseFloat(sliderP.min) || 1.5, pHi = parseFloat(sliderP.max) || 6;
sliderP.addEventListener('input', () => {
  playing = false;
  state.p = parseFloat(sliderP.value);
  valueP.textContent = state.p.toFixed(2);
  drawAll();
});
sliderNmax.addEventListener('input', () => {
  playing = false;
  state.nMax = parseInt(sliderNmax.value, 10);
  valueNmax.textContent = String(state.nMax);
  drawAll();
});
function tick(now) {
  if (playing) {
    const dt = Math.min(0.05, (now - _last) / 1000 || 0);
    state.p += pDir * dt * ((pHi - pLo) / 12);
    if (state.p >= pHi) { state.p = pHi; pDir = -1; } else if (state.p <= pLo) { state.p = pLo; pDir = 1; }
    sliderP.value = state.p.toFixed(2); valueP.textContent = state.p.toFixed(2);
  }
  _last = now;
  drawAll();
  requestAnimationFrame(tick);
}

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
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME && playing) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME && playing) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const potFn = POTENTIALS.power(state.p);
  const bs = bohrSommerfeldLadder(potFn, state.nMax, Math.max(8, state.nMax + 2) + 5);
  const ex = (Math.abs(state.p - 2) < 0.01) ? EXACT_LEVELS[2](0) : (Math.abs(state.p - 4) < 0.01) ? EXACT_LEVELS[4][0] : null;
  const fields = [
    { key: 'exponent-p', label: 'potential exponent p', value: parseFloat(state.p.toFixed(2)), format: 'float' },
    { key: 'nmax', label: 'maximum quantum level', value: state.nMax, format: 'float' },
    { key: 'e0-bs', label: 'E0 Bohr-Sommerfeld', value: parseFloat(bs[0].toFixed(3)), format: 'float' },
    { key: 'e0-exact', label: 'E0 exact reference', value: ex !== null ? parseFloat(ex.toFixed(3)) : 'n/a (p = 2 or 4 only)', format: ex !== null ? 'float' : 'text' },
  ];
  return { fields };
};
window.playground.getInvariants = function () {
  const inv = [];
  const potFn = POTENTIALS.power(state.p);
  const eMax = Math.max(8, state.nMax + 2);
  const bs = bohrSommerfeldLadder(potFn, state.nMax, eMax + 5);
  const ex = (Math.abs(state.p - 2) < 0.01) ? new Array(state.nMax).fill(null).map((_, n) => EXACT_LEVELS[2](n)) : (Math.abs(state.p - 4) < 0.01) ? EXACT_LEVELS[4].slice(0, state.nMax) : null;
  if (ex !== null) {
    const relErr0 = Math.abs((bs[0] - ex[0]) / ex[0]);
    inv.push({
      key: 'bs-accuracy',
      label: 'relative error E0',
      value: (relErr0 * 100).toExponential(2) + '%',
      status: relErr0 < 0.1 ? 'pass' : (relErr0 < 0.3 ? 'pending' : 'drift'),
    });
  } else {
    inv.push({
      key: 'bs-monotone',
      label: 'BS levels increasing',
      value: (bs[state.nMax - 1] > bs[0]) ? 'pass' : 'drift',
      status: (bs[state.nMax - 1] > bs[0]) ? 'pass' : 'drift',
    });
  }
  inv.push({
    key: 'positive-levels',
    label: 'all levels positive',
    value: bs.slice(0, state.nMax).every(e => e > 0) ? 'pass' : 'drift',
    status: bs.slice(0, state.nMax).every(e => e > 0) ? 'pass' : 'drift',
  });
  return inv;
};
