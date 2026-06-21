import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for Gram-Schmidt orthogonalization in 2D. Top region:
// v1 and v2, the projection of v2 onto q1 subtracted to leave the
// perpendicular residual, and the resulting orthonormal frame q1, q2, built
// up in animated stages. Bottom region: the residual and projection lengths
// as v2's angle varies, the residual vanishing when v2 is parallel to v1.
//
// Reference: Trefethen and Bau, Numerical Linear Algebra, Lec. 7-8;
// Arfken and Weber, Mathematical Methods for Physicists, 7th ed., Ch. 3.

import { gramSchmidt, dot, norm } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sA1 = document.getElementById('slider-a1');
const sL1 = document.getElementById('slider-l1');
const sA2 = document.getElementById('slider-a2');
const sL2 = document.getElementById('slider-l2');
const vA1 = document.getElementById('value-a1');
const vL1 = document.getElementById('value-l1');
const vA2 = document.getElementById('value-a2');
const vL2 = document.getElementById('value-l2');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

const DEF = { a1: 20, l1: 2, a2: 70, l2: 2.4 };
let running = !DETERMINISTIC;
let phase = 0;                 // build-up phase in [0, 5)

function inputs() {
  const a1 = parseFloat(sA1.value) * Math.PI / 180, l1 = parseFloat(sL1.value);
  const a2 = parseFloat(sA2.value) * Math.PI / 180, l2 = parseFloat(sL2.value);
  return { v1: [l1 * Math.cos(a1), l1 * Math.sin(a1)], v2: [l2 * Math.cos(a2), l2 * Math.sin(a2)] };
}
function syncVals() {
  vA1.textContent = String(parseFloat(sA1.value));
  vL1.textContent = parseFloat(sL1.value).toFixed(2);
  vA2.textContent = String(parseFloat(sA2.value));
  vL2.textContent = parseFloat(sL2.value).toFixed(2);
}
for (const s of [sA1, sL1, sA2, sL2]) s.addEventListener('input', () => { syncVals(); render(); });
btnReset.addEventListener('click', () => {
  sA1.value = String(DEF.a1); sL1.value = String(DEF.l1); sA2.value = String(DEF.a2); sL2.value = String(DEF.l2);
  phase = 0; running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.7 },
    { name: 'diagnostic', weight: 1.35 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    v1: '#ff9d6e',
    v2: '#7cc6ff',
    q1: '#67d98c',
    q2: '#b58cff',
    proj: '#9aa0a6',
    res: '#ffd166',
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.08)',
  };
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

const smooth = (t) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };

function arrow(x0, y0, x1, y1, col, w, dash) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
  ctx.save();
  if (dash) ctx.setLineDash(dash);
  ctx.strokeStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.restore();
  if (L > 6) {
    const ux = dx / L, uy = dy / L;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - 10 * ux + 5 * uy, y1 - 10 * uy - 5 * ux);
    ctx.lineTo(x1 - 10 * ux - 5 * uy, y1 - 10 * uy + 5 * ux);
    ctx.closePath(); ctx.fill();
  }
}

const STAGE = ['two input vectors', 'q₁ = v₁ / |v₁|', 'project v₂ onto q₁', 'residual = v₂ − projection', 'q₂ = residual / |residual|', 'orthonormal frame q₁, q₂'];

