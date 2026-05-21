import { f, maxDelta } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutD = document.getElementById('readout-d');
const readoutX = document.getElementById('readout-x');
const sliderX = document.getElementById('slider-x');
const sliderEps = document.getElementById('slider-eps');
const valueX = document.getElementById('value-x');
const valueEps = document.getElementById('value-eps');
let x0 = parseFloat(sliderX.value);
let eps = parseFloat(sliderEps.value);
sliderX.addEventListener('input', () => { x0 = parseFloat(sliderX.value); valueX.textContent = x0.toFixed(2); });
sliderEps.addEventListener('input', () => { eps = parseFloat(sliderEps.value); valueEps.textContent = eps.toFixed(3); });
function colors() {
  const css = getComputedStyle(document.body);
  return { bg: css.getPropertyValue('--bg').trim() || '#060608', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', accent: css.getPropertyValue('--accent').trim() || '#ffd166', blue: '#5bc0eb', grid: '#23252a' };
}
function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const padL = 60, padR = 16, padT = 22, padB = 38;
  const plotW = canvas.width - padL - padR, plotH = canvas.height - padT - padB;
  const xMin = -3, xMax = 3, yMin = -1.3, yMax = 1.3;
  function xFor(x) { return padL + plotW * (x - xMin) / (xMax - xMin); }
  function yFor(y) { return padT + plotH * (1 - (y - yMin) / (yMax - yMin)); }
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) { const x = padL + plotW * i / 6; ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke(); }
  for (let i = 0; i <= 4; i += 1) { const y = padT + plotH * i / 4; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke(); }
  ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padL, yFor(0)); ctx.lineTo(padL + plotW, yFor(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(xFor(0), padT); ctx.lineTo(xFor(0), padT + plotH); ctx.stroke();
  const f0 = f(x0);
  const dMax = maxDelta(x0, eps);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.15)';
  ctx.fillRect(xFor(x0 - dMax), yFor(f0 + eps), xFor(x0 + dMax) - xFor(x0 - dMax), yFor(f0 - eps) - yFor(f0 + eps));
  ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
  ctx.strokeRect(xFor(x0 - dMax), yFor(f0 + eps), xFor(x0 + dMax) - xFor(x0 - dMax), yFor(f0 - eps) - yFor(f0 + eps));
  ctx.strokeStyle = c.blue; ctx.lineWidth = 2.5; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) {
    const x = xMin + (xMax - xMin) * i / 300;
    if (i === 0) ctx.moveTo(xFor(x), yFor(f(x))); else ctx.lineTo(xFor(x), yFor(f(x)));
  }
  ctx.stroke();
  ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(xFor(x0), yFor(f0), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`epsilon = ${eps.toFixed(3)}, delta_max = ${dMax.toFixed(4)}`, padL + 8, padT + 14);
}
function updateReadout() {
  readoutD.textContent = maxDelta(x0, eps).toFixed(4);
  readoutX.textContent = `${x0.toFixed(2)}, ${f(x0).toFixed(3)}`;
}
function loop() { render(); updateReadout(); requestAnimationFrame(loop); }
function bootSync() {
  if (CAPTURE_NAME) { eps = 0.05 + (CAPTURE_FRAC || 0) * 0.4; sliderEps.value = String(eps); valueEps.textContent = eps.toFixed(3); }
  valueX.textContent = x0.toFixed(2);
  valueEps.textContent = eps.toFixed(3);
  render(); updateReadout();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null, x0, eps } })); })); }
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
