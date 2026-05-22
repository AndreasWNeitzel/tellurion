// A regular Sturm-Liouville problem made physical: the modes of
// -(T y')' = lambda rho(x) y on [0, pi] with clamped ends ARE the
// normal modes of a string whose mass density rho(x) you can change.
// Uniform rho gives the textbook sin(n x), lambda_n = n^2. Loading the
// string (heavy centre, a step, a taper) bends the mode shapes and
// shifts the spectrum, yet the modes stay orthonormal under the
// rho-weighted inner product. Three views: the vibrating string with
// its visible density, the eigenvalue ladder against the n^2
// reference, and every requested mode (not just six). Click the string
// to re-pluck.

import {
  solveSL, projectWeighted, modeSumAt, nodeCount, eigenvalue, L,
} from './sim.js';
import { parseUrlState, applyState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? '0');

const canvas     = document.getElementById('stage');
const ctx        = canvas.getContext('2d', { alpha: false });
const readoutN   = document.getElementById('readout-n');
const readoutLam = document.getElementById('readout-lam');
const readoutNod = document.getElementById('readout-nod');
const sliderN    = document.getElementById('slider-N');
const valueN     = document.getElementById('value-N');
const selDens    = document.getElementById('sel-density');

const W = canvas.width, H = canvas.height;
const NGRID = 96;

let N = parseInt(sliderN.value, 10);
let densKind = selDens.value;
let sol = solveSL(densKind, NGRID, L);

// Initial profiles. Default: a smoothly loaded string. Click re-plucks
// to a triangular tent peaked at the cursor (a sharp corner, so the
// modal coefficients fall off slowly and N visibly matters).
const smoothProfile = (x) => Math.sin(Math.PI * x / L) * (0.6 + 0.4 * x / L);
let pluckP = null;
function currentProfile(x) {
  if (pluckP === null) return smoothProfile(x);
  return x < pluckP ? (x / pluckP) : ((L - x) / (L - pluckP));
}

let coeffs = projectWeighted(currentProfile, sol, N);
function reproject() { coeffs = projectWeighted(currentProfile, sol, N); }
function resolve() { sol = solveSL(densKind, NGRID, L); reproject(); }

sliderN.addEventListener('input', () => {
  N = parseInt(sliderN.value, 10);
  valueN.textContent = String(N);
  reproject();
});
selDens.addEventListener('change', () => {
  densKind = selDens.value;
  resolve();
});

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const py = (e.clientY - rect.top) / rect.height;
  if (py > 0.46) return;                         // only the string panel is pluckable
  const px = (e.clientX - rect.left) / rect.width;
  pluckP = Math.max(0.07 * L, Math.min(0.93 * L, px * L));
  reproject();
});

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    grid:   '#23252a',
  };
}

const TIME_SCALE = 0.55;
let clock = 0;

