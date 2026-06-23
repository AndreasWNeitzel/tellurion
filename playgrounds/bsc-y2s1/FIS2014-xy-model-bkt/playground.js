import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// XY model with vortex overlay.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createXY, sweep, magnetization, energyPerSite, vortexMap, setTemperature, T_BKT } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderT      = document.getElementById('slider-T');
const sliderL      = document.getElementById('slider-L');
const sliderSpeed  = document.getElementById('slider-speed');
const valueT       = document.getElementById('value-T');
const valueL       = document.getElementById('value-L');
const valueSpeed   = document.getElementById('value-speed');
const btnCold      = document.getElementById('btn-cold');
const btnHot       = document.getElementById('btn-hot');

const W = canvas.width, H = canvas.height;
const state = { xy: null, T: 0.7, L: 64, speed: 3, playing: !(DETERMINISTIC || prefersReducedMotion()), hist: [] };

// Field zone (top) and diagnostic zone (bottom): the old layout left the
// whole lower third of the portrait canvas black.
const FIELD = { x: 60, y: 52, s: Math.min(W - 120, 700) };
FIELD.x = (W - FIELD.s) / 2;
const DIAG = { x: 44, y: FIELD.y + FIELD.s + 40, w: W - 88, h: H - (FIELD.y + FIELD.s + 40) - 30 };

function rebuild(init = 'hot') {
  state.xy = createXY({ L: state.L, T: state.T, seed: SEED, init });
  state.hist = [];
}
function record() {
  if (!state.xy) return;
  const { nPlus, nMinus } = vortexMap(state.xy);
  state.hist.push({ nv: nPlus + nMinus, m: Math.abs(magnetization(state.xy)) });
  if (state.hist.length > 400) state.hist.shift();
}

function hsv(h, s, v) {
  const c = v * s;
  const hp = (h * 6) % 6;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) { r = c; g = x; b = 0; }
  else if (hp < 2) { r = x; g = c; b = 0; }
  else if (hp < 3) { r = 0; g = c; b = x; }
  else if (hp < 4) { r = 0; g = x; b = c; }
  else if (hp < 5) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const m = v - c;
  return [Math.round(255 * (r + m)), Math.round(255 * (g + m)), Math.round(255 * (b + m))];
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const { L, theta } = state.xy;
  const cell = FIELD.s / L;
  const x0 = FIELD.x, y0 = FIELD.y;

  // title
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = '#9aa0a6';
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('Spin-angle field; circles mark free vortices (+) and antivortices (-)', x0, y0 - 12);

  for (let j = 0; j < L; j += 1) {
    for (let i = 0; i < L; i += 1) {
      const t = theta[j * L + i];
      const h = ((t / (2 * Math.PI)) + 1) % 1;
      const [r, g, b] = hsv(h, 0.80, 0.60);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x0 + i * cell, y0 + j * cell, cell + 0.6, cell + 0.6);
    }
  }
  // Vortex overlay, ringed in white so the topological defects pop out of the
  // colourful field. These are the objects that unbind at the BKT transition.
  const { v, nPlus, nMinus } = vortexMap(state.xy);
  for (let j = 0; j < L; j += 1) {
    for (let i = 0; i < L; i += 1) {
      const c = v[j * L + i];
      if (c === 0) continue;
      const px = x0 + (i + 1) * cell, py = y0 + (j + 1) * cell;
      const rad = Math.max(2.5, cell * 0.42);
      ctx.fillStyle = c === 1 ? '#ff4040' : '#4d7bff';
      ctx.beginPath(); ctx.arc(px, py, rad, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(px, py, rad, 0, 2 * Math.PI); ctx.stroke();
    }
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, FIELD.s - 1, FIELD.s - 1);

  // Readout panel, top-left over the field.
  const m = magnetization(state.xy), e = energyPerSite(state.xy);
  ctx.font = fontString(canvas, 'caption', 'mono');
  const rows = [
    ['T', state.T.toFixed(2)], ['T_BKT', T_BKT.toFixed(3)], ['T / T_BKT', (state.T / T_BKT).toFixed(2)],
    ['L', String(state.L)], ['|m|', m.toFixed(3)], ['e/site', e.toFixed(3)],
    ['vortices (+)', String(nPlus)], ['vortices (-)', String(nMinus)],
  ];
  const pad = 8, panelW = 230, rowH = 15, panelH = rows.length * rowH + pad * 2;
  ctx.fillStyle = 'rgba(10, 12, 18, 0.82)'; ctx.fillRect(x0 + 8, y0 + 8, panelW, panelH);
  ctx.strokeStyle = 'rgba(220, 225, 235, 0.4)'; ctx.strokeRect(x0 + 8.5, y0 + 8.5, panelW - 1, panelH - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'; ctx.textBaseline = 'alphabetic';
  let y = y0 + 8 + pad + 11;
  for (const [k, v2] of rows) {
    ctx.textAlign = 'left'; ctx.fillStyle = k.startsWith('vortices') ? (k.includes('+') ? '#ff8080' : '#8fa8ff') : 'rgba(255,255,255,0.92)';
    ctx.fillText(k, x0 + 16, y);
    ctx.textAlign = 'right'; ctx.fillText(v2, x0 + 8 + panelW - 8, y); y += rowH;
  }
  ctx.textAlign = 'left';

  drawDiag();
}

// Diagnostic: free-vortex count and |m| over Monte Carlo time. Below T_BKT
// vortices stay bound in pairs and annihilate (count low, |m| held up by
// finite size); above T_BKT free vortices proliferate and |m| collapses.
function drawDiag() {
  const r = DIAG;
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = '#9aa0a6';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('Free vortices and |m| vs Monte Carlo sweeps', r.x + 10, r.y + 7);

  const padL = 46, padR = 46, padT = 28, padB = 24;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, y0 = r.y + padT, y1 = r.y + r.h - padB;
  const h = state.hist;
  const nvMax = Math.max(8, ...h.map((p) => p.nv));
  const X = (k) => x0 + (x1 - x0) * (h.length <= 1 ? 0 : k / (h.length - 1));
  const yNv = (nv) => y1 - (nv / nvMax) * (y1 - y0);
  const yM = (mm) => y1 - mm * (y1 - y0);

  // left axis (vortices), right axis (|m| 0..1)
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = '#6e757f';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const f of [0, 0.5, 1]) {
    const yy = y1 - f * (y1 - y0);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    ctx.fillStyle = '#7fd0ff'; ctx.fillText(Math.round(f * nvMax), x0 - 6, yy);
    ctx.fillStyle = '#f5b942'; ctx.textAlign = 'left'; ctx.fillText(f.toFixed(1), x1 + 6, yy); ctx.textAlign = 'right';
  }
  if (h.length > 1) {
    ctx.strokeStyle = '#7fd0ff'; ctx.lineWidth = 2; ctx.beginPath();
    h.forEach((p, k) => { const Y = yNv(p.nv); k ? ctx.lineTo(X(k), Y) : ctx.moveTo(X(k), Y); }); ctx.stroke();
    ctx.strokeStyle = '#f5b942'; ctx.lineWidth = 1.8; ctx.beginPath();
    h.forEach((p, k) => { const Y = yM(p.m); k ? ctx.lineTo(X(k), Y) : ctx.moveTo(X(k), Y); }); ctx.stroke();
  }
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#7fd0ff'; ctx.fillText('free vortices', x0 + 6, y0 + 4);
  ctx.fillStyle = '#f5b942'; ctx.fillText('|m|', x0 + 132, y0 + 4);
  const regime = state.T < T_BKT ? 'bound pairs (quasi-ordered)' : 'free vortices (disordered)';
  ctx.fillStyle = '#9aa0a6'; ctx.textAlign = 'right'; ctx.fillText(`T/T_BKT = ${(state.T / T_BKT).toFixed(2)}  ${regime}`, x1, y0 + 4);
}

