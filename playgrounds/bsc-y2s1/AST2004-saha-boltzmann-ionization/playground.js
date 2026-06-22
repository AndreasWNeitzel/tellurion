import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Saha + Boltzmann as a grounded model: why A stars have the strongest
// hydrogen lines. Left: the Saha ionization fraction, the Boltzmann
// n=2 population, and their product (the Balmer line strength) peaking
// near ~9500 K, with spectral-class ticks. Right: a box of hydrogen
// whose atoms ionize and excite as you heat it, so the peak is visible
// as "most atoms neutral AND in n=2". sim.js core is unchanged.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import {
  ionizationFraction, ionizationTemp, boltzmannFraction, balmerStrength,
} from './sim.js';

const params = new URLSearchParams(location.search);
const SEED = parseInt(params.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutX = document.getElementById('readout-x');
const readoutTion = document.getElementById('readout-tion');
const sliderLogN = document.getElementById('slider-logn');
const sliderT = document.getElementById('slider-T');
const valueLogN = document.getElementById('value-logn');
const valueT = document.getElementById('value-T');
const btnPlay = document.getElementById('btn-play');
const btnReset = document.getElementById('btn-reset');

const W = canvas.width, H = canvas.height;
const TMIN = 2500, TMAX = 42000;
const SWEEP_LO = 2600, SWEEP_HI = 41000, SWEEP_PERIOD = 17;
const st = { logN: parseFloat(sliderLogN.value), T: parseFloat(sliderT.value), tokenR: [], phase: 0, playing: !DETERMINISTIC };

function buildTokens() {
  const rng = makeRng(SEED);
  st.tokenR = [];
  // Each token carries its population draw r plus a thermal-wiggle phase so the
  // gas jitters continuously; ionized atoms get a faster wiggle (lighter, hotter).
  for (let i = 0; i < 156; i += 1) {
    st.tokenR.push({ r: rng(), phx: rng() * 6.283, phy: rng() * 6.283, spd: 2.4 + rng() * 2.6 });
  }
}

const SPECTRAL = [
  ['M', 3200], ['K', 4500], ['G', 5600], ['F', 6800], ['A', 9200], ['B', 15000], ['O', 30000],
];

function drawCurves() {
  const x0 = 44, y0 = 40, pw = W * 0.52 - x0, ph = H - y0 - 54;
  const nTot = Math.pow(10, st.logN);
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(x0, y0, pw, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, pw - 1, ph - 1);
  const xOf = (T) => x0 + pw * (T - TMIN) / (TMAX - TMIN);
  const yOf = (v) => y0 + ph - 6 - (ph - 14) * v;

  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  for (const [lab, T] of SPECTRAL) {
    if (T < TMIN || T > TMAX) continue;
    const xx = xOf(T);
    ctx.beginPath(); ctx.moveTo(xx, y0 + 6); ctx.lineTo(xx, y0 + ph - 6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(lab, xx, y0 + ph + 14);
  }

  const curve = (fn, col, lw, norm) => {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    for (let i = 0; i <= 220; i += 1) {
      const T = TMIN + (TMAX - TMIN) * i / 220;
      const X = xOf(T), Y = yOf(Math.max(0, Math.min(1, fn(T) / norm)));
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  };
  // Balmer-strength normalization = its peak over the range.
  let bMax = 1e-9;
  for (let i = 0; i <= 220; i += 1) { const T = TMIN + (TMAX - TMIN) * i / 220; const b = balmerStrength(T, nTot); if (b > bMax) bMax = b; }
  curve((T) => ionizationFraction(T, nTot), '#5bc0eb', 1.6, 1);
  curve((T) => boltzmannFraction(2, T) * 50, '#f4a261', 1.6, 1);   // x50 to be visible
  curve((T) => balmerStrength(T, nTot), '#ffffff', 2.4, bMax);

  // Peak marker.
  let bpT = TMIN, bp = 0;
  for (let i = 0; i <= 400; i += 1) { const T = TMIN + (TMAX - TMIN) * i / 400; const b = balmerStrength(T, nTot); if (b > bp) { bp = b; bpT = T; } }
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xOf(bpT), y0 + 6); ctx.lineTo(xOf(bpT), y0 + ph - 6); ctx.stroke(); ctx.setLineDash([]);
  // Current-T marker.
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xOf(st.T), y0 + 6); ctx.lineTo(xOf(st.T), y0 + ph - 6); ctx.stroke();

  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('ionized fraction x (Saha)', x0 + 8, y0 + 16);
  ctx.fillStyle = '#f4a261'; ctx.fillText('n=2 population x50 (Boltzmann)', x0 + 8, y0 + 32);
  ctx.fillStyle = '#ffffff'; ctx.fillText('Balmer line strength = (1-x) f2', x0 + 8, y0 + 48);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'center';
  ctx.fillText(`peak ~ ${Math.round(bpT)} K (A stars)`, xOf(bpT), y0 + ph - 10);
  ctx.save(); ctx.translate(14, y0 + ph / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('fraction (normalized)', 0, 0); ctx.restore();
}

function drawGas() {
  const x0 = W * 0.55, y0 = 40, bw = W - x0 - 28, bh = H - y0 - 54;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(x0, y0, bw, bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, bw - 1, bh - 1);
  const nTot = Math.pow(10, st.logN);
  const x = ionizationFraction(st.T, nTot);
  const f2 = boltzmannFraction(2, st.T);              // of neutrals (Z0~g1)
  const cols = 13, rows = Math.ceil(st.tokenR.length / cols);
  const cw = bw / cols, chh = bh / rows;
  let nIon = 0, nExc = 0;
  const vth = Math.sqrt(Math.max(0.2, st.T / 8000));            // thermal speed scale
  const amp0 = Math.min(cw, chh) * 0.26;
  for (let i = 0; i < st.tokenR.length; i += 1) {
    const tk = st.tokenR[i];
    const r = tk.r;
    const ci = i % cols, ri = (i / cols) | 0;
    let kind;
    if (r < x) kind = 'ion';
    else if (r < x + (1 - x) * Math.min(1, f2 * 60)) kind = 'exc';
    else kind = 'gnd';
    const amp = Math.min(1.7 * amp0, amp0 * vth * (kind === 'ion' ? 1.6 : 1));
    const jx = amp * Math.cos(st.phase * tk.spd + tk.phx);
    const jy = amp * Math.sin(st.phase * tk.spd * 1.07 + tk.phy);
    const px = x0 + (ci + 0.5) * cw + jx, py = y0 + (ri + 0.5) * chh + jy;
    if (kind === 'ion') {
      nIon += 1;
      ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(px - 3, py, 3.4, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(px + 4, py, 2.2, 0, 2 * Math.PI); ctx.fill();
    } else if (kind === 'exc') {
      nExc += 1;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(px, py, 5.2, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px, py, 8, 0, 2 * Math.PI); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(120,150,200,0.7)';
      ctx.beginPath(); ctx.arc(px, py, 4, 0, 2 * Math.PI); ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('hydrogen gas at T', x0 + 8, y0 - 8);
  ctx.fillStyle = '#ef476f'; ctx.fillText(`ionized ${(100 * nIon / st.tokenR.length).toFixed(0)}%`, x0 + 8, y0 + bh + 16);
  ctx.fillStyle = '#ffd166'; ctx.fillText(`n=2 (Balmer) ${(100 * nExc / st.tokenR.length).toFixed(0)}%`, x0 + 130, y0 + bh + 16);
  ctx.fillStyle = 'rgba(120,150,200,0.9)'; ctx.fillText('ground', x0 + 300, y0 + bh + 16);
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const nTot = Math.pow(10, st.logN);
  const x = ionizationFraction(st.T, nTot);
  const tion = ionizationTemp(nTot);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`T = ${Math.round(st.T)} K   log n = ${st.logN.toFixed(2)}   x = ${x.toFixed(3)}   Balmer = ${balmerStrength(st.T, nTot).toExponential(2)}`, 24, 22);
  drawCurves();
  drawGas();
  readoutX.textContent = x.toFixed(3);
  readoutTion.textContent = String(Math.round(tion));
}

function setPlaying(on) {
  st.playing = on;
  if (btnPlay) { btnPlay.textContent = on ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!on)); }
}
sliderLogN.addEventListener('input', () => { st.logN = parseFloat(sliderLogN.value); valueLogN.textContent = st.logN.toFixed(2); render(); });
sliderT.addEventListener('input', () => { setPlaying(false); st.T = parseFloat(sliderT.value); valueT.textContent = String(Math.round(st.T)); render(); });
if (btnPlay) btnPlay.addEventListener('click', () => setPlaying(!st.playing));
if (btnReset) btnReset.addEventListener('click', () => {
  st.logN = 20; sliderLogN.value = '20'; valueLogN.textContent = '20.00';
  st.T = 8000; sliderT.value = '8000'; valueT.textContent = '8000';
  setPlaying(true); render();
});

let lastFrame = performance.now();
function tick(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05); lastFrame = now;
  st.phase += dt;
  if (st.playing) {
    // Smoothly sweep the temperature across the M to B range, dwelling at the
    // ends, so the Balmer peak near the A class plays out on its own.
    const frac = 0.5 - 0.5 * Math.cos(st.phase * 2 * Math.PI / SWEEP_PERIOD);
    st.T = SWEEP_LO + frac * (SWEEP_HI - SWEEP_LO);
    sliderT.value = String(Math.round(st.T));
    valueT.textContent = String(Math.round(st.T));
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  buildTokens();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.T = 3200 + f * 22000;                          // M -> B sweep through the peak
    sliderT.value = String(Math.round(st.T));
  }
  valueLogN.textContent = st.logN.toFixed(2);
  valueT.textContent = String(Math.round(st.T));
  render();
  if (DETERMINISTIC) {
    setPlaying(false);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null, seed: SEED } }));
    }));
  } else {
    requestAnimationFrame(tick);
  }
}

bootSync();


// === Diagnostics interface (Layout System v2) ===
// State reports the temperature, log number density and the Saha
// ionization fraction. The invariant verifies the bisection solver
// for the ionization temperature: evaluating the Saha ionization
// fraction at the solved ionization temperature must return 0.5.
window.playground = window.playground || {};
window.playground.getState = function () {
  const nTot = Math.pow(10, st.logN);
  return {
    fields: [
      { key: 'temperature', label: 'temperature (K)', value: st.T, format: 'float' },
      { key: 'log-density', label: 'log10 number density (1/m^3)', value: st.logN, format: 'float' },
      { key: 'ionization', label: 'ionization fraction', value: ionizationFraction(st.T, nTot), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const nTot = Math.pow(10, st.logN);
  const tHalf = ionizationTemp(nTot);
  const drift = Math.abs(ionizationFraction(tHalf, nTot) - 0.5);
  return [{
    key: 'ionization-temp',
    label: 'ionization fraction = 0.5 at the solved ionization temperature',
    value: drift.toExponential(2),
    status: drift < 3e-3 ? 'pass' : (drift < 3e-2 ? 'pending' : 'drift'),
  }];
};
