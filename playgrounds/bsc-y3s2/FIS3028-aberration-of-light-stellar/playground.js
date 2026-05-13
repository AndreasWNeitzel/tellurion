// Stellar aberration playground. Polar plot of star positions at
// uniformly spaced rest angles, then their observer-frame angles.

import {
  thetaObs, aberrationShift, BETA_EARTH_ORBIT,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutAs    = document.getElementById('readout-as');
const readoutAp    = document.getElementById('readout-ap');

const sliderLogB = document.getElementById('slider-logb');
const valueLogB  = document.getElementById('value-logb');

let logBeta = parseFloat(sliderLogB.value);
sliderLogB.addEventListener('input', () => { logBeta = parseFloat(sliderLogB.value); valueLogB.textContent = logBeta.toFixed(2); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    orange: '#f4a261',
    grid:   '#23252a',
  };
}

const RAD_TO_AS = 180 * 3600 / Math.PI;

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cxPx = canvas.width / 2, cyPx = canvas.height / 2;
  const R = Math.min(canvas.width, canvas.height) * 0.38;
  const beta = Math.pow(10, logBeta);

  // Concentric circle and axes.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cxPx, cyPx, R, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cxPx - R, cyPx); ctx.lineTo(cxPx + R, cyPx); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cxPx, cyPx - R); ctx.lineTo(cxPx, cyPx + R); ctx.stroke();

  // Motion direction arrow.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cxPx, cyPx); ctx.lineTo(cxPx + R * 0.92, cyPx); ctx.stroke();
  ctx.fillStyle = c.muted;
  ctx.beginPath();
  ctx.moveTo(cxPx + R * 0.92, cyPx);
  ctx.lineTo(cxPx + R * 0.92 - 8, cyPx - 5);
  ctx.lineTo(cxPx + R * 0.92 - 8, cyPx + 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.muted;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('v', cxPx + R * 0.94, cyPx + 4);

  // Rest-frame stars at uniform angles.
  const N = 18;
  let maxShift = 0;
  for (let i = 0; i < N; i += 1) {
    const tr = 2 * Math.PI * i / N;
    const to = thetaObs(tr, beta) * (tr > Math.PI ? -1 : 1);
    // For tr in [pi, 2pi] we mirror.
    const trDisplay = tr > Math.PI ? -(2 * Math.PI - tr) : tr;
    const px_r = cxPx + R * Math.cos(trDisplay);
    const py_r = cyPx - R * Math.sin(trDisplay);
    const px_o = cxPx + R * Math.cos(to);
    const py_o = cyPx - R * Math.sin(to);
    ctx.strokeStyle = c.accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px_r, py_r); ctx.lineTo(px_o, py_o); ctx.stroke();
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = c.blue;
    ctx.beginPath(); ctx.arc(px_r, py_r, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = c.orange;
    ctx.beginPath(); ctx.arc(px_o, py_o, 5, 0, 2 * Math.PI); ctx.fill();

    const shift = Math.abs(aberrationShift(tr, beta));
    if (shift > maxShift) maxShift = shift;
  }

  // Observer dot.
  ctx.fillStyle = c.fg;
  ctx.beginPath(); ctx.arc(cxPx, cyPx, 5, 0, 2 * Math.PI); ctx.fill();

  // Legend.
  ctx.fillStyle = c.blue;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('rest frame', 12, 20);
  ctx.fillStyle = c.orange;
  ctx.fillText('observer frame (boosted)', 12, 38);
  ctx.fillStyle = c.muted;
  ctx.fillText(`beta = ${beta.toExponential(2)}`, 12, 56);
  ctx.fillStyle = c.accent;
  ctx.fillText(`max shift = ${(maxShift * RAD_TO_AS).toFixed(2)} arcsec`, 12, 74);
  if (Math.abs(logBeta - Math.log10(BETA_EARTH_ORBIT)) < 0.05) {
    ctx.fillStyle = c.accent;
    ctx.fillText('(this is Earth\'s annual orbital beta)', 12, 92);
  }
}

function updateReadout() {
  const beta = Math.pow(10, logBeta);
  const shift = aberrationShift(Math.PI / 2, beta) * RAD_TO_AS;
  readoutAs.textContent = shift.toFixed(2);
  // Small-beta validity: shift / (beta sin theta) close to 1.
  const ratio = aberrationShift(0.5, beta) / (beta * Math.sin(0.5));
  readoutAp.textContent = Math.abs(ratio - 1) < 0.05 ? 'yes' : 'no';
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    logBeta = -6 + 6 * frac;
    sliderLogB.value = String(logBeta);
    valueLogB.textContent = logBeta.toFixed(2);
  }
  valueLogB.textContent = logBeta.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, logBeta };
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