function tickN(n) { if (state.xy) { sweep(state.xy, n); record(); } }

sliderT.addEventListener('input', () => {
  state.T = parseFloat(sliderT.value);
  valueT.textContent = state.T.toFixed(2);
  if (state.xy) setTemperature(state.xy, state.T);
});
sliderL.addEventListener('change', () => {
  state.L = parseInt(sliderL.value, 10);
  valueL.textContent = String(state.L);
  rebuild('hot'); record(); drawAll();
});
sliderSpeed.addEventListener('input', () => {
  state.speed = parseInt(sliderSpeed.value, 10);
  valueSpeed.textContent = String(state.speed);
});
btnCold.addEventListener('click', () => { rebuild('cold'); record(); drawAll(); });
btnHot.addEventListener('click', () => { rebuild('hot'); record(); drawAll(); });
const btnPlayPause = document.getElementById('btn-playpause');
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    state.playing = !state.playing;
    btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  });
}

function bootSync() {
  rebuild('hot');
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const Ts = [0.20, 0.60, T_BKT, 1.30, 2.20];
    state.T = Ts[Math.min(Ts.length - 1, Math.round(frac * (Ts.length - 1)))];
    sliderT.value = state.T.toFixed(2);
    valueT.textContent = state.T.toFixed(2);
    setTemperature(state.xy, state.T);
    for (let k = 0; k < 40; k += 1) { sweep(state.xy, 5); record(); }
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
  record(); drawAll();
}

function tick() {
  if (state.playing) { tickN(state.speed); drawAll(); }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const E = energyPerSite(state.xy);
  const M = magnetization(state.xy);
  return {
    fields: [
      { key: 'L', label: 'Lattice size L', value: state.L, format: 'float' },
      { key: 'T', label: 'Temperature T', value: state.T, format: 'float' },
      { key: 'T_BKT', label: 'BKT transition T', value: T_BKT, format: 'float' },
      { key: 'E', label: 'Energy per site', value: E, format: 'float' },
      { key: 'M', label: 'Magnetization', value: M, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const regime = state.T < T_BKT ? 'ordered' : 'disordered';
  return [{
    key: 'bkt-phase',
    label: `Phase (T vs Tc=0.893): ${regime}`,
    value: regime,
    status: 'pass'
  }];
};
