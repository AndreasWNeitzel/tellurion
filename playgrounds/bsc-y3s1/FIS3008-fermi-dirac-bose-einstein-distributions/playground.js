// Fermi-Dirac, Bose-Einstein, and Maxwell-Boltzmann occupation numbers. The scene
// draws the three distributions n(E) against energy with the chemical potential
// marked and a draggable energy cursor; an optional temperature sweep morphs the
// curves so the Fermi step sharpens and the Bose peak diverges as kT changes. The
// diagnostic is the same three curves on a log axis, where the high-energy tails
// collapse onto the single classical exponential. Canvas2D only.
//
// Reference: Pathria and Beale, Statistical Mechanics, 3rd ed., Ch. 6.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { fermiDirac, boseEinstein, maxwellBoltzmann } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sKT = document.getElementById('s-kt'), vKT = document.getElementById('v-kt');
const sMu = document.getElementById('s-mu'), vMu = document.getElementById('v-mu');
const btnSweep = document.getElementById('btn-sweep'), btnReset = document.getElementById('btn-reset');

const ELO = 0, EHI = 10;
const st = { kT: 1.0, mu: 4.0, cursor: 5.2, sweep: true };
let frame = 0, running = true;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.18 }, { name: 'diag', weight: 0.92 }]); }
function syncVals() { sKT.value = st.kT; vKT.textContent = st.kT.toFixed(2); sMu.value = st.mu; vMu.textContent = st.mu.toFixed(2); }
function setSweep(on) { st.sweep = on; btnSweep.textContent = `Sweep T: ${on ? 'on' : 'off'}`; btnSweep.setAttribute('aria-pressed', String(on)); }
btnReset.addEventListener('click', () => { st.kT = 1.0; st.mu = 4.0; st.cursor = 5.2; setSweep(false); syncVals(); render(); });
btnSweep.addEventListener('click', () => { setSweep(!st.sweep); if (st.sweep && !running) { running = true; requestAnimationFrame(tick); } });
sKT.addEventListener('input', () => { setSweep(false); st.kT = +sKT.value; vKT.textContent = st.kT.toFixed(2); render(); });
sMu.addEventListener('input', () => { st.mu = +sMu.value; vMu.textContent = st.mu.toFixed(2); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    fd: '#5ea8ff', be: '#ff7a5c', mb: '#8de08a', mu: '#c98cff', cursor: '#ffd24a', band: 'rgba(201,140,255,0.10)', cls: 'rgba(141,224,138,0.10)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SC = null;
function drawScene(col, r) {
  panel(col, r, `Occupation number n(E):  kT = ${st.kT.toFixed(2)},  chemical potential mu = ${st.mu.toFixed(2)}`);
  const NY = 2;  // linear y range
  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: r.h - 30 - 34 };
  const xOf = (E) => inner.x + (E - ELO) / (EHI - ELO) * inner.w, yOf = (n) => inner.y + inner.h * (1 - Math.max(0, Math.min(NY, n)) / NY);
  // chemical-potential band [mu-kT, mu+kT] and mu line.
  ctx.fillStyle = col.band; ctx.fillRect(xOf(st.mu - st.kT), inner.y, xOf(st.mu + st.kT) - xOf(st.mu - st.kT), inner.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // y gridlines.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const n of [0, 0.5, 1, 1.5, 2]) { const Y = yOf(n); ctx.strokeStyle = n === 1 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(n.toFixed(1), inner.x - 5, Y); }
  ctx.save(); clipTo(ctx, inner);
  // mu marker.
  ctx.strokeStyle = col.mu; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xOf(st.mu), inner.y); ctx.lineTo(xOf(st.mu), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  const curve = (fn, color, w, dash) => { ctx.strokeStyle = color; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); ctx.beginPath(); let pen = false; for (let i = 0; i <= 400; i += 1) { const E = ELO + (EHI - ELO) * i / 400; const n = fn(E, st.mu, st.kT); if (!isFinite(n) || n > NY * 1.6) { if (n > NY) { /* keep drawing toward top */ } pen = false; continue; } const X = xOf(E), Y = yOf(n); if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } } ctx.stroke(); if (dash) ctx.setLineDash([]); };
  curve(maxwellBoltzmann, col.mb, 2.0, [6, 4]);
  curve(boseEinstein, col.be, 2.6);
  curve(fermiDirac, col.fd, 2.6);
  // cursor.
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(st.cursor), inner.y); ctx.lineTo(xOf(st.cursor), inner.y + inner.h); ctx.stroke();
  for (const [fn, c] of [[fermiDirac, col.fd], [boseEinstein, col.be], [maxwellBoltzmann, col.mb]]) { const n = fn(st.cursor, st.mu, st.kT); if (isFinite(n) && n <= NY) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(xOf(st.cursor), yOf(n), 4, 0, 6.2832); ctx.fill(); } }
  ctx.restore();
  // legend (lower-left, where the low-energy occupation space is empty) and readout.
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = col.fd; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText('Fermi-Dirac', inner.x + 8, inner.y + inner.h - 38);
  ctx.fillStyle = col.be; ctx.fillText('Bose-Einstein', inner.x + 8, inner.y + inner.h - 24);
  ctx.fillStyle = col.mb; ctx.fillText('Maxwell-Boltzmann', inner.x + 8, inner.y + inner.h - 10);
  ctx.textBaseline = 'top';
  ctx.fillStyle = col.mu; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.fillText('mu', xOf(st.mu), inner.y + inner.h + 6);
  const fdc = fermiDirac(st.cursor, st.mu, st.kT), bec = boseEinstein(st.cursor, st.mu, st.kT), mbc = maxwellBoltzmann(st.cursor, st.mu, st.kT);
  ctx.fillStyle = col.cursor; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText(`E = ${st.cursor.toFixed(2)}:  FD ${fdc.toFixed(3)}   BE ${isFinite(bec) ? bec.toFixed(3) : 'inf'}   MB ${mbc.toFixed(3)}`, inner.x + inner.w - 6, inner.y + 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let E = 0; E <= 10; E += 2) ctx.fillText(`${E}`, xOf(E), inner.y + inner.h + 6); ctx.fillText('energy E (drag cursor)', inner.x + inner.w / 2, inner.y + inner.h + 19);
  SC = { inner, xOf };
}

