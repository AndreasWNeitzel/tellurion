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

function loop() {
  render();
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const s = svd2x2(a, b, c, d);
  const det = a * d - b * c;
  const cond = s.s2 > 1e-12 ? s.s1 / s.s2 : Infinity;
  const frobenius = Math.sqrt(s.s1 * s.s1 + s.s2 * s.s2);
  return {
    fields: [
      { key: 'matrix-entries', label: 'Matrix M', value: `[[${a.toFixed(2)}, ${b.toFixed(2)}], [${c.toFixed(2)}, ${d.toFixed(2)}]]`, format: 'string' },
      { key: 'det', label: 'det(M)', value: det, format: 'exponential2' },
      { key: 'trace', label: 'trace(M)', value: a + d, format: 'float' },
      { key: 'sigma-1', label: 'Singular value s_1', value: s.s1, format: 'exponential2' },
      { key: 'sigma-2', label: 'Singular value s_2', value: s.s2, format: 'exponential2' },
      { key: 'condition', label: 'Condition number kappa(M)', value: cond === Infinity ? 'infinity' : cond.toFixed(3), format: 'string' },
      { key: 'frobenius', label: 'Frobenius norm ||M||', value: frobenius, format: 'exponential2' }
    ]
  };
};
window.playground.getInvariants = function () {
  const s = svd2x2(a, b, c, d);
  const det = a * d - b * c;
  const inv = [];

  // Singular values are non-negative and ordered
  inv.push({
    key: 'singular-order',
    label: 's_1 >= s_2 >= 0 (ordered)',
    value: `${s.s1.toFixed(4)} >= ${s.s2.toFixed(4)}`,
    status: (s.s1 >= s.s2 && s.s2 >= 0) ? 'pass' : 'fail'
  });

  // Reconstruction: ||M - U S V^T|| should be tiny
  const u1 = s.u1, u2 = s.u2, v1 = s.v1, v2 = s.v2;
  const recon_a = s.s1 * u1.x * v1.x + s.s2 * u2.x * v2.x;
  const recon_b = s.s1 * u1.x * v1.y + s.s2 * u2.x * v2.y;
  const recon_c = s.s1 * u1.y * v1.x + s.s2 * u2.y * v2.x;
  const recon_d = s.s1 * u1.y * v1.y + s.s2 * u2.y * v2.y;
  const recon_err = Math.abs(recon_a - a) + Math.abs(recon_b - b) + Math.abs(recon_c - c) + Math.abs(recon_d - d);
  inv.push({
    key: 'reconstruction',
    label: 'M = U S V^T (reconstruction error)',
    value: recon_err.toFixed(2e-10),
    status: recon_err < 1e-8 ? 'pass' : 'fail'
  });

  // Orthonormality: U columns should be orthonormal
  const u_dot = u1.x * u2.x + u1.y * u2.y;
  const u_norm1_sq = u1.x * u1.x + u1.y * u1.y;
  const u_norm2_sq = u2.x * u2.x + u2.y * u2.y;
  const u_ortho = Math.abs(u_dot) < 1e-10 && Math.abs(u_norm1_sq - 1) < 1e-10 && Math.abs(u_norm2_sq - 1) < 1e-10;
  inv.push({
    key: 'u-orthonormal',
    label: 'U is orthonormal (rotation)',
    value: u_ortho ? 'yes' : 'no',
    status: u_ortho ? 'pass' : 'fail'
  });

  // Determinant check: det(M) = s1 * s2 (for proper SVD)
  const det_expected = s.s1 * s.s2;
  inv.push({
    key: 'det-relationship',
    label: 'det(M) <= s_1 * s_2 (singular values bound)',
    value: `${det.toFixed(3)} vs ${det_expected.toFixed(3)}`,
    status: Math.abs(det) <= det_expected + 1e-10 ? 'pass' : 'fail'
  });

  // Frobenius norm: ||M||^2 = s1^2 + s2^2
  const frobenius_sq = a * a + b * b + c * c + d * d;
  const frobenius_sv_sq = s.s1 * s.s1 + s.s2 * s.s2;
  inv.push({
    key: 'frobenius',
    label: '||M||^2 = s_1^2 + s_2^2',
    value: (Math.abs(frobenius_sq - frobenius_sv_sq) < 1e-10) ? 'match' : 'mismatch',
    status: (Math.abs(frobenius_sq - frobenius_sv_sq) < 1e-10) ? 'pass' : 'fail'
  });

  return inv;
};
