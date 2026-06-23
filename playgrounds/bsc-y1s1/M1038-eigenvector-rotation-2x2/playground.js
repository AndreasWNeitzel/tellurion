// playground.js
// 2x2 eigenvectors: a matrix M acting on the unit circle.
//
// Vertical 4:5 composition:
//   1. PLANE: the unit circle and its image ellipse under M, the eigenvector
//      lines (when real) scaled by their eigenvalues, and a sweeping input
//      vector v with its image Mv. Most directions turn; at the eigenvectors
//      the image lines up with the input.
//   2. TURN: how far the image direction deviates from the input direction,
//      over all input angles. It hits zero exactly at the eigenvector
//      directions, and never reaches zero when the eigenvalues are complex.

import { eigen2x2 } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEigs = document.getElementById('readout-eigs');
const readoutTrDet = document.getElementById('readout-trdet');

const sliderA = document.getElementById('slider-a');
const sliderB = document.getElementById('slider-b');
const sliderC = document.getElementById('slider-c');
const sliderD = document.getElementById('slider-d');
const valueA = document.getElementById('value-a');
const valueB = document.getElementById('value-b');
const valueC = document.getElementById('value-c');
const valueD = document.getElementById('value-d');

let a = parseFloat(sliderA.value), b = parseFloat(sliderB.value);
let c = parseFloat(sliderC.value), d = parseFloat(sliderD.value);
let theta = 0;                          // sweeping input angle
const playing = !(DETERMINISTIC || prefersReducedMotion());

sliderA.addEventListener('input', () => { a = parseFloat(sliderA.value); valueA.textContent = a.toFixed(2); });
sliderB.addEventListener('input', () => { b = parseFloat(sliderB.value); valueB.textContent = b.toFixed(2); });
sliderC.addEventListener('input', () => { c = parseFloat(sliderC.value); valueC.textContent = c.toFixed(2); });
sliderD.addEventListener('input', () => { d = parseFloat(sliderD.value); valueD.textContent = d.toFixed(2); });

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'plane', weight: 3.0 },
    { name: 'turn', weight: 1.4 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  const g = (k, f) => css.getPropertyValue(k).trim() || f;
  return {
    bg: g('--bg', '#07090f'), panel: '#0a0c12', fg: g('--fg', '#e8e8e8'),
    muted: 'rgba(255,255,255,0.5)', accent: g('--accent', '#ffd166'),
    cool: '#7fb1d8', warm: '#e0925f', red: '#ef476f',
    grid: 'rgba(255,255,255,0.07)', axis: 'rgba(255,255,255,0.28)', border: 'rgba(255,255,255,0.12)',
  };
}
function panel(col, r) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
}
function arrow(x0, y0, x1, y1, color, width, head) {
  const an = Math.atan2(y1 - y0, x1 - x0), hl = head || 9;
  ctx.strokeStyle = color; ctx.lineWidth = width || 2.5;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - hl * Math.cos(an - 0.4), y1 - hl * Math.sin(an - 0.4));
  ctx.lineTo(x1 - hl * Math.cos(an + 0.4), y1 - hl * Math.sin(an + 0.4));
  ctx.closePath(); ctx.fill();
}
function Mapply(x, y) { return [a * x + b * y, c * x + d * y]; }
// Deviation of the image direction from the input line, in radians [0, pi/2].
function deviation(th) {
  const [mx, my] = Mapply(Math.cos(th), Math.sin(th));
  if (Math.hypot(mx, my) < 1e-9) return 0;
  let dlt = Math.atan2(my, mx) - th;
  dlt = Math.atan2(Math.sin(dlt), Math.cos(dlt));   // wrap to (-pi, pi]
  const ad = Math.abs(dlt);
  return Math.min(ad, Math.PI - ad);
}

