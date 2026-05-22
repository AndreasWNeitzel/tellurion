// 2x2 eigenvector playground.
// Draws the unit circle and its image under M, plus the real eigenvectors
// (when they exist), all in a single coordinate frame.

import { eigen2x2 } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutEigs = document.getElementById('readout-eigs');
const readoutTrDet= document.getElementById('readout-trdet');

const sliderA = document.getElementById('slider-a');
const sliderB = document.getElementById('slider-b');
const sliderC = document.getElementById('slider-c');
const sliderD = document.getElementById('slider-d');
const valueA  = document.getElementById('value-a');
const valueB  = document.getElementById('value-b');
const valueC  = document.getElementById('value-c');
const valueD  = document.getElementById('value-d');

let a = parseFloat(sliderA.value), b = parseFloat(sliderB.value);
let c = parseFloat(sliderC.value), d = parseFloat(sliderD.value);

function setSlider(slider, valueEl, v) {
  slider.value = String(v.toFixed(2));
  valueEl.textContent = v.toFixed(2);
}

sliderA.addEventListener('input', () => { a = parseFloat(sliderA.value); valueA.textContent = a.toFixed(2); });
sliderB.addEventListener('input', () => { b = parseFloat(sliderB.value); valueB.textContent = b.toFixed(2); });
sliderC.addEventListener('input', () => { c = parseFloat(sliderC.value); valueC.textContent = c.toFixed(2); });
sliderD.addEventListener('input', () => { d = parseFloat(sliderD.value); valueD.textContent = d.toFixed(2); });

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

function render() {
  const cs = colors();
  ctx.fillStyle = cs.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const scale = 60;

  // Axes.
  ctx.strokeStyle = cs.grid;
  ctx.lineWidth = 1;
  for (let i = -5; i <= 5; i += 1) {
    if (i === 0) continue;
    ctx.beginPath(); ctx.moveTo(cx - 5 * scale, cy + i * scale); ctx.lineTo(cx + 5 * scale, cy + i * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + i * scale, cy - 4 * scale); ctx.lineTo(cx + i * scale, cy + 4 * scale); ctx.stroke();
  }
  ctx.strokeStyle = cs.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();

  // Unit circle.
  ctx.strokeStyle = cs.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, scale, 0, 2 * Math.PI);
  ctx.stroke();

  // Image of unit circle under M.
  ctx.strokeStyle = cs.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const t = 2 * Math.PI * i / 200;
    const x = Math.cos(t), y = Math.sin(t);
    const Mx = a * x + b * y;
    const My = c * x + d * y;
    const px = cx + scale * Mx;
    const py = cy - scale * My;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Eigenvectors.
  const r = eigen2x2(a, b, c, d);
  if (r.real) {
    for (let i = 0; i < 2; i += 1) {
      const lam = r.eigenvalues[i];
      const v = r.eigenvectors[i];
      const color = (i === 0) ? cs.accent : '#ef476f';
      // Draw line through origin in eigenvector direction.
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 5 * scale * v.x, cy + 5 * scale * v.y);
      ctx.lineTo(cx + 5 * scale * v.x, cy - 5 * scale * v.y);
      ctx.stroke();
      // Tip marker scaled by eigenvalue.
      const tx = cx + scale * lam * v.x;
      const ty = cy - scale * lam * v.y;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(tx, ty, 6, 0, 2 * Math.PI); ctx.fill();
    }
  }

  // Labels.
  ctx.fillStyle = cs.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('unit circle', cx + scale + 6, cy - 4);
  ctx.fillStyle = cs.blue;
  ctx.fillText('image M(unit circle)', 12, 20);
  if (r.real) {
    ctx.fillStyle = cs.accent;
    ctx.fillText('eigenvector 1 (scaled by lambda_1)', 12, 36);
    ctx.fillStyle = '#ef476f';
    ctx.fillText('eigenvector 2 (scaled by lambda_2)', 12, 52);
  } else {
    ctx.fillStyle = cs.muted;
    ctx.fillText('complex spectrum (no real eigenvectors)', 12, 36);
  }
}

function updateReadout() {
  const r = eigen2x2(a, b, c, d);
  if (r.real) {
    readoutEigs.textContent = `${r.eigenvalues[0].toFixed(3)}, ${r.eigenvalues[1].toFixed(3)}`;
  } else {
    readoutEigs.textContent = 'complex';
  }
  readoutTrDet.textContent = `tr=${r.tr.toFixed(3)}, det=${r.det.toFixed(3)}`;
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Sweep b from 0 to 2.5 over capture, keeping symmetric c = b.
    b = frac * 2.5;
    c = b;
    setSlider(sliderB, valueB, b);
    setSlider(sliderC, valueC, c);
  }
  valueA.textContent = a.toFixed(2);
  valueB.textContent = b.toFixed(2);
  valueC.textContent = c.toFixed(2);
  valueD.textContent = d.toFixed(2);
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const result = eigen2x2(a, b, c, d);
  const lam1 = result.eigenvalues ? result.eigenvalues[0] : null;
  const lam2 = result.eigenvalues ? result.eigenvalues[1] : null;
  return {
    fields: [
      { key: 'trace', label: 'Trace (lambda1 + lambda2)', value: result.tr, format: 'float' },
      { key: 'determinant', label: 'Determinant (lambda1 * lambda2)', value: result.det, format: 'float' },
      { key: 'lambda-1', label: 'Eigenvalue 1', value: result.real && lam1 !== null ? lam1 : 'complex', format: result.real ? 'float' : undefined },
      { key: 'lambda-2', label: 'Eigenvalue 2', value: result.real && lam2 !== null ? lam2 : 'complex', format: result.real ? 'float' : undefined }
    ]
  };
};
window.playground.getInvariants = function () {
  const result = eigen2x2(a, b, c, d);
  if (!result.real) {
    return [
      { key: 'eigenvalue-type', label: 'Eigenvalues are real', value: 'complex', status: 'pending' }
    ];
  }
  const [lam1, lam2] = result.eigenvalues;
  const tr_check = a + d;
  const det_check = a * d - b * c;
  const tr_drift = Math.abs((lam1 + lam2) - tr_check);
  const det_drift = Math.abs((lam1 * lam2) - det_check);
  return [
    {
      key: 'trace-identity',
      label: 'Trace = lambda1 + lambda2',
      value: tr_drift > 1e-10 ? tr_drift.toExponential(2) : 'pass',
      status: tr_drift > 1e-10 ? 'drift' : 'pass'
    }
  ];
};
