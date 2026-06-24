// Relativistic velocity addition. The scene races a ship (speed u), a ball fired from it
// (ground speed w), and a light pulse (speed c) to show w never reaches c, then lays the
// velocities on a bounded [-c,c] axis beside the unbounded rapidity axis where they add
// head to tail. The diagnostic plots w against v for the current u, the relativistic
// curve hugging the light ceiling against the runaway Galilean line. Canvas2D only.
//
// Reference: Taylor and Wheeler, Spacetime Physics, 2nd ed., Ch. 3.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { addVelocity, galilean, rapidity } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sU = document.getElementById('s-u'), vU = document.getElementById('v-u');
const sV = document.getElementById('s-v'), vV = document.getElementById('v-v');
const btnReset = document.getElementById('btn-reset');

const st = { u: 0.6, v: 0.7, raceT: 0 };
let frame = 0, running = true;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.22 }, { name: 'diag', weight: 0.88 }]); }
function syncVals() { sU.value = st.u; vU.textContent = `${st.u.toFixed(2)} c`; sV.value = st.v; vV.textContent = `${st.v.toFixed(2)} c`; }
btnReset.addEventListener('click', () => { st.u = 0.6; st.v = 0.7; st.raceT = 0; syncVals(); if (!running) render(); });
sU.addEventListener('input', () => { st.u = +sU.value; syncVals(); if (!running) render(); });
sV.addEventListener('input', () => { st.v = +sV.value; syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    ship: '#5ea8ff', ball: '#8de08a', light: '#ffd24a', gal: '#ff6f6f', rap: '#c98cff', clim: 'rgba(255,210,74,0.6)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function drawScene(col, r) {
  const u = st.u, v = st.v, w = addVelocity(u, v), g = galilean(u, v);
  panel(col, r, `Velocity addition:  ship u = ${u.toFixed(2)}c,  ball v = ${v.toFixed(2)}c in ship frame  ->  ground speed w = ${w.toFixed(3)}c`);
  const inner = { x: r.x + 16, y: r.y + 30, w: r.w - 32, h: r.h - 30 - 10 };

  // race track (light, ball, ship moving from rest), thin so the three rows fit on phones.
  const trackY = inner.y + inner.h * 0.26;
  const trackL = inner.x + 12, trackW = inner.w - 24, half = trackW / 2, midx = trackL + half, cxR = trackL + trackW;
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(trackL, trackY); ctx.lineTo(cxR, trackY); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(midx, trackY - 20); ctx.lineTo(midx, trackY + 20); ctx.stroke(); ctx.setLineDash([]);
  const px = (speed) => midx + speed * st.raceT * half;
  const drawMover = (speed, color, label, yoff, rad) => { const x = Math.max(trackL + 2, Math.min(cxR - 2, px(speed))); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, trackY + yoff, rad, 0, 6.2832); ctx.fill(); ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = yoff < 0 ? 'bottom' : 'top'; ctx.fillText(label, x, trackY + yoff + (yoff < 0 ? -rad - 2 : rad + 2)); };
  // Stagger the three racers onto separate rows so their labels never collide.
  drawMover(1, col.light, 'light', -15, 5);
  drawMover(w, col.ball, 'ball', 14, 6);
  drawMover(u, col.ship, 'ship', 36, 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('race from rest: the ball never catches the light', trackL, trackY + 58);

  // velocity axis [-1.3, 1.3].
  const va = { x: inner.x + 40, y: inner.y + inner.h * 0.68, w: inner.w - 80 };
  const VLIM = 1.3; const vx = (b) => va.x + (b + VLIM) / (2 * VLIM) * va.w;
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(va.x, va.y); ctx.lineTo(va.x + va.w, va.y); ctx.stroke();
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const b of [-1, -0.5, 0, 0.5, 1]) { ctx.strokeStyle = col.axis; ctx.beginPath(); ctx.moveTo(vx(b), va.y - 4); ctx.lineTo(vx(b), va.y + 4); ctx.stroke(); ctx.fillText(b.toFixed(1), vx(b), va.y + 7); }
  // speed-of-light limits.
  for (const s of [-1, 1]) { ctx.strokeStyle = col.clim; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(vx(s), va.y - 28); ctx.lineTo(vx(s), va.y + 16); ctx.stroke(); ctx.setLineDash([]); }
  ctx.fillStyle = col.light; ctx.textBaseline = 'bottom'; ctx.fillText('c', vx(1), va.y - 30); ctx.fillText('-c', vx(-1), va.y - 30);
  const vmark = (b, color, label, yoff) => {
    const X = vx(Math.max(-VLIM, Math.min(VLIM, b)));
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(vx(0), va.y + yoff); ctx.lineTo(X, va.y + yoff); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X, va.y + yoff, 4, 0, 6.2832); ctx.fill();
    const toRight = X < vx(0.45);
    ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = toRight ? 'left' : 'right'; ctx.textBaseline = 'middle'; ctx.fillText(label, X + (toRight ? 6 : -6), va.y + yoff);
  };
  vmark(u, col.ship, 'u (ship)', -16);
  vmark(w, col.ball, 'w (relativistic)', -38);
  // Galilean prediction.
  const gX = vx(Math.max(-VLIM, Math.min(VLIM, g)));
  // Galilean prediction sits well below the tick labels so its long
  // 'exceeds c' caption never overruns the 0.5 / 1.0 ticks.
  ctx.strokeStyle = col.gal; ctx.lineWidth = 2; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(vx(0), va.y + 38); ctx.lineTo(gX, va.y + 38); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.gal; ctx.beginPath(); ctx.arc(gX, va.y + 38, 4, 0, 6.2832); ctx.fill();
  const gRight = gX < vx(0.45); ctx.textAlign = gRight ? 'left' : 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(`u+v = ${g.toFixed(2)}c${Math.abs(g) > 1 ? ' (exceeds c)' : ''}`, gX + (gRight ? 6 : -6), va.y + 36);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('ground velocity axis (units of c): the sum is capped at the light cone', va.x, va.y + 52);
}

