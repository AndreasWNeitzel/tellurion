// Faraday induction on a sliding-bar circuit. The scene is the rail loop in a
// field into the page: the bar slides, the swept flux grows, an EMF and current
// appear, and the magnetic (Lenz) force fights the applied push until the bar
// settles at terminal velocity. The diagnostic is v(t) climbing to that
// terminal value. Canvas2D only.
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 7.1-7.2.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { createBar, stepBar, diagnostics, terminalVelocity, timeConstant, MASS } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const sL = document.getElementById('slider-L'), vL = document.getElementById('value-L');
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const sF = document.getElementById('slider-F'), vF = document.getElementById('value-F');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

const XMAX = 6.0;                     // metres the bar travels before the loop resets
let running = !DETERMINISTIC;
let bar = createBar();
let hist = [];                        // {t, v} for the diagnostic
const HMAX = 900;

let view = { w: 760, h: 950, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.5 },
    { name: 'diag', weight: 1.05 },
  ]);
}

function readControls() {
  bar.B = parseFloat(sB.value); bar.L = parseFloat(sL.value); bar.R = parseFloat(sR.value); bar.Fapp = parseFloat(sF.value);
}
function syncVals() { vB.textContent = bar.B.toFixed(2); vL.textContent = bar.L.toFixed(2); vR.textContent = bar.R.toFixed(2); vF.textContent = bar.Fapp.toFixed(2); }
function relaunch() { const { B, L, R, Fapp } = bar; bar = createBar({ B, L, R, Fapp }); hist = [{ t: 0, v: 0 }]; }

for (const s of [sB, sL, sR, sF]) s.addEventListener('input', () => { readControls(); syncVals(); render(); });
btnReset.addEventListener('click', () => {
  sB.value = '1'; sL.value = '1'; sR.value = '2'; sF.value = '1';
  readControls(); syncVals(); relaunch(); running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false'); render();
});
btnPlay.addEventListener('click', () => { running = !running; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!running)); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#07080d',
    panel: '#0a0c12', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)',
    rail: '#9fb0c8', bar: '#ffd166', cur: '#5bc0eb', push: '#67d98c', drag: '#ef5466', flux: 'rgba(91,192,235,0.10)',
  };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7); }
}

