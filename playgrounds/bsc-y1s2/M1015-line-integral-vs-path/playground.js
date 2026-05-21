// playground.js
// Interactive line integral. Drag A, B and the bend handle: a probe
// walks the bent path while the work integral accumulates, next to the
// straight-path reference. For a conservative field both match and the
// closed loop is ~0; for a rotational field the path matters and the
// loop encloses circulation. sim.js core is unchanged.

import {
  FIELDS, lineIntegral, straightPath, bezierPath, lineIntegralPolyline,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutPaths = document.getElementById('readout-paths');
const readoutLoop = document.getElementById('readout-loop');
const selectField = document.getElementById('select-field');
const valueField = document.getElementById('value-field');

const W = canvas.width, H = canvas.height;
const VIEW = 3.2;
const SCx = W / (2 * VIEW), SCy = H / (2 * VIEW);
const CXp = W / 2, CYp = H / 2;
const toPx = (p) => ({ px: CXp + p.x * SCx, py: CYp - p.y * SCy });
const toWorld = (mx, my) => ({ x: (mx - CXp) / SCx, y: (CYp - my) / SCy });

const st = {
  fieldKey: 'conservative1',
  A: { x: -2, y: -0.4 }, B: { x: 2, y: 0.6 }, C: { x: 0, y: 1.8 },
  probe: 0, drag: null, playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function fieldMag(f, x, y) { return Math.hypot(f.P(x, y), f.Q(x, y)); }

function ramp(t) {
  const u = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * Math.min(1, Math.max(0, -0.35 + 2.2 * u)));
  const g = Math.round(255 * Math.min(1, 0.1 + 0.95 * u));
  const b = Math.round(255 * Math.min(1, 0.6 - 0.55 * u + 0.25 * (1 - u)));
  return `rgb(${r},${g},${b})`;
}

function drawField(f) {
  let mMax = 1e-6;
  for (let gx = -3; gx <= 3; gx += 0.5) for (let gy = -2.5; gy <= 2.5; gy += 0.5) { const m = fieldMag(f, gx, gy); if (m > mMax) mMax = m; }
  for (let gx = -3; gx <= 3; gx += 0.5) {
    for (let gy = -2.5; gy <= 2.5; gy += 0.5) {
      const m = fieldMag(f, gx, gy); if (m < 1e-9) continue;
      const ux = f.P(gx, gy) / m, uy = f.Q(gx, gy) / m;
      const L = 0.16 + 0.18 * Math.min(1, m / mMax);
      const a = toPx({ x: gx, y: gy });
      const b = toPx({ x: gx + ux * L, y: gy + uy * L });
      const col = ramp(m / mMax);
      ctx.strokeStyle = col; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
      const ang = Math.atan2(b.py - a.py, b.px - a.px);
      ctx.beginPath(); ctx.moveTo(b.px, b.py);
      ctx.lineTo(b.px - 5 * Math.cos(ang - 0.4), b.py - 5 * Math.sin(ang - 0.4));
      ctx.lineTo(b.px - 5 * Math.cos(ang + 0.4), b.py - 5 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
  }
}

function drawPath(pathFn, color, lw, tMax) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
  const N = 120, lim = tMax ?? 1;
  for (let i = 0; i <= N; i += 1) {
    const t = lim * i / N;
    const p = toPx({ x: pathFn.x(t), y: pathFn.y(t) });
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
}

function handle(p, label, col, active) {
  const q = toPx(p);
  ctx.fillStyle = active ? '#06d6a0' : col;
  ctx.beginPath(); ctx.arc(q.px, q.py, 8, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(label, q.px, q.py - 12);
}

function render() {
  const f = FIELDS[st.fieldKey];
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  const o = toPx({ x: 0, y: 0 });
  ctx.beginPath(); ctx.moveTo(0, o.py); ctx.lineTo(W, o.py); ctx.moveTo(o.px, 0); ctx.lineTo(o.px, H); ctx.stroke();

  drawField(f);
  const sp = straightPath(st.A, st.B);
  const bz = bezierPath(st.A, st.C, st.B);
  drawPath(sp, 'rgba(244,162,97,0.85)', 2.5);
  drawPath(bz, '#5bc0eb', 2.5);

  const tp = Math.max(0.001, st.probe);
  const pts = [];
  const Np = 80;
  for (let i = 0; i <= Math.round(Np * tp); i += 1) { const t = i / Np; pts.push({ x: bz.x(t), y: bz.y(t) }); }
  drawPath(bz, 'rgba(91,192,235,0.45)', 7, tp);
  const probeP = toPx({ x: bz.x(tp), y: bz.y(tp) });
  const dxv = bz.dx(tp), dyv = bz.dy(tp), dl = Math.hypot(dxv, dyv) || 1;
  const Fp = (f.P(bz.x(tp), bz.y(tp)) * dxv + f.Q(bz.x(tp), bz.y(tp)) * dyv) / dl;
  ctx.strokeStyle = Fp >= 0 ? '#06d6a0' : '#ef476f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(probeP.px, probeP.py);
  ctx.lineTo(probeP.px + (dxv / dl) * Fp * 18, probeP.py - (dyv / dl) * Fp * 18); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(probeP.px, probeP.py, 5, 0, 2 * Math.PI); ctx.fill();

  handle(st.A, 'A', '#1b6ca8', st.drag === 'A');
  handle(st.B, 'B', '#1b6ca8', st.drag === 'B');
  handle(st.C, 'bend', '#c13b27', st.drag === 'C');

  const iS = lineIntegral(f, sp.x, sp.y, sp.dx, sp.dy);
  const iB = lineIntegral(f, bz.x, bz.y, bz.dx, bz.dy);
  const loop = iS - iB;
  const workSoFar = lineIntegralPolyline(f, pts.length > 1 ? pts : [st.A, st.A]);

  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`field: ${f.label}   ${f.isConservative ? 'conservative (path-independent)' : 'non-conservative (path matters)'}`, 16, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`work along bent path so far = ${workSoFar.toFixed(3)}   (probe ${(tp * 100) | 0}%)`, 16, H - 16);
  ctx.fillStyle = '#f4a261'; ctx.fillText('straight A->B', 16, 40);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('your bent path A->B', 130, 40);

  readoutPaths.textContent = `${iS.toFixed(3)}, ${iB.toFixed(3)}`;
  readoutLoop.textContent = loop.toFixed(3);
  valueField.textContent = f.isConservative ? 'conservative' : 'rotational';
}

function pickHandle(mx, my) {
  for (const k of ['A', 'B', 'C']) {
    const q = toPx(st[k]);
    if (Math.hypot(mx - q.px, my - q.py) < 16) return k;
  }
  return null;
}
function evtPos(e) {
  const r = canvas.getBoundingClientRect();
  return { mx: (e.clientX - r.left) * (W / r.width), my: (e.clientY - r.top) * (H / r.height) };
}
canvas.addEventListener('pointerdown', (e) => {
  const { mx, my } = evtPos(e); st.drag = pickHandle(mx, my);
  canvas.classList.toggle('dragging', !!st.drag);
});
canvas.addEventListener('pointermove', (e) => {
  if (!st.drag) return;
  const { mx, my } = evtPos(e); const w = toWorld(mx, my);
  st[st.drag] = { x: Math.max(-3, Math.min(3, w.x)), y: Math.max(-2.6, Math.min(2.6, w.y)) };
  render();
});
window.addEventListener('pointerup', () => { st.drag = null; canvas.classList.remove('dragging'); });
selectField.addEventListener('change', () => { st.fieldKey = selectField.value; render(); });

function tick() {
  if (st.playing) { st.probe += 0.006; if (st.probe > 1) st.probe = 0; render(); }
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const keys = Object.keys(FIELDS);
    st.fieldKey = keys[Math.min(keys.length - 1, Math.round(f * (keys.length - 1)))];
    selectField.value = st.fieldKey;
    st.C = { x: -1.2 + 2.4 * f, y: 1.0 + 1.4 * f };
    st.probe = 0.25 + 0.7 * f;
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
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
