// Photoelectric effect playground.
// Plot KE_max = h nu - phi for each metal as a function of nu. Highlight
// the selected metal and draw a vertical line at the current nu.

import { METALS, thresholdFreqPhz, keMaxEv } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutKe   = document.getElementById('readout-ke');
const readoutNu0  = document.getElementById('readout-nu0');

const selectMetal = document.getElementById('select-metal');
const sliderNu    = document.getElementById('slider-nu');
const valueMetal  = document.getElementById('value-metal');
const valueNu     = document.getElementById('value-nu');

let metalName = selectMetal.value;
let nuPhz     = parseFloat(sliderNu.value);

function currentMetal() {
  return METALS.find(m => m.name === metalName) || METALS[0];
}

selectMetal.addEventListener('change', () => {
  metalName = selectMetal.value;
  valueMetal.textContent = metalName;
});
sliderNu.addEventListener('input', () => {
  nuPhz = parseFloat(sliderNu.value);
  valueNu.textContent = nuPhz.toFixed(2);
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

function drawPlot(c, x0, y0, w, h) {
  const padL = 64, padR = 16, padT = 28, padB = 44;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);

  const nuMin = 0;
  const nuMax = 3.0;
  const keMax = 6.0;

  function xFor(nu) { return x0 + padL + plotW * (nu - nuMin) / (nuMax - nuMin); }
  function yFor(ke) { return y0 + padT + plotH * (1 - ke / keMax); }

  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const x = x0 + padL + plotW * i / 6;
    ctx.beginPath(); ctx.moveTo(x, y0 + padT); ctx.lineTo(x, y0 + padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${(i * 0.5).toFixed(1)}`, x - 6, y0 + padT + plotH + 12);
  }
  for (let i = 0; i <= 6; i += 1) {
    const y = y0 + padT + plotH * i / 6;
    ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`${(6 - i)}`, x0 + padL - 14, y + 3);
  }
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('nu (PHz = 1e15 Hz)', x0 + padL + plotW / 2 - 50, y0 + padT + plotH + 28);
  ctx.save();
  ctx.translate(x0 + 14, y0 + padT + plotH / 2 + 40);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('KE_max (eV)', 0, 0);
  ctx.restore();

  for (const m of METALS) {
    const nu0 = thresholdFreqPhz(m.phi);
    if (nu0 > nuMax) continue;
    const xStart = xFor(nu0);
    const yStart = yFor(0);
    const xEnd = xFor(nuMax);
    const ke_end = keMaxEv(nuMax, m.phi);
    const yEnd = yFor(Math.min(ke_end, keMax));

    ctx.strokeStyle = m.color;
    ctx.lineWidth = (m.name === metalName) ? 3 : 1.5;
    ctx.globalAlpha = (m.name === metalName) ? 1.0 : 0.55;
    ctx.beginPath(); ctx.moveTo(xStart, yStart); ctx.lineTo(xEnd, yEnd); ctx.stroke();

    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(xStart, yStart, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = (m.name === metalName) ? m.color : c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${m.name} (${m.phi.toFixed(2)} eV)`, xEnd - 130, yEnd - 6);
  }
  ctx.globalAlpha = 1.0;

  const xNow = xFor(nuPhz);
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(xNow, y0 + padT); ctx.lineTo(xNow, y0 + padT + plotH); ctx.stroke();
  ctx.setLineDash([]);

  const m = currentMetal();
  const keNow = keMaxEv(nuPhz, m.phi);
  if (keNow > 0) {
    const yNow = yFor(Math.min(keNow, keMax));
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(xNow, yNow, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = c.fg;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawPlot(c, 0, 0, canvas.width, canvas.height);
}

function updateReadout() {
  const m = currentMetal();
  readoutKe.textContent  = keMaxEv(nuPhz, m.phi).toFixed(3);
  readoutNu0.textContent = thresholdFreqPhz(m.phi).toFixed(3);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    nuPhz = 0.4 + frac * 2.0;
    valueNu.textContent = nuPhz.toFixed(2);
    sliderNu.value = String(nuPhz);
  }
  valueMetal.textContent = metalName;
  valueNu.textContent = nuPhz.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, metal: metalName, nu: nuPhz };
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
  const m = currentMetal();
  const ke = keMaxEv(nuPhz, m.phi);
  const nu0 = thresholdFreqPhz(m.phi);
  return {
    fields: [
      { key: 'metal', label: 'Selected metal', value: metalName, format: undefined },
      { key: 'frequency', label: 'Photon frequency (PHz)', value: nuPhz, format: 'float' },
      { key: 'ke-max', label: 'KE max (eV)', value: ke, format: 'float' },
      { key: 'threshold-freq', label: 'Threshold frequency (PHz)', value: nu0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const m = currentMetal();
  const ke = keMaxEv(nuPhz, m.phi);
  const nu0 = thresholdFreqPhz(m.phi);
  // Einstein photoelectric equation: KE_max = h*nu - phi. Check constraint.
  const H_EV_S = 4.135667696e-15;
  const photon_energy = H_EV_S * 1e15 * nuPhz;
  const ke_expected = Math.max(0, photon_energy - m.phi);
  const ke_drift = Math.abs(ke - ke_expected);
  // Also check: if nu < nu0, KE must be zero.
  const below_threshold = nuPhz < nu0 - 1e-10;
  const status = below_threshold && ke > 1e-8 ? 'drift' : (ke_drift > 1e-10 ? 'drift' : 'pass');
  return [
    {
      key: 'einstein-equation',
      label: 'Einstein: KE = h*nu - phi',
      value: status === 'pass' ? 'pass' : ke_drift.toExponential(2),
      status: status
    }
  ];
};