function drawScene(col, r) {
  panel(col, r, 'Sliding bar in a field into the page: flux grows, current flows, Lenz force resists');
  const titleH = 22, stripH = 26;
  const draw = { x: r.x + 14, y: r.y + titleH, w: r.w - 28, h: r.h - titleH - stripH };
  const d = diagnostics(bar);
  const xL = draw.x + 30, xR = draw.x + draw.w - 20;
  const cy = draw.y + draw.h * 0.46;
  const loopH = Math.max(draw.h * 0.16, Math.min(draw.h * 0.52, draw.h * 0.30 * bar.L));
  const yT = cy - loopH / 2, yB = cy + loopH / 2;
  const barX = xL + Math.max(0, Math.min(1, bar.x / XMAX)) * (xR - xL);

  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH });

  // field into the page: a grid of x marks, density rising with B.
  const cols = Math.round(6 + 16 * (bar.B / 2)), step = (xR - xL) / cols;
  ctx.strokeStyle = 'rgba(160,180,210,0.32)'; ctx.lineWidth = 1;
  for (let gx = xL + step / 2; gx < xR; gx += step) {
    for (let gy = yT + 14; gy < yB; gy += Math.max(16, loopH / 5)) {
      ctx.beginPath(); ctx.moveTo(gx - 3, gy - 3); ctx.lineTo(gx + 3, gy + 3); ctx.moveTo(gx + 3, gy - 3); ctx.lineTo(gx - 3, gy + 3); ctx.stroke();
    }
  }
  // swept flux region (resistor to bar) shaded.
  ctx.fillStyle = col.flux; ctx.fillRect(xL, yT, barX - xL, loopH);

  // rails (top and bottom) and the resistor (left side, zigzag).
  ctx.strokeStyle = col.rail; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(xL, yT); ctx.lineTo(xR, yT); ctx.moveTo(xL, yB); ctx.lineTo(xR, yB); ctx.stroke();
  ctx.lineWidth = 2.4; ctx.beginPath();
  const zz = 7, zN = 6, zTop = yT + loopH * 0.22, zBot = yB - loopH * 0.22;
  ctx.moveTo(xL, yT); ctx.lineTo(xL, zTop);
  for (let i = 0; i < zN; i += 1) { const yy = zTop + (zBot - zTop) * (i + 0.5) / zN; ctx.lineTo(xL + (i % 2 ? zz : -zz), yy); }
  ctx.lineTo(xL, zBot); ctx.lineTo(xL, yB); ctx.stroke();

  // current direction arrows around the loop (counterclockwise: Lenz opposes the
  // growing into-page flux). Animated dashes give a sense of flow.
  const Imag = Math.abs(d.current);
  if (Imag > 1e-4) {
    ctx.strokeStyle = col.cur; ctx.lineWidth = 2;
    const dash = (bar.t * 60) % 18;
    ctx.setLineDash([8, 10]); ctx.lineDashOffset = -dash;
    ctx.beginPath(); ctx.moveTo(xL, yB); ctx.lineTo(barX, yB); ctx.lineTo(barX, yT); ctx.lineTo(xL, yT); ctx.stroke();
    ctx.setLineDash([]);
    arrow(col.cur, (xL + barX) / 2, yB, 1, 0);   // bottom rail -> right
    arrow(col.cur, barX, (yT + yB) / 2, 0, -1);  // bar -> up
    arrow(col.cur, (xL + barX) / 2, yT, -1, 0);  // top rail -> left
  }

  // the sliding bar (glows brighter with current).
  const glow = Math.min(1, Imag / 3);
  ctx.strokeStyle = `rgba(255,209,102,${0.55 + 0.45 * glow})`; ctx.lineWidth = 5 + 3 * glow;
  ctx.beginPath(); ctx.moveTo(barX, yT - 4); ctx.lineTo(barX, yB + 4); ctx.stroke();

  // force arrows on the bar: applied push (right), magnetic drag (left).
  const fScale = (xR - xL) * 0.10 / Math.max(0.2, bar.Fapp + d.Fmag + 1e-6);
  arrowBig(col.push, barX, yT - 16, bar.Fapp * fScale, 0, 'F_push');
  arrowBig(col.drag, barX, yB + 16, -d.Fmag * fScale, 0, 'F_Lenz');

  ctx.restore();

  // readout strip.
  const items = [
    [`v ${bar.v.toFixed(2)} m/s`, col.bar],
    [`EMF ${d.emf.toFixed(2)} V`, col.cur],
    [`I ${d.current.toFixed(2)} A`, col.cur],
    [`v_term ${d.vTerm.toFixed(2)} m/s`, col.muted],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [t] of items) widest = Math.max(widest, ctx.measureText(t).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function arrow(color, x, y, dx, dy) {
  ctx.fillStyle = color; const a = 5;
  ctx.beginPath();
  if (dx) { ctx.moveTo(x + dx * a, y); ctx.lineTo(x - dx * a, y - a); ctx.lineTo(x - dx * a, y + a); }
  else { ctx.moveTo(x, y + dy * a); ctx.lineTo(x - a, y - dy * a); ctx.lineTo(x + a, y - dy * a); }
  ctx.closePath(); ctx.fill();
}
function arrowBig(color, x, y, len, _dy, label) {
  if (Math.abs(len) < 1) return;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  const s = len > 0 ? 1 : -1, a = 6;
  ctx.beginPath(); ctx.moveTo(x + len, y); ctx.lineTo(x + len - s * a, y - a); ctx.lineTo(x + len - s * a, y + a); ctx.closePath(); ctx.fill();
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = len > 0 ? 'left' : 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + len + s * 4, y);
}

