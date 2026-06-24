// Transmission-line impedance matching. A complex load R + jX reflects part
// of the incident wave; the live standing wave, a Smith chart, and the
// voltage envelope show the mismatch, and a quarter-wave transformer matches it.

import {
  reflectionComplex, gammaAt, impedanceFromGamma, vswrFromMag, quarterWaveInput,
  cabs, carg, reflection, vswr, powerDelivered,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx    = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const sRL = document.getElementById('slider-rl'), vRL = document.getElementById('value-rl');
const sXL = document.getElementById('slider-xl'), vXL = document.getElementById('value-xl');
const selMatch = document.getElementById('select-match'), vMatch = document.getElementById('value-match');
const readoutG = document.getElementById('readout-g');
const readoutP = document.getElementById('readout-p');

const Z0 = 50;
const st = { R: parseFloat(sRL.value), X: parseFloat(sXL.value), match: selMatch.value };
let t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());

sRL.addEventListener('input', () => { st.R = parseFloat(sRL.value); vRL.textContent = sRL.value; });
sXL.addEventListener('input', () => { st.X = parseFloat(sXL.value); vXL.textContent = sXL.value; });
selMatch.addEventListener('change', () => { st.match = selMatch.value; vMatch.textContent = selMatch.options[selMatch.selectedIndex].text; });

const COL = {
  bg: '#06070b', fg: '#e8eaf0', muted: '#9aa6b8', grid: 'rgba(150,170,210,0.13)',
  fwd: '#5bc0eb', ref: '#ef476f', sum: '#ffd166', load: '#ef476f', match: '#52e0a0',
  panel: 'rgba(14,20,34,0.7)',
};

// Derived line state: load reflection, the reflection the source actually sees
// (through the transformer when matching is on), and VSWR.
function lineState() {
  const gL = reflectionComplex(st.R, st.X, Z0);
  let gIn = gL, qwt = null;
  if (st.match === 'qwt') { qwt = quarterWaveInput(st.R, st.X, Z0); gIn = qwt.gamma; }
  return { gL, gIn, qwt, magL: cabs(gL), magIn: cabs(gIn) };
}

// ---------------------------------------------------------------- header
function drawHeader(ls) {
  ctx.textAlign = 'left';
  ctx.fillStyle = COL.fg;
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Transmission line: impedance matching', 22, 30);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = COL.muted;
  const Xs = st.X >= 0 ? `+ j${st.X.toFixed(0)}` : `- j${Math.abs(st.X).toFixed(0)}`;
  ctx.fillText(`Z_0 = ${Z0} Ohm     Z_L = ${st.R.toFixed(0)} ${Xs} Ohm`, 22, 52);
  const vs = vswrFromMag(ls.magIn);
  const rl = ls.magIn < 1e-6 ? 'inf' : (-20 * Math.log10(ls.magIn)).toFixed(1);
  ctx.fillStyle = ls.magIn < 0.05 ? COL.match : COL.sum;
  ctx.fillText(`|Gamma| = ${ls.magIn.toFixed(3)}     VSWR = ${vs === Infinity ? 'inf' : vs.toFixed(2)}     return loss = ${rl} dB     P_load = ${((1 - ls.magIn * ls.magIn) * 100).toFixed(1)}%`, 22, 74);
  if (st.match === 'qwt' && ls.qwt) {
    ctx.fillStyle = COL.match;
    ctx.fillText(`quarter-wave transformer: Z_t = sqrt(Z_0 R_L) = ${ls.qwt.Zt.toFixed(1)} Ohm`, 22, 94);
  } else {
    ctx.fillStyle = COL.muted;
    ctx.fillText('set X_L = 0 then add the quarter-wave transformer to match', 22, 94);
  }
}

