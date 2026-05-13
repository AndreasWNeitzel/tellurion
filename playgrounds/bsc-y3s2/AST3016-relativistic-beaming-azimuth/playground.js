// playground.js
// Polar plot of relativistic beaming intensity.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { beamingPattern, beamingHalfAngle, doppler } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderG      = document.getElementById('slider-gamma');
const sliderA      = document.getElementById('slider-alpha');
const valueG       = document.getElementById('value-gamma');
const valueA       = document.getElementById('value-alpha');

const W = canvas.width, H = canvas.height;
const CX = W / 2, CY = H / 2;

const state = { gamma: 5.0, alpha: 0.0 };

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const radius = Math.min(W, H) * 0.42;

  // Radial gridlines (log-spaced)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 0.5;
  for (let r = 1; r <= 4; r += 1) {
    ctx.beginPath();
    ctx.arc(CX, CY, radius * (r / 4), 0, 2 * Math.PI);
    ctx.stroke();
  }
  // Cardinal rays
  for (let a = 0; a < 360; a += 30) {
    const t = a * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + radius * Math.cos(t), CY - radius * Math.sin(t));
    ctx.stroke();
  }

  const { thetas, intensities, beta } = beamingPattern({ gamma: state.gamma, alpha: state.alpha, n: 720 });
  let iMax = 0;
  for (let i = 0; i < intensities.length; i += 1) if (intensities[i] > iMax) iMax = intensities[i];
  // Log scale for visualization (otherwise the back lobes are invisible).
  // Use log10(1 + I) normalized to log10(1 + iMax).
  const norm = Math.log10(1 + iMax);

  // Filled polar curve
  ctx.fillStyle = 'rgba(241, 210, 138, 0.25)';
  ctx.beginPath();
  for (let i = 0; i < thetas.length; i += 1) {
    const t = thetas[i];
    const rNorm = Math.log10(1 + intensities[i]) / norm;
    const r = radius * rNorm;
    const x = CX + r * Math.cos(t);
    const y = CY - r * Math.sin(t);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  // outline
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < thetas.length; i += 1) {
    const t = thetas[i];
    const rNorm = Math.log10(1 + intensities[i]) / norm;
    const r = radius * rNorm;
    const x = CX + r * Math.cos(t);
    const y = CY - r * Math.sin(t);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Velocity arrow (yellow, along +x)
  ctx.strokeStyle = '#ffd96a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CX, CY);
  ctx.lineTo(CX + radius * 0.30, CY);
  ctx.stroke();
  // arrowhead
  ctx.fillStyle = '#ffd96a';
  ctx.beginPath();
  ctx.moveTo(CX + radius * 0.30, CY);
  ctx.lineTo(CX + radius * 0.30 - 8, CY - 5);
  ctx.lineTo(CX + radius * 0.30 - 8, CY + 5);
  ctx.closePath();
  ctx.fill();

  // Readout
  const theta1ovG = beamingHalfAngle(beta);
  const D0 = doppler(beta, 0);
  const D180 = doppler(beta, Math.PI);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const rows = [
    ['gamma',         state.gamma.toFixed(2)],
    ['beta',          beta.toFixed(4)],
    ['alpha',         state.alpha.toFixed(2)],
    ['theta_beam',    theta1ovG.toFixed(3) + ' rad'],
    ['1/gamma',       (1 / state.gamma).toFixed(3) + ' rad'],
    ['D(0) forward',  D0.toFixed(2)],
    ['D(pi) backward',D180.toFixed(3)],
    ['I(0)/I(pi)',    (Math.pow(D0 / D180, 3 + state.alpha)).toExponential(2)],
  ];
  let y = 18;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 12, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, 280, y);
    y += 14;
  }

  ctx.textAlign = 'center';
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('velocity', CX + radius * 0.20, CY + 14);
}

sliderG.addEventListener('input', () => {
  state.gamma = parseFloat(sliderG.value);
  valueG.textContent = state.gamma.toFixed(2);
  drawAll();
});
sliderA.addEventListener('input', () => {
  state.alpha = parseFloat(sliderA.value);
  valueA.textContent = state.alpha.toFixed(2);
  drawAll();
});

function bootSync() {
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const gs = [1.2, 2.0, 5.0, 10.0, 18.0];
    state.gamma = gs[Math.min(gs.length - 1, Math.round(frac * (gs.length - 1)))];
    sliderG.value = state.gamma.toFixed(2);
    valueG.textContent = state.gamma.toFixed(2);
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
  }
}

// Animate gamma slowly so beam tightens and widens.
let animTime = 0;
let paused = false;
let userOverride = false;
sliderG.addEventListener('input', () => { userOverride = true; });
sliderA.addEventListener('input', () => { userOverride = true; });
const btnPlayPause = document.getElementById('btn-playpause');
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    paused = !paused;
    btnPlayPause.textContent = paused ? 'Play' : 'Pause';
    if (!paused) userOverride = false;
  });
}
function tick() {
  if (!paused && !userOverride && !CAPTURE_NAME) {
    animTime += 0.008;
    state.gamma = 6 + 4.5 * Math.sin(animTime);
    sliderG.value = state.gamma.toFixed(2);
    valueG.textContent = state.gamma.toFixed(2);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