function drawPlane(col) {
  const r = REG.plane;
  panel(col, r);
  const side = Math.min(r.w, r.h) - 16;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const scale = (side / 2) / 4.2;     // +/- 4.2 units across the half-side
  const X = (x) => cx + x * scale;
  const Y = (y) => cy - y * scale;
  const res = eigen2x2(a, b, c, d);

  // Grid.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
  for (let i = -4; i <= 4; i += 1) {
    if (i === 0) continue;
    ctx.beginPath(); ctx.moveTo(X(-4.2), Y(i)); ctx.lineTo(X(4.2), Y(i)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(i), Y(-4.2)); ctx.lineTo(X(i), Y(4.2)); ctx.stroke();
  }
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(X(-4.2), Y(0)); ctx.lineTo(X(4.2), Y(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(X(0), Y(-4.2)); ctx.lineTo(X(0), Y(4.2)); ctx.stroke();

  // Unit circle.
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(X(0), Y(0), scale, 0, 6.28); ctx.stroke();
  // Image ellipse.
  ctx.strokeStyle = col.cool; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const t = 2 * Math.PI * i / 200;
    const [mx, my] = Mapply(Math.cos(t), Math.sin(t));
    i ? ctx.lineTo(X(mx), Y(my)) : ctx.moveTo(X(mx), Y(my));
  }
  ctx.closePath(); ctx.stroke();

  // Eigenvector lines + tips.
  if (res.real) {
    for (let i = 0; i < 2; i += 1) {
      const v = res.eigenvectors[i], lam = res.eigenvalues[i];
      const color = i === 0 ? col.accent : col.red;
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(X(-4.2 * v.x), Y(-4.2 * v.y)); ctx.lineTo(X(4.2 * v.x), Y(4.2 * v.y)); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(X(lam * v.x), Y(lam * v.y), 5, 0, 6.28); ctx.fill();
    }
  }

  // Sweeping input vector v and its image Mv.
  const vx = Math.cos(theta), vy = Math.sin(theta);
  const [mvx, mvy] = Mapply(vx, vy);
  const aligned = deviation(theta) < 0.05;
  if (aligned) {
    ctx.fillStyle = 'rgba(255,209,102,0.16)';
    ctx.beginPath(); ctx.arc(X(0), Y(0), scale * 1.15, 0, 6.28); ctx.fill();
  }
  arrow(X(0), Y(0), X(mvx), Y(mvy), col.warm, 3, 11);     // image Mv
  arrow(X(0), Y(0), X(vx), Y(vy), col.cool, 3, 11);       // input v

  // Labels + on-canvas readout.
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.cool; ctx.fillText('input v', r.x + 8, r.y + 8);
  ctx.fillStyle = col.warm; ctx.fillText('image M v', r.x + 64, r.y + 8);
  if (aligned) { ctx.fillStyle = col.accent; ctx.fillText('aligned: eigenvector', r.x + 8, r.y + 26); }

  ctx.font = fontString(canvas, 'mono', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillStyle = col.fg;
  ctx.fillText(`tr ${res.tr.toFixed(2)}   det ${res.det.toFixed(2)}`, r.x + r.w - 8, r.y + 8);
  if (res.real) {
    ctx.fillStyle = col.accent;
    ctx.fillText(`λ ${res.eigenvalues[0].toFixed(2)}, ${res.eigenvalues[1].toFixed(2)}`, r.x + r.w - 8, r.y + 24);
  } else {
    ctx.fillStyle = col.red;
    ctx.fillText('λ complex (rotation)', r.x + r.w - 8, r.y + 24);
  }
}

function drawTurn(col) {
  const r = REG.turn;
  panel(col, r);
  const padL = 42, padR = 14, padT = 26, padB = 26;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, pw = x1 - x0;
  const y0 = r.y + padT, y1 = r.y + r.h - padB, ph = y1 - y0;
  const maxDeg = 90;
  const fx = (deg) => x0 + (deg / 180) * pw;
  const fy = (deg) => y1 - (deg / maxDeg) * ph;
  const res = eigen2x2(a, b, c, d);

  // Gridlines.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const v of [0, 45, 90]) {
    const py = fy(v);
    ctx.strokeStyle = col.grid; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke();
    ctx.fillText(`${v}°`, x0 - 5, py);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let deg = 0; deg <= 180; deg += 45) {
    ctx.fillStyle = col.muted; ctx.fillText(`${deg}°`, fx(deg), y1 + 5);
  }

  // Deviation curve.
  ctx.strokeStyle = col.cool; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 180; i += 1) {
    const th = i * Math.PI / 180;
    const deg = deviation(th) * 180 / Math.PI;
    const px = fx(i), py = fy(Math.min(maxDeg, deg));
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();

  // Eigenvector directions: zeros of the curve.
  if (res.real) {
    for (let i = 0; i < 2; i += 1) {
      const v = res.eigenvectors[i];
      let deg = Math.atan2(v.y, v.x) * 180 / Math.PI;
      deg = ((deg % 180) + 180) % 180;
      const color = i === 0 ? col.accent : col.red;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(fx(deg), fy(0), 5, 0, 6.28); ctx.fill();
    }
  }

  // Current sweep cursor.
  const cd = ((theta * 180 / Math.PI) % 180 + 180) % 180;
  ctx.strokeStyle = col.warm; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(fx(cd), y0); ctx.lineTo(fx(cd), y1); ctx.stroke(); ctx.setLineDash([]);

  // Labels.
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.accent; ctx.fillText('how much M turns each direction', r.x + 8, r.y + 7);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'sans');
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(res.real ? 'zeros = eigenvectors (no turn)' : 'never zero: no real eigenvectors', (x0 + x1) / 2, r.y + r.h - 3);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawPlane(col);
  drawTurn(col);
  updateReadout();
}

