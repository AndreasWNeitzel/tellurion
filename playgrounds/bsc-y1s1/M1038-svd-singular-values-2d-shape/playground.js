// SVD 2D playground.
// Four panels showing the unit circle stretched by each step of M = U S V^T.

import { svd2x2 } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutS    = document.getElementById('readout-s');
const readoutCond = document.getElementById('readout-cond');

const sliders = ['a', 'b', 'c', 'd'].reduce((o, k) => {
  o[k] = document.getElementById(`slider-${k}`);
  o[`v${k}`] = document.getElementById(`value-${k}`);
  return o;
}, {});

let a = parseFloat(sliders.a.value);
let b = parseFloat(sliders.b.value);
let c = parseFloat(sliders.c.value);
let d = parseFloat(sliders.d.value);

for (const k of ['a', 'b', 'c', 'd']) {
  sliders[k].addEventListener('input', () => {
    const v = parseFloat(sliders[k].value);
    if (k === 'a') a = v;
    if (k === 'b') b = v;
    if (k === 'c') c = v;
    if (k === 'd') d = v;
    sliders[`v${k}`].textContent = v.toFixed(2);
  });
}

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

function drawPanel(c, x0, y0, w, h, points, color, title) {
  const cx = x0 + w / 2, cy = y0 + h / 2;
  const scale = Math.min(w, h) * 0.18;
  // Background.
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);

  // Axes (subtle).
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + 6, cy); ctx.lineTo(x0 + w - 6, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, y0 + 18); ctx.lineTo(cx, y0 + h - 14); ctx.stroke();

  // Curve.
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const px = cx + scale * p.x;
    const py = cy - scale * p.y;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Title.
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x0 + 8, y0 + 14);
}

function render() {
  const cs = colors();
  ctx.fillStyle = cs.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const s = svd2x2(a, b, c, d);

  // Generate unit circle.
  const N = 200;
  const circle = [];
  for (let i = 0; i <= N; i += 1) {
    const t = 2 * Math.PI * i / N;
    circle.push({ x: Math.cos(t), y: Math.sin(t) });
  }
  // After V^T (V^T x): coordinates in V basis.
  const afterVT = circle.map(p => ({
    x: s.v1.x * p.x + s.v1.y * p.y,
    y: s.v2.x * p.x + s.v2.y * p.y,
  }));
  // After S: stretch by s1, s2.
  const afterS = afterVT.map(p => ({ x: s.s1 * p.x, y: s.s2 * p.y }));
  // After U: rotate by U.
  const afterU = afterS.map(p => ({
    x: s.u1.x * p.x + s.u2.x * p.y,
    y: s.u1.y * p.x + s.u2.y * p.y,
  }));

  const panelW = canvas.width / 4;
  const panelH = canvas.height;
  drawPanel(cs, panelW * 0, 0, panelW, panelH, circle,  cs.muted,  'unit circle');
  drawPanel(cs, panelW * 1, 0, panelW, panelH, afterVT, cs.blue,   'after V^T (rotate)');
  drawPanel(cs, panelW * 2, 0, panelW, panelH, afterS,  cs.accent, `after S (s_1=${s.s1.toFixed(2)}, s_2=${s.s2.toFixed(2)})`);
  drawPanel(cs, panelW * 3, 0, panelW, panelH, afterU,  cs.red,    'after U (rotate)');
}

function updateReadout() {
  const s = svd2x2(a, b, c, d);
  readoutS.textContent = `${s.s1.toFixed(3)}, ${s.s2.toFixed(3)}`;
  if (s.s2 > 1e-12) {
    readoutCond.textContent = (s.s1 / s.s2).toFixed(3);
  } else {
    readoutCond.textContent = 'inf';
  }
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    b = -1 + 2 * frac;
    sliders.b.value = String(b.toFixed(2));
    sliders.vb.textContent = b.toFixed(2);
  }
  sliders.va.textContent = a.toFixed(2);
  sliders.vb.textContent = b.toFixed(2);
  sliders.vc.textContent = c.toFixed(2);
  sliders.vd.textContent = d.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, a, b, c, d };
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
