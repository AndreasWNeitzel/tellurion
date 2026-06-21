// Driven series RLC resonance. The scene is the rotating phasor diagram: the
// resistor voltage in phase with the current, the inductor and capacitor
// voltages 90 degrees ahead and behind, summing to the source. The diagnostic
// is the resonance curve, current amplitude versus drive frequency, peaking at
// f0 with a width set by Q. Canvas2D only.
//
// Reference: Young and Freedman, University Physics, 14e, Ch. 31.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { createCircuit, omega0, currentAmp, phase, qFactor, voltages } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sR = document.getElementById('slider-R'), vRo = document.getElementById('value-R');
const sL = document.getElementById('slider-L'), vLo = document.getElementById('value-L');
const sC = document.getElementById('slider-C'), vCo = document.getElementById('value-C');
const sF = document.getElementById('slider-F'), vFo = document.getElementById('value-F');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

const TWO_PI = 2 * Math.PI;
let cir = createCircuit();
let driveF = omega0(cir.L, cir.C) / TWO_PI;     // Hz, default at resonance
let running = !DETERMINISTIC;
let theta = 0;                                   // visual rotation of the phasor clock

let view = { w: 780, h: 1020, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.45 },
    { name: 'diag', weight: 1.05 },
  ]);
}

// L is shown in mH and C in uF on the sliders; convert to SI here.
function readControls() {
  cir.R = parseFloat(sR.value);
  cir.L = parseFloat(sL.value) * 1e-3;
  cir.C = parseFloat(sC.value) * 1e-6;
  driveF = parseFloat(sF.value);
}
function syncVals() {
  vRo.textContent = cir.R.toFixed(0); vLo.textContent = (cir.L * 1e3).toFixed(1);
  vCo.textContent = (cir.C * 1e6).toFixed(2); vFo.textContent = driveF.toFixed(0);
}
for (const s of [sR, sL, sC, sF]) s.addEventListener('input', () => { readControls(); syncVals(); render(); });
btnReset.addEventListener('click', () => {
  sR.value = '50'; sL.value = '10'; sC.value = '1'; readControls();
  sF.value = String(Math.round(omega0(cir.L, cir.C) / TWO_PI)); driveF = parseFloat(sF.value);
  syncVals(); running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false'); render();
});
btnPlay.addEventListener('click', () => { running = !running; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!running)); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#07080d', panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)',
    vr: '#ef5466', vl: '#5bc0eb', vc: '#67d98c', vsrc: '#ffd166', cur: 'rgba(220,228,245,0.55)',
  };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7); }
}
function vec(color, x0, y0, x1, y1, w = 2.4) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const ang = Math.atan2(y1 - y0, x1 - x0), a = 8;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - a * Math.cos(ang - 0.4), y1 - a * Math.sin(ang - 0.4)); ctx.lineTo(x1 - a * Math.cos(ang + 0.4), y1 - a * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
}

function drawCircuit(col, x, y, w) {
  // minimal series loop: source ~, then R, L, C boxes, current dots moving.
  ctx.strokeStyle = col.muted; ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, 30);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const seg = w / 4;
  ctx.beginPath(); ctx.arc(x + seg * 0.5, y, 9, 0, TWO_PI); ctx.stroke(); ctx.fillText('~', x + seg * 0.5, y);
  const labs = [['R', col.vr], ['L', col.vl], ['C', col.vc]];
  labs.forEach(([t, c], i) => { const cx = x + seg * (1.5 + i); ctx.fillStyle = c; ctx.fillRect(cx - 12, y - 7, 24, 14); ctx.fillStyle = '#0a0c12'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText(t, cx, y); ctx.font = fontString(canvas, 'tick', 'mono'); });
  // moving current dots along the bottom wire.
  const Iamp = currentAmp(cir.V0, TWO_PI * driveF, cir.R, cir.L, cir.C);
  const speed = Math.min(1, Iamp / (cir.V0 / cir.R));
  ctx.fillStyle = 'rgba(255,209,102,0.8)';
  for (let k = 0; k < 9; k += 1) { const fx = ((k / 9 + theta * 0.05 * (0.3 + speed)) % 1); ctx.beginPath(); ctx.arc(x + fx * w, y + 30, 2.2, 0, TWO_PI); ctx.fill(); }
}

