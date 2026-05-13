// Saha-Boltzmann ionization playground. Plots x(T) at fixed n_tot and
// marks the half-ionization temperature.

import { ionizationFraction, ionizationTemp } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutX    = document.getElementById('readout-x');
const readoutTion = document.getElementById('readout-tion');

const sliderLogN = document.getElementById('slider-logn');
const sliderT    = document.getElementById('slider-T');
const valueLogN  = document.getElementById('value-logn');
const valueT     = document.getElementById('value-T');

let logN = parseFloat(sliderLogN.value);
let T    = parseFloat(sliderT.value);
sliderLogN.addEventListener('input', () => { logN = parseFloat(sliderLogN.value); valueLogN.textContent = logN.toFixed(2); });
sliderT.addEventListener('input', () => { T = parseFloat(sliderT.value); valueT.textContent = String(T.toFixed(0)); });

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

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padL = 56, padR = 16, padT = 24, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  const tMin = 2000, tMax = 100000;
  function xFor(t) { return padL + plotW * (t - tMin) / (tMax - tMin); }
  function yFor(xVal) { return padT + plotH * (1 - xVal); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const x = padL + plotW * i / 5;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`${(tMin + (tMax - tMin) * i / 5).toFixed(0)}`, x - 18, padT + plotH + 14);
  }
  for (let i = 0; i <= 5; i += 1) {
    const y = padT + plotH * i / 5;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`${(1 - i / 5).toFixed(1)}`, padL - 24, y + 3);
  }
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('T (K)', padL + plotW - 30, padT + plotH + 28);
  ctx.save(); ctx.translate(16, padT + plotH / 2 + 24); ctx.rotate(-Math.PI / 2);
  ctx.fillText('x = n_+ / n_tot', 0, 0); ctx.restore();

  // Curve.
  const n = Math.pow(10, logN);
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const N = 400;
  for (let i = 0; i <= N; i += 1) {
    const t = tMin + (tMax - tMin) * i / N;
    const x = ionizationFraction(t, n);
    if (i === 0) ctx.moveTo(xFor(t), yFor(x)); else ctx.lineTo(xFor(t), yFor(x));
  }
  ctx.stroke();

  // T_ion vertical marker (where x = 0.5).
  const Tion = ionizationTemp(n);
  if (Tion >= tMin && Tion <= tMax) {
    const xT = xFor(Tion);
    ctx.strokeStyle = c.red;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xT, padT); ctx.lineTo(xT, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.red;
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`T_ion = ${Tion.toFixed(0)} K`, xT + 4, padT + 14);
  }

  // Current-T vertical marker.
  const xNow = xFor(T);
  ctx.strokeStyle = c.blue;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xNow, padT); ctx.lineTo(xNow, padT + plotH); ctx.stroke();
  ctx.setLineDash([]);
  const xVal = ionizationFraction(T, n);
  ctx.fillStyle = c.blue;
  ctx.beginPath(); ctx.arc(xNow, yFor(xVal), 5, 0, 2 * Math.PI); ctx.fill();
}

function updateReadout() {
  const n = Math.pow(10, logN);
  readoutX.textContent = ionizationFraction(T, n).toFixed(4);
  readoutTion.textContent = ionizationTemp(n).toFixed(0);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    T = 2000 + frac * 98000;
    sliderT.value = String(Math.round(T));
    valueT.textContent = String(Math.round(T));
  }
  valueLogN.textContent = logN.toFixed(2);
  valueT.textContent = String(T.toFixed(0));
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, logN, T };
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
