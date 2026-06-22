// The variational principle for the hydrogen atom with a Gaussian trial wavefunction.
// The scene compares the trial Gaussian against the exact 1s state (highlighting the
// missing cusp) and shows the energy <H> against the exact floor E0. The diagnostic is
// the variational curve <H>(a): it bottoms out above E0 and never crosses it. Canvas2D.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 3rd ed., Ch. 7.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { E0_EXACT, ALPHA_OPT, kinetic, potential, energy, trialPsi, exactPsi, trialRadial, exactRadial } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sA = document.getElementById('s-a'), vA = document.getElementById('v-a');
const btnSweep = document.getElementById('btn-sweep'), btnOpt = document.getElementById('btn-opt'), btnReset = document.getElementById('btn-reset');

const ALO = 0.05, AHI = 1.0, RMAX = 6;
const st = { a: ALPHA_OPT, sweep: true };
let frame = 0, running = true;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.16 }, { name: 'diag', weight: 0.94 }]); }
function syncVals() { sA.value = st.a; vA.textContent = st.a.toFixed(3); btnSweep.textContent = `Sweep a: ${st.sweep ? 'on' : 'off'}`; btnSweep.setAttribute('aria-pressed', String(st.sweep)); }
function setSweep(on) { st.sweep = on; syncVals(); }
btnReset.addEventListener('click', () => { st.a = ALPHA_OPT; setSweep(false); render(); });
btnOpt.addEventListener('click', () => { st.a = ALPHA_OPT; setSweep(false); render(); });
btnSweep.addEventListener('click', () => { setSweep(!st.sweep); if (st.sweep && !running) { running = true; requestAnimationFrame(tick); } });
sA.addEventListener('input', () => { setSweep(false); st.a = +sA.value; vA.textContent = st.a.toFixed(3); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    trial: '#5ea8ff', exact: '#ff9d3c', cusp: '#ffd24a', kin: '#8de08a', pot: '#ff6f6f', H: '#ffd24a', floor: '#c98cff', curve: '#5ec8ff' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function drawScene(col, r) {
  const T = kinetic(st.a), V = potential(st.a), H = energy(st.a);
  panel(col, r, `Variational hydrogen:  trial width a = ${st.a.toFixed(3)},  <H> = ${H.toFixed(3)} Ha  (exact ${E0_EXACT.toFixed(2)} Ha)`);
  const inner = { x: r.x + 40, y: r.y + 30, w: r.w - 40 - 16, h: r.h - 30 - 10 };
  const wf = { x: inner.x, y: inner.y + 6, w: inner.w * 0.62, h: inner.h - 34 };
  // wavefunction comparison psi(r).
  const psiMax = 0.65; const xOf = (rr) => wf.x + rr / RMAX * wf.w, yOf = (p) => wf.y + wf.h * (1 - p / psiMax);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(wf.x, wf.y, wf.w, wf.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const p of [0, 0.2, 0.4, 0.6]) { const Y = yOf(p); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(wf.x, Y); ctx.lineTo(wf.x + wf.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(p.toFixed(1), wf.x - 5, Y); }
  ctx.save(); clipTo(ctx, wf);
  // exact 1s (cusp at r=0).
  ctx.strokeStyle = col.exact; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 300; i += 1) { const rr = RMAX * i / 300; const Y = yOf(exactPsi(rr)); i ? ctx.lineTo(xOf(rr), Y) : ctx.moveTo(xOf(rr), Y); } ctx.stroke();
  // trial Gaussian (smooth at r=0).
  ctx.strokeStyle = col.trial; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 300; i += 1) { const rr = RMAX * i / 300; const Y = yOf(trialPsi(rr, st.a)); i ? ctx.lineTo(xOf(rr), Y) : ctx.moveTo(xOf(rr), Y); } ctx.stroke();
  // cusp highlight at r=0.
  ctx.fillStyle = col.cusp; ctx.beginPath(); ctx.arc(xOf(0), yOf(exactPsi(0)), 4, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.exact; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('exact e^-r (cusp)', wf.x + 8, wf.y + 6);
  ctx.fillStyle = col.trial; ctx.fillText('trial Gaussian e^-a r^2', wf.x + 8, wf.y + 20);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('radius r (Bohr)', wf.x + wf.w / 2, wf.y + wf.h + 6);
  ctx.save(); ctx.translate(wf.x - 26, wf.y + wf.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('wavefunction psi(r)', 0, 0); ctx.restore();

  // energy level indicator (right).
  const en = { x: inner.x + inner.w * 0.72, y: inner.y + 18, w: inner.w * 0.26, h: inner.h - 50 };
  const eLo = -0.62, eHi = 0.05; const eY = (e) => en.y + en.h * (eHi - e) / (eHi - eLo);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(en.x, en.y); ctx.lineTo(en.x, en.y + en.h); ctx.stroke();
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const e of [0, -0.2, -0.4, -0.6]) { const Y = eY(e); ctx.fillStyle = col.muted; ctx.fillText(e.toFixed(1), en.x - 5, Y); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(en.x, Y); ctx.lineTo(en.x + en.w, Y); ctx.stroke(); }
  // exact floor.
  ctx.strokeStyle = col.floor; ctx.lineWidth = 2; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(en.x, eY(E0_EXACT)); ctx.lineTo(en.x + en.w, eY(E0_EXACT)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.floor; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('exact E0 = -0.5', en.x + 2, eY(E0_EXACT) - 3);
  // <H> bar.
  ctx.fillStyle = col.H; ctx.fillRect(en.x + en.w * 0.2, eY(H), en.w * 0.6, eY(0) - eY(H) > 0 ? eY(0) - eY(H) : 1);
  ctx.fillStyle = col.H; ctx.textBaseline = 'middle'; ctx.fillText(`<H> = ${H.toFixed(3)}`, en.x + 2, eY(H) - 9);
  ctx.fillStyle = col.kin; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`<T> = ${T.toFixed(3)}`, en.x, en.y + en.h + 8);
  ctx.fillStyle = col.pot; ctx.fillText(`<V> = ${V.toFixed(3)}`, en.x, en.y + en.h + 22);
}

function drawDiag(col, r) {
  panel(col, r, 'Variational curve <H>(a): the minimum is the best estimate, and it never dips below the exact E0');
  const inner = { x: r.x + 46, y: r.y + 30, w: r.w - 46 - 16, h: r.h - 30 - 34 };
  const eLo = -0.55, eHi = 0.2; const xOf = (a) => inner.x + (a - ALO) / (AHI - ALO) * inner.w, yOf = (e) => inner.y + inner.h * (eHi - e) / (eHi - eLo);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const e of [0.2, 0, -0.2, -0.4, -0.5]) { const Y = yOf(e); const isFloor = e === -0.5; ctx.strokeStyle = isFloor ? col.floor : 'rgba(255,255,255,0.06)'; if (isFloor) ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = isFloor ? col.floor : col.muted; ctx.fillText(e.toFixed(2), inner.x - 5, Y); }
  // forbidden region below E0.
  ctx.fillStyle = 'rgba(201,140,255,0.08)'; ctx.fillRect(inner.x, yOf(E0_EXACT), inner.w, inner.y + inner.h - yOf(E0_EXACT));
  ctx.save(); clipTo(ctx, inner);
  ctx.strokeStyle = col.curve; ctx.lineWidth = 2.8; ctx.beginPath(); for (let i = 0; i <= 300; i += 1) { const a = ALO + (AHI - ALO) * i / 300; const Y = yOf(energy(a)); i ? ctx.lineTo(xOf(a), Y) : ctx.moveTo(xOf(a), Y); } ctx.stroke();
  // optimum marker.
  ctx.strokeStyle = col.H; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(ALPHA_OPT), inner.y); ctx.lineTo(xOf(ALPHA_OPT), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.H; ctx.beginPath(); ctx.arc(xOf(ALPHA_OPT), yOf(energy(ALPHA_OPT)), 5, 0, 6.2832); ctx.fill();
  // current a marker.
  ctx.strokeStyle = col.fg; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(st.a), inner.y); ctx.lineTo(xOf(st.a), inner.y + inner.h); ctx.stroke();
  ctx.fillStyle = col.curve; ctx.beginPath(); ctx.arc(xOf(st.a), yOf(energy(st.a)), 4.5, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.H; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(`best <H> = -0.424 at a* = ${ALPHA_OPT.toFixed(3)}`, xOf(ALPHA_OPT), inner.y + 6);
  ctx.fillStyle = col.floor; ctx.textAlign = 'left'; ctx.fillText('forbidden: <H> < E0 (variational bound)', inner.x + 8, yOf(E0_EXACT) + 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const a of [0.1, 0.3, 0.5, 0.7, 0.9]) ctx.fillText(a.toFixed(1), xOf(a), inner.y + inner.h + 6);
  ctx.fillText('trial width parameter a', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick() { frame += 1; if (st.sweep) { st.a = 0.5 + 0.45 * Math.sin(frame * 0.012); sA.value = st.a; vA.textContent = st.a.toFixed(3); } render(); if (running) requestAnimationFrame(tick); }

function boot() {
  if (params.get('a')) st.a = Math.max(ALO, Math.min(AHI, +params.get('a')));
  setSweep(!DETERMINISTIC && st.sweep); syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.sweep = false; st.a = ALPHA_OPT; syncVals(); render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'a', label: 'trial width a', value: st.a, format: 'float' },
    { key: 'T', label: 'kinetic <T> (Ha)', value: kinetic(st.a), format: 'float' },
    { key: 'V', label: 'potential <V> (Ha)', value: potential(st.a), format: 'float' },
    { key: 'H', label: 'energy <H> (Ha)', value: energy(st.a), format: 'float' },
    { key: 'gap', label: '<H> - E0 (Ha)', value: energy(st.a) - E0_EXACT, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const H = energy(st.a);
  return [
    { key: 'bound', label: '<H> >= E0 (variational bound)', value: `${H.toFixed(3)} >= ${E0_EXACT}`, status: H >= E0_EXACT - 1e-9 ? 'pass' : 'drift' },
    { key: 'opt', label: 'minimum at a* = 8/(9 pi)', value: ALPHA_OPT.toFixed(4), status: 'pass' },
  ];
};