function updateReadout() {
  const r = eigen2x2(a, b, c, d);
  if (readoutEigs) readoutEigs.textContent = r.real ? `${r.eigenvalues[0].toFixed(3)}, ${r.eigenvalues[1].toFixed(3)}` : 'complex';
  if (readoutTrDet) readoutTrDet.textContent = `tr=${r.tr.toFixed(3)}, det=${r.det.toFixed(3)}`;
}

if (typeof ResizeObserver !== 'undefined') {
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { relayout(); render(); });
  });
  ro.observe(canvas);
}

function loop() {
  if (playing) theta = (theta + 0.012) % (2 * Math.PI);
  render();
  requestAnimationFrame(loop);
}

function bootSync() {
  relayout();
  valueA.textContent = a.toFixed(2); valueB.textContent = b.toFixed(2);
  valueC.textContent = c.toFixed(2); valueD.textContent = d.toFixed(2);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    theta = frac * Math.PI;
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, a, b, c, d } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME, a, b, c, d };
      }));
    }
    return;
  }
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop);
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
      { key: 'lambda-2', label: 'Eigenvalue 2', value: result.real && lam2 !== null ? lam2 : 'complex', format: result.real ? 'float' : undefined },
    ],
  };
};
window.playground.getInvariants = function () {
  const result = eigen2x2(a, b, c, d);
  if (!result.real) {
    return [{ key: 'eigenvalue-type', label: 'Eigenvalues are real', value: 'complex', status: 'pending' }];
  }
  const [lam1, lam2] = result.eigenvalues;
  const tr_drift = Math.abs((lam1 + lam2) - (a + d));
  const det_drift = Math.abs((lam1 * lam2) - (a * d - b * c));
  return [
    {
      key: 'trace-identity', label: 'trace = lambda1 + lambda2',
      value: tr_drift > 1e-10 ? tr_drift.toExponential(2) : 'pass',
      status: tr_drift > 1e-9 ? 'drift' : 'pass',
    },
    {
      key: 'det-identity', label: 'det = lambda1 * lambda2',
      value: det_drift > 1e-10 ? det_drift.toExponential(2) : 'pass',
      status: det_drift > 1e-9 ? 'drift' : 'pass',
    },
  ];
};
