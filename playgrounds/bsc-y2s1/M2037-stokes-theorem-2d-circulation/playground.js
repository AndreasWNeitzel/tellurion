import { curlAtPoint, circulationRect } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutC = document.getElementById('readout-c'); const readoutA = document.getElementById('readout-a');
const selectF = document.getElementById('select-f');
const sliderW = document.getElementById('slider-w'); const sliderH = document.getElementById('slider-h');
const valueF = document.getElementById('value-f'); const valueW = document.getElementById('value-w'); const valueH = document.getElementById('value-h');
let field = selectF.value; let w = parseFloat(sliderW.value); let h = parseFloat(sliderH.value);
selectF.addEventListener('change', () => { field = selectF.value; valueF.textContent = field; });
sliderW.addEventListener('input', () => { w = parseFloat(sliderW.value); valueW.textContent = w.toFixed(2); });
sliderH.addEventListener('input', () => { h = parseFloat(sliderH.value); valueH.textContent = h.toFixed(2); });
function colors() { const css = getComputedStyle(document.body); return { bg: css.getPropertyValue('--bg').trim() || '#060608', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', accent: css.getPropertyValue('--accent').trim() || '#ffd166', blue: '#5bc0eb', red: '#ef476f', grid: '#23252a' }; }
function vec(field, x, y) {
  if (field === 'unit') return { u: -y / 2, v: x / 2 };
  if (field === 'shear') return { u: y, v: 0 };
  return { u: x, v: y };
}
function arrow(c, x0, y0, x1, y1) { ctx.strokeStyle = c; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); const a = Math.atan2(y1 - y0, x1 - x0); const head = 4; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - head * Math.cos(a - 0.32), y1 - head * Math.sin(a - 0.32)); ctx.lineTo(x1 - head * Math.cos(a + 0.32), y1 - head * Math.sin(a + 0.32)); ctx.closePath(); ctx.fill(); }
function render() {
  const c = colors(); ctx.fillStyle = c.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2; const scale = 70;
  ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();
  for (let ix = -3; ix <= 3; ix += 0.4) for (let iy = -2; iy <= 2; iy += 0.4) {
    const { u, v } = vec(field, ix, iy);
    const mag = Math.hypot(u, v); if (mag < 1e-9) continue;
    const len = Math.min(0.35, 0.08 + 0.05 * mag);
    const dx = len * u / mag, dy = len * v / mag;
    arrow(c.muted, cx + scale * ix, cy - scale * iy, cx + scale * (ix + dx), cy - scale * (iy + dy));
  }
  // Rectangle.
  ctx.fillStyle = 'rgba(255, 209, 102, 0.15)';
  ctx.fillRect(cx - scale * w / 2, cy - scale * h / 2, scale * w, scale * h);
  ctx.strokeStyle = c.accent; ctx.lineWidth = 2.5;
  ctx.strokeRect(cx - scale * w / 2, cy - scale * h / 2, scale * w, scale * h);
  // Boundary arrows showing CCW orientation.
  ctx.strokeStyle = c.blue; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - scale * w / 2, cy - scale * h / 2);
  ctx.lineTo(cx + scale * w / 2, cy - scale * h / 2);
  ctx.lineTo(cx + scale * w / 2, cy + scale * h / 2);
  ctx.lineTo(cx - scale * w / 2, cy + scale * h / 2);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`field: ${field}`, 12, 20);
  ctx.fillText(`curl = ${curlAtPoint(field, 0, 0)}`, 12, 38);
  ctx.fillStyle = c.accent;
  ctx.fillText(`circulation = ${circulationRect(field, 0, 0, w, h).toFixed(3)}, area = ${(w * h).toFixed(3)}`, 12, 56);
}
function updateReadout() { readoutC.textContent = circulationRect(field, 0, 0, w, h).toFixed(3); readoutA.textContent = (w * h).toFixed(3); }
function loop() { render(); updateReadout(); requestAnimationFrame(loop); }
function bootSync() {
  if (CAPTURE_NAME) {
    const f = CAPTURE_FRAC || 0;
    const fields = ['unit', 'shear', 'conservative'];
    field = fields[Math.min(2, Math.floor(f * 2.999))]; selectF.value = field;
    // Also sweep the loop so every frame differs (3 fields alone gave
    // only 3 distinct frames out of 5) and the circulation = double
    // integral of curl relation is shown at several loop sizes.
    w = 0.7 + f * 3.0; h = 0.6 + f * 2.2;
    sliderW.value = String(w); sliderH.value = String(h);
  }
  valueF.textContent = field; valueW.textContent = w.toFixed(2); valueH.textContent = h.toFixed(2);
  render(); updateReadout();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
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
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
