// The displacement current that completes Ampere's law. The scene charges a
// capacitor: conduction current flows in the wires and stops at the plates,
// while a displacement current (a changing electric flux) carries on across the
// gap. A slidable Amperian loop encloses the conduction current in the wire or
// the displacement current in the gap, the same value, so B is continuous. The
// diagnostic overlays the two currents, which lie exactly on top of each other.
// Canvas2D only.
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 7.3.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { tauOf, current, charge, eField, displacementCurrent } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const sC = document.getElementById('slider-C'), vC = document.getElementById('value-C');
const sLoop = document.getElementById('slider-loop'), vLoop = document.getElementById('value-loop'), labLoop = document.getElementById('label-loop');
const btnReset = document.getElementById('btn-reset'), btnPlay = document.getElementById('btn-playpause');

const V = 5;
const st = { R: 2, C: 1.5, loop: 0.18, t: 0.05, flow: 0 };
let running = !DETERMINISTIC;
let hist = [];

function tau() { return tauOf(st.R, st.C); }
function relaunch() { st.t = 0.001; hist = []; }

let view = { w: 760, h: 980, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.45 }, { name: 'diag', weight: 1.05 }]);
}

function syncVals() {
  vR.textContent = st.R.toFixed(1); vC.textContent = st.C.toFixed(1); vLoop.textContent = `${(st.loop * 100).toFixed(0)} %`;
  labLoop.textContent = (st.loop > 0.4 && st.loop < 0.6) ? 'loop: in gap' : 'loop: on wire';
}
sR.addEventListener('input', () => { st.R = parseFloat(sR.value); syncVals(); relaunch(); render(); });
sC.addEventListener('input', () => { st.C = parseFloat(sC.value); syncVals(); relaunch(); render(); });
sLoop.addEventListener('input', () => { st.loop = parseFloat(sLoop.value); syncVals(); render(); });
btnReset.addEventListener('click', () => { st.R = 2; st.C = 1.5; st.loop = 0.18; sR.value = '2'; sC.value = '1.5'; sLoop.value = '0.18'; running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false'); syncVals(); relaunch(); render(); });
btnPlay.addEventListener('click', () => { running = !running; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!running)); });

