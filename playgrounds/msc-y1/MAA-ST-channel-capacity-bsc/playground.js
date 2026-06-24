import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// BSC: capacity curve, repetition-code BER curves, sliding p cursor.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  binaryEntropy, capacityBSC, repetitionCodeError, simulateBSC,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderP      = document.getElementById('slider-p');
const sliderSpeed  = document.getElementById('slider-speed');
const valueP       = document.getElementById('value-p');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  p: 0.1,
  speed: 2,
  sweepDir: 1,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const sim = simulateBSC({ N: 5000, p: state.p, seed: SEED });

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`p = ${state.p.toFixed(3)}   H(p) = ${binaryEntropy(state.p).toFixed(3)}   C(p) = ${capacityBSC(state.p).toFixed(3)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`simulation (N = 5000 bits, seed = ${SEED.toString(16)}): empirical BER = ${sim.ber.toFixed(3)}`, 30, 40);

  const padL = 30, padR = 30;
  const PW = W - padL - padR;

  // Top: capacity / entropy. The headline result gets equal billing with
  // the repetition-code panel below (it used to be a 200px strip above a
  // 670px plot).
  const topY = 56, topH = 452;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, topY, PW, topH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, topY + 0.5, PW - 1, topH - 1);
  // Curves
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const NPTS = PW - 8;
  for (let i = 0; i < NPTS; i += 1) {
    const p = i / (NPTS - 1);
    const C = capacityBSC(p);
    const px = padL + 4 + i;
    const py = topY + topH - 4 - (topH - 12) * C;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = tok.accentWarm;
  ctx.beginPath();
  for (let i = 0; i < NPTS; i += 1) {
    const p = i / (NPTS - 1);
    const Hp = binaryEntropy(p);
    const px = padL + 4 + i;
    const py = topY + topH - 4 - (topH - 12) * Hp;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // p cursor
  const cPx = padL + 4 + (PW - 8) * state.p;
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cPx, topY + 6); ctx.lineTo(cPx, topY + topH - 6);
  ctx.stroke();
  // markers at the current p, so the cursor reads off C and H
  const yOfTop = (v) => topY + topH - 4 - (topH - 12) * v;
  ctx.fillStyle = tok.accentCool;
  ctx.beginPath(); ctx.arc(cPx, yOfTop(capacityBSC(state.p)), 3.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath(); ctx.arc(cPx, yOfTop(binaryEntropy(state.p)), 3.5, 0, 2 * Math.PI); ctx.fill();
  // y ticks (bits)
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = 'rgba(200,206,224,0.55)'; ctx.textAlign = 'right';
  for (const bv of [0, 0.5, 1]) {
    const py = yOfTop(bv);
    ctx.fillText(bv.toFixed(1), padL + 26, py + 3);
    ctx.strokeStyle = 'rgba(226,232,240,0.05)'; ctx.beginPath(); ctx.moveTo(padL + 32, py); ctx.lineTo(padL + PW - 4, py); ctx.stroke();
  }
  ctx.textAlign = 'left';
  // labels
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('C(p) capacity', padL + 6, topY + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('H(p) entropy', padL + 150, topY + 14);

  // Bottom: repetition error curves
  const botY = topY + topH + 26, botH = H - botY - 64;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, botY, PW, botH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, botY + 0.5, PW - 1, botH - 1);
  // We plot only p in [0, 0.5] for repetition since beyond 0.5 the majority-vote
  // decoder is wrong by symmetry.
  const ns = [1, 3, 5, 7, 11];
  const colors = ['#7fb1d8', '#d68a69', '#f1d28a', '#a3d4a3', '#c2c2e6'];
  for (let ni = 0; ni < ns.length; ni += 1) {
    const n = ns[ni];
    ctx.strokeStyle = colors[ni];
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < NPTS; i += 1) {
      const p = 0.5 * i / (NPTS - 1);
      const e = n === 1 ? p : repetitionCodeError(n, p);
      const px = padL + 4 + (PW - 8) * (i / (NPTS - 1));  // p in [0,0.5] across the full panel width
      const py = botY + botH - 4 - (botH - 12) * Math.min(0.5, e) / 0.5;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Y ticks: decode-error probability (0..0.5, its max under majority vote).
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = 'rgba(200,206,224,0.6)'; ctx.textAlign = 'right';
  for (const ev of [0, 0.25, 0.5]) {
    const py = botY + botH - 4 - (botH - 12) * ev / 0.5;
    ctx.fillText(ev.toFixed(2), padL + 30, py + 3);
    ctx.strokeStyle = 'rgba(226,232,240,0.06)'; ctx.beginPath(); ctx.moveTo(padL + 36, py); ctx.lineTo(padL + PW - 4, py); ctx.stroke();
  }
  // Labels
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  for (let ni = 0; ni < ns.length; ni += 1) {
    ctx.fillStyle = colors[ni];
    ctx.fillText(`n = ${ns[ni]}`, padL + 50 + ni * 60, botY + 14);
  }
  // p cursor on bottom
  const cPx2 = padL + 4 + (PW - 8) * Math.min(1, state.p / 0.5);
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cPx2, botY + 6); ctx.lineTo(cPx2, botY + botH - 6);
  ctx.stroke();
  // markers: the decode error for each code length at the current p
  const pc = Math.min(0.5, state.p);
  for (let ni = 0; ni < ns.length; ni += 1) {
    const n = ns[ni];
    const e = n === 1 ? pc : repetitionCodeError(n, pc);
    const py = botY + botH - 4 - (botH - 12) * Math.min(0.5, e) / 0.5;
    ctx.fillStyle = colors[ni];
    ctx.beginPath(); ctx.arc(cPx2, py, 3, 0, 2 * Math.PI); ctx.fill();
  }
  // axis
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (const pt of [0, 0.1, 0.2, 0.3, 0.4, 0.5]) {
    const px = padL + 4 + (PW - 8) * (pt / 0.5);
    ctx.fillText(pt.toFixed(1), px, botY + botH - 4);
  }
  ctx.fillText('p (bit-flip probability)', padL + PW / 2, botY + botH + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    state.p += state.sweepDir * 0.003;
    if (state.p > 1) { state.p = 1; state.sweepDir = -1; }
    if (state.p < 0) { state.p = 0; state.sweepDir = 1; }
  }
  valueP.textContent = state.p.toFixed(3);
  sliderP.value = state.p.toFixed(3);
}

sliderP.addEventListener('input', () => { state.p = parseFloat(sliderP.value); valueP.textContent = state.p.toFixed(3); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.p = 0.1; state.sweepDir = 1; sliderP.value = '0.1'; valueP.textContent = '0.100'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.p = frac;
    sliderP.value = state.p.toFixed(3); valueP.textContent = state.p.toFixed(3);
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
    if (state.speed > 0) tickN(state.speed);
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
window.playground = window.playground || {};
function bscEntropy(p) {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}
window.playground.getState = function () {
  const p = state.p;
  const H = bscEntropy(p);
  return { fields: [
    { key: 'flip-prob', label: 'crossover probability $p$', value: p, format: 'float' },
    { key: 'entropy', label: 'binary entropy $H(p)$ (bits)', value: H, format: 'float' },
    { key: 'capacity', label: 'channel capacity $C = 1 - H(p)$ (bits)', value: 1 - H, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const p = state.p;
  // The binary symmetric channel capacity is symmetric under p to 1 - p:
  // swapping the crossover convention cannot change the information rate.
  const drift = Math.abs(bscEntropy(p) - bscEntropy(1 - p));
  return [{
    key: 'bsc-symmetry',
    label: 'BSC capacity is symmetric, $C(p) = C(1-p)$',
    value: drift.toExponential(2),
    status: drift < 1e-9 ? 'pass' : 'drift',
  }];
};
