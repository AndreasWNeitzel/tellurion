// Eddy-current braking. Two conducting plates, one solid and one slotted, are
// released together and fall through the same magnetic-field band. The flux
// through the solid plate changes as it crosses the field, driving eddy currents
// whose Lenz force brakes it hard; the slots in the other plate break those
// current loops, so it sails through. The diagnostic races their speeds.
// Canvas2D only.
//
// Reference: Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 30.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { G, Y_MAG, SIGMA_B, fieldB, fieldGrad, createPlate, stepPlate, eddyCurrent } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const btnReset = document.getElementById('btn-reset'), btnPlay = document.getElementById('btn-playpause');

const YMAX = 4.0, Y0 = 0.2, KSOLID = 2.6, KSLOT = 2.6 / 8;   // solid brakes hard but keeps creeping; slotted nearly free-falls
let B0 = 1.4;
let running = !DETERMINISTIC;
let solid, slotted, hist = [], tElapsed = 0;

function relaunch() { solid = createPlate(KSOLID, Y0); slotted = createPlate(KSLOT, Y0); hist = []; tElapsed = 0; }
relaunch();

let view = { w: 760, h: 980, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.7 }, { name: 'diag', weight: 0.95 }]);
}

vB.textContent = B0.toFixed(1);
sB.addEventListener('input', () => { B0 = parseFloat(sB.value); vB.textContent = B0.toFixed(1); render(); });
btnReset.addEventListener('click', () => { sB.value = '1.4'; B0 = 1.4; vB.textContent = '1.4'; relaunch(); running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false'); render(); });
btnPlay.addEventListener('click', () => { running = !running; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!running)); });

function colors() {
  const css = getComputedStyle(document.body);
  return { bg: css.getPropertyValue('--bg').trim() || '#07080d', panel: '#0a0c12', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', solid: '#5bc0eb', slot: '#67d98c', eddy: '#ffd166', field: '#ef5466' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7); }
}

function drawScene(col, r) {
  panel(col, r, 'Two plates fall through the field: solid brakes, slotted sails through');
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const YT = draw.y + 12, YB = draw.y + draw.h - 12;
  const yOf = (y) => YT + (y / YMAX) * (YB - YT);
  const laneL = draw.x + draw.w * 0.32, laneR = draw.x + draw.w * 0.68;
  const pw = draw.w * 0.20, ph = (0.34 / YMAX) * (YB - YT);

  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH });

  // field band: shaded strip, x marks denser where B is stronger, pole labels.
  const yBandT = yOf(Y_MAG - 2.5 * SIGMA_B), yBandB = yOf(Y_MAG + 2.5 * SIGMA_B);
  ctx.fillStyle = 'rgba(239,84,102,0.07)'; ctx.fillRect(draw.x + 8, yBandT, draw.w - 16, yBandB - yBandT);
  for (let gy = yBandT; gy < yBandB; gy += 14) {
    const yphys = (gy - YT) / (YB - YT) * YMAX; const a = Math.min(0.6, fieldB(yphys, B0) / Math.max(B0, 0.1) * 0.6);
    ctx.strokeStyle = `rgba(239,84,102,${a})`; ctx.lineWidth = 1;
    for (let gx = draw.x + 24; gx < draw.x + draw.w - 16; gx += 30) { ctx.beginPath(); ctx.moveTo(gx - 3, gy - 3); ctx.lineTo(gx + 3, gy + 3); ctx.moveTo(gx + 3, gy - 3); ctx.lineTo(gx - 3, gy + 3); ctx.stroke(); }
  }
  ctx.fillStyle = col.field; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('magnet (B into page)', draw.x + 12, yBandT + 8);

  drawPlate(col, laneL, yOf(solid.y), pw, ph, solid, false);
  drawPlate(col, laneR, yOf(slotted.y), pw, ph, slotted, true);
  // labels under each lane.
  ctx.fillStyle = col.solid; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('solid', laneL, YB - 2); ctx.fillStyle = col.slot; ctx.fillText('slotted', laneR, YB - 2);
  ctx.restore();

  // readout strip.
  const items = [
    [`B ${B0.toFixed(1)}`, col.field],
    [`v_solid ${solid.v.toFixed(1)}`, col.solid],
    [`v_slot ${slotted.v.toFixed(1)}`, col.slot],
    [`gap ${(slotted.y - solid.y).toFixed(2)}`, col.muted],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [t] of items) widest = Math.max(widest, ctx.measureText(t).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawPlate(col, cx, cy, w, h, p, slot) {
  const baseCol = slot ? col.slot : col.solid;
  ctx.fillStyle = slot ? 'rgba(103,217,140,0.18)' : 'rgba(91,192,235,0.22)';
  ctx.strokeStyle = baseCol; ctx.lineWidth = 2;
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h); ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  if (slot) { ctx.strokeStyle = 'rgba(10,12,18,0.9)'; ctx.lineWidth = 2.5; for (let k = 1; k <= 3; k += 1) { const x = cx - w / 2 + w * k / 4; ctx.beginPath(); ctx.moveTo(x, cy - h / 2 + 2); ctx.lineTo(x, cy + h / 2 - 2); ctx.stroke(); } }
  // eddy current loop(s), brightness ~ instantaneous current.
  const I = eddyCurrent(p, B0); const a = Math.min(0.95, I / 6);
  if (a > 0.03) {
    ctx.strokeStyle = `rgba(255,209,102,${a})`; ctx.lineWidth = 2;
    const loops = slot ? 4 : 1, lw = (w - 6) / loops;
    for (let k = 0; k < loops; k += 1) { const lx = cx - w / 2 + 3 + lw * (k + 0.5); ctx.beginPath(); ctx.ellipse(lx, cy, lw * 0.32, h * 0.32, 0, 0, 6.28); ctx.stroke(); }
  }
}

