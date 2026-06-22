// A Breit-Wigner resonance. The scene shows a scattering rig whose scattered intensity
// tracks the cross-section as the incident energy sweeps, above the Lorentzian
// cross-section curve. The diagnostic plots the phase shift sweeping through pi/2 and
// the Wigner time delay peaking, both at the resonance. Canvas2D only.
//
// Reference: Sakurai and Napolitano, Modern Quantum Mechanics, 2nd ed., Ch. 6.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { crossSection, phaseShift, timeDelay } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sER = document.getElementById('s-er'), vER = document.getElementById('v-er');
const sG = document.getElementById('s-g'), vG = document.getElementById('v-g');
const btnSweep = document.getElementById('btn-sweep'), btnReset = document.getElementById('btn-reset');

const ELO = 0, EHI = 10;
const st = { ER: 5, gamma: 1.2, E: 5, sweep: true };
let frame = 0, running = true;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.2 }, { name: 'diag', weight: 0.9 }]); }
function syncVals() { sER.value = st.ER; vER.textContent = st.ER.toFixed(1); sG.value = st.gamma; vG.textContent = st.gamma.toFixed(2); btnSweep.textContent = `Sweep E: ${st.sweep ? 'on' : 'off'}`; btnSweep.setAttribute('aria-pressed', String(st.sweep)); }
function setSweep(on) { st.sweep = on; syncVals(); }
btnReset.addEventListener('click', () => { st.ER = 5; st.gamma = 1.2; st.E = 5; setSweep(false); render(); });
btnSweep.addEventListener('click', () => { setSweep(!st.sweep); if (st.sweep && !running) { running = true; requestAnimationFrame(tick); } });
sER.addEventListener('input', () => { st.ER = +sER.value; syncVals(); if (!running) render(); });
sG.addEventListener('input', () => { st.gamma = +sG.value; syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    beam: '#5ea8ff', target: '#ffd24a', scat: '#ff9d3c', sigma: '#8de08a', cursor: '#ffd24a', res: 'rgba(255,157,60,0.5)', phase: '#5ec8ff', delay: '#c98cff' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SC = null;
function drawScene(col, r) {
  const sig = crossSection(st.E, st.ER, st.gamma);
  const onRes = sig > 0.92;
  panel(col, r, `Breit-Wigner resonance:  E_R = ${st.ER.toFixed(1)},  width Gamma = ${st.gamma.toFixed(2)},  incident E = ${st.E.toFixed(2)}  ->  sigma/sigma_max = ${sig.toFixed(2)}`);
  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: r.h - 30 - 34 };
  // scattering rig (proportional, so it fits the compressed phone fold).
  const rig = { x: inner.x, y: inner.y + 4, w: inner.w, h: Math.min(80, inner.h * 0.30) };
  const tcx = rig.x + rig.w * 0.5, tcy = rig.y + rig.h / 2, trad = 10;
  // incident beam.
  ctx.strokeStyle = col.beam; ctx.fillStyle = col.beam; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(rig.x + 6, tcy); ctx.lineTo(tcx - trad - 5, tcy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tcx - trad - 5, tcy); ctx.lineTo(tcx - trad - 14, tcy - 4); ctx.lineTo(tcx - trad - 14, tcy + 4); ctx.closePath(); ctx.fill();
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('incident beam', rig.x + 6, tcy - 5);
  // scattered intensity proportional to sigma, capped inside the rig.
  const maxLen = rig.h * 0.5 - trad - 6;
  for (let k = 0; k < 14; k += 1) { const a = (k / 14) * 6.2832 + 0.2; const len = 3 + sig * maxLen; ctx.strokeStyle = `rgba(255,157,60,${(0.15 + 0.8 * sig).toFixed(3)})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(tcx + trad * Math.cos(a), tcy + trad * Math.sin(a)); ctx.lineTo(tcx + (trad + len) * Math.cos(a), tcy + (trad + len) * Math.sin(a)); ctx.stroke(); }
  // target.
  ctx.fillStyle = 'rgba(255,210,74,0.18)'; ctx.beginPath(); ctx.arc(tcx, tcy, trad, 0, 6.2832); ctx.fill(); ctx.strokeStyle = col.target; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = onRes ? col.scat : col.muted; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(onRes ? 'ON RESONANCE' : `scattered ~ ${(sig * 100).toFixed(0)}%`, rig.x + rig.w, tcy - 5);

  // cross-section plot.
  const plot = { x: inner.x, y: rig.y + rig.h + 18, w: inner.w, h: inner.y + inner.h - (rig.y + rig.h + 18) - 16 };
  const xOf = (E) => plot.x + (E - ELO) / (EHI - ELO) * plot.w, yOf = (s) => plot.y + plot.h * (1 - s);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const s of [0, 0.5, 1]) { const Y = yOf(s); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(plot.x, Y); ctx.lineTo(plot.x + plot.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(s.toFixed(1), plot.x - 5, Y); }
  ctx.save(); clipTo(ctx, plot);
  // FWHM band.
  ctx.fillStyle = col.res; ctx.globalAlpha = 0.25; ctx.fillRect(xOf(st.ER - st.gamma / 2), plot.y, xOf(st.ER + st.gamma / 2) - xOf(st.ER - st.gamma / 2), plot.h); ctx.globalAlpha = 1;
  ctx.strokeStyle = col.sigma; ctx.lineWidth = 2.8; ctx.beginPath(); for (let i = 0; i <= 400; i += 1) { const E = ELO + (EHI - ELO) * i / 400; const Y = yOf(crossSection(E, st.ER, st.gamma)); i ? ctx.lineTo(xOf(E), Y) : ctx.moveTo(xOf(E), Y); } ctx.stroke();
  // half-max line.
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xOf(st.ER - st.gamma / 2), yOf(0.5)); ctx.lineTo(xOf(st.ER + st.gamma / 2), yOf(0.5)); ctx.stroke(); ctx.setLineDash([]);
  // cursor.
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(st.E), plot.y); ctx.lineTo(xOf(st.E), plot.y + plot.h); ctx.stroke();
  ctx.fillStyle = col.sigma; ctx.beginPath(); ctx.arc(xOf(st.E), yOf(sig), 5, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.sigma; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('cross-section sigma / sigma_max', plot.x + 6, plot.y + 6);
  ctx.fillStyle = col.res; ctx.textAlign = 'center'; ctx.fillText('FWHM = Gamma', xOf(st.ER), plot.y + plot.h - 16);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; for (let E = 0; E <= 10; E += 2) ctx.fillText(`${E}`, xOf(E), plot.y + plot.h + 6); ctx.fillText('incident energy E', plot.x + plot.w / 2, plot.y + plot.h + 19);
  SC = { plot, xOf };
}

function drawDiag(col, r) {
  panel(col, r, 'Phase shift delta sweeps through pi/2 and the Wigner time delay peaks, both at the resonance');
  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: r.h - 30 - 34 };
  const xOf = (E) => inner.x + (E - ELO) / (EHI - ELO) * inner.w, yOf = (v) => inner.y + inner.h * (1 - v);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const [v, lab] of [[0, '0'], [0.5, 'pi/2'], [1, 'pi']]) { const Y = yOf(v); ctx.strokeStyle = v === 0.5 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(lab, inner.x - 5, Y); }
  const tdMax = 2 / st.gamma;
  ctx.save(); clipTo(ctx, inner);
  // resonance line.
  ctx.strokeStyle = col.res; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(xOf(st.ER), inner.y); ctx.lineTo(xOf(st.ER), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  // time delay (normalized to its peak).
  ctx.strokeStyle = col.delay; ctx.lineWidth = 2.2; ctx.setLineDash([6, 4]); ctx.beginPath(); for (let i = 0; i <= 400; i += 1) { const E = ELO + (EHI - ELO) * i / 400; const Y = yOf(timeDelay(E, st.ER, st.gamma) / tdMax); i ? ctx.lineTo(xOf(E), Y) : ctx.moveTo(xOf(E), Y); } ctx.stroke(); ctx.setLineDash([]);
  // phase shift delta/pi.
  ctx.strokeStyle = col.phase; ctx.lineWidth = 2.8; ctx.beginPath(); for (let i = 0; i <= 400; i += 1) { const E = ELO + (EHI - ELO) * i / 400; const Y = yOf(phaseShift(E, st.ER, st.gamma) / Math.PI); i ? ctx.lineTo(xOf(E), Y) : ctx.moveTo(xOf(E), Y); } ctx.stroke();
  // cursor.
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(st.E), inner.y); ctx.lineTo(xOf(st.E), inner.y + inner.h); ctx.stroke();
  ctx.fillStyle = col.phase; ctx.beginPath(); ctx.arc(xOf(st.E), yOf(phaseShift(st.E, st.ER, st.gamma) / Math.PI), 4.5, 0, 6.2832); ctx.fill();
  ctx.fillStyle = col.delay; ctx.beginPath(); ctx.arc(xOf(st.E), yOf(timeDelay(st.E, st.ER, st.gamma) / tdMax), 4, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.phase; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('phase shift delta / pi', inner.x + 6, inner.y + 6);
  ctx.fillStyle = col.delay; ctx.fillText('time delay (normalized)', inner.x + 6, inner.y + 20);
  ctx.fillStyle = col.res; ctx.textAlign = 'center'; ctx.fillText('E_R', xOf(st.ER), inner.y + 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; for (let E = 0; E <= 10; E += 2) ctx.fillText(`${E}`, xOf(E), inner.y + inner.h + 6); ctx.fillText('incident energy E', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick() { frame += 1; if (st.sweep) st.E = 5 + 4.7 * Math.sin(frame * 0.01); render(); if (running) requestAnimationFrame(tick); }

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function setE(px) { if (!SC) return; st.E = Math.max(ELO, Math.min(EHI, (px - SC.plot.x) / SC.plot.w * (EHI - ELO))); }
canvas.addEventListener('pointerdown', (e) => { const [px, py] = ptr(e); if (!REG || py < REG.scene.y) return; setSweep(false); drag = true; setE(px); if (!running) render(); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [px] = ptr(e); setE(px); if (!running) render(); });
window.addEventListener('pointerup', () => { drag = false; });

function boot() {
  if (params.get('ER')) st.ER = Math.max(1, Math.min(9, +params.get('ER')));
  if (params.get('gamma')) st.gamma = Math.max(0.3, Math.min(3, +params.get('gamma')));
  setSweep(!DETERMINISTIC && st.sweep); syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.sweep = false; st.E = st.ER; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'ER', label: 'resonance energy E_R', value: st.ER, format: 'float' },
    { key: 'gamma', label: 'width Gamma', value: st.gamma, format: 'float' },
    { key: 'E', label: 'incident energy E', value: st.E, format: 'float' },
    { key: 'sigma', label: 'sigma / sigma_max', value: crossSection(st.E, st.ER, st.gamma), format: 'float' },
    { key: 'delta', label: 'phase shift delta / pi', value: phaseShift(st.E, st.ER, st.gamma) / Math.PI, format: 'float' },
    { key: 'tau', label: 'time delay dδ/dE', value: timeDelay(st.E, st.ER, st.gamma), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const s = Math.sin(phaseShift(st.E, st.ER, st.gamma));
  const ident = Math.abs(crossSection(st.E, st.ER, st.gamma) - s * s);
  const peak = crossSection(st.ER, st.ER, st.gamma);
  return [
    { key: 'sin2', label: 'sigma = sin^2(delta)', value: ident.toExponential(1), status: ident < 1e-9 ? 'pass' : 'drift' },
    { key: 'peak', label: 'sigma peaks at 1 on resonance', value: peak.toFixed(3), status: Math.abs(peak - 1) < 1e-9 ? 'pass' : 'drift' },
  ];
};