function modeColor(k, kMax, alpha = 1) {
  const t = (k - 1) / Math.max(1, kMax - 1);
  const r = 70 + Math.round(180 * t);
  const g = 130 + Math.round(95 * t);
  const b = 235 - Math.round(170 * t);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Sample the time-evolved string and the static reconstruction on the
// solver grid, returning pixel polylines plus the display normalisation.
function sampleString(t) {
  const ng = sol.n + 2;
  const live = new Float64Array(ng), env = new Float64Array(ng);
  let fMax = 1e-9;
  for (let j = 0; j < ng; j += 1) {
    live[j] = modeSumAt(sol, coeffs, N, j, t);
    let e = 0;
    for (let k = 1; k <= N; k += 1) e += coeffs[k] * sol.modes[k - 1][j];
    env[j] = e;
    fMax = Math.max(fMax, Math.abs(e), Math.abs(live[j]));
  }
  return { live, env, fMax, ng };
}

// Panel 1: the physical string. Stroke weight and warmth track the
// local density rho(x); a faint ribbon behind shows rho directly.
function drawString(c, x0, y0, w, h, t) {
  ctx.fillStyle = c.bg; ctx.fillRect(x0, y0, w, h);
  const padL = 50, padR = 18, padT = 30, padB = 24;
  const plotW = w - padL - padR;
  const midY = y0 + padT + (h - padT - padB) / 2;
  const amp = (h - padT - padB) * 0.40;
  const { live, env, fMax, ng } = sampleString(t);
  const xPix = (j) => x0 + padL + plotW * (j / (ng - 1));
  const yPix = (v) => midY - amp * v / fMax;

  // Density ribbon (the Sturm-Liouville weight, made visible).
  let rMax = 1e-9;
  for (let j = 0; j < ng; j += 1) rMax = Math.max(rMax, sol.rho[j]);
  const ribB = y0 + h - padB + 18;
  ctx.beginPath();
  ctx.moveTo(xPix(0), ribB);
  for (let j = 0; j < ng; j += 1) ctx.lineTo(xPix(j), ribB - 30 * sol.rho[j] / rMax);
  ctx.lineTo(xPix(ng - 1), ribB); ctx.closePath();
  ctx.fillStyle = 'rgba(120,150,255,0.16)'; ctx.fill();
  ctx.strokeStyle = 'rgba(120,150,255,0.4)'; ctx.lineWidth = 1; ctx.stroke();

  ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
  ctx.beginPath(); ctx.moveTo(xPix(0), midY); ctx.lineTo(xPix(ng - 1), midY); ctx.stroke();
  ctx.setLineDash([]);

  // Static reconstruction envelope (target the modal sum converges to).
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let j = 0; j < ng; j += 1) (j ? ctx.lineTo : ctx.moveTo).call(ctx, xPix(j), yPix(env[j]));
  ctx.stroke();

  // The vibrating string: segments coloured/weighted by local density.
  for (let j = 1; j < ng; j += 1) {
    const rA = sol.rho[j - 1] / rMax;
    ctx.strokeStyle = `rgba(255,${Math.round(209 - 120 * rA)},${Math.round(102 - 70 * rA)},0.9)`;
    ctx.lineWidth = 1.6 + 3.6 * rA;
    ctx.beginPath();
    ctx.moveTo(xPix(j - 1), yPix(live[j - 1]));
    ctx.lineTo(xPix(j), yPix(live[j]));
    ctx.stroke();
  }
  ctx.fillStyle = c.fg;
  for (const je of [0, ng - 1]) { ctx.beginPath(); ctx.arc(xPix(je), midY, 4.5, 0, 2 * Math.PI); ctx.fill(); }

  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('clamped string  -(T y′)′ = λ ρ(x) y    line weight = local density ρ', x0 + padL, y0 + 17);
  ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.textAlign = 'right';
  ctx.fillText(pluckP === null ? 'click string to pluck' : 'plucked', x0 + w - padR, y0 + 17);
}

// Panel 2: the eigenvalue ladder lambda_k, with faint open ticks at
// the uniform-string reference n^2 so the spectral shift is visible.
function drawSpectrum(c, x0, y0, w, h) {
  ctx.fillStyle = c.bg; ctx.fillRect(x0, y0, w, h);
  const padL = 50, padR = 16, padT = 22, padB = 26;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const K = N;
  let lamMax = 1;
  for (let k = 1; k <= K; k += 1) lamMax = Math.max(lamMax, sol.lambda[k - 1], eigenvalue(k));
  const xk = (k) => x0 + padL + plotW * (K === 1 ? 0.5 : (k - 1) / (K - 1));
  const yl = (lam) => y0 + padT + plotH * (1 - lam / lamMax);

  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + padL, y0 + padT + plotH); ctx.lineTo(x0 + padL + plotW, y0 + padT + plotH); ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('spectrum  λₖ   (open ticks: uniform-string reference n²)', x0 + padL, y0 + 15);

  for (let k = 1; k <= K; k += 1) {
    const xr = xk(k);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xr - 5, yl(eigenvalue(k))); ctx.lineTo(xr + 5, yl(eigenvalue(k))); ctx.stroke();
    const yv = yl(sol.lambda[k - 1]);
    ctx.strokeStyle = modeColor(k, K, 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xr, y0 + padT + plotH); ctx.lineTo(xr, yv); ctx.stroke();
    ctx.fillStyle = modeColor(k, K, 1);
    ctx.beginPath(); ctx.arc(xr, yv, 3.4, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('k = 1', xk(1), y0 + padT + plotH + 14);
  ctx.fillText(`k = ${K}`, xk(K), y0 + padT + plotH + 14);
}

