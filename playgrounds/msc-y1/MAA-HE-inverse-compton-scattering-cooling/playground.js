// Inverse-Compton cooling playground. Two-panel layout:
//   LEFT: t_cool(gamma) curve (the closed-form diagnostic from the
//     original 2D plot, with Hubble-time reference line).
//   RIGHT: live evolution of a small population of electrons cooling
//     in the photon bath. Each electron's gamma decays via the
//     Thomson IC law  d gamma/dt = -K gamma^2, giving
//     gamma(t) = gamma_0 / (1 + K gamma_0 t)  with
//     K = (4 sigma_T U) / (3 m_e c).
//     The electrons drift LEFT (toward lower gamma) on the same axis
//     as the t_cool curve; the LIVE cumulative spectrum in a strip
//     below shows electron density per log-gamma bin evolving.
//
// Reference: Rybicki and Lightman, Radiative Processes in Astrophysics,
// Ch. 7 (`rybickilightman1979`).

import {
  tCoolYears, uPhotonThermalJM3, tCoolSeconds,
  SIGMA_T, M_E_KG, C, YEAR_S,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const readoutU = document.getElementById('readout-u');
const readoutT = document.getElementById('readout-t');
const sliderT = document.getElementById('slider-T');
const valueT = document.getElementById('value-T');

let logT = parseFloat(sliderT.value);
let timeElapsedYr = 0;
const running = !prefersReducedMotion();

sliderT.addEventListener('input', () => {
  logT = parseFloat(sliderT.value);
  valueT.textContent = logT.toFixed(3);
  // Resetting the bath temperature resets the elapsed time and the
  // electron population (the cooling rate changed).
  timeElapsedYr = 0;
  seedElectrons();
});

// =========================================================================
// ELECTRON POPULATION. N electrons drawn from a uniform-in-log gamma
// distribution; each evolves under the closed-form cooling law.
// =========================================================================
const N_ELECTRONS = 80;
const electrons = new Float64Array(N_ELECTRONS);     // gamma_0 for each
let _rng = 0xC0FFEE;
function rnd() { _rng = (Math.imul(_rng, 1664525) + 1013904223) >>> 0; return _rng / 4294967296; }
function seedElectrons() {
  _rng = 0xC0FFEE;
  for (let i = 0; i < N_ELECTRONS; i += 1) {
    const lg = 2 + rnd() * 6;       // log10(gamma) uniform in [2, 8]
    electrons[i] = Math.pow(10, lg);
  }
}
seedElectrons();
function gammaAt(g0, t_yr, U) {
  // gamma(t) = g0 / (1 + K g0 t), K in 1/yr.
  // K(yr^-1) = (4 sigma_T U) / (3 m_e c) * YEAR_S = 1 / tCoolSeconds(1, U) * YEAR_S
  const K = YEAR_S / tCoolSeconds(1, U);   // = (4 sigma_T U YEAR_S) / (3 m_e c)
  return g0 / (1 + K * g0 * t_yr);
}

// =========================================================================
// RENDER.
// =========================================================================
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

const gMinLog = 0, gMaxLog = 9;

function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);

  const T = Math.pow(10, logT);
  const U = uPhotonThermalJM3(T);
  // Layout: left 55 % = t_cool curve, right 45 % = electron evolution.
  const padL = 64, padR = 14, padT = 30, padB = 40;
  // Portrait stack: t_cool curve full-width on top, electron-evolution panel below.
  const leftW = W - padL - padR;
  const plotH = Math.round((H - padT - padB - 44) / 2);
  const rightW = W - padL - padR;
  const rPadT = padT + plotH + 44;
  const rPlotH = plotH;

  // --- LEFT: t_cool(gamma) curve ---
  const tMinLog = -3, tMaxLog = 18;
  function xLeft(lg) { return padL + leftW * (lg - gMinLog) / (gMaxLog - gMinLog); }
  function yTcool(lt) { return padT + plotH * (1 - (lt - tMinLog) / (tMaxLog - tMinLog)); }
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let lg = gMinLog; lg <= gMaxLog; lg += 1) {
    const x = xLeft(lg);
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
  }
  for (let lt = tMinLog; lt <= tMaxLog; lt += 3) {
    const y = yTcool(lt);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + leftW, y); ctx.stroke();
    ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`10^${lt}`, padL - 36, y + 3);
  }
  for (let lg = gMinLog; lg <= gMaxLog; lg += 3) {
    ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`10^${lg}`, xLeft(lg) - 14, padT + plotH + 14);
  }
  // Hubble-time reference.
  const yH = yTcool(Math.log10(1.4e10));
  ctx.strokeStyle = c.red; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padL, yH); ctx.lineTo(padL + leftW, yH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.red; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Hubble time', padL + leftW - 100, yH - 4);
  // t_cool(gamma) curve.
  ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const lg = gMinLog + (gMaxLog - gMinLog) * i / 200;
    const gamma = Math.pow(10, lg);
    const lt = Math.log10(tCoolYears(gamma, U));
    if (lt < tMinLog || lt > tMaxLog) continue;
    if (i === 0) ctx.moveTo(xLeft(lg), yTcool(lt));
    else ctx.lineTo(xLeft(lg), yTcool(lt));
  }
  ctx.stroke();
  // Marker at gamma = 1e4.
  const xRef = xLeft(4);
  ctx.strokeStyle = c.blue; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xRef, padT); ctx.lineTo(xRef, padT + plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.blue;
  ctx.fillText('γ = 10⁴', xRef + 4, padT + 28);
  // Title.
  ctx.fillStyle = c.accent; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`T = ${T.toFixed(2)} K  U_ph = ${U.toExponential(2)} J/m³`, padL + 12, padT + 14);
  ctx.fillStyle = c.muted;
  ctx.fillText('t_cool (yr, log)', padL + 12, padT + plotH - 8);
  ctx.fillText('γ (log)', padL + leftW - 60, padT + plotH + 28);

  // --- RIGHT: live electron population evolution ---
  const rightX = padL;
  function xRight(lg) { return rightX + rightW * (lg - gMinLog) / (gMaxLog - gMinLog); }
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let lg = gMinLog; lg <= gMaxLog; lg += 1) {
    const x = xRight(lg);
    ctx.beginPath(); ctx.moveTo(x, rPadT); ctx.lineTo(x, rPadT + rPlotH); ctx.stroke();
  }
  for (let lg = gMinLog; lg <= gMaxLog; lg += 3) {
    ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`10^${lg}`, xRight(lg) - 14, rPadT + rPlotH + 14);
  }
  ctx.fillStyle = c.fg; ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('electron cooling on a γ axis', rightX, rPadT - 6);

  // Evolve each electron and plot it as a dot. Draw a trail from its
  // initial gamma to its current gamma (a horizontal line on the log γ
  // axis) to show how far it has cooled.
  const dotY0 = rPadT + 30;
  const dotYStep = (rPlotH - 90) / N_ELECTRONS;
  for (let i = 0; i < N_ELECTRONS; i += 1) {
    const g0 = electrons[i];
    const gN = gammaAt(g0, timeElapsedYr, U);
    const y = dotY0 + i * dotYStep;
    if (gN < 1.0) continue;
    const lg0 = Math.log10(g0), lgN = Math.log10(gN);
    if (lg0 < gMinLog || lgN < gMinLog) continue;
    // Trail.
    ctx.strokeStyle = 'rgba(91, 192, 235, 0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xRight(lg0), y); ctx.lineTo(xRight(lgN), y); ctx.stroke();
    // Initial position (faint).
    ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
    ctx.beginPath(); ctx.arc(xRight(lg0), y, 2.4, 0, Math.PI * 2); ctx.fill();
    // Current position (bright).
    ctx.fillStyle = '#5bc0eb';
    ctx.beginPath(); ctx.arc(xRight(lgN), y, 3.2, 0, Math.PI * 2); ctx.fill();
  }

  // Cumulative spectrum (electron count per log γ bin) below the dots.
  const NBINS = 36;
  const hist = new Int32Array(NBINS);
  let nAlive = 0;
  for (let i = 0; i < N_ELECTRONS; i += 1) {
    const gN = gammaAt(electrons[i], timeElapsedYr, U);
    if (gN < 1) continue;
    nAlive += 1;
    const b = Math.min(NBINS - 1, Math.max(0, Math.floor((Math.log10(gN) - gMinLog) / (gMaxLog - gMinLog) * NBINS)));
    hist[b] += 1;
  }
  const histY = rPadT + rPlotH - 50;
  const histH = 40;
  let hMax = 1; for (const v of hist) if (v > hMax) hMax = v;
  const binW = rightW / NBINS;
  for (let b = 0; b < NBINS; b += 1) {
    const hh = hist[b] / hMax * histH;
    ctx.fillStyle = 'rgba(91, 192, 235, 0.7)';
    ctx.fillRect(rightX + b * binW, histY + histH - hh, binW - 0.6, hh);
  }
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)'; ctx.lineWidth = 1;
  ctx.strokeRect(rightX, histY, rightW, histH);
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`N(γ)  alive = ${nAlive}/${N_ELECTRONS}`, rightX + 4, histY - 4);
  ctx.fillText(`elapsed t = ${timeElapsedYr.toExponential(2)} yr`, rightX + rightW - 160, histY - 20);
  ctx.fillText('log γ', rightX + rightW / 2 - 12, padT + plotH + 28);
}

