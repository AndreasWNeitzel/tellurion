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

const W = canvas.width, H = canvas.height;
const TMIN = 2500, TMAX = 42000;
const st = { logN: parseFloat(sliderLogN.value), T: parseFloat(sliderT.value), tokenR: [] };

function buildTokens() {
  const rng = makeRng(SEED);
  st.tokenR = [];
  for (let i = 0; i < 156; i += 1) st.tokenR.push(rng());
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
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
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

  ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
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
  for (let i = 0; i < st.tokenR.length; i += 1) {
    const r = st.tokenR[i];
    const ci = i % cols, ri = (i / cols) | 0;
    const jx = (((r * 997) % 1) - 0.5) * cw * 0.3;
    const jy = (((r * 613) % 1) - 0.5) * chh * 0.3;
    const px = x0 + (ci + 0.5) * cw + jx, py = y0 + (ri + 0.5) * chh + jy;
    let kind;
    if (r < x) kind = 'ion';
    else if (r < x + (1 - x) * Math.min(1, f2 * 60)) kind = 'exc';
    else kind = 'gnd';
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
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
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
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`T = ${Math.round(st.T)} K   log n = ${st.logN.toFixed(2)}   x = ${x.toFixed(3)}   Balmer = ${balmerStrength(st.T, nTot).toExponential(2)}`, 24, 22);
  drawCurves();
  drawGas();
  readoutX.textContent = x.toFixed(3);
  readoutTion.textContent = String(Math.round(tion));
}

sliderLogN.addEventListener('input', () => { st.logN = parseFloat(sliderLogN.value); valueLogN.textContent = st.logN.toFixed(2); render(); });
sliderT.addEventListener('input', () => { st.T = parseFloat(sliderT.value); valueT.textContent = String(Math.round(st.T)); render(); });

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
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null, seed: SEED } }));
    }));
  }
}

bootSync();
