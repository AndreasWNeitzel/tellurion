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
let cx0 = 0, cy0 = 0; // Center of rectangle in field coordinates
let isDragging = false, dragStartX = 0, dragStartY = 0, dragStartCx0 = 0, dragStartCy0 = 0;
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
// Rule-13 diagnostic: the loop circulation against the enclosed area.
// Stokes (Green) in 2D makes this a straight line through the origin
// with slope equal to the curl; the marker is the measured
// circulation, which sits exactly on the line.
function drawStokesPlot() {
  const pw = 280, ph = 150, px = canvas.width - pw - 16, py = 48;
  ctx.fillStyle = 'rgb(10, 13, 24)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.textAlign = 'left';
  ctx.fillText('circulation vs enclosed area', px + 8, py + 16);
  const ax = px + 16, ay = py + 26, aw = pw - 30, ah = ph - 44;
  const areaMax = 12, circMax = 12;
  const curl = curlAtPoint(field, cx0, cy0);
  const xOf = (A) => ax + (A / areaMax) * aw;
  const yOf = (C) => ay + ah / 2 - (C / circMax) * (ah / 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath(); ctx.moveTo(ax, yOf(0)); ctx.lineTo(ax + aw, yOf(0)); ctx.stroke();
  // Stokes line: circulation = curl times area.
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(0));
  ctx.lineTo(xOf(areaMax), yOf(curl * areaMax));
  ctx.stroke();
  // Marker at the measured (area, circulation).
  const area = w * h;
  const circ = circulationRect(field, cx0, cy0, w, h);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(xOf(Math.min(area, areaMax)), yOf(Math.max(-circMax, Math.min(circMax, circ))), 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(200, 210, 240, 0.75)';
  ctx.fillText('circulation', px + 8, ay + 10);
  ctx.textAlign = 'right';
  ctx.fillText('area', ax + aw, ay + ah + 12);
  ctx.textAlign = 'left';
}

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
  // Rectangle (now positioned at cx0, cy0 instead of center).
  const rectX = cx + scale * cx0, rectY = cy - scale * cy0;
  ctx.fillStyle = 'rgba(255, 209, 102, 0.15)';
  ctx.fillRect(rectX - scale * w / 2, rectY - scale * h / 2, scale * w, scale * h);
  ctx.strokeStyle = c.accent; ctx.lineWidth = 2.5;
  ctx.strokeRect(rectX - scale * w / 2, rectY - scale * h / 2, scale * w, scale * h);
  // Boundary arrows showing CCW orientation.
  ctx.strokeStyle = c.blue; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rectX - scale * w / 2, rectY - scale * h / 2);
  ctx.lineTo(rectX + scale * w / 2, rectY - scale * h / 2);
  ctx.lineTo(rectX + scale * w / 2, rectY + scale * h / 2);
  ctx.lineTo(rectX - scale * w / 2, rectY + scale * h / 2);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`field: ${field}`, 12, 20);
  ctx.fillText(`curl = ${curlAtPoint(field, 0, 0)}`, 12, 38);
  ctx.fillStyle = c.accent;
  ctx.fillText(`circulation = ${circulationRect(field, cx0, cy0, w, h).toFixed(3)}, area = ${(w * h).toFixed(3)}`, 12, 56);
  drawStokesPlot();
}
function updateReadout() { readoutC.textContent = circulationRect(field, cx0, cy0, w, h).toFixed(3); readoutA.textContent = (w * h).toFixed(3); }
function loop() { render(); updateReadout(); requestAnimationFrame(loop); }

// Canvas drag handling for rectangle.
canvas.addEventListener('pointerdown', e => {
  const rect = canvas.getBoundingClientRect();
  dragStartX = e.clientX - rect.left;
  dragStartY = e.clientY - rect.top;
  dragStartCx0 = cx0;
  dragStartCy0 = cy0;
  isDragging = true;
});
canvas.addEventListener('pointermove', e => {
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const dx = x - dragStartX;
  const dy = y - dragStartY;
  const scale = 70;
  cx0 = dragStartCx0 + dx / scale;
  cy0 = dragStartCy0 - dy / scale;
});
canvas.addEventListener('pointerup', () => { isDragging = false; });
canvas.addEventListener('pointercancel', () => { isDragging = false; });
canvas.addEventListener('mouseleave', () => { isDragging = false; });

function bootSync() {
  if (CAPTURE_NAME) {
    const f = CAPTURE_FRAC || 0;
    const fields = ['unit', 'shear', 'conservative'];
    field = fields[Math.min(2, Math.floor(f * 2.999))]; selectF.value = field;
    // Also sweep the loop and position so every frame differs
    w = 0.7 + f * 3.0; h = 0.6 + f * 2.2;
    cx0 = -1 + f * 2.5;
    sliderW.value = String(w); sliderH.value = String(h);
  }
  valueF.textContent = field; valueW.textContent = w.toFixed(2); valueH.textContent = h.toFixed(2);
  render(); updateReadout();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const curl = curlAtPoint(field, cx0, cy0);
  const circ = circulationRect(field, cx0, cy0, w, h);
  const area = w * h;
  return {
    fields: [
      { key: 'field-type', label: 'Vector field', value: field, format: undefined },
      { key: 'curl-at-center', label: 'Curl (at rect center)', value: curl, format: 'float' },
      { key: 'circulation', label: 'Circulation (line integral)', value: circ, format: 'float' },
      { key: 'area', label: 'Area of rectangle', value: area, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const curl = curlAtPoint(field, cx0, cy0);
  const circ = circulationRect(field, cx0, cy0, w, h);
  const area = w * h;
  const flux = curl * area;
  const stokes_error = Math.abs(circ - flux);
  const rel_error = Math.abs(flux) > 1e-10 ? stokes_error / Math.abs(flux) : stokes_error;
  const status = rel_error < 1e-6 ? 'pass' : (rel_error < 0.01 ? 'pending' : 'drift');
  return [
    {
      key: 'stokes-theorem',
      label: 'Circulation = integral(curl) dA',
      value: status === 'pass' ? 'pass' : stokes_error.toExponential(2),
      status: status
    }
  ];
};
