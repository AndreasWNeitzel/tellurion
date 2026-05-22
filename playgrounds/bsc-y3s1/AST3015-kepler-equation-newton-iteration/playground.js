// Kepler-equation Newton-iteration playground. Orbit + convergence trace.

import { solveKepler, orbitXY, residual } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutM    = document.getElementById('readout-m');
const readoutE    = document.getElementById('readout-e');

const sliderE  = document.getElementById('slider-e');
const sliderSp = document.getElementById('slider-sp');
const valueE   = document.getElementById('value-e');
const valueSp  = document.getElementById('value-sp');

let e = parseFloat(sliderE.value);
let speed = parseFloat(sliderSp.value);
let t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
const T = 8;  // 8 s per orbit
const a = 1.0;

sliderE.addEventListener('input', () => { e = parseFloat(sliderE.value); valueE.textContent = e.toFixed(3); });
sliderSp.addEventListener('input', () => { speed = parseFloat(sliderSp.value); valueSp.textContent = speed.toFixed(2); });

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

function meanAnomaly(now) {
  return ((now - t0) / 1000) * (2 * Math.PI / T) * speed;
}

function drawOrbit(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);
  const cx = x0 + w / 2, cy = y_off + h / 2;
  const b = a * Math.sqrt(1 - e * e);
  const scale = Math.min(w, h) * 0.35;

  // Ellipse.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const tt = 2 * Math.PI * i / 200;
    const x = a * (Math.cos(tt) - e);
    const y = b * Math.sin(tt);
    const px = cx + scale * x;
    const py = cy - scale * y;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Focus (Sun).
  ctx.fillStyle = c.accent;
  ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Planet.
  const M = meanAnomaly((typeof performance !== 'undefined' ? performance.now() : Date.now()));
  const p = orbitXY(a, e, M);
  const px = cx + scale * p.x;
  const py = cy - scale * p.y;
  ctx.fillStyle = c.blue;
  ctx.beginPath(); ctx.arc(px, py, 8, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Connecting radius.
  ctx.strokeStyle = c.muted;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`e = ${e.toFixed(3)}, a = 1`, x0 + 12, y_off + 14);
}

function drawConvergence(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);

  const padL = 56, padR = 12, padT = 22, padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const M = meanAnomaly((typeof performance !== 'undefined' ? performance.now() : Date.now()));
  const r = solveKepler(M, e);
  const history = r.history;
  // history holds the WRAPPED E iterates; r.E is unwrapped (sim.js adds
  // M - Mw after the loop). Compare against the converged wrapped value
  // (last history entry) so the residual shows true Newton convergence
  // instead of a constant unwrap offset.
  const Einf = history[history.length - 1];

  const maxIter = 12;
  function xFor(i) { return x0 + padL + plotW * (i / maxIter); }
  // Log scale -16 to 1.
  function yFor(le) { return y_off + padT + plotH * (1 - (le + 16) / 17); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= maxIter; i += 2) {
    const x = xFor(i);
    ctx.beginPath(); ctx.moveTo(x, y_off + padT); ctx.lineTo(x, y_off + padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${i}`, x - 6, y_off + padT + plotH + 14);
  }
  for (let le = -16; le <= 0; le += 4) {
    const y = yFor(le);
    ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`1e${le}`, x0 + padL - 32, y + 3);
  }

  // Residual convergence curve. Pass 1: the polyline (one path, one
  // stroke). Pass 2: the per-iteration dots. The previous code called
  // beginPath() for each dot inside the loop, wiping the polyline so
  // only the last arc was ever stroked.
  const pts = [];
  for (let i = 0; i < history.length; i += 1) {
    const r_i = Math.abs(history[i] - Einf);
    const le = Math.max(-18, Math.log10(Math.max(r_i, 1e-19)));
    pts.push({ x: xFor(i), y: yFor(le) });
  }
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 1) {
    if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
    else ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
  ctx.fillStyle = c.blue;
  for (const p of pts) {
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI); ctx.fill();
  }

  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('iter', x0 + padL + plotW - 48, y_off + padT + plotH + 28);
  ctx.save(); ctx.translate(x0 + 16, y_off + padT + plotH / 2 + 30); ctx.rotate(-Math.PI / 2);
  ctx.fillText('|E_n - E_inf|', 0, 0); ctx.restore();
  ctx.fillStyle = c.accent;
  ctx.fillText(`iterations = ${r.iterations}`, x0 + padL + 8, y_off + padT + 14);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  drawOrbit(c, 0, 0, W * 0.5, H);
  drawConvergence(c, W * 0.5, 0, W * 0.5, H);
}

function updateReadout() {
  const M = meanAnomaly((typeof performance !== 'undefined' ? performance.now() : Date.now()));
  const r = solveKepler(M, e);
  readoutM.textContent = ((M % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)).toFixed(3);
  readoutE.textContent = `${r.E.toFixed(3)}, ${r.iterations}`;
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Freeze time at frac of one orbit.
    t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - frac * T * 1000;
  }
  valueE.textContent = e.toFixed(3);
  valueSp.textContent = speed.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, e };
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
  const M = meanAnomaly((typeof performance !== 'undefined' ? performance.now() : Date.now()));
  const r = solveKepler(M, e);
  return {
    fields: [
      { key: 'eccentricity', label: 'Eccentricity e', value: e, format: 'float' },
      { key: 'orbit-speed', label: 'Orbit speed factor', value: speed, format: 'float' },
      { key: 'mean-anomaly', label: 'Mean anomaly M (rad)', value: (M % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), format: 'float' },
      { key: 'eccentric-anomaly', label: 'Eccentric anomaly E (rad)', value: r.E, format: 'float' },
      { key: 'newton-iterations', label: 'Newton iterations', value: r.iterations, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const M = meanAnomaly((typeof performance !== 'undefined' ? performance.now() : Date.now()));
  const r = solveKepler(M, e);
  const residual_final = Math.abs(r.E - e * Math.sin(r.E) - M);
  return [
    {
      key: 'kepler-satisfied',
      label: 'Kepler equation M = E - e sin(E)',
      value: residual_final.toExponential(2),
      status: residual_final < 1e-11 ? 'pass' : 'drift'
    },
    {
      key: 'convergence-rate',
      label: 'Newton convergence (quadratic)',
      value: r.iterations < 15 ? 'pass' : 'slow',
      status: r.iterations < 15 ? 'pass' : 'pending'
    }
  ];
};