function drawScene(col, r) {
  panel(col, r, 'Subtract the overlap, keep the perpendicular');

  const titleH = 24;
  const inner = { x: r.x + 8, y: r.y + titleH, w: r.w - 16, h: r.h - titleH - 8 };
  const leftW = inner.w * 0.66;
  const side = Math.min(leftW, inner.h);
  const plot = { x: inner.x, y: inner.y + (inner.h - side) / 2, w: side, h: side };

  const { v1, v2 } = inputs();
  const n1 = norm(v1) || 1e-9;
  const q1 = [v1[0] / n1, v1[1] / n1];
  const pc = dot(v2, q1);                      // projection coefficient
  const proj = [pc * q1[0], pc * q1[1]];
  const w = [v2[0] - proj[0], v2[1] - proj[1]];
  const nw = norm(w);
  const q2 = nw > 1e-9 ? [w[0] / nw, w[1] / nw] : [0, 0];

  const E = 3.3;
  const cx = plot.x + plot.w / 2, cy = plot.y + plot.h / 2;
  const sc = (plot.w * 0.46) / E;
  const SX = (x) => cx + x * sc;
  const SY = (y) => cy - y * sc;

  // Axes + unit circle.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(plot.x, cy); ctx.lineTo(plot.x + plot.w, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, plot.y); ctx.lineTo(cx, plot.y + plot.h); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.arc(cx, cy, sc, 0, 2 * Math.PI); ctx.stroke();

  const gQ1 = smooth(phase - 1), gPr = smooth(phase - 2), gRes = smooth(phase - 3), gQ2 = smooth(phase - 4);

  // Input vectors (dim once their roles are taken over).
  arrow(cx, cy, SX(v1[0]), SY(v1[1]), col.v1, 2.5);
  arrow(cx, cy, SX(v2[0]), SY(v2[1]), col.v2, 2.5);
  ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.fillStyle = col.v1; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('v₁', SX(v1[0]) + 6, SY(v1[1]));
  ctx.fillStyle = col.v2; ctx.fillText('v₂', SX(v2[0]) + 6, SY(v2[1]));

  // Projection of v2 onto q1 (along q1) and the perpendicular drop.
  if (gPr > 0) {
    const ppx = SX(proj[0] * gPr), ppy = SY(proj[1] * gPr);
    arrow(cx, cy, ppx, ppy, col.proj, 3);
    // perpendicular drop from v2 tip toward the projection point.
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.save(); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(SX(v2[0]), SY(v2[1])); ctx.lineTo(SX(proj[0]), SY(proj[1])); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = col.proj; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('proj', SX(proj[0] * 0.5), SY(proj[1] * 0.5) + 4);
  }

  // Residual w = v2 - proj, drawn from the projection point.
  if (gRes > 0) {
    const bx = SX(proj[0]), by = SY(proj[1]);
    arrow(bx, by, SX(proj[0] + w[0] * gRes), SY(proj[1] + w[1] * gRes), col.res, 3);
    ctx.fillStyle = col.res; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('residual', SX(proj[0] + w[0] * 0.5) + 6, SY(proj[1] + w[1] * 0.5));
  }

  // Orthonormal frame q1, q2 (unit), with a right-angle marker.
  if (gQ1 > 0) {
    arrow(cx, cy, SX(q1[0] * gQ1), SY(q1[1] * gQ1), col.q1, 3.4);
    ctx.fillStyle = col.q1; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    if (gQ1 > 0.6) ctx.fillText('q₁', SX(q1[0]) + 6, SY(q1[1]) - 8);
  }
  if (gQ2 > 0 && nw > 1e-9) {
    arrow(cx, cy, SX(q2[0] * gQ2), SY(q2[1] * gQ2), col.q2, 3.4);
    ctx.fillStyle = col.q2; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    if (gQ2 > 0.6) ctx.fillText('q₂', SX(q2[0]) + 6, SY(q2[1]) - 8);
    // right-angle marker at origin between q1 and q2.
    const d = sc * 0.16;
    ctx.strokeStyle = col.muted; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + q1[0] * d, cy - q1[1] * d);
    ctx.lineTo(cx + (q1[0] + q2[0]) * d, cy - (q1[1] + q2[1]) * d);
    ctx.lineTo(cx + q2[0] * d, cy - q2[1] * d);
    ctx.stroke();
  }

  // Stage label.
  ctx.fillStyle = col.accent;
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(STAGE[Math.min(5, Math.floor(phase))], cx, plot.y + 2);

  // Right-hand numeric panel.
  drawNumbers(col, { x: inner.x + leftW + 8, y: inner.y, w: inner.w - leftW - 10, h: inner.h },
    { v1, v2, q1, q2, pc, nw });
}