function updateReadout() {
  const T = Math.pow(10, logT);
  const U = uPhotonThermalJM3(T);
  readoutU.textContent = U.toExponential(3);
  readoutT.textContent = tCoolYears(1e4, U).toExponential(3);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (running) {
    // Advance simulated time. The bath temperature sets the natural
    // cooling timescale t_cool(gamma=1e4) ~ tCoolYears(1e4, U). We
    // sweep through ~ a decade of that timescale per second of real
    // time so the user actually sees electrons cooling.
    const T = Math.pow(10, logT);
    const U = uPhotonThermalJM3(T);
    const tRef = tCoolYears(1e4, U);
    timeElapsedYr += dt * 0.4 * tRef;
  }
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    logT = 0 + frac * 5;
    sliderT.value = String(logT);
    valueT.textContent = logT.toFixed(3);
    const T = Math.pow(10, logT);
    const U = uPhotonThermalJM3(T);
    const tRef = tCoolYears(1e4, U);
    timeElapsedYr = frac * 1.5 * tRef;
  }
  valueT.textContent = logT.toFixed(3);
  render();
  updateReadout();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, logT };
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const U = uPhotonThermalJM3(Math.pow(10, logT));
  return {
    fields: [
      { key: 'temperature', label: 'photon bath temperature log10(T, K)', value: logT, format: 'float' },
      { key: 'energy-density', label: 'photon energy density U (J/m^3)', value: U, format: 'float' },
      { key: 'elapsed-time', label: 'elapsed time (years)', value: timeElapsedYr, format: 'float' },
      { key: 'electron-count', label: 'electron population size', value: N_ELECTRONS, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  const U = uPhotonThermalJM3(Math.pow(10, logT));
  // Energy conservation cross-check: cooling timescale must be positive and scale as 1/gamma
  const testGamma = 100;
  const tTest = tCoolSeconds(testGamma, U);
  const tTest2 = tCoolSeconds(testGamma * 2, U);
  const ratio = tTest / tTest2;
  inv.push({
    key: 'cooling-scaling',
    label: 't_cool(gamma) / t_cool(2*gamma) should be ~2.0 (1/gamma scaling)',
    value: ratio.toFixed(2),
    status: Math.abs(ratio - 2.0) < 0.1 ? 'pass' : 'drift'
  });
  // Closed-form solution check: gamma(t) = g0 / (1 + K g0 t)
  const g0 = 1e5;
  const K = YEAR_S / tCoolSeconds(1, U);
  const t_test_yr = 1e6;
  const g_expected = g0 / (1 + K * g0 * t_test_yr);
  inv.push({
    key: 'solution-validity',
    label: 'gamma at t=1Myr stays positive',
    value: g_expected.toExponential(2),
    status: g_expected > 1 ? 'pass' : 'drift'
  });
  return inv;
};