// Panel 3: small multiples of every requested mode (capped only by N,
// never by a hard 6). Each cell shows psi_k breathing at sqrt(lambda_k)
// with its k-1 interior nodes.
function drawGallery(c, x0, y0, w, h, t) {
  ctx.fillStyle = c.bg; ctx.fillRect(x0, y0, w, h);
  const padT = 20, padB = 8, padX = 8;
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`normal modes ψₖ(x) cos(√λₖ t)   (showing all ${N})`, x0 + padX + 4, y0 + 14);

  const cols = N <= 4 ? N : (N <= 9 ? Math.ceil(N / 2) : (N <= 15 ? 5 : Math.ceil(N / 4)));
  const rows = Math.ceil(N / cols);
  const gw = (w - 2 * padX) / cols;
  const gh = (h - padT - padB) / rows;
  const ng = sol.n + 2;

  for (let k = 1; k <= N; k += 1) {
    const r = Math.floor((k - 1) / cols), col = (k - 1) % cols;
    const cx = x0 + padX + col * gw, cy = y0 + padT + r * gh;
    const mid = cy + gh * 0.52;
    const a = gh * 0.32;
    ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx + 6, mid); ctx.lineTo(cx + gw - 6, mid); ctx.stroke();
    const env = Math.cos(Math.sqrt(Math.max(0, sol.lambda[k - 1])) * t);
    const psi = sol.modes[k - 1];
    ctx.strokeStyle = modeColor(k, N, 1); ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let j = 0; j < ng; j += 1) {
      const xx = cx + 6 + (gw - 12) * (j / (ng - 1));
      const yy = mid - a * psi[j] * 1.05 * env;
      (j ? ctx.lineTo : ctx.moveTo).call(ctx, xx, yy);
    }
    ctx.stroke();
    ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillText(`k=${k}`, cx + 7, cy + 11);
  }
}

function render(t) {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  const h1 = H * 0.40, h2 = H * 0.24, h3 = H - h1 - h2;
  drawString(c, 0, 0, W, h1, t);
  drawSpectrum(c, 0, h1, W, h2);
  drawGallery(c, 0, h1 + h2, W, h3, t);
}

function updateReadout() {
  readoutN.textContent = String(N);
  readoutLam.textContent = sol.lambda[N - 1].toFixed(2);
  readoutNod.textContent = String(nodeCount(sol.modes[N - 1]));
}

let last = 0;
function loop(now) {
  if (!last) last = now;
  clock += Math.min(0.05, (now - last) / 1000) * TIME_SCALE;
  last = now;
  render(clock);
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const kinds = ['uniform', 'heavy-center', 'two-step', 'heavy-end', 'taper'];
    densKind = kinds[Math.min(kinds.length - 1, Math.floor(frac * kinds.length + 1e-6))];
    selDens.value = densKind;
    N = Math.max(2, Math.round(4 + frac * 14));
    sliderN.value = String(N); valueN.textContent = String(N);
    resolve();
    render(0.4 + 2.1 * frac);
    updateReadout();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, N, densKind };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      }));
    }
    return;
  }
  const st = parseUrlState();
  if (st) {
    applyState(st, { N: sliderN, density: selDens });
    N = parseInt(sliderN.value, 10);
    densKind = selDens.value;
  }
  valueN.textContent = String(N);
  resolve();
  render(0);
  updateReadout();
}

mountShareButton(
  document.getElementById('controls'),
  () => ({ N: String(N), density: densKind }),
  { label: 'Copy URL' },
);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(loop);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(loop);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'eigenvalue', label: 'eigenvalue lambda', value: state.lambda ? state.lambda.toFixed(2) : '0', format: 'string' },
    { key: 'mode-n', label: 'mode index', value: state.n || 0, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  return [ { key: 'lambda-positive', label: 'lambda > 0', value: (state.lambda || 0) > 0 ? 'pass' : 'pending', status: (state.lambda || 0) > 0 ? 'pass' : 'pending' } ];
};