function colors() {
  const css = getComputedStyle(document.body);
  return { bg: css.getPropertyValue('--bg').trim() || '#07080d', panel: '#0a0c12', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', wire: '#9fb0c8', cond: '#5bc0eb', disp: '#67d98c', efield: '#ffd166', plus: '#ef5466', loop: '#ff9d6f', B: '#c8b6ff' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7); }
}

function arrow(x0, y0, x1, y1, head) {
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - head * Math.cos(a - 0.4), y1 - head * Math.sin(a - 0.4));
  ctx.lineTo(x1 - head * Math.cos(a + 0.4), y1 - head * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
}

function drawScene(col, r) {
  panel(col, r, 'Charging capacitor: conduction current in wires, displacement in gap');
  const titleH = 22, stripH = 26;
  const draw = { x: r.x + 16, y: r.y + titleH, w: r.w - 32, h: r.h - titleH - stripH };
  const bandA = { x: draw.x, y: draw.y, w: draw.w, h: draw.h * 0.42 };           // side view of the circuit
  const bandB = { x: draw.x, y: draw.y + draw.h * 0.42, w: draw.w, h: draw.h * 0.58 }; // face-on Amperian loop
  const cy = bandA.y + bandA.h * 0.52;
  const xL = draw.x + draw.w * 0.06, xR = draw.x + draw.w * 0.94;     // wire span
  const gapL = draw.x + draw.w * 0.44, gapR = draw.x + draw.w * 0.56; // capacitor plates
  const I = current(V, st.R, st.t, tau()), Q = charge(V, st.C, st.t, tau()), E = eField(V, st.C, st.t, tau());
  const lx = xL + st.loop * (xR - xL);
  const inGap = lx > gapL - 2 && lx < gapR + 2;
  const Ienc = inGap ? displacementCurrent(V, st.C, st.t, tau()) : I;
  const Imax = V / st.R;
  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH });

  // --- top band: side view of the charging circuit ---
  ctx.strokeStyle = col.wire; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(xL, cy); ctx.lineTo(gapL, cy); ctx.moveTo(gapR, cy); ctx.lineTo(xR, cy); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xL, cy - 12); ctx.lineTo(xL, cy + 12); ctx.moveTo(xL - 6, cy - 6); ctx.lineTo(xL - 6, cy + 6); ctx.stroke();
  ctx.strokeStyle = col.plus; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(gapL, cy - 34); ctx.lineTo(gapL, cy + 34); ctx.stroke();
  ctx.strokeStyle = col.cond; ctx.beginPath(); ctx.moveTo(gapR, cy - 34); ctx.lineTo(gapR, cy + 34); ctx.stroke();
  const qa = Math.min(1, Q / (st.C * V));
  ctx.fillStyle = `rgba(239,84,102,${0.4 + 0.6 * qa})`; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let k = -1; k <= 1; k += 1) ctx.fillText('+', gapL - 8, cy + k * 16);
  ctx.fillStyle = `rgba(91,192,235,${0.4 + 0.6 * qa})`; for (let k = -1; k <= 1; k += 1) ctx.fillText('-', gapR + 8, cy + k * 16);
  // conduction-current dots.
  ctx.fillStyle = col.cond; const nd = 8;
  for (let k = 0; k < nd; k += 1) {
    const f = (k / nd + st.flow) % 1;
    ctx.beginPath(); ctx.arc(xL + f * (gapL - xL), cy, 2.4, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(gapR + f * (xR - gapR), cy, 2.4, 0, 6.28); ctx.fill();
  }
  // displacement field E in the gap.
  const ea = Math.min(1, E / V);
  ctx.strokeStyle = `rgba(255,209,102,${0.3 + 0.6 * ea})`; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2;
  for (let gy = cy - 28; gy <= cy + 28; gy += 14) arrow(gapL + 4, gy, gapR - 5, gy, 5);
  ctx.fillStyle = col.efield; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('E', gapR + 18, cy);
  // edge-on Amperian loop at lx.
  ctx.strokeStyle = col.loop; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.ellipse(lx, cy, 8, 46, 0, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.loop; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(inGap ? 'loop in gap: encloses I_disp' : 'loop on wire: encloses I_cond', lx, cy - 50);

  // --- lower band: face-on view of the Amperian loop ---
  const ccx = bandB.x + bandB.w / 2, ccy = bandB.y + bandB.h * 0.46;
  const Rloop = Math.min(bandB.h * 0.34, bandB.w * 0.2);
  ctx.strokeStyle = col.muted; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(bandB.x + 6, bandB.y + 2); ctx.lineTo(bandB.x + bandB.w - 6, bandB.y + 2); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('Same loop face-on: B circles the enclosed current', ccx, bandB.y + 8);
  // the loop circle.
  ctx.strokeStyle = col.loop; ctx.lineWidth = 2.2; ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.arc(ccx, ccy, Rloop, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
  // tangential B arrows (counterclockwise), length scaled to I_enc.
  const Bn = Math.min(1, Ienc / (Imax + 1e-9));
  const aLen = 9 + 20 * Bn;
  ctx.strokeStyle = col.B; ctx.fillStyle = col.B; ctx.lineWidth = 1.8;
  for (let i = 0; i < 8; i += 1) {
    const th = i / 8 * 6.283;
    const px = ccx + Rloop * Math.cos(th), py = ccy + Rloop * Math.sin(th);
    const tx = -Math.sin(th), ty = Math.cos(th);
    arrow(px - tx * aLen * 0.5, py - ty * aLen * 0.5, px + tx * aLen * 0.5, py + ty * aLen * 0.5, 5);
  }
  // enclosed current at the centre.
  if (inGap) {
    // displacement current: changing E shown as a small gold disc with an out-of-page rate symbol.
    ctx.fillStyle = `rgba(255,209,102,${0.35 + 0.5 * ea})`; ctx.beginPath(); ctx.arc(ccx, ccy, 16, 0, 6.28); ctx.fill();
    ctx.strokeStyle = col.efield; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(ccx, ccy, 16, 0, 6.28); ctx.stroke();
    ctx.fillStyle = col.efield; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('dE/dt', ccx, ccy);
  } else {
    // conduction current into the page (flowing along +x, away from the viewer): cross.
    ctx.strokeStyle = col.cond; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(ccx, ccy, 13, 0, 6.28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ccx - 9, ccy - 9); ctx.lineTo(ccx + 9, ccy + 9); ctx.moveTo(ccx + 9, ccy - 9); ctx.lineTo(ccx - 9, ccy + 9); ctx.stroke();
  }
  // labels: enclosed current and the Ampere relation.
  ctx.fillStyle = col.loop; ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`closed loop B.dl = mu0 I_enc = mu0 x ${Ienc.toFixed(2)}`, ccx, ccy + Rloop + 12);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText(inGap ? 'enclosed current = displacement current' : 'enclosed current = conduction current', ccx, ccy + Rloop + 30);
  ctx.restore();

  // readout strip.
  const items = [
    [`I_cond ${I.toFixed(2)}`, col.cond],
    [`I_disp ${displacementCurrent(V, st.C, st.t, tau()).toFixed(2)}`, col.disp],
    [`E ${E.toFixed(2)}`, col.efield],
    [`I_enc ${Ienc.toFixed(2)}`, col.loop],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [t] of items) widest = Math.max(widest, ctx.measureText(t).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiag(col, r) {
  panel(col, r, 'I_cond and I_disp coincide; E rises as the capacitor charges');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 34, h: r.h - 28 - 32 };
  const tMax = Math.max(5 * tau(), hist.length ? hist[hist.length - 1].t : 1, 1e-3);
  const Imax = V / st.R * 1.1;
  const Efinal = st.C * V, Emax = Efinal * 1.05;          // E asymptotes to Q_max/(eps0 A) = C V, not V
  const xOf = (t) => inner.x + t / tMax * inner.w;
  const yI = (I) => inner.y + inner.h - I / Imax * inner.h;
  const yE = (E) => inner.y + inner.h - E / Emax * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 4; k += 1) { const I = Imax * k / 4; const y = yI(I); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(I.toFixed(1), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // E(t) rising (gold), on its own scale: E goes 0 to C V as the capacitor charges.
  ctx.strokeStyle = 'rgba(255,209,102,0.7)'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) { const t = tMax * i / 200; const X = xOf(t), Y = yE(eField(V, st.C, t, tau())); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke();
  // I_cond (thick cyan).
  ctx.strokeStyle = col.cond; ctx.lineWidth = 3.2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) { const t = tMax * i / 200; const X = xOf(t), Y = yI(current(V, st.R, t, tau())); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke();
  // I_disp (dashed green, on top: shows they coincide).
  ctx.strokeStyle = col.disp; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) { const t = tMax * i / 200; const X = xOf(t), Y = yI(displacementCurrent(V, st.C, t, tau())); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  // current-time marker.
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.t), inner.y); ctx.lineTo(xOf(st.t), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  // right axis for E (gold): E rises from 0 to C V as the capacitor charges.
  ctx.fillStyle = 'rgba(255,209,102,0.85)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 4; k += 1) { const E = Efinal * k / 4; ctx.fillText(E.toFixed(1), inner.x + inner.w + 4, yE(E)); }

  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.cond; ctx.fillText('I_cond', inner.x + inner.w - 124, inner.y + 4);
  ctx.fillStyle = col.disp; ctx.fillText('I_disp (dashed)', inner.x + inner.w - 124, inner.y + 18);
  ctx.fillStyle = col.efield; ctx.fillText('E (right axis)', inner.x + inner.w - 124, inner.y + 32);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('time t', inner.x + inner.w / 2, inner.y + inner.h + 8);
  ctx.save(); ctx.translate(inner.x - 28, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('current', 0, 0); ctx.restore();
}

function advance() {
  const dt = 0.016 * Math.max(0.4, tau());
  st.t += dt; st.flow = (st.flow + 0.02 * (1 + current(V, st.R, st.t, tau()))) % 1;
  hist.push({ t: st.t }); if (hist.length > 600) hist.shift();
  if (st.t > 5.5 * tau()) relaunch();
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
  if (params.get('R')) { st.R = Math.max(0.5, Math.min(5, parseFloat(params.get('R')))); sR.value = String(st.R); }
  if (params.get('C')) { st.C = Math.max(0.5, Math.min(3, parseFloat(params.get('C')))); sC.value = String(st.C); }
  syncVals(); relayout();
  if (CAPTURE_NAME) { st.t = 0.7 * tau(); st.loop = 0.5; sLoop.value = '0.5'; syncVals(); for (let i = 0; i < 30; i += 1) hist.push({ t: i }); }
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
    { key: 'R', label: 'resistance R', value: st.R, format: 'float' },
    { key: 'C', label: 'capacitance C', value: st.C, format: 'float' },
    { key: 'Icond', label: 'conduction current', value: current(V, st.R, st.t, tau()), format: 'float' },
    { key: 'Idisp', label: 'displacement current', value: displacementCurrent(V, st.C, st.t, tau()), format: 'float' },
    { key: 'E', label: 'gap field E', value: eField(V, st.C, st.t, tau()), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const Ic = current(V, st.R, st.t, tau()), Id = displacementCurrent(V, st.C, st.t, tau());
  const rel = Math.abs(Ic - Id) / (Math.abs(Ic) + 1e-6);
  return [
    { key: 'equal', label: 'I_disp = I_cond (Maxwell-Ampere)', value: rel.toExponential(1), status: rel < 1e-3 ? 'pass' : 'drift' },
  ];
};