function drawScene(col, r) {
  panel(col, r, 'Phasor diagram: V_R in phase, V_L leads, V_C lags, summing to the source');
  const titleH = 22, stripH = 26;
  const draw = { x: r.x + 12, y: r.y + titleH, w: r.w - 24, h: r.h - titleH - stripH };
  drawCircuit(col, draw.x + draw.w * 0.18, draw.y + 22, draw.w * 0.64);

  const w = TWO_PI * driveF;
  const v = voltages(cir.V0, w, cir.R, cir.L, cir.C);
  const cx = draw.x + draw.w / 2, cy = draw.y + draw.h * 0.60;
  const span = Math.max(v.VR, v.VL, v.VC, v.Vsrc, 1e-9);
  const scale = Math.min(draw.w, draw.h) * 0.34 / span;
  const t = theta;                                   // current reference angle (rotates)
  const ux = Math.cos(t), uy = Math.sin(t);          // along the current
  const px = -Math.sin(t), py = Math.cos(t);         // 90 deg ahead (inductive +)

  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH });
  // faint current reference axis.
  ctx.strokeStyle = col.cur; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(cx - ux * span * scale * 1.1, cy - uy * span * scale * 1.1); ctx.lineTo(cx + ux * span * scale * 1.15, cy + uy * span * scale * 1.15); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.cur; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('I', cx + ux * span * scale * 1.15 + 4 + px * 2, cy + uy * span * scale * 1.15 - py * 0 + 0);

  // V_R from origin (along I).
  const rTipX = cx + ux * v.VR * scale, rTipY = cy + uy * v.VR * scale;
  vec(col.vr, cx, cy, rTipX, rTipY);
  // net reactive voltage (V_L - V_C) from V_R tip, perpendicular.
  const net = v.VL - v.VC;
  const sTipX = rTipX + px * net * scale, sTipY = rTipY + py * net * scale;
  vec(net >= 0 ? col.vl : col.vc, rTipX, rTipY, sTipX, sTipY, 1.8);
  // resultant = source phasor.
  vec(col.vsrc, cx, cy, sTipX, sTipY, 3);
  // also draw V_L and V_C from origin (light) to show their full lengths.
  ctx.globalAlpha = 0.5;
  vec(col.vl, cx, cy, cx + px * v.VL * scale, cy + py * v.VL * scale, 1.4);
  vec(col.vc, cx, cy, cx - px * v.VC * scale, cy - py * v.VC * scale, 1.4);
  ctx.globalAlpha = 1;
  ctx.restore();

  // labels for the phasors near their tips.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textBaseline = 'middle';
  label(col.vr, 'V_R', rTipX, rTipY, ux, uy);
  label(col.vsrc, 'V_src', sTipX, sTipY, Math.cos(t + v.phi), Math.sin(t + v.phi));
  label(col.vl, 'V_L', cx + px * v.VL * scale, cy + py * v.VL * scale, px, py);
  label(col.vc, 'V_C', cx - px * v.VC * scale, cy - py * v.VC * scale, -px, -py);

  // readout strip.
  const f0 = omega0(cir.L, cir.C) / TWO_PI;
  const items = [
    [`f ${driveF.toFixed(0)} Hz`, col.vsrc],
    [`f0 ${f0.toFixed(0)} Hz`, col.muted],
    [`Q ${qFactor(cir.R, cir.L, cir.C).toFixed(2)}`, col.vl],
    [`phase ${(Math.abs(v.phi) < 0.009 ? '0' : (v.phi * 180 / Math.PI).toFixed(0))} deg`, col.vr],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [tx] of items) widest = Math.max(widest, ctx.measureText(tx).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([tx, c], i) => { ctx.fillStyle = c; ctx.fillText(tx, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}
function label(color, txt, x, y, dx, dy) { ctx.fillStyle = color; ctx.textAlign = dx >= 0 ? 'left' : 'right'; ctx.fillText(txt, x + dx * 7, y + dy * 7); }

function drawDiag(col, r) {
  panel(col, r, 'Resonance curve: current amplitude peaks at f0, width set by Q');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 32 };
  const f0 = omega0(cir.L, cir.C) / TWO_PI;
  const fLo = 0.15 * f0, fHi = 3.2 * f0;
  const Imax = cir.V0 / cir.R;
  const xOf = (f) => inner.x + (f - fLo) / (fHi - fLo) * inner.w;
  const yOf = (I) => inner.y + inner.h - (I / Imax) * inner.h;

  // half-power band shaded.
  const disc = Math.sqrt(cir.R * cir.R + 4 * cir.L / cir.C);
  const whi = (cir.R + disc) / (2 * cir.L) / TWO_PI, wlo = (-cir.R + disc) / (2 * cir.L) / TWO_PI;
  ctx.fillStyle = 'rgba(91,192,235,0.10)'; ctx.fillRect(xOf(wlo), inner.y, xOf(whi) - xOf(wlo), inner.h);

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 4; k += 1) { const I = Imax * k / 4; const y = yOf(I); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText((k / 4).toFixed(2), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // the resonance curve.
  ctx.strokeStyle = col.vsrc; ctx.lineWidth = 2.4; ctx.beginPath();
  const N = 240;
  for (let i = 0; i <= N; i += 1) { const f = fLo + (fHi - fLo) * i / N; const I = currentAmp(cir.V0, TWO_PI * f, cir.R, cir.L, cir.C); const X = xOf(f), Y = yOf(I); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke();
  // half-power line.
  ctx.strokeStyle = 'rgba(91,192,235,0.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(Imax / Math.SQRT2)); ctx.lineTo(inner.x + inner.w, yOf(Imax / Math.SQRT2)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(91,192,235,0.7)'; ctx.textAlign = 'left'; ctx.fillText('1/sqrt2 (half power)', inner.x + 6, yOf(Imax / Math.SQRT2) - 8);
  // f0 marker.
  ctx.strokeStyle = 'rgba(154,160,166,0.5)'; ctx.beginPath(); ctx.moveTo(xOf(f0), inner.y); ctx.lineTo(xOf(f0), inner.y + inner.h); ctx.stroke();
  // current drive marker.
  const Inow = currentAmp(cir.V0, TWO_PI * driveF, cir.R, cir.L, cir.C);
  ctx.strokeStyle = col.vsrc; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(driveF), inner.y); ctx.lineTo(xOf(driveF), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xOf(driveF), yOf(Inow), 4, 0, TWO_PI); ctx.fill(); ctx.strokeStyle = col.vsrc; ctx.lineWidth = 1.4; ctx.stroke();

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('drive frequency f (Hz)', inner.x + inner.w / 2, inner.y + inner.h + 8);
  for (const f of [f0]) { ctx.fillStyle = col.muted; ctx.fillText('f0', xOf(f), inner.y + inner.h + 8); }
  ctx.save(); ctx.translate(inner.x - 28, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('current I / I_max', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiag(col, REG.diag);
}
function tick() { if (running) theta += 0.03; render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

function boot() {
  readControls(); driveF = parseFloat(sF.value); syncVals(); relayout();
  if (CAPTURE_NAME) theta = 0.7;
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
  const w = TWO_PI * driveF, v = voltages(cir.V0, w, cir.R, cir.L, cir.C);
  return { fields: [
    { key: 'f', label: 'drive frequency (Hz)', value: driveF, format: 'float' },
    { key: 'f0', label: 'resonance f0 (Hz)', value: omega0(cir.L, cir.C) / TWO_PI, format: 'float' },
    { key: 'Q', label: 'quality factor Q', value: qFactor(cir.R, cir.L, cir.C), format: 'float' },
    { key: 'I', label: 'current amplitude (A)', value: v.I, format: 'float' },
    { key: 'phase', label: 'phase phi (deg)', value: v.phi * 180 / Math.PI, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const w = TWO_PI * driveF, v = voltages(cir.V0, w, cir.R, cir.L, cir.C);
  const phasorSum = Math.abs(Math.hypot(v.VR, v.VL - v.VC) - cir.V0) / cir.V0;
  const atRes = Math.abs(driveF - omega0(cir.L, cir.C) / TWO_PI) / (omega0(cir.L, cir.C) / TWO_PI) < 0.01;
  return [
    { key: 'phasor', label: 'phasor sum equals the source V', value: phasorSum.toExponential(1), status: phasorSum < 1e-6 ? 'pass' : 'drift' },
    { key: 'resonance', label: 'at f0: phase 0, I = V0/R', value: atRes ? `phi ${(v.phi * 180 / Math.PI).toFixed(1)}` : 'off resonance', status: atRes ? (Math.abs(v.phi) < 0.05 ? 'pass' : 'drift') : 'pending' },
  ];
};
