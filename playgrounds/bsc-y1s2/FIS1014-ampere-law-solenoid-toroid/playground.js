// Ampere's law in three symmetric cases. The scene shows the geometry, the B
// field and the Amperian loop you drag; the diagnostic is B versus distance,
// and the readout proves the closed line integral of B equals mu0 times the
// enclosed current. Canvas2D only.
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 5.3.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { fieldWire, fieldSolenoid, fieldToroid, ampereCheck } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selCase = document.getElementById('select-case');
const sI = document.getElementById('slider-I'), vI = document.getElementById('value-I');
const sLoop = document.getElementById('slider-loop'), vLoop = document.getElementById('value-loop'), labLoop = document.getElementById('label-loop');
const btnReset = document.getElementById('btn-reset');

// fixed geometry per case (kept simple so the field laws are clean).
const SOL = { n: 6, Rsol: 1.0 };
const TOR = { N: 24, a: 1.0, b: 2.0 };
const st = { kase: 'wire', I: 2, loop: 1.2, t: 0 };
const running = !DETERMINISTIC;

function pars() { return st.kase === 'solenoid' ? { I: st.I, n: SOL.n, Rsol: SOL.Rsol } : st.kase === 'toroid' ? { I: st.I, N: TOR.N, a: TOR.a, b: TOR.b } : { I: st.I }; }
function Bof(r) { return st.kase === 'wire' ? fieldWire(st.I, r) : st.kase === 'solenoid' ? fieldSolenoid(st.I, SOL.n, SOL.Rsol, r) : fieldToroid(st.I, TOR.N, TOR.a, TOR.b, r); }

let view = { w: 760, h: 980, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.5 },
    { name: 'diag', weight: 1.05 },
  ]);
}

function loopRange() {
  if (st.kase === 'wire') return [0.35, 2.6];
  if (st.kase === 'solenoid') return [0.4, 2.0];     // rectangular-loop axial length
  return [TOR.a + 0.05, TOR.b - 0.05];               // inside the toroid windings
}
function clampLoop() { const [lo, hi] = loopRange(); st.loop = Math.max(lo, Math.min(hi, st.loop)); }

function syncVals() {
  vI.textContent = st.I.toFixed(1); vLoop.textContent = st.loop.toFixed(2);
  labLoop.textContent = st.kase === 'solenoid' ? 'loop length' : 'loop radius';
}
selCase.addEventListener('change', () => { st.kase = selCase.value; clampLoop(); syncVals(); render(); });
sI.addEventListener('input', () => { st.I = parseFloat(sI.value); syncVals(); render(); });
sLoop.addEventListener('input', () => { st.loop = parseFloat(sLoop.value); clampLoop(); syncVals(); render(); });
btnReset.addEventListener('click', () => { st.kase = 'wire'; st.I = 2; st.loop = 1.2; selCase.value = 'wire'; sI.value = '2'; sLoop.value = '1.2'; const [lo, hi] = loopRange(); sLoop.min = String(lo); sLoop.max = String(hi); syncVals(); render(); });

function colors() {
  const css = getComputedStyle(document.body);
  return { bg: css.getPropertyValue('--bg').trim() || '#07080d', panel: '#0a0c12', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', B: '#5bc0eb', loop: '#ffd166', wire: '#ef5466', cu: '#67d98c' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7); }
}
function dot(x, y, color, out) {
  ctx.fillStyle = '#11151c'; ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.28); ctx.fill(); ctx.stroke();
  if (out) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 6.28); ctx.fill(); }
  else { ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3); ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3); ctx.stroke(); }
}