function drawNumbers(col, box, d) {
  let y = box.y + 4;
  const x = box.x;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const angV = Math.acos(Math.max(-1, Math.min(1, dot(d.v1, d.v2) / (norm(d.v1) * norm(d.v2) || 1)))) * 180 / Math.PI;
  const orth = Math.abs(dot(d.q1, d.q2));

  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('the numbers', x, y); y += 20;

  const line = (label, val, color) => {
    ctx.fillStyle = color; ctx.font = fontString(canvas, 'tick', 'mono', 700);
    ctx.fillText(label, x, y); y += 13;
    ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono');
    ctx.fillText(val, x, y); y += 18;
  };
  line('v₂ · q₁ (overlap)', d.pc.toFixed(2), col.proj);
  line('|residual|', d.nw.toFixed(2), col.res);
  line('q₁ (unit)', `(${d.q1[0].toFixed(2)}, ${d.q1[1].toFixed(2)})`, col.q1);
  line('q₂ (unit)', d.nw > 1e-9 ? `(${d.q2[0].toFixed(2)}, ${d.q2[1].toFixed(2)})` : 'undefined', col.q2);
  y += 2;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText(`∠(v₁,v₂) = ${angV.toFixed(0)}°`, x, y); y += 15;
  ctx.fillStyle = orth < 1e-6 ? col.q1 : col.res;
  ctx.fillText(`q₁·q₂ = ${orth.toExponential(1)}`, x, y);
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Residual and projection vs v₂ angle');

  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 14, h: r.h - 28 - 40 };
  const a1 = parseFloat(sA1.value) * Math.PI / 180;
  const l2 = parseFloat(sL2.value);
  const a2 = parseFloat(sA2.value);
  const yMax = Math.max(l2 * 1.1, 0.1);
  const xOf = (deg) => inner.x + (deg / 360) * inner.w;
  const yOf = (v) => inner.y + inner.h - (v / yMax) * inner.h;

  // Grid + y ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const v of [0, l2 / 2, l2]) { const y = yOf(v); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(v.toFixed(1), inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const dg of [0, 90, 180, 270, 360]) ctx.fillText(String(dg), xOf(dg), inner.y + inner.h + 4);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  const curve = (fn, color, w) => {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath();
    for (let i = 0; i <= 180; i++) {
      const th = i / 180 * 2 * Math.PI;
      const X = xOf(i / 180 * 360), Y = yOf(fn(th));
      if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
    }
    ctx.stroke();
  };
  curve((th) => Math.abs(l2 * Math.cos(th - a1)), col.proj, 1.6);     // projection length
  curve((th) => Math.abs(l2 * Math.sin(th - a1)), col.res, 2.6);      // residual length

  // Parallel (residual zero) markers at a1 and a1+180.
  for (const deg of [(parseFloat(sA1.value)) % 360, (parseFloat(sA1.value) + 180) % 360]) {
    ctx.strokeStyle = 'rgba(239,71,111,0.5)'; ctx.lineWidth = 1;
    ctx.save(); ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(xOf(deg), inner.y); ctx.lineTo(xOf(deg), inner.y + inner.h); ctx.stroke();
    ctx.restore();
  }

  // Cursor at current v2 angle.
  const cxp = xOf(a2 % 360);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
  ctx.save(); ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(cxp, inner.y); ctx.lineTo(cxp, inner.y + inner.h); ctx.stroke();
  ctx.restore();
  const dth = (a2 * Math.PI / 180) - a1;
  ctx.fillStyle = col.res; ctx.beginPath(); ctx.arc(cxp, yOf(Math.abs(l2 * Math.sin(dth))), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = col.proj; ctx.beginPath(); ctx.arc(cxp, yOf(Math.abs(l2 * Math.cos(dth))), 3.5, 0, 2 * Math.PI); ctx.fill();

  // Axis labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('v₂ angle (deg)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 32, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('length', 0, 0); ctx.restore();

  const legend = [['residual', col.res], ['projection', col.proj]];
  ctx.fillStyle = 'rgba(10,12,18,0.72)'; ctx.fillRect(inner.x + 6, inner.y + 6, 156, 18);
  let lx = inner.x + 12; const ly = inner.y + 15;
  ctx.font = fontString(canvas, 'legend', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const [lab, c] of legend) {
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 14, ly); ctx.stroke();
    ctx.fillStyle = col.fg; ctx.fillText(lab, lx + 17, ly); lx += ctx.measureText(lab).width + 32;
  }
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) phase = (phase + dt) % 8;   // build over 0-5 s, hold assembled 5-8 s
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    phase = (f * 8) % 8;
  } else {
    phase = 6;     // start in the assembled-hold window
  }
  syncVals();
  relayout();
  render();
}

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const { v1, v2 } = inputs();
  const q = gramSchmidt([v1, v2]);
  const pc = dot(v2, [v1[0] / (norm(v1) || 1), v1[1] / (norm(v1) || 1)]);
  const ang = Math.acos(Math.max(-1, Math.min(1, dot(v1, v2) / (norm(v1) * norm(v2) || 1)))) * 180 / Math.PI;
  return {
    fields: [
      { key: 'ang', label: 'angle $\\angle(v_1,v_2)$ (deg)', value: ang, format: 'float' },
      { key: 'proj', label: 'overlap $v_2\\cdot q_1$', value: pc, format: 'float' },
      { key: 'orth', label: 'orthogonality $q_1\\cdot q_2$', value: dot(q[0], q[1]), format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    const { v1, v2 } = inputs();
    const q = gramSchmidt([v1, v2]);
    const nq2 = norm(q[1]);
    if (nq2 < 1e-9) {
      return [{ key: 'orthonormal', label: 'Q orthonormal (parallel inputs fail)', value: '1.0', status: 'drift' }];
    }
    const err = Math.max(
      Math.abs(dot(q[0], q[0]) - 1),
      Math.abs(dot(q[1], q[1]) - 1),
      Math.abs(dot(q[0], q[1])),
    );
    return [{
      key: 'orthonormal',
      label: 'Q orthonormal (max err)',
      value: err.toExponential(2),
      status: err < 1e-9 ? 'pass' : (err < 1e-5 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