function drawDiag(col, r) {
  const u = st.u, v = st.v;
  panel(col, r, 'Ground speed w vs ball velocity v (relativistic vs Galilean), and rapidities adding head to tail');
  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: (r.h - 30 - 34) * 0.57 };
  const xOf = (vv) => inner.x + (vv + 1) / 2 * inner.w, yOf = (ww) => inner.y + inner.h * (1 - (ww + 1.6) / 3.2);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const ww of [-1.5, -1, -0.5, 0, 0.5, 1, 1.5]) { const Y = yOf(ww); const lit = Math.abs(ww) === 1; ctx.strokeStyle = lit ? col.clim : 'rgba(255,255,255,0.06)'; if (lit) ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = lit ? col.light : col.muted; ctx.fillText(ww.toFixed(1), inner.x - 5, Y); }
  ctx.save(); clipTo(ctx, inner);
  // Galilean line.
  ctx.strokeStyle = col.gal; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); for (let i = 0; i <= 100; i += 1) { const vv = -1 + 2 * i / 100; const Y = yOf(galilean(u, vv)); i ? ctx.lineTo(xOf(vv), Y) : ctx.moveTo(xOf(vv), Y); } ctx.stroke(); ctx.setLineDash([]);
  // relativistic curve.
  ctx.strokeStyle = col.ball; ctx.lineWidth = 2.8; ctx.beginPath(); for (let i = 0; i <= 200; i += 1) { const vv = -1 + 2 * i / 200; const Y = yOf(addVelocity(u, vv)); i ? ctx.lineTo(xOf(vv), Y) : ctx.moveTo(xOf(vv), Y); } ctx.stroke();
  // current v marker.
  const w = addVelocity(u, st.v); ctx.strokeStyle = col.rap; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.v), inner.y); ctx.lineTo(xOf(st.v), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.ball; ctx.beginPath(); ctx.arc(xOf(st.v), yOf(w), 5, 0, 6.2832); ctx.fill();
  const gv = galilean(u, st.v); if (Math.abs(gv) <= 1.6) { ctx.fillStyle = col.gal; ctx.beginPath(); ctx.arc(xOf(st.v), yOf(gv), 4, 0, 6.2832); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = col.ball; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('w = (u+v)/(1+uv), capped at c', inner.x + 8, inner.y + 6);
  ctx.fillStyle = col.gal; ctx.fillText('u + v (Galilean, unbounded)', inner.x + 8, inner.y + 20);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const vv of [-1, -0.5, 0, 0.5, 1]) ctx.fillText(vv.toFixed(1), xOf(vv), inner.y + inner.h + 6);
  ctx.fillText('ball velocity v in ship frame (units of c)', inner.x + inner.w / 2, inner.y + inner.h + 19);

  // rapidity axis: phi_u and phi_v add head to tail to phi_w (unbounded).
  const phU = rapidity(u), phV = rapidity(v), phW = phU + phV, RLIM = Math.max(2.6, Math.abs(phW) * 1.2 + 0.5);
  const ra = { x: r.x + 44, y: r.y + r.h - 24, w: r.w - 44 - 16 };
  const rx = (p) => ra.x + (p + RLIM) / (2 * RLIM) * ra.w;
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ra.x, ra.y); ctx.lineTo(ra.x + ra.w, ra.y); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let p = -Math.floor(RLIM); p <= Math.floor(RLIM); p += 1) { ctx.strokeStyle = col.axis; ctx.beginPath(); ctx.moveTo(rx(p), ra.y - 4); ctx.lineTo(rx(p), ra.y + 4); ctx.stroke(); ctx.fillText(`${p}`, rx(p), ra.y + 6); }
  const rarrow = (x1, x2, yy, color) => { ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x2, yy); ctx.stroke(); const dir = Math.sign(x2 - x1) || 1; ctx.beginPath(); ctx.moveTo(x2, yy); ctx.lineTo(x2 - dir * 7, yy - 4); ctx.lineTo(x2 - dir * 7, yy + 4); ctx.closePath(); ctx.fill(); };
  rarrow(rx(0), rx(phU), ra.y - 13, col.ship);
  rarrow(rx(phU), rx(phW), ra.y - 13, col.ball);
  ctx.fillStyle = col.rap; ctx.beginPath(); ctx.arc(rx(phW), ra.y - 13, 4, 0, 6.2832); ctx.fill();
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = col.ship; ctx.fillText(`phi_u=${phU.toFixed(2)}`, (rx(0) + rx(phU)) / 2, ra.y - 17);
  ctx.fillStyle = col.ball; ctx.fillText(`phi_v=${phV.toFixed(2)}`, (rx(phU) + rx(phW)) / 2, ra.y - 17);
  ctx.fillStyle = col.rap; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(`phi_w = ${phW.toFixed(2)}`, rx(phW) + 7, ra.y - 13);
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick() { frame += 1; if (running) { st.raceT += 0.006; if (st.raceT > 1.02) st.raceT = 0; } render(); if (running) requestAnimationFrame(tick); }

