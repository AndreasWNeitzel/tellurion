// Fermi surface 2D playground. Brillouin zone with k-states shaded by
// occupation, plus DOS histogram with E_F marker.

import { dispersion, fermiEnergyAtFilling, densityOfStates } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutEf   = document.getElementById('readout-ef');
const readoutF    = document.getElementById('readout-f');

const sliderF = document.getElementById('slider-f');
const valueF  = document.getElementById('value-f');

let f = parseFloat(sliderF.value);
sliderF.addEventListener('input', () => { f = parseFloat(sliderF.value); valueF.textContent = f.toFixed(3); });

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

// 1-H: last BZ transform (for click/drag k-space inversion) + clicked v_F.
let bzXf = { cxPx: 0, cyPx: 0, size: 1 };
let vArrow = null;   // { kx, ky, vx, vy } or null

function drawBZ(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);

  const cxPx = x0 + w / 2, cyPx = y_off + h / 2;
  const size = Math.min(w, h) * 0.42;
  bzXf = { cxPx, cyPx, size };
  const N = 60;
  const Ef = fermiEnergyAtFilling(f, 1, N);

  // Heatmap: occupied vs unoccupied; shade unoccupied lighter.
  for (let i = 0; i < N; i += 1) {
    for (let j = 0; j < N; j += 1) {
      const kx = -Math.PI + 2 * Math.PI * (i + 0.5) / N;
      const ky = -Math.PI + 2 * Math.PI * (j + 0.5) / N;
      const e = dispersion(kx, ky, 1);
      const occupied = e <= Ef;
      const cellW = (2 * size) / N;
      const px = cxPx - size + i * cellW;
      const py = cyPx - size + j * cellW;
      ctx.fillStyle = occupied ? 'rgba(255, 209, 102, 0.7)' : 'rgba(91, 192, 235, 0.15)';
      ctx.fillRect(px, py, cellW + 0.5, cellW + 0.5);
    }
  }

  // BZ outline.
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cxPx - size, cyPx - size, 2 * size, 2 * size);

  ctx.fillStyle = c.muted;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Gamma (0, 0)', cxPx - 32, cyPx + 14);
  ctx.fillText('M (pi, pi)', cxPx + size - 60, cyPx - size + 14);
  ctx.fillText('Brillouin zone [-pi, pi]^2', x0 + 12, y_off + 16);
}

function drawDOS(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);
  const padL = 56, padR = 12, padT = 22, padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const dos = densityOfStates(1, 80, 30);
  const Ef = fermiEnergyAtFilling(f, 1, 80);

  function xFor(E) {
    return x0 + padL + plotW * (E - dos.Emin) / (dos.Emax - dos.Emin);
  }
  let maxCount = 1;
  for (const b of dos.bins) if (b > maxCount) maxCount = b;
  function yFor(count) { return y_off + padT + plotH * (1 - count / maxCount); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const x = x0 + padL + plotW * i / 4;
    ctx.beginPath(); ctx.moveTo(x, y_off + padT); ctx.lineTo(x, y_off + padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    const E = dos.Emin + (dos.Emax - dos.Emin) * i / 4;
    ctx.fillText(`${E.toFixed(1)}`, x - 8, y_off + padT + plotH + 14);
  }

  // Bars.
  const binW = plotW / dos.bins.length;
  for (let i = 0; i < dos.bins.length; i += 1) {
    const xx = x0 + padL + binW * i;
    const yy = yFor(dos.bins[i]);
    const E = dos.Emin + (dos.Emax - dos.Emin) * (i + 0.5) / dos.bins.length;
    ctx.fillStyle = E <= Ef ? c.accent : c.blue;
    ctx.fillRect(xx + 0.5, yy, binW - 1, y_off + padT + plotH - yy);
  }

  // E_F marker.
  const xf = xFor(Ef);
  ctx.strokeStyle = c.red;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(xf, y_off + padT); ctx.lineTo(xf, y_off + padT + plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.red;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`E_F = ${Ef.toFixed(3)} t`, xf + 4, y_off + padT + 14);

  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('E / t', x0 + padL + plotW - 24, y_off + padT + plotH + 28);
  ctx.fillText('DOS(E)', x0 + 12, y_off + 14);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  drawBZ(c, 0, 0, W * 0.5, H);
  drawDOS(c, W * 0.5, 0, W * 0.5, H);
  // Fermi-velocity arrow at the clicked k-point.
  if (vArrow) {
    const { cxPx, cyPx, size } = bzXf;
    const sx = cxPx + vArrow.kx / Math.PI * size;
    const sy = cyPx + vArrow.ky / Math.PI * size;
    const mag = Math.hypot(vArrow.vx, vArrow.vy) || 1;
    const L = 34 * Math.min(1.4, mag / 2);
    const ux = vArrow.vx / mag, uy = vArrow.vy / mag;
    ctx.strokeStyle = '#ff5d5d'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + ux * L, sy + uy * L); ctx.stroke();
    ctx.fillStyle = '#ff5d5d';
    ctx.beginPath();
    ctx.moveTo(sx + ux * L, sy + uy * L);
    ctx.lineTo(sx + ux * L - 7 * ux + 4 * uy, sy + uy * L - 7 * uy - 4 * ux);
    ctx.lineTo(sx + ux * L - 7 * ux - 4 * uy, sy + uy * L - 7 * uy + 4 * ux);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff5d5d'; ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`v_F=(${vArrow.vx.toFixed(2)}, ${vArrow.vy.toFixed(2)})`, sx + 8, sy - 8);
  }
}

// Convert a canvas point to (kx, ky) in the BZ; null if outside.
function canvasToK(px, py) {
  const { cxPx, cyPx, size } = bzXf;
  if (px < cxPx - size || px > cxPx + size || py < cyPx - size || py > cyPx + size) return null;
  return { kx: (px - cxPx) / size * Math.PI, ky: (py - cyPx) / size * Math.PI };
}

let dragging = false, dragY = 0;
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const k = canvasToK(px, py);
  if (!k) return;
  // Click on the Fermi surface (|E - Ef| small) -> velocity arrow.
  const Ef = fermiEnergyAtFilling(f, 1, 80);
  const E = dispersion(k.kx, k.ky, 1);
  if (Math.abs(E - Ef) < 0.25) {
    vArrow = { kx: k.kx, ky: k.ky, vx: 2 * Math.sin(k.kx), vy: 2 * Math.sin(k.ky) };
  } else {
    vArrow = null;
    dragging = true; dragY = py;
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  f = Math.max(0.02, Math.min(0.98, f + (dragY - py) * 0.0015));
  dragY = py;
  sliderF.value = String(f); valueF.textContent = f.toFixed(3);
});
canvas.addEventListener('mouseup', () => { dragging = false; });

function updateReadout() {
  const Ef = fermiEnergyAtFilling(f, 1, 80);
  readoutEf.textContent = Ef.toFixed(3);
  readoutF.textContent = f.toFixed(3);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    f = 0.05 + frac * 0.9;
    sliderF.value = String(f);
    valueF.textContent = f.toFixed(3);
  }
  valueF.textContent = f.toFixed(3);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, f };
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