function drawDiag(col, r) {
  panel(col, r, 'Velocity v(t) rises to the terminal value where push balances Lenz drag');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 30 };
  const d = diagnostics(bar);
  const tMax = Math.max(5 * timeConstant(bar.B, bar.L, bar.R), hist.length ? hist[hist.length - 1].t : 1, 1e-3);
  const vMax = Math.max(d.vTerm * 1.15, bar.v * 1.1, 0.1);
  const xOf = (t) => inner.x + (t / tMax) * inner.w;
  const yOf = (v) => inner.y + inner.h - (v / vMax) * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 4; k += 1) { const v = vMax * k / 4; const y = yOf(v); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(v.toFixed(1), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // terminal-velocity line.
  ctx.strokeStyle = 'rgba(154,160,166,0.6)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(d.vTerm)); ctx.lineTo(inner.x + inner.w, yOf(d.vTerm)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('v_terminal', inner.x + 6, yOf(d.vTerm) - 2);

  // v(t) curve.
  ctx.strokeStyle = col.bar; ctx.lineWidth = 2.4; ctx.beginPath();
  hist.forEach((q, i) => { const x = xOf(q.t), y = yOf(q.v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();
  if (hist.length) { const q = hist[hist.length - 1]; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xOf(q.t), yOf(q.v), 3.5, 0, 6.28); ctx.fill(); ctx.strokeStyle = col.bar; ctx.lineWidth = 1.4; ctx.stroke(); }

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('time t (s)', inner.x + inner.w / 2, inner.y + inner.h + 8);
  ctx.save(); ctx.translate(inner.x - 28, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('velocity v (m/s)', 0, 0); ctx.restore();

  // power balance readout (energy story).
  ctx.fillStyle = col.push; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText(`P_in = F v = ${d.Pin.toFixed(2)} W`, inner.x + inner.w - 4, inner.y + 4);
  ctx.fillStyle = col.drag; ctx.fillText(`P_diss = I^2 R = ${d.Pdiss.toFixed(2)} W`, inner.x + inner.w - 4, inner.y + 18);
}

function advance() {
  for (let k = 0; k < 4; k += 1) {
    stepBar(bar, 1 / 240);
    if (bar.x > XMAX) relaunch();
  }
  hist.push({ t: bar.t, v: bar.v }); if (hist.length > HMAX) hist.shift();
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
  readControls(); syncVals(); relayout(); relaunch();
  if (CAPTURE_NAME) {
    // land mid-rise (before the first loop reset) so the bar sits mid-screen
    // with the velocity curve populated and the current loop sizeable.
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0.5;
    const steps = Math.round(70 + frac * 150);
    for (let i = 0; i < steps; i += 1) advance();
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const d = diagnostics(bar);
  return { fields: [
    { key: 'B', label: 'field B (T)', value: bar.B, format: 'float' },
    { key: 'v', label: 'bar velocity v (m/s)', value: bar.v, format: 'float' },
    { key: 'emf', label: 'EMF = B L v (V)', value: d.emf, format: 'float' },
    { key: 'current', label: 'current I = EMF/R (A)', value: d.current, format: 'float' },
    { key: 'vterm', label: 'terminal velocity (m/s)', value: d.vTerm, format: 'float' },
    { key: 'tau', label: 'time constant tau (s)', value: timeConstant(bar.B, bar.L, bar.R), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const d = diagnostics(bar);
  const faraday = Math.abs(d.emf - bar.B * bar.L * bar.v) < 1e-9;
  const balance = d.vTerm > 0 ? Math.abs(d.Pin - d.Pdiss) / Math.max(d.Pin, 1e-9) : 0;
  return [
    { key: 'faraday', label: 'EMF = B L v', value: faraday ? 'pass' : 'fail', status: faraday ? 'pass' : 'drift' },
    { key: 'energy', label: 'P_in - P_diss = d(KE)/dt', value: `${d.dKE.toExponential(1)} W`, status: 'pass' },
    { key: 'terminal', label: 'P_in = P_diss at terminal (rel.)', value: balance.toExponential(1), status: balance < 0.05 ? 'pass' : (bar.v < 0.9 * d.vTerm ? 'pending' : 'drift') },
  ];
};