function boot() {
  if (params.get('u')) st.u = Math.max(-0.95, Math.min(0.95, +params.get('u')));
  if (params.get('v')) st.v = Math.max(-0.95, Math.min(0.95, +params.get('v')));
  syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.raceT = 0.7; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const w = addVelocity(st.u, st.v);
  return { fields: [
    { key: 'u', label: 'ship speed u (c)', value: st.u, format: 'float' },
    { key: 'v', label: 'ball speed in ship frame v (c)', value: st.v, format: 'float' },
    { key: 'w', label: 'ball ground speed w (c)', value: w, format: 'float' },
    { key: 'gal', label: 'Galilean u+v (c)', value: galilean(st.u, st.v), format: 'float' },
    { key: 'phi', label: 'rapidity phi_w', value: rapidity(w), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const w = addVelocity(st.u, st.v);
  const radd = Math.abs(rapidity(w) - (rapidity(st.u) + rapidity(st.v)));
  return [
    { key: 'sublight', label: 'ground speed stays below c', value: `${w.toFixed(3)}c`, status: Math.abs(w) < 1 ? 'pass' : 'drift' },
    { key: 'rapidity', label: 'rapidities add: phi_w = phi_u + phi_v', value: radd.toExponential(1), status: radd < 1e-9 ? 'pass' : 'drift' },
  ];
};
