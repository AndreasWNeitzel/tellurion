import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Catenary as a hanging suspension bridge. The main cable is the
// fixed-length catenary through two draggable support towers; vertical
// hangers carry a deck. Grab either tower and slide it; the cable
// re-solves (sim.js solveCatenary2pt). The slider sets the cable length
// (slack). The symmetric y = a cosh(x/a) - a API is kept for the tests.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  tension, solveCatenary2pt, sampleCatenary2pt, catenary2ptY,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderA      = document.getElementById('slider-a');
const sliderSpeed  = document.getElementById('slider-speed');
const valueA       = document.getElementById('value-a');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

// World: x in [-2.4, 2.4], y up. Supports near the top, deck near y=0.
const X_LIM = 2.4, Y_LIM = 3.0;
const PAD = { l: 50, r: 30, t: 40, b: 50 };
function scale() {
  return Math.min((W - PAD.l - PAD.r) / (2 * X_LIM), (H - PAD.t - PAD.b) / Y_LIM);
}
function toPx(x, yw) {
  const s = scale();
  return { px: PAD.l + (W - PAD.l - PAD.r) / 2 + x * s, py: PAD.t + (Y_LIM - 0.3 - yw) * s };
}

const state = {
  P1: { x: -1.6, y: 2.2 },
  P2: { x:  1.6, y: 2.2 },
  L: 4.2,                  // cable length (slack); slider-controlled
  drag: null,              // 1 | 2 | null
  sway: 0,
  speed: parseInt(sliderSpeed.value, 10) || 2,   // was undefined -> NaN sway
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

// slider-a now controls cable length L (slack). Map its [0.4,3.0]-ish
// range onto a sensible L band relative to the support chord.
function chord() { return Math.hypot(state.P2.x - state.P1.x, state.P2.y - state.P1.y); }
sliderA.addEventListener('input', () => {
  const t = parseFloat(sliderA.value);
  state.L = chord() * (1.02 + 0.9 * (t - 0.4) / 2.6);
  valueA.textContent = state.L.toFixed(2);
  drawAll();
});
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => {
  state.P1 = { x: -1.6, y: 2.2 }; state.P2 = { x: 1.6, y: 2.2 }; state.L = 4.2;
  sliderA.value = '0.60'; valueA.textContent = '4.20'; drawAll();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function pxToWorld(cx, cy) {
  const r = canvas.getBoundingClientRect();
  const x = (cx - r.left) * (W / r.width), y = (cy - r.top) * (H / r.height);
  const s = scale();
  return {
    x: (x - PAD.l - (W - PAD.l - PAD.r) / 2) / s,
    y: (Y_LIM - 0.3) - (y - PAD.t) / s,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const w = pxToWorld(e.clientX, e.clientY);
  const d1 = Math.hypot(w.x - state.P1.x, w.y - state.P1.y);
  const d2 = Math.hypot(w.x - state.P2.x, w.y - state.P2.y);
  state.drag = d1 < d2 ? (d1 < 0.5 ? 1 : null) : (d2 < 0.5 ? 2 : null);
  canvas.classList.toggle('dragging', !!state.drag);
});
canvas.addEventListener('pointermove', (e) => {
  if (!state.drag) return;
  const w = pxToWorld(e.clientX, e.clientY);
  const P = state.drag === 1 ? state.P1 : state.P2;
  P.x = Math.max(-X_LIM + 0.1, Math.min(X_LIM - 0.1, w.x));
  P.y = Math.max(0.6, Math.min(Y_LIM - 0.5, w.y));
  if (state.L < chord() + 0.05) state.L = chord() + 0.05;   // keep solvable
  drawAll();
});
window.addEventListener('pointerup', () => { state.drag = null; canvas.classList.remove('dragging'); });

function drawAll() {
  // Sky and ground.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0a1020'); sky.addColorStop(1, '#0e0f14');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const ground = toPx(0, 0).py + 6;
  ctx.fillStyle = '#0b0c10'; ctx.fillRect(0, ground, W, H - ground);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(W, ground); ctx.stroke();

  const left  = state.P1.x <= state.P2.x ? state.P1 : state.P2;
  const right = state.P1.x <= state.P2.x ? state.P2 : state.P1;
  const swayY = state.playing ? 0.02 * Math.sin(state.sway) : 0;
  const L1 = { x: left.x, y: left.y + swayY }, R1 = { x: right.x, y: right.y - swayY };
  const sol = solveCatenary2pt(L1.x, L1.y, R1.x, R1.y, state.L);

  // Towers.
  for (const P of [L1, R1]) {
    const top = toPx(P.x, P.y), base = toPx(P.x, 0);
    ctx.strokeStyle = '#9aa6b8'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(top.px, top.py); ctx.lineTo(base.px, base.py); ctx.stroke();
    ctx.fillStyle = '#c7d0de';
    ctx.beginPath(); ctx.arc(top.px, top.py, 7, 0, 2 * Math.PI); ctx.fill();
  }

  // Deck: straight roadway between the tower bases.
  const b1 = toPx(L1.x, 0.18), b2 = toPx(R1.x, 0.18);
  ctx.strokeStyle = '#5b6472'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(b1.px, b1.py); ctx.lineTo(b2.px, b2.py); ctx.stroke();

  // Main cable + hangers.
  let aOut = null;
  if (sol) {
    aOut = sol.a;
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.4;
    ctx.beginPath();
    const { xs, ys } = sampleCatenary2pt(sol, L1.x, R1.x, 180);
    for (let i = 0; i < xs.length; i += 1) {
      const p = toPx(xs[i], ys[i]);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,209,102,0.45)'; ctx.lineWidth = 1;
    const nH = 22;
    for (let k = 1; k < nH; k += 1) {
      const x = L1.x + (R1.x - L1.x) * k / nH;
      const yc = catenary2ptY(sol, x);
      const deckY = 0.18 + (R1.x - L1.x !== 0 ? 0 : 0);
      if (yc <= deckY) continue;
      const a = toPx(x, yc), d = toPx(x, deckY);
      ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(d.px, d.py); ctx.stroke();
    }
  } else {
    // Cable too short for the span: it pulls taut (straight).
    ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 2.4;
    const p1 = toPx(L1.x, L1.y), p2 = toPx(R1.x, R1.y);
    ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
  }

  // Draggable handles.
  for (const [P, n] of [[L1, 1], [R1, 2]]) {
    const t = toPx(P.x, P.y);
    ctx.strokeStyle = state.drag === n ? '#06d6a0' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(t.px, t.py, 11, 0, 2 * Math.PI); ctx.stroke();
  }

  // Readouts.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  const span = Math.abs(R1.x - L1.x);
  const sagv = sol ? (Math.min(L1.y, R1.y) - (sol.a + sol.c)) : 0;
  ctx.fillText('Drag a tower. Cable length is fixed; the catenary re-solves.', 30, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(
    `a = ${aOut ? aOut.toFixed(3) : 'taut'}   L = ${state.L.toFixed(2)}   span = ${span.toFixed(2)}   sag = ${sagv > 0 ? sagv.toFixed(3) : '-'}   T_max ~ ${aOut ? tension(0, aOut).toFixed(2) : '-'}`,
    30, 42);
}

function tick() {
  if (state.playing) { state.sway += 0.03 * state.speed; drawAll(); }
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Stage: vary asymmetry + slack so frames differ.
    state.P1 = { x: -1.7, y: 1.4 + 1.0 * f };
    state.P2 = { x:  1.7, y: 2.3 - 0.8 * f };
    state.L  = chord() * (1.05 + 0.7 * f);
    valueA.textContent = state.L.toFixed(2);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
      }));
    }
    return;
  }
  valueA.textContent = state.L.toFixed(2);
  drawAll();
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
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
