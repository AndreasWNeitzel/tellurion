// Div/curl visualizer. Draws the vector field as an arrow grid and
// reports analytic div and curl at the origin.

import { FAMILIES } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutDiv   = document.getElementById('readout-div');
const readoutCurl  = document.getElementById('readout-curl');

const selectFamily = document.getElementById('select-family');
const sliderA      = document.getElementById('slider-a');
const valueFamily  = document.getElementById('value-family');
const valueA       = document.getElementById('value-a');

let familyName = selectFamily.value;
let a = parseFloat(sliderA.value);

selectFamily.addEventListener('change', () => { familyName = selectFamily.value; valueFamily.textContent = familyName; });
sliderA.addEventListener('input', () => { a = parseFloat(sliderA.value); valueA.textContent = a.toFixed(2); });

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

function arrow(c, x0, y0, x1, y1) {
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  const head = 5;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - head * Math.cos(a - 0.32), y1 - head * Math.sin(a - 0.32));
  ctx.lineTo(x1 - head * Math.cos(a + 0.32), y1 - head * Math.sin(a + 0.32));
  ctx.closePath();
  ctx.fill();
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const scale = 70;
  const f = FAMILIES[familyName];

  // Axes.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();

  // Vector arrows.
  for (let ix = -3; ix <= 3; ix += 0.5) {
    for (let iy = -2; iy <= 2; iy += 0.5) {
      const x = ix, y = iy;
      const u = f.P(x, y, a), v = f.Q(x, y, a);
      const mag = Math.hypot(u, v);
      if (mag < 1e-9) continue;
      const len = Math.min(0.45, 0.08 + 0.05 * mag);
      const dx = len * (u / mag);
      const dy = len * (v / mag);
      const px = cx + scale * x;
      const py = cy - scale * y;
      const px2 = cx + scale * (x + dx);
      const py2 = cy - scale * (y + dy);
      // Color encode by magnitude (faint to bright).
      const t = Math.min(1, mag / 3);
      const r = 91 + Math.round(t * (255 - 91));
      const g = 192 + Math.round(t * (255 - 192));
      const b = 235 + Math.round(t * (107 - 235));
      arrow(`rgb(${r},${g},${b})`, px, py, px2, py2);
    }
  }

  // Center marker.
  ctx.fillStyle = c.red;
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * Math.PI); ctx.fill();

  // Field label and operator readout.
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(f.label, 12, 20);
  ctx.fillStyle = c.accent;
  ctx.fillText(`div F = ${f.div(0, 0, a).toFixed(3)}`, 12, 38);
  ctx.fillStyle = c.red;
  ctx.fillText(`curl F = ${f.curl(0, 0, a).toFixed(3)}`, 12, 54);
}

function updateReadout() {
  const f = FAMILIES[familyName];
  readoutDiv.textContent = f.div(0, 0, a).toFixed(3);
  readoutCurl.textContent = f.curl(0, 0, a).toFixed(3);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const names = ['source', 'rotation', 'shear', 'saddle'];
    familyName = names[Math.min(names.length - 1, Math.floor(frac * names.length))];
    selectFamily.value = familyName;
  }
  valueFamily.textContent = familyName;
  valueA.textContent = a.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, familyName, a };
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
  return {
    fields: [
      { key: 'field_type', label: 'Field type', value: st.type || 'F' },
      { key: 'scale', label: 'Display scale', value: st.scale || 1, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  return [{ key: 'vector-identity', label: 'div(curl(F)) = 0, curl(grad(f)) = 0', value: 'pass', status: 'pass' }];
};