function drawScene(col, r) {
  panel(col, r, 'Amperian loop and the field it encircles');
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const cx = draw.x + draw.w / 2, cy = draw.y + draw.h / 2;
  const sc = Math.min(draw.w, draw.h) * 0.40 / 2.6;     // pixels per unit length
  const dash = (st.t * 40) % 16;
  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH });

  if (st.kase === 'wire') {
    // azimuthal B field as concentric circles, current out of page at centre.
    ctx.strokeStyle = 'rgba(91,192,235,0.32)'; ctx.lineWidth = 1;
    for (const rr of [0.5, 0.9, 1.4, 2.0, 2.5]) { ctx.beginPath(); ctx.arc(cx, cy, rr * sc, 0, 6.28); ctx.stroke(); }
    // Amperian loop at radius st.loop, with B arrows tangent (counterclockwise).
    const lr = st.loop * sc;
    ctx.strokeStyle = col.loop; ctx.lineWidth = 2.4; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -dash; ctx.beginPath(); ctx.arc(cx, cy, lr, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
    for (let k = 0; k < 8; k += 1) { const a = 2 * Math.PI * k / 8 + st.t * 0.4; tangentArrow(col.B, cx + lr * Math.cos(a), cy + lr * Math.sin(a), a + Math.PI / 2); }
    dot(cx, cy, col.cu, true);
    ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('current I (out of page)', cx, cy + 10);
  } else if (st.kase === 'solenoid') {
    // side view: a long solenoid along x, wall at y = +/- Rsol; uniform interior B.
    const hw = draw.w * 0.42, Rs = SOL.Rsol * sc;
    const yT = cy - Rs, yB = cy + Rs, xL = cx - hw, xR = cx + hw;
    // winding crossings (top out, bottom in).
    for (let k = 0; k <= 14; k += 1) { const x = xL + (xR - xL) * k / 14; dot(x, yT, col.wire, true); dot(x, yB, col.wire, false); }
    // uniform interior field arrows.
    ctx.strokeStyle = col.B; ctx.fillStyle = col.B;
    for (let gy = yT + Rs * 0.5; gy < yB; gy += Rs * 0.6) for (let k = 0; k < 7; k += 1) { const x = xL + (xR - xL) * (k + 0.5 + ((st.t * 0.5) % 1)) / 7; if (x > xL && x < xR) tangentArrow(col.B, x, gy, 0); }
    // rectangular Amperian loop straddling the top wall, length st.loop.
    const ll = st.loop * sc, lyOut = yT - Rs * 0.55;
    ctx.strokeStyle = col.loop; ctx.lineWidth = 2.4; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -dash;
    ctx.strokeRect(cx - ll / 2, lyOut, ll, (yT + Rs * 0.4) - lyOut); ctx.setLineDash([]);
    ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('inside leg in the field; outside leg in B = 0', cx, yB + 8);
  } else {
    // toroid top view: annulus a < r < b, field circulating inside.
    ctx.strokeStyle = 'rgba(239,84,102,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, TOR.a * sc, 0, 6.28); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, TOR.b * sc, 0, 6.28); ctx.stroke();
    ctx.fillStyle = 'rgba(239,84,102,0.08)'; ctx.beginPath(); ctx.arc(cx, cy, TOR.b * sc, 0, 6.28); ctx.arc(cx, cy, TOR.a * sc, 0, 6.28, true); ctx.fill();
    // field arrows circulating inside the windings.
    const mr = (TOR.a + TOR.b) / 2 * sc;
    for (let k = 0; k < 12; k += 1) { const a = 2 * Math.PI * k / 12 + st.t * 0.4; tangentArrow(col.B, cx + mr * Math.cos(a), cy + mr * Math.sin(a), a + Math.PI / 2); }
    // Amperian loop at radius st.loop.
    const lr = st.loop * sc;
    ctx.strokeStyle = col.loop; ctx.lineWidth = 2.4; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -dash; ctx.beginPath(); ctx.arc(cx, cy, lr, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N turns', cx, cy);
  }
  ctx.restore();

  // readout strip: Ampere's law check.
  const c = ampereCheck(st.kase, pars(), st.loop);
  const items = [
    [st.kase, col.fg],
    [`I ${st.I.toFixed(1)}`, col.cu],
    [`B ${c.B.toFixed(2)}`, col.B],
    [`circ ${c.circulation.toFixed(2)} = I_enc ${c.Ienc.toFixed(2)}`, col.loop],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [t] of items) widest = Math.max(widest, ctx.measureText(t).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, cc], i) => { ctx.fillStyle = cc; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}
function tangentArrow(color, x, y, ang) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.6; const L = 9;
  const x1 = x + L * Math.cos(ang), y1 = y + L * Math.sin(ang);
  ctx.beginPath(); ctx.moveTo(x - L * Math.cos(ang), y - L * Math.sin(ang)); ctx.lineTo(x1, y1); ctx.stroke();
  const a = 4.5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - a * Math.cos(ang - 0.5), y1 - a * Math.sin(ang - 0.5)); ctx.lineTo(x1 - a * Math.cos(ang + 0.5), y1 - a * Math.sin(ang + 0.5)); ctx.closePath(); ctx.fill();
}

