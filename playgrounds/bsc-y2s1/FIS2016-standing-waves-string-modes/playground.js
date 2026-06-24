import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Standing waves on a fixed-end string. Show selected mode or 1+3 superposition.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { yMode, ySuper, freqN, antinodes, nodes, L } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderN      = document.getElementById('slider-n');
const sliderSpeed  = document.getElementById('slider-speed');
const valueN       = document.getElementById('value-n');
const valueSpeed   = document.getElementById('value-speed');
const btnSuper     = document.getElementById('btn-superpose');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  n: 1,
  speed: 2,
  superpose: false,
  tNow: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

const HERO = { x: 30, y: 60, w: W - 60, h: 420 };
const DECOMP = { x: 30, y: 506, w: W - 60, h: 300 };
const SPEC = { x: 30, y: 832, w: W - 60, h: 168 };

function panel(p, title, color) {
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = color || 'rgba(220,230,245,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, p.x + 10, p.y + 18);
}

// Map x in [0, L] and y in [-1, 1] to a panel's interior plot area.
function mapper(p, amp) {
  const ax = p.x + 16, aw = p.w - 32, ay = p.y + 28, ah = p.h - 48;
  const midY = ay + ah / 2;
  return { X: (x) => ax + (x / L) * aw, Y: (y) => midY - y * (ah * 0.5 * amp), ax, aw, ay, ah, midY };
}
function plotW(M, fn, color, lw) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
  const Nx = 300; for (let i = 0; i <= Nx; i += 1) { const x = (i / Nx) * L; const px = M.X(x), py = M.Y(fn(x)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
}
function plotEnv(M, n, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
  for (const s of [1, -1]) { ctx.beginPath(); const Nx = 160; for (let i = 0; i <= Nx; i += 1) { const x = (i / Nx) * L; const px = M.X(x), py = M.Y(s * Math.sin(n * Math.PI * x / L)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
  ctx.setLineDash([]);
}

function drawHero() {
  const p = HERO;
  const label = state.superpose ? 'modes 1 + 3 superposition (a plucked-string sound)' : `mode n = ${state.n}, f_n = ${freqN(state.n).toFixed(2)} = n c / 2L`;
  panel(p, `standing wave on a fixed string: ${label}`, tok.accentCool);
  const M = mapper(p, 0.86);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(M.ax, M.midY); ctx.lineTo(M.ax + M.aw, M.midY); ctx.stroke();
  if (state.superpose) {
    const amps = [0, 1.0, 0, 0.5, 0, 0];
    plotEnv(M, 1, 'rgba(127,177,216,0.30)'); plotEnv(M, 3, 'rgba(214,138,105,0.30)');
    plotW(M, (x) => yMode(x, state.tNow, 1, 1.0), 'rgba(127,177,216,0.55)', 1);
    plotW(M, (x) => yMode(x, state.tNow, 3, 0.5), 'rgba(214,138,105,0.55)', 1);
    plotW(M, (x) => ySuper(x, state.tNow, amps), '#f1d28a', 2.6);
  } else {
    // shaded envelope
    ctx.fillStyle = 'rgba(127,177,216,0.08)'; ctx.beginPath();
    const Nx = 160; for (let i = 0; i <= Nx; i += 1) { const x = (i / Nx) * L; const px = M.X(x), py = M.Y(Math.sin(state.n * Math.PI * x / L)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    for (let i = Nx; i >= 0; i -= 1) { const x = (i / Nx) * L; ctx.lineTo(M.X(x), M.Y(-Math.sin(state.n * Math.PI * x / L))); }
    ctx.closePath(); ctx.fill();
    plotEnv(M, state.n, 'rgba(127,177,216,0.35)');
    plotW(M, (x) => yMode(x, state.tNow, state.n), tok.accentCool, 2.6);
    for (const xn of [0, ...nodes(state.n), L]) { const x = M.X(xn); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, M.midY - 7); ctx.lineTo(x, M.midY + 7); ctx.stroke(); }
    for (const xa of antinodes(state.n)) { ctx.fillStyle = tok.accentWarm; ctx.beginPath(); ctx.arc(M.X(xa), M.Y(yMode(xa, state.tNow, state.n)), 5, 0, 6.28); ctx.fill(); }
  }
  for (const xx of [0, L]) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(M.X(xx), M.midY, 5, 0, 6.28); ctx.fill(); }
  ctx.fillStyle = 'rgba(170,180,200,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`t = ${state.tNow.toFixed(2)}`, p.x + p.w - 10, p.y + 18);
}

function drawDecomp() {
  const p = DECOMP;
  panel(p, 'a standing wave is two travelling waves: right-mover + left-mover = sum', 'rgba(180,230,160,0.92)');
  const M = mapper(p, 0.80);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(M.ax, M.midY); ctx.lineTo(M.ax + M.aw, M.midY); ctx.stroke();
  if (state.superpose) {
    ctx.fillStyle = 'rgba(170,180,200,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('select a single mode to see its two travelling-wave halves', p.x + p.w / 2, M.midY); ctx.textBaseline = 'alphabetic'; return;
  }
  const n = state.n, k = n * Math.PI / L, w = 2 * Math.PI * freqN(n);
  const R = (x) => 0.5 * Math.sin(k * x - w * state.tNow);
  const Lf = (x) => 0.5 * Math.sin(k * x + w * state.tNow);
  plotW(M, R, 'rgba(127,177,216,0.75)', 1.5);
  plotW(M, Lf, 'rgba(214,138,105,0.75)', 1.5);
  plotW(M, (x) => R(x) + Lf(x), '#f1d28a', 2.6);
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(127,177,216,0.95)'; ctx.fillText('right-mover  ->', p.x + 14, p.y + p.h - 12);
  ctx.fillStyle = 'rgba(214,138,105,0.95)'; ctx.fillText('<-  left-mover', p.x + 180, p.y + p.h - 12);
  ctx.fillStyle = '#f1d28a'; ctx.textAlign = 'right'; ctx.fillText('sum = standing wave', p.x + p.w - 14, p.y + p.h - 12);
  ctx.textBaseline = 'alphabetic';
}

function drawSpectrum() {
  const p = SPEC;
  panel(p, 'harmonic spectrum  f_n = n c / (2 L)   (click a bar to select the mode)', 'rgba(205,180,240,0.92)');
  const NMODES = 6;
  const ax = p.x + 38, aw = p.w - 54, ay = p.y + 30, ah = p.h - 50;
  const fmax = freqN(NMODES) * 1.12, bw = aw / NMODES;
  SPEC._bars = [];
  for (let n = 1; n <= NMODES; n += 1) {
    const f = freqN(n), bh = (f / fmax) * ah;
    const bx = ax + (n - 1) * bw + bw * 0.18, bwid = bw * 0.64;
    const active = state.superpose ? (n === 1 || n === 3) : (n === state.n);
    const warm = state.superpose && n === 3;
    ctx.fillStyle = active ? (warm ? 'rgba(214,138,105,0.9)' : 'rgba(127,177,216,0.9)') : 'rgba(120,140,170,0.32)';
    ctx.fillRect(bx, ay + ah - bh, bwid, bh);
    SPEC._bars.push({ cx0: ax + (n - 1) * bw, cx1: ax + n * bw, n });
    ctx.fillStyle = active ? '#fff' : 'rgba(180,190,210,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(`n=${n}`, bx + bwid / 2, ay + ah + 5);
    ctx.textBaseline = 'alphabetic'; ctx.fillText(f.toFixed(1), bx + bwid / 2, ay + ah - bh - 6);
  }
  ctx.save(); ctx.translate(p.x + 14, ay + ah / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = 'rgba(170,180,200,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('f_n', 0, 0); ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

function drawAll() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  drawHero();
  drawDecomp();
  drawSpectrum();
}

function tickN(n) { for (let i = 0; i < n; i += 1) state.tNow += 0.01; }   // halved from 0.02

sliderN.addEventListener('input', () => { state.n = parseInt(sliderN.value, 10); valueN.textContent = String(state.n); state.superpose = false; btnSuper.textContent = 'superpose 1+3'; drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnSuper.addEventListener('click', () => {
  state.superpose = !state.superpose;
  btnSuper.textContent = state.superpose ? 'single mode' : 'superpose 1+3';
  drawAll();
});
btnReset.addEventListener('click', () => { state.tNow = 0; drawAll(); });
canvas.addEventListener('click', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const cx = (ev.clientX - rect.left) * (W / rect.width);
  const cy = (ev.clientY - rect.top) * (H / rect.height);
  if (!SPEC._bars || cy < SPEC.y || cy > SPEC.y + SPEC.h) return;
  for (const b of SPEC._bars) {
    if (cx >= b.cx0 && cx <= b.cx1) {
      state.n = b.n; state.superpose = false;
      sliderN.value = String(b.n); valueN.textContent = String(b.n);
      btnSuper.textContent = 'superpose 1+3';
      drawAll(); return;
    }
  }
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Sweep through modes for variety: 0 -> mode 1, 0.25 -> mode 2, etc.
    state.n = Math.min(5, 1 + Math.floor(frac * 5));
    sliderN.value = String(state.n); valueN.textContent = String(state.n);
    state.tNow = frac * 2.0;
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
    tickN(state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
// State reports the mode number and its frequency. The invariant is
// the defining property of a standing wave: the nodes are stationary
// zeros, so the displacement evaluated at every node position must
// be zero for all time (unlike a travelling wave, where the zeros
// move).
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'mode', label: 'mode number n', value: String(state.n) },
      { key: 'frequency', label: 'mode frequency f_n', value: freqN(state.n), format: 'float' },
      { key: 'superpose', label: 'superposition', value: state.superpose ? 'on' : 'off' },
    ],
  };
};
window.playground.getInvariants = function () {
  const n = state.n;
  const nd = nodes(n);
  let worst = 0;
  for (let k = 0; k < nd.length; k += 1) {
    worst = Math.max(worst, Math.abs(yMode(nd[k], state.tNow, n)));
  }
  return [{
    key: 'nodes',
    label: 'standing-wave nodes are stationary zeros',
    value: worst.toExponential(2),
    status: worst < 1e-9 ? 'pass' : (worst < 1e-4 ? 'pending' : 'drift'),
  }];
};
