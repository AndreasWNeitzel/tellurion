// Fabry-Perot playground. Two panels: full transmission over 3 FSRs and
// a zoom on one peak.

import { transmission, coefficientFinesse, finesse, fwhmPhi } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutFin   = document.getElementById('readout-fin');
const readoutTmin  = document.getElementById('readout-tmin');

const sliderR  = document.getElementById('slider-R');
const valueR   = document.getElementById('value-R');

let R = parseFloat(sliderR.value);
sliderR.addEventListener('input', () => { R = parseFloat(sliderR.value); valueR.textContent = R.toFixed(3); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    grid:   '#23252a',
  };
}

function drawCurve(c, x0, y_off, w, h, phiMin, phiMax, title) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);
  const padL = 56, padR = 12, padT = 22, padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  function xFor(phi) { return x0 + padL + plotW * (phi - phiMin) / (phiMax - phiMin); }
  function yFor(T) { return y_off + padT + plotH * (1 - T); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const x = x0 + padL + plotW * i / 6;
    ctx.beginPath(); ctx.moveTo(x, y_off + padT); ctx.lineTo(x, y_off + padT + plotH); ctx.stroke();
  }
  for (let i = 0; i <= 4; i += 1) {
    const y = y_off + padT + plotH * i / 4;
    ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`${(1 - i / 4).toFixed(1)}`, x0 + padL - 22, y + 3);
  }

  // Resonance vertical lines at 2 pi m.
  for (let m = Math.floor(phiMin / (2 * Math.PI)); m <= Math.ceil(phiMax / (2 * Math.PI)); m += 1) {
    const phi = 2 * Math.PI * m;
    if (phi < phiMin || phi > phiMax) continue;
    const x = xFor(phi);
    ctx.strokeStyle = c.muted;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y_off + padT); ctx.lineTo(x, y_off + padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Transmission curve.
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 400; i += 1) {
    const phi = phiMin + (phiMax - phiMin) * i / 400;
    const T = transmission(phi, R);
    const xx = xFor(phi);
    const yy = yFor(T);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(title, x0 + padL, y_off + 14);
  ctx.fillText('phi', x0 + padL + plotW - 20, y_off + padT + plotH + 28);
  ctx.save(); ctx.translate(x0 + 16, y_off + padT + plotH / 2 + 16); ctx.rotate(-Math.PI / 2);
  ctx.fillText('T', 0, 0); ctx.restore();
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  // Top: 3 FSRs.
  drawCurve(c, 0, 0, W, H / 2, -Math.PI, 5 * Math.PI, 'three FSRs');
  // Bottom: zoom on one peak.
  const w = fwhmPhi(R) * 3;
  drawCurve(c, 0, H / 2, W, H / 2, 2 * Math.PI - w, 2 * Math.PI + w, 'zoom on phi = 2 pi peak');
}

function updateReadout() {
  readoutFin.textContent = finesse(R).toFixed(2);
  readoutTmin.textContent = (1 / (1 + coefficientFinesse(R))).toExponential(2);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    R = 0.5 + frac * 0.499;
    sliderR.value = String(R);
    valueR.textContent = R.toFixed(3);
  }
  valueR.textContent = R.toFixed(3);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, R };
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