// ------------------------------------------------------ hero: standing wave
function drawLine(now, ls) {
  const x0 = 40, x1 = W - 40, y0 = 108, y1 = 470;
  const yMid = (y0 + y1) / 2;
  const lineX1 = st.match === 'qwt' ? x0 + (x1 - x0) * 0.80 : x1;  // transformer at the load end
  const g = ls.gIn;                       // reflection seen on the main line
  const gMag = cabs(g), gPh = carg(g);
  const amp = (y1 - y0) * 0.42 / (1 + Math.max(gMag, 0.0));
  const t = (now - t0) / 1000;
  const lambdaPx = (lineX1 - x0) / 3.2;   // ~3 wavelengths on the main line
  const k = 2 * Math.PI / lambdaPx, omega = 2 * Math.PI * 0.45;
  const N = 420;

  // panel frame
  ctx.fillStyle = COL.panel; ctx.fillRect(20, y0 - 8, W - 40, (y1 - y0) + 40);

  // axis line
  ctx.strokeStyle = 'rgba(180,190,210,0.45)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x0, yMid); ctx.lineTo(x1, yMid); ctx.stroke();

  // envelope |V(x)| (dashed), on the main line
  ctx.strokeStyle = 'rgba(255,209,102,0.4)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.1;
  for (const sgn of [1, -1]) {
    ctx.beginPath();
    for (let i = 0; i <= N; i += 1) {
      const x = x0 + (lineX1 - x0) * i / N;
      const xl = (lineX1 - x);                       // distance from main-line end toward source
      const E = Math.sqrt(1 + gMag * gMag + 2 * gMag * Math.cos(2 * k * xl + gPh));
      const y = yMid - sgn * amp * E;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // forward and reflected components (faint), then the live sum (bold)
  const drawWave = (color, lw, fn) => {
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
    for (let i = 0; i <= N; i += 1) {
      const x = x0 + (lineX1 - x0) * i / N, xl = (lineX1 - x);
      const y = yMid - amp * fn(xl);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  drawWave('rgba(91,192,235,0.35)', 1.2, (xl) => Math.cos(omega * t - k * xl));
  drawWave('rgba(239,71,111,0.35)', 1.2, (xl) => gMag * Math.cos(omega * t + k * xl + gPh));
  drawWave(COL.sum, 2.6, (xl) => Math.cos(omega * t - k * xl) + gMag * Math.cos(omega * t + k * xl + gPh));

  // quarter-wave transformer section + load stub
  if (st.match === 'qwt') {
    ctx.strokeStyle = COL.match; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(lineX1, yMid); ctx.lineTo(x1 - 16, yMid); ctx.stroke();
    ctx.fillStyle = COL.match; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
    ctx.fillText('lambda/4', (lineX1 + x1) / 2, yMid + 18);
  }
  // source and load terminals
  ctx.fillStyle = COL.fwd; ctx.fillRect(x0 - 12, yMid - 20, 12, 40);
  ctx.fillStyle = COL.load; ctx.fillRect(x1, yMid - 20, 12, 40);
  ctx.textAlign = 'left'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = COL.fwd; ctx.fillText('source', x0 - 6, y0 + 12);
  ctx.textAlign = 'right'; ctx.fillStyle = COL.load; ctx.fillText('load Z_L', x1 + 8, y0 + 12);
  ctx.textAlign = 'left'; ctx.fillStyle = COL.muted;
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(91,192,235,0.8)'; ctx.fillText('forward', x0, y1 + 20);
  ctx.fillStyle = 'rgba(239,71,111,0.85)'; ctx.fillText('reflected', x0 + 80, y1 + 20);
  ctx.fillStyle = COL.sum; ctx.fillText('standing wave V(x,t)', x0 + 180, y1 + 20);
  ctx.fillStyle = COL.muted; ctx.fillText('dashed: |V| envelope', x0 + 380, y1 + 20);
}

// --------------------------------------------------------- Smith chart
function drawSmith(ls) {
  const cx = 218, cy = 740, SR = 195;
  ctx.fillStyle = COL.panel; ctx.fillRect(20, 520, 396, 470);
  ctx.fillStyle = COL.fg; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('Smith chart (Gamma plane)', 32, 542);

  const toS = (g) => ({ x: cx + SR * g.re, y: cy - SR * g.im });
  // clip to the unit disk for the grid
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, SR, 0, 2 * Math.PI); ctx.clip();
  ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
  // resistance circles r = R/Z0
  for (const r of [0.2, 0.5, 1, 2, 5]) {
    const c0 = r / (1 + r), rad = 1 / (1 + r);
    ctx.beginPath(); ctx.arc(cx + SR * c0, cy, SR * rad, 0, 2 * Math.PI);
    ctx.strokeStyle = r === 1 ? 'rgba(82,224,160,0.5)' : COL.grid; ctx.stroke();
  }
  // reactance arcs x = X/Z0 (centre (1, 1/x), radius 1/|x|)
  for (const x of [0.2, 0.5, 1, 2, 5]) {
    for (const s of [1, -1]) {
      ctx.beginPath();
      ctx.arc(cx + SR * 1, cy - s * SR * (1 / x), SR * (1 / x), 0, 2 * Math.PI);
      ctx.strokeStyle = COL.grid; ctx.stroke();
    }
  }
  // real axis
  ctx.strokeStyle = 'rgba(150,170,210,0.25)';
  ctx.beginPath(); ctx.moveTo(cx - SR, cy); ctx.lineTo(cx + SR, cy); ctx.stroke();
  ctx.restore();

  // outer unit circle
  ctx.strokeStyle = 'rgba(180,190,210,0.5)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(cx, cy, SR, 0, 2 * Math.PI); ctx.stroke();

  // constant-VSWR circle through the load
  ctx.strokeStyle = 'rgba(255,209,102,0.45)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, SR * ls.magL, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);

  // matched centre
  ctx.fillStyle = COL.match; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 2 * Math.PI); ctx.fill();
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('match', cx + 6, cy - 4);

  // load point
  const pL = toS(ls.gL);
  ctx.fillStyle = COL.load; ctx.beginPath(); ctx.arc(pL.x, pL.y, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillText('Z_L', pL.x + 8, pL.y);
  // transformed input point (matching) + connector
  if (st.match === 'qwt') {
    const pI = toS(ls.gIn);
    ctx.strokeStyle = 'rgba(82,224,160,0.6)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(pL.x, pL.y); ctx.lineTo(pI.x, pI.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = COL.match; ctx.beginPath(); ctx.arc(pI.x, pI.y, 6, 0, 2 * Math.PI); ctx.fill();
    ctx.fillText('Z_in', pI.x + 8, pI.y);
  }
  ctx.fillStyle = COL.muted; ctx.textAlign = 'center';
  ctx.fillText('centre = matched (Gamma = 0); rim = |Gamma| = 1', cx, cy + SR + 22);
}

// --------------------------------------------- impedance along the line
function drawZofd(ls) {
  const px = 432, py = 560, pw = 358, ph = 400;
  ctx.fillStyle = COL.panel; ctx.fillRect(px - 12, 520, 398, 470);
  ctx.fillStyle = COL.fg; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('impedance toward source  Z(d)/Z_0', px - 2, 542);

  const ax = px + 38, aw = pw - 50, ay = py, ah = ph - 50;
  // y-axis range covers R/Z0 (>=0) and X/Z0 (signed); clip to +/-4
  const yMax = 4;
  const yOf = (v) => ay + ah * (1 - (Math.max(-yMax, Math.min(yMax, v)) + yMax) / (2 * yMax));
  const xOf = (d) => ax + aw * (d / 0.5);   // half a wavelength toward the source
  // grid
  ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
  for (const v of [-4, -2, 0, 2, 4]) {
    ctx.beginPath(); ctx.moveTo(ax, yOf(v)); ctx.lineTo(ax + aw, yOf(v)); ctx.stroke();
    ctx.fillStyle = COL.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right';
    ctx.fillText(String(v), ax - 4, yOf(v) + 3);
  }
  ctx.strokeStyle = 'rgba(82,224,160,0.4)';
  ctx.beginPath(); ctx.moveTo(ax, yOf(1)); ctx.lineTo(ax + aw, yOf(1)); ctx.stroke();   // R/Z0 = 1 target

  // R(d) and X(d) toward the source from the load reflection (no transformer)
  const M = 240;
  const drawCurve = (color, comp) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= M; i += 1) {
      const d = 0.5 * i / M;
      const z = impedanceFromGamma(gammaAt(ls.gL, d), 1);
      const y = yOf(comp(z));
      const x = xOf(d);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  drawCurve(COL.fwd, (z) => z.re);   // resistance / Z0
  drawCurve(COL.ref, (z) => z.im);   // reactance / Z0

  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = COL.fwd; ctx.fillText('R(d)/Z_0', ax + 6, ay + 14);
  ctx.fillStyle = COL.ref; ctx.fillText('X(d)/Z_0', ax + 6, ay + 30);
  ctx.fillStyle = COL.muted; ctx.textAlign = 'center';
  ctx.fillText('distance d from load (wavelengths)', ax + aw / 2, py + ph - 4);
  ctx.textAlign = 'right';
  ctx.fillText('0', ax, py + ph - 20); ctx.fillText('0.25', ax + aw / 2, py + ph - 20); ctx.fillText('0.5', ax + aw, py + ph - 20);
}

function render(now) {
  const ls = lineState();
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
  drawHeader(ls);
  drawLine(now, ls);
  drawSmith(ls);
  drawZofd(ls);
  // legacy readouts
  const vs = vswrFromMag(ls.magIn);
  readoutG.textContent = `${ls.magIn.toFixed(3)}, ${vs === Infinity ? 'inf' : vs.toFixed(3)}`;
  readoutP.textContent = (1 - ls.magIn * ls.magIn).toFixed(3);
}

function tick(now) { render(now); requestAnimationFrame(tick); }

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Sweep a clear mismatch -> matched story across the capture fraction.
    st.R = 120; st.X = Math.round(120 * (1 - f) - 20);
    st.match = f > 0.66 ? 'qwt' : 'none';
    if (f > 0.66) st.X = 0;
    sRL.value = String(st.R); vRL.textContent = String(st.R);
    sXL.value = String(st.X); vXL.textContent = String(st.X);
    selMatch.value = st.match; vMatch.textContent = selMatch.options[selMatch.selectedIndex].text;
    t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  }
  vRL.textContent = String(st.R); vXL.textContent = String(st.X);
  vMatch.textContent = selMatch.options[selMatch.selectedIndex].text;
  render((typeof performance !== 'undefined' ? performance.now() : Date.now()));
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const detail = { capture: CAPTURE_NAME ?? null };
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
      window.__simulationReady = true; window.__simulationReadyDetail = detail;
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const ls = lineState();
  return { fields: [
    { key: 'load-r', label: 'Load R (Ohm)', value: st.R, format: 'float' },
    { key: 'load-x', label: 'Load X (Ohm)', value: st.X, format: 'float' },
    { key: 'reflection-coeff', label: '|Gamma| seen by source', value: ls.magIn, format: 'float' },
    { key: 'vswr', label: 'VSWR', value: ls.magIn >= 1 ? Infinity : (1 + ls.magIn) / (1 - ls.magIn), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  // Real-load identity P = 1 - |Gamma|^2 must hold for the resistive case.
  const g = reflection(st.R, Z0), p = powerDelivered(st.R, Z0);
  const drift = Math.abs(p - (1 - g * g));
  return [{ key: 'power-identity', label: 'P = 1 - |Gamma|^2', value: drift > 1e-10 ? drift.toExponential(2) : 'pass', status: drift > 1e-10 ? 'drift' : 'pass' }];
};
