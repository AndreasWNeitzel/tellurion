// Jeans instability playground. Plots omega^2(k) on a signed
// log-symmetric scale, shading the unstable band.

import {
  jeansLengthM, jeansMassKg, omegaSquared,
  nToRho, isothermalCs, PC_M, M_SUN,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutLj   = document.getElementById('readout-lj');
const readoutMj   = document.getElementById('readout-mj');

const sliderT     = document.getElementById('slider-T');
const sliderLogN  = document.getElementById('slider-logn');
const valueT      = document.getElementById('value-T');
const valueLogN   = document.getElementById('value-logn');

let T   = parseFloat(sliderT.value);
let logN = parseFloat(sliderLogN.value);

sliderT.addEventListener('input', () => { T = parseFloat(sliderT.value); valueT.textContent = String(T.toFixed(0)); });
sliderLogN.addEventListener('input', () => { logN = parseFloat(sliderLogN.value); valueLogN.textContent = logN.toFixed(2); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    red:    '#ef476f',
    grid:   '#23252a',
  };
}

// Symmetric log scale: y > 0 -> log10(y), y < 0 -> -log10(-y), with
// linear interpolation across zero.
function symLog(y) {
  const linthresh = 1e-30;
  if (Math.abs(y) < linthresh) return y / linthresh;
  return Math.sign(y) * (Math.log10(Math.abs(y) / linthresh) + 1);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cs = isothermalCs(T);
  const n_cm3 = Math.pow(10, logN);
  const rho = nToRho(n_cm3);

  const padL = 64, padR = 16, padT = 30, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  // k range from 1e-22 to 1e-12 /m (log) - covers galactic to subparsec.
  const kMinLog = -22, kMaxLog = -12;
  function xFor(lK) { return padL + plotW * (lK - kMinLog) / (kMaxLog - kMinLog); }

  // omega^2 range (log absolute) from 1e-32 (epsilon) to 1e-22.
  const wMinSym = -10, wMaxSym = 10; // symlog units
  function yFor(w2) {
    const s = symLog(w2);
    return padT + plotH * (1 - (s - wMinSym) / (wMaxSym - wMinSym));
  }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let lK = kMinLog; lK <= kMaxLog; lK += 2) {
    const x = xFor(lK);
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`1e${lK}`, x - 18, padT + plotH + 14);
  }
  // zero line.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padL, yFor(0)); ctx.lineTo(padL + plotW, yFor(0)); ctx.stroke();

  // Compute kJ.
  const lamJ = jeansLengthM(cs, rho);
  const kJ = 2 * Math.PI / lamJ;
  const lkJ = Math.log10(kJ);

  // Shade unstable band (k < kJ).
  if (lkJ > kMinLog) {
    const xShade = xFor(Math.min(kMaxLog, lkJ));
    ctx.fillStyle = 'rgba(239, 71, 111, 0.10)';
    ctx.fillRect(padL, padT, xShade - padL, plotH);
  }

  // Dispersion curve.
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const lK = kMinLog + (kMaxLog - kMinLog) * i / 200;
    const k = Math.pow(10, lK);
    const w2 = omegaSquared(k, cs, rho);
    const xx = xFor(lK);
    const yy = yFor(w2);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Jeans wavenumber marker.
  if (lkJ > kMinLog && lkJ < kMaxLog) {
    const xJ = xFor(lkJ);
    ctx.strokeStyle = c.red;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xJ, padT); ctx.lineTo(xJ, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.red;
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`k_J = 2pi/lambda_J`, xJ + 4, padT + 12);
  }

  // Axis labels.
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('k (1/m)', padL + plotW - 50, padT + plotH + 28);
  ctx.save(); ctx.translate(16, padT + plotH / 2 + 40); ctx.rotate(-Math.PI / 2);
  ctx.fillText('omega^2 (1/s^2), signed-log', 0, 0); ctx.restore();

  // Label regions.
  ctx.fillStyle = c.red;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Jeans-unstable (omega^2 < 0)', padL + 12, padT + plotH - 8);
  ctx.fillStyle = c.blue;
  ctx.fillText('sound-wave (omega^2 > 0)', padL + plotW - 180, padT + 24);
}

function updateReadout() {
  const cs = isothermalCs(T);
  const n_cm3 = Math.pow(10, logN);
  const rho = nToRho(n_cm3);
  const lam = jeansLengthM(cs, rho);
  const M = jeansMassKg(cs, rho);
  readoutLj.textContent = (lam / PC_M).toFixed(3);
  readoutMj.textContent = (M / M_SUN).toFixed(2);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    T = 10 + frac * 1000;
    sliderT.value = String(Math.round(T));
    valueT.textContent = String(Math.round(T));
  }
  valueT.textContent = String(T.toFixed(0));
  valueLogN.textContent = logN.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, T, logN };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(loop);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(loop);
}