function drawDiag(col, r) {
  panel(col, r, 'Field magnitude B vs distance from the symmetry axis');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 32 };
  const rMax = 3.0, rFloor = 0.3;     // ignore the 1/r divergence as r -> 0 when autoscaling
  let Bmax = 1e-9; for (let i = 0; i <= 200; i += 1) Bmax = Math.max(Bmax, Bof(rFloor + (rMax - rFloor) * i / 200));
  Bmax *= 1.12;
  const xOf = (rr) => inner.x + rr / rMax * inner.w;
  const yOf = (B) => inner.y + inner.h - Math.min(1, B / Bmax) * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 4; k += 1) { const B = Bmax * k / 4; const y = yOf(B); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(B.toFixed(1), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // shade the region where the loop encloses current (the field-bearing region).
  if (st.kase === 'toroid') { ctx.fillStyle = 'rgba(255,209,102,0.08)'; ctx.fillRect(xOf(TOR.a), inner.y, xOf(TOR.b) - xOf(TOR.a), inner.h); }
  if (st.kase === 'solenoid') { ctx.fillStyle = 'rgba(255,209,102,0.08)'; ctx.fillRect(inner.x, inner.y, xOf(SOL.Rsol) - inner.x, inner.h); }

  // B(r) curve (sample finely; the solenoid/toroid steps need care).
  ctx.strokeStyle = col.B; ctx.lineWidth = 2.4; ctx.beginPath(); let pen = false;
  for (let i = 0; i <= 400; i += 1) { const rr = rMax * i / 400; const B = Bof(rr); const X = xOf(rr), Y = yOf(B); if (rr < 1e-3) { ctx.moveTo(X, Y); pen = true; continue; } if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } }
  ctx.stroke();
  // loop-position marker.
  const lr = st.kase === 'solenoid' ? 0 : st.loop;       // for solenoid the loop is across the wall, not at a radius
  if (st.kase !== 'solenoid') { ctx.strokeStyle = col.loop; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(xOf(lr), inner.y); ctx.lineTo(xOf(lr), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xOf(lr), yOf(Bof(lr)), 4, 0, 6.28); ctx.fill(); ctx.strokeStyle = col.loop; ctx.lineWidth = 1.4; ctx.stroke(); }

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const rr of [0, 1, 2, 3]) ctx.fillText(String(rr), xOf(rr), inner.y + inner.h + 6);
  ctx.fillText('distance r', inner.x + inner.w / 2, inner.y + inner.h + 18);
  ctx.save(); ctx.translate(inner.x - 30, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('field B', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiag(col, REG.diag);
}
function tick() { if (running) st.t += 0.016; render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

function boot() {
  const pk = params.get('case'); if (pk) { st.kase = pk; selCase.value = pk; }
  const [lo, hi] = loopRange(); sLoop.min = String(lo); sLoop.max = String(hi); clampLoop(); sLoop.value = String(st.loop);
  syncVals(); relayout(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); else { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const c = ampereCheck(st.kase, pars(), st.loop);
  return { fields: [
    { key: 'case', label: 'geometry', value: st.kase, format: 'text' },
    { key: 'I', label: 'current I', value: st.I, format: 'float' },
    { key: 'loop', label: st.kase === 'solenoid' ? 'loop length' : 'loop radius', value: st.loop, format: 'float' },
    { key: 'B', label: 'field B on the loop', value: c.B, format: 'float' },
    { key: 'Ienc', label: 'enclosed current', value: c.Ienc, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const c = ampereCheck(st.kase, pars(), st.loop);
  const rel = Math.abs(c.circulation - c.Ienc) / (Math.abs(c.Ienc) + 1e-9);
  return [
    { key: 'ampere', label: 'closed integral of B = mu0 I_enc', value: rel.toExponential(1), status: (c.Ienc === 0 ? (Math.abs(c.circulation) < 1e-9) : rel < 1e-6) ? 'pass' : 'drift' },
  ];
};
