import { dxDy, dyDx, exact } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutX = document.getElementById('readout-x'); const readoutY = document.getElementById('readout-y');
const sliderA = document.getElementById('slider-A'); const sliderB = document.getElementById('slider-B');
const valueA = document.getElementById('value-A'); const valueB = document.getElementById('value-B');
let A = parseFloat(sliderA.value), B = parseFloat(sliderB.value);
sliderA.addEventListener('input', () => { A = parseFloat(sliderA.value); valueA.textContent = A.toFixed(2); });
sliderB.addEventListener('input', () => { B = parseFloat(sliderB.value); valueB.textContent = B.toFixed(2); });
function colors() { const css = getComputedStyle(document.body); return { bg: css.getPropertyValue('--bg').trim() || '#060608', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', accent: css.getPropertyValue('--accent').trim() || '#ffd166' }; }
function render() {
  const c = colors(); ctx.fillStyle = c.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const padL = 60, padR = 16, padT = 22, padB = 36;
  const plotW = canvas.width - padL - padR, plotH = canvas.height - padT - padB;
  function xFor(x) { return padL + plotW * x / 6; }
  function yFor(y) { return padT + plotH * (1 - y / 6); }
  // Heatmap of f.
  const N = 60; const w = plotW / N * 6 / 6, h = plotH / N;
  for (let i = 0; i < N; i += 1) for (let j = 0; j < N; j += 1) {
    const x = 6 * (i + 0.5) / N, y = 6 * (j + 0.5) / N;
    const f = Math.sin(x) * Math.cos(y);
    const t = Math.max(-1, Math.min(1, f));
    const r = Math.round(127 + 128 * t), g = Math.round(127), b = Math.round(127 - 128 * t);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(xFor(x - 6 / (2 * N)), yFor(y + 6 / (2 * N)), plotW / N + 0.5, plotH / N + 0.5);
  }
  // Highlight the integration rectangle.
  ctx.strokeStyle = c.accent; ctx.lineWidth = 3;
  ctx.strokeRect(xFor(0), yFor(B), xFor(A) - xFor(0), yFor(0) - yFor(B));
  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('0', padL - 8, yFor(0) + 4);
  ctx.fillText('6', padL + plotW - 4, yFor(0) + 14);
  ctx.fillText('y = 6', padL - 28, padT + 4);
  ctx.fillText('y = 0', padL - 28, yFor(0) + 4);
  ctx.fillText('f(x,y) = sin x cos y', padL + 8, padT + 14);
}
function updateReadout() {
  readoutX.textContent = dxDy(80, 0, A, 0, B).toFixed(6);
  readoutY.textContent = dyDx(80, 0, A, 0, B).toFixed(6);
}
function loop() { render(); updateReadout(); requestAnimationFrame(loop); }
function bootSync() {
  if (CAPTURE_NAME) { B = 1 + (CAPTURE_FRAC || 0) * 4; sliderB.value = String(B); valueB.textContent = B.toFixed(2); }
  valueA.textContent = A.toFixed(2); valueB.textContent = B.toFixed(2);
  render(); updateReadout();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }
