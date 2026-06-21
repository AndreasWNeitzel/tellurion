// A parallel-plate capacitor and a dielectric slab pulled into the gap. The slab
// covers a fraction x of the plate area (two capacitors in parallel), the free
// charge is denser under the dielectric, and the slab is pulled in by the field.
// Toggle a disconnected battery (constant charge, the energy falls) and a
// connected one (constant voltage, the battery does the work). Canvas2D only.
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 4.4.4.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { vacuumC, capacitance, chargeFor, energyConstQ, energyConstV, forceIn, fieldE, createSlab, stepSlab } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sEps = document.getElementById('slider-eps'), vEps = document.getElementById('value-eps');
const sV = document.getElementById('slider-V'), vV = document.getElementById('value-V');
const btnMode = document.getElementById('btn-mode'), vMode = document.getElementById('value-mode');
const btnRelease = document.getElementById('btn-release'), btnReset = document.getElementById('btn-reset');

const st = { epsR: 4, V: 2, mode: 'Q', slab: createSlab(0), Q: 0 };
let running = false;
function setHeldQ() { st.Q = chargeFor(1, 0, st.V); }   // charge at x=0, then held in const-Q mode
setHeldQ();

function held() {
  const C = capacitance(st.epsR, st.slab.x);
  if (st.mode === 'Q') return { C, V: st.Q / C, Q: st.Q, U: energyConstQ(st.Q, st.epsR, st.slab.x) };
  return { C, V: st.V, Q: C * st.V, U: energyConstV(st.epsR, st.slab.x, st.V) };
}