function drawDiag(col, r) {
  panel(col, r, 'Same distributions on a log axis: the tails collapse onto the classical exponential for E - mu >> kT');
  const inner = { x: r.x + 46, y: r.y + 30, w: r.w - 46 - 16, h: r.h - 30 - 34 };
  const lhi = 1, llo = -3;  // log10(n) range
  const xOf = (E) => inner.x + (E - ELO) / (EHI - ELO) * inner.w;
  const yOf = (n) => { const L = Math.log10(Math.max(1e-12, n)); return inner.y + inner.h * (lhi - Math.max(llo, Math.min(lhi, L))) / (lhi - llo); };
  // classical region shading: E > mu + 2kT.
  ctx.fillStyle = col.cls; const xc = xOf(Math.min(EHI, st.mu + 2 * st.kT)); ctx.fillRect(xc, inner.y, inner.x + inner.w - xc, inner.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // decade gridlines.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = col.muted;
  for (let d = lhi; d >= llo; d -= 1) { const Y = yOf(Math.pow(10, d)); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`1e${d}`, inner.x - 5, Y); }
  ctx.save(); clipTo(ctx, inner);
  ctx.strokeStyle = col.mu; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xOf(st.mu), inner.y); ctx.lineTo(xOf(st.mu), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  const curveL = (fn, color, w, dash) => { ctx.strokeStyle = color; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); ctx.beginPath(); let pen = false; for (let i = 0; i <= 400; i += 1) { const E = ELO + (EHI - ELO) * i / 400; const n = fn(E, st.mu, st.kT); if (!isFinite(n) || n <= 0) { pen = false; continue; } const X = xOf(E), Y = yOf(n); if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } } ctx.stroke(); if (dash) ctx.setLineDash([]); };
  curveL(boseEinstein, col.be, 2.6);
  curveL(fermiDirac, col.fd, 2.6);
  curveL(maxwellBoltzmann, col.mb, 2.0, [6, 4]);
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(st.cursor), inner.y); ctx.lineTo(xOf(st.cursor), inner.y + inner.h); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = col.mb; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('classical limit: FD ~ BE ~ MB = e^-(E-mu)/kT', inner.x + 8, inner.y + 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let E = 0; E <= 10; E += 2) ctx.fillText(`${E}`, xOf(E), inner.y + inner.h + 6); ctx.fillText('energy E', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

function tick() {
  frame += 1;
  if (st.sweep) { st.kT = 1.4 + 1.15 * Math.sin(frame * 0.012); sKT.value = st.kT; vKT.textContent = st.kT.toFixed(2); }
  render();
  if (running) requestAnimationFrame(tick);
}

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function setCursor(px) { if (!SC) return; const E = ELO + (px - SC.inner.x) / SC.inner.w * (EHI - ELO); st.cursor = Math.max(ELO, Math.min(EHI, E)); }
canvas.addEventListener('pointerdown', (e) => { const [px, py] = ptr(e); if (!REG || py > REG.scene.y + REG.scene.h) return; drag = true; setCursor(px); if (!running) render(); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [px] = ptr(e); setCursor(px); if (!running) render(); });
window.addEventListener('pointerup', () => { drag = false; });

function boot() {
  if (params.get('kT')) st.kT = Math.max(0.1, Math.min(3, +params.get('kT')));
  if (params.get('mu')) st.mu = Math.max(0.5, Math.min(9, +params.get('mu')));
  setSweep(!DETERMINISTIC && st.sweep); syncVals(); relayout();
  if (DETERMINISTIC) {
    running = false; st.sweep = false; setSweep(false); frame = 0; render();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
  } else { requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const be = boseEinstein(st.cursor, st.mu, st.kT);
  return { fields: [
    { key: 'kT', label: 'temperature kT', value: st.kT, format: 'float' },
    { key: 'mu', label: 'chemical potential mu', value: st.mu, format: 'float' },
    { key: 'E', label: 'cursor energy E', value: st.cursor, format: 'float' },
    { key: 'fd', label: 'n Fermi-Dirac', value: fermiDirac(st.cursor, st.mu, st.kT), format: 'float' },
    { key: 'be', label: 'n Bose-Einstein', value: isFinite(be) ? be : Infinity, format: 'float' },
    { key: 'mb', label: 'n Maxwell-Boltzmann', value: maxwellBoltzmann(st.cursor, st.mu, st.kT), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const fd = fermiDirac(st.cursor, st.mu, st.kT);
  const ph = fermiDirac(st.mu + 1, st.mu, st.kT) + fermiDirac(st.mu - 1, st.mu, st.kT);
  return [
    { key: 'fdrange', label: 'Fermi-Dirac in [0,1]', value: fd.toFixed(3), status: fd >= 0 && fd <= 1 ? 'pass' : 'drift' },
    { key: 'phsym', label: 'particle-hole symmetry n(mu+d)+n(mu-d)=1', value: ph.toFixed(4), status: Math.abs(ph - 1) < 1e-9 ? 'pass' : 'drift' },
  ];
};