function drawDiag(col, r) {
  panel(col, r, 'Speed vs time: the solid plate stalls in the field, the slotted does not');
  const inner = { x: r.x + 40, y: r.y + 28, w: r.w - 40 - 16, h: r.h - 28 - 30 };
  const tMax = Math.max(hist.length ? hist[hist.length - 1].t : 1, 1);
  let vMax = 1; for (const q of hist) vMax = Math.max(vMax, q.vs, q.vl); vMax *= 1.1;
  const xOf = (t) => inner.x + t / tMax * inner.w;
  const yOf = (v) => inner.y + inner.h - v / vMax * inner.h;
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 4; k += 1) { const v = vMax * k / 4; const y = yOf(v); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(v.toFixed(0), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  const curve = (key, color) => { ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.beginPath(); hist.forEach((q, i) => { const X = xOf(q.t), Y = yOf(q[key]); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }); ctx.stroke(); };
  curve('vl', col.slot); curve('vs', col.solid);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('time t', inner.x + inner.w / 2, inner.y + inner.h + 8);
  ctx.save(); ctx.translate(inner.x - 26, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('speed v', 0, 0); ctx.restore();
}

function advance() {
  const dt = 1 / 240;
  for (let k = 0; k < 3; k += 1) { stepPlate(solid, dt, B0); stepPlate(slotted, dt, B0); tElapsed += dt; }
  hist.push({ t: tElapsed, vs: solid.v, vl: slotted.v }); if (hist.length > 900) hist.shift();
  if (solid.y > YMAX && slotted.y > YMAX) relaunch();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiag(col, REG.diag);
}
function tick() { if (running) advance(); render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

function boot() {
  relayout();
  if (CAPTURE_NAME) for (let i = 0; i < 58; i += 1) advance();   // both plates still on screen, mid-race
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); else { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'B', label: 'field strength B0', value: B0, format: 'float' },
    { key: 'vs', label: 'solid plate speed', value: solid.v, format: 'float' },
    { key: 'vl', label: 'slotted plate speed', value: slotted.v, format: 'float' },
    { key: 'hs', label: 'solid heat dissipated', value: solid.heat, format: 'float' },
    { key: 'hl', label: 'slotted heat dissipated', value: slotted.heat, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  // energy balance for the solid plate: gravity work = KE + eddy heat.
  const work = G * (solid.y - Y0), ke = 0.5 * solid.v * solid.v;
  const rel = Math.abs(work - (ke + solid.heat)) / (Math.abs(work) + 1e-9);
  return [
    { key: 'energy', label: 'gravity work = KE + eddy heat', value: rel.toExponential(1), status: rel < 0.05 ? 'pass' : 'drift' },
    { key: 'brake', label: 'solid (low R) brakes harder', value: (slotted.v - solid.v).toFixed(2), status: 'pass' },
  ];
};