let view = { w: 820, h: 1020, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.32 }, { name: 'diag', weight: 0.9 }]);
}
function syncVals() { vEps.textContent = st.epsR.toFixed(1); vV.textContent = st.V.toFixed(1); vMode.textContent = st.mode === 'Q' ? 'constant Q (battery off)' : 'constant V (battery on)'; }
sEps.addEventListener('input', () => { st.epsR = parseFloat(sEps.value); setHeldQ(); syncVals(); render(); });
sV.addEventListener('input', () => { st.V = parseFloat(sV.value); setHeldQ(); syncVals(); render(); });
btnMode.addEventListener('click', () => { st.mode = st.mode === 'Q' ? 'V' : 'Q'; setHeldQ(); syncVals(); render(); });
btnRelease.addEventListener('click', () => { running = !running; btnRelease.textContent = running ? 'Pause' : 'Release'; btnRelease.setAttribute('aria-pressed', String(running)); });
btnReset.addEventListener('click', () => { st.slab = createSlab(0); running = false; btnRelease.textContent = 'Release'; setHeldQ(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', plus: '#ef5466', minus: '#5b8def', field: '#ffd166', diel: 'rgba(103,217,140,0.20)', dielEdge: '#67d98c', U: '#ffd166', F: '#ff9d6f' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
function arrow(x0, y0, x1, y1, head, c) {
  ctx.strokeStyle = c; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - head * Math.cos(a - 0.5), y1 - head * Math.sin(a - 0.5)); ctx.lineTo(x1 - head * Math.cos(a + 0.5), y1 - head * Math.sin(a + 0.5)); ctx.closePath(); ctx.fill();
}

let plateBox = null;
function drawScene(col, r) {
  panel(col, r, st.mode === 'Q' ? 'Dielectric pulled in, battery disconnected (charge fixed)' : 'Dielectric pulled in, battery connected (voltage fixed)');
  const h = held();
  const draw = { x: r.x + 40, y: r.y + 30, w: r.w - 80, h: r.h - 30 - 64 };
  const W = draw.w * 0.82, xL = draw.x + draw.w * 0.09, gap = draw.h * 0.46;
  const yTop = draw.y + draw.h * 0.5 - gap / 2, yBot = draw.y + draw.h * 0.5 + gap / 2;
  plateBox = { xL, xR: xL + W, yTop, yBot, W, gap };
  const x = st.slab.x, xEdge = xL + x * W;
  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + 24, w: r.w, h: r.h - 24 });

  // dielectric slab (from the left, fraction x).
  if (x > 0.001) {
    ctx.fillStyle = col.diel; ctx.fillRect(xL, yTop, x * W, gap);
    ctx.strokeStyle = col.dielEdge; ctx.lineWidth = 1.6; ctx.strokeRect(xL, yTop, x * W, gap);
    ctx.fillStyle = col.dielEdge; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (x > 0.12) ctx.fillText(`dielectric eps_r=${st.epsR.toFixed(1)}`, xL + x * W / 2, (yTop + yBot) / 2);
  }
  // E field arrows (uniform V/d), length scaled to the current field so that at
  // constant charge the field visibly weakens as the slab enters and V drops.
  const arrowLen = gap * 0.78 * Math.max(0.25, Math.min(1, h.V / st.V));
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 11; i += 1) { const ax = xL + (i + 0.5) / 11 * W; arrow(ax, yTop + (gap - arrowLen) / 2, ax, yTop + (gap + arrowLen) / 2, 6, col.field); }
  ctx.globalAlpha = 1;
  // plates.
  ctx.fillStyle = '#cbd2dd'; ctx.fillRect(xL - 4, yTop - 9, W + 8, 9); ctx.fillRect(xL - 4, yBot, W + 8, 9);
  // free charges, denser under the dielectric (sigma ~ eps_r there).
  ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const drawCharges = (yC, sign, color) => {
    ctx.fillStyle = color;
    const place = (x0, x1, dens) => { const n = Math.max(1, Math.round((x1 - x0) / W * 11 * dens)); for (let i = 0; i < n; i += 1) ctx.fillText(sign, x0 + (i + 0.5) / n * (x1 - x0), yC); };
    place(xL, xEdge, st.epsR); place(xEdge, xL + W, 1);
  };
  drawCharges(yTop - 4.5, '+', col.plus); drawCharges(yBot + 4.5, '-', col.minus);
  // bound charges on the slab surfaces (- near + plate, + near - plate).
  if (x > 0.06) {
    ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = 'rgba(91,141,239,0.85)';
    for (let i = 0; i < Math.round(x * 11 * st.epsR); i += 1) ctx.fillText('-', xL + (i + 0.5) / Math.round(x * 11 * st.epsR) * x * W, yTop + 8);
    ctx.fillStyle = 'rgba(239,84,102,0.85)';
    for (let i = 0; i < Math.round(x * 11 * st.epsR); i += 1) ctx.fillText('+', xL + (i + 0.5) / Math.round(x * 11 * st.epsR) * x * W, yBot - 8);
  }
  // inward force arrow on the slab edge.
  const F = forceIn(st.epsR, x, st.mode, st.Q, st.V);
  if (x < 0.999) { const fx = xEdge + 6; arrow(fx, (yTop + yBot) / 2, fx + Math.min(70, 18 + F * 30), (yTop + yBot) / 2, 8, col.F); ctx.fillStyle = col.F; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('pull in', fx + 6, (yTop + yBot) / 2 - 4); }
  // battery / switch indicator.
  ctx.strokeStyle = col.muted; ctx.lineWidth = 2; const bx = xL + W + 16;
  ctx.beginPath(); ctx.moveTo(xL + W + 4, yTop - 4.5); ctx.lineTo(bx, yTop - 4.5); ctx.lineTo(bx, yBot + 4.5); ctx.lineTo(xL + W + 4, yBot + 4.5); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  if (st.mode === 'V') { ctx.strokeStyle = col.field; ctx.beginPath(); ctx.moveTo(bx, (yTop + yBot) / 2 - 8); ctx.lineTo(bx, (yTop + yBot) / 2 + 8); ctx.moveTo(bx - 5, (yTop + yBot) / 2 - 3); ctx.lineTo(bx - 5, (yTop + yBot) / 2 + 3); ctx.stroke(); ctx.fillText('battery', bx + 6, (yTop + yBot) / 2); }
  else { ctx.strokeStyle = col.muted; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(bx - 4, (yTop + yBot) / 2 - 6); ctx.lineTo(bx + 4, (yTop + yBot) / 2 - 12); ctx.stroke(); ctx.setLineDash([]); ctx.fillText('open', bx + 6, (yTop + yBot) / 2); }
  ctx.restore();

  // readout strip.
  const items = [[`C ${h.C.toFixed(2)}`, col.dielEdge], [`V ${h.V.toFixed(2)}`, col.field], [`Q ${h.Q.toFixed(2)}`, col.plus], [`U ${h.U.toFixed(3)}`, col.U]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 30); });
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillText(`inserted x = ${(x * 100).toFixed(0)}%   (drag the slab, or Release to let the field pull it in)`, r.x + r.w / 2, r.y + r.h - 11);
}

function drawDiag(col, r) {
  panel(col, r, st.mode === 'Q' ? 'Energy U(x) falls as the slab enters (the field does the work)' : 'Energy U(x) rises as the slab enters (the battery supplies the work)');
  const inner = { x: r.x + 46, y: r.y + 26, w: r.w - 46 - 46, h: r.h - 26 - 30 };
  const Us = [], Fs = [];
  for (let i = 0; i <= 100; i += 1) { const x = i / 100; Us.push(st.mode === 'Q' ? energyConstQ(st.Q, st.epsR, x) : energyConstV(st.epsR, x, st.V)); Fs.push(forceIn(st.epsR, x, st.mode, st.Q, st.V)); }
  const uLo = Math.min(...Us) * 0.92, uHi = Math.max(...Us) * 1.05;
  const fHi = Math.max(...Fs) * 1.1 + 1e-9;
  const xOf = (x) => inner.x + x * inner.w;
  const yU = (u) => inner.y + inner.h - (u - uLo) / (uHi - uLo) * inner.h;
  const yF = (f) => inner.y + inner.h - f / fHi * inner.h;
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // force F(x) (orange, right axis).
  ctx.strokeStyle = col.F; ctx.lineWidth = 1.8; ctx.setLineDash([5, 3]); ctx.beginPath(); Fs.forEach((f, i) => { const X = xOf(i / 100), Y = yF(f); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); ctx.setLineDash([]);
  // energy U(x) (gold, left axis).
  ctx.strokeStyle = col.U; ctx.lineWidth = 2.6; ctx.beginPath(); Us.forEach((u, i) => { const X = xOf(i / 100), Y = yU(u); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  // current x marker.
  const x = st.slab.x;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(x), inner.y); ctx.lineTo(xOf(x), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.U; ctx.beginPath(); ctx.arc(xOf(x), yU(st.mode === 'Q' ? energyConstQ(st.Q, st.epsR, x) : energyConstV(st.epsR, x, st.V)), 4, 0, 6.28); ctx.fill();
  // labels.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.U; ctx.fillText('energy U', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.F; ctx.textAlign = 'right'; ctx.fillText('inward force F', inner.x + inner.w - 6, inner.y + 4);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('inserted fraction x', inner.x + inner.w / 2, inner.y + inner.h + 8);
}

function advance() {
  if (!running) return;
  const p = { epsR: st.epsR, mode: st.mode, Q: st.Q, V: st.V, m: 1.2, gamma: 1.6 };
  let n = 0; const dt = 1 / 240;
  while (n < 8) { stepSlab(st.slab, dt, p); n += 1; }
  if (st.slab.x >= 0.999 && Math.abs(st.slab.v) < 1e-3) { running = false; btnRelease.textContent = 'Release'; }
}
function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}
function tick() { advance(); render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

// drag the slab.
function pointerX(ev) { const rect = canvas.getBoundingClientRect(); return (ev.clientX - rect.left) * (view.w / rect.width); }
function pointerY(ev) { const rect = canvas.getBoundingClientRect(); return (ev.clientY - rect.top) * (view.h / rect.height); }
let dragging = false;
canvas.addEventListener('pointerdown', (e) => { if (!plateBox) return; const py = pointerY(e); if (py > plateBox.yTop - 16 && py < plateBox.yBot + 16) { dragging = true; running = false; btnRelease.textContent = 'Release'; const x = Math.max(0, Math.min(1, (pointerX(e) - plateBox.xL) / plateBox.W)); st.slab.x = x; st.slab.v = 0; render(); } });
canvas.addEventListener('pointermove', (e) => { if (!dragging || !plateBox) return; st.slab.x = Math.max(0, Math.min(1, (pointerX(e) - plateBox.xL) / plateBox.W)); st.slab.v = 0; render(); });
window.addEventListener('pointerup', () => { dragging = false; });

function boot() {
  syncVals(); relayout();
  if (CAPTURE_NAME) { st.slab.x = 0.45; }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); else { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const h = held();
  return { fields: [
    { key: 'mode', label: 'mode', value: st.mode === 'Q' ? 'constant Q' : 'constant V', format: 'text' },
    { key: 'epsR', label: 'dielectric eps_r', value: st.epsR, format: 'float' },
    { key: 'x', label: 'inserted fraction', value: st.slab.x, format: 'float' },
    { key: 'C', label: 'capacitance C/C0', value: h.C / vacuumC(), format: 'float' },
    { key: 'V', label: 'voltage V', value: h.V, format: 'float' },
    { key: 'U', label: 'energy U', value: h.U, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const x = st.slab.x;
  const C = capacitance(st.epsR, x);
  const law = Math.abs(C - vacuumC() * (1 + (st.epsR - 1) * x)) / vacuumC();
  const F = forceIn(st.epsR, x, st.mode, st.Q, st.V);
  return [
    { key: 'claw', label: 'C = C0(1+(eps_r-1)x)', value: law.toExponential(1), status: law < 1e-9 ? 'pass' : 'drift' },
    { key: 'force', label: 'the slab is pulled in (F > 0)', value: F.toFixed(3), status: F > -1e-9 ? 'pass' : 'drift' },
  ];
};
