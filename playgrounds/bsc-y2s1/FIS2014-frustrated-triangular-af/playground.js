import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Triangular antiferromagnetic Ising (Wannier 1950), Canvas2D only. Each spin
// wants to be opposite to all six neighbours, but no triangle can anti-align
// all three pairs at once, so the lattice is geometrically frustrated and never
// orders. Scene: the spins on a proper equilateral triangular lattice, drawn as
// up/down discs with the fully frustrated triangles (all three spins equal)
// flagged; a toggle shows the three-sublattice chirality domains instead.
// Diagnostic: the satisfied-bond fraction climbing toward the 2/3 ceiling (one
// frustrated bond per triangle is unavoidable) while the magnetization stays
// pinned near zero (no ordering).
//
// Reference: Wannier 1950, Phys. Rev. 79, 357; Newman and Barkema 1999,
// Section 5.4 (`newmanbarkema1999`).

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createAF, sweep, magnetization, energyPerSite, frustratedFraction, setTemperature, J_AF } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams = new URLSearchParams(location.search);
const SEED = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sliderT = document.getElementById('slider-T');
const sliderL = document.getElementById('slider-L');
const sliderSpeed = document.getElementById('slider-speed');
const selView = document.getElementById('select-view');
const valueT = document.getElementById('value-T');
const valueL = document.getElementById('value-L');
const valueSpeed = document.getElementById('value-speed');
const valueView = document.getElementById('value-view');
const btnCold = document.getElementById('btn-cold');
const btnHot = document.getElementById('btn-hot');
const btnPlayPause = document.getElementById('btn-playpause');

const SQ3 = Math.sqrt(3) / 2;
const UP = '#f5b942', DOWN = '#3f74b8';            // spin colours
const DOMHUE = ['#6c8ef5', '#f0883e', '#52c98a'];  // chirality sublattice hues
const FRUST = 'rgba(244,86,86,0.55)';              // fully-frustrated triangle flag

const state = {
  af: null, L: 40, T: 0.5, speed: 3, view: 'spins',
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  hist: [],
};

function rebuild(init = 'hot') { state.af = createAF({ L: state.L, T: state.T, seed: SEED, init }); state.hist = []; }

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.35 },
    { name: 'diagnostic', weight: 0.85 },
  ]);
}
function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608', panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 10, r.y + 7); }
}

function geom(r) {
  const L = state.L, pad = 16;
  const aw = r.w - 2 * pad, ah = r.h - 28 - 30;
  const dx = Math.min(aw / (L - 0.5), ah / ((L - 1) * SQ3));
  const gw = (L - 0.5) * dx, gh = (L - 1) * dx * SQ3;
  const ox = r.x + pad + (aw - gw) / 2, oy = r.y + 28 + (ah - gh) / 2;
  return { L, dx, ox, oy, dy: dx * SQ3 };
}
const SX = (i, j, g) => g.ox + i * g.dx + ((j & 1) ? 0.5 * g.dx : 0);
const SY = (j, g) => g.oy + j * g.dy;

function minorityIdx(a, b, c) {
  if (a === b && b === c) return -1;
  if (a !== b && a !== c) return 0;
  if (b !== a && b !== c) return 1;
  return 2;
}

function drawScene(col, r) {
  panel(col, r, state.view === 'spins'
    ? 'Spins on a triangular lattice (red = fully frustrated triangle)'
    : 'Chirality domains: which sublattice carries the odd spin');
  const g = geom(r), L = g.L, sp = state.af.spins;
  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + 26, w: r.w, h: r.h - 26 });

  if (state.view === 'domains') {
    for (let j = 0; j < L - 1; j += 1) for (let i = 0; i < L - 1; i += 1) {
      const A = [SX(i, j, g), SY(j, g)], B = [SX(i + 1, j, g), SY(j, g)], C = [SX(i, j + 1, g), SY(j + 1, g)], D = [SX(i + 1, j + 1, g), SY(j + 1, g)];
      const sA = sp[j * L + i], sB = sp[j * L + i + 1], sC = sp[(j + 1) * L + i], sD = sp[(j + 1) * L + i + 1];
      const mu = minorityIdx(sA, sB, sC); ctx.fillStyle = mu < 0 ? '#f4f4f0' : DOMHUE[mu];
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath(); ctx.fill();
      const md = minorityIdx(sB, sC, sD); ctx.fillStyle = md < 0 ? '#f4f4f0' : DOMHUE[md];
      ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]); ctx.closePath(); ctx.fill();
    }
  } else {
    // fully frustrated triangles (all three spins equal) highlighted behind.
    for (let j = 0; j < L - 1; j += 1) for (let i = 0; i < L - 1; i += 1) {
      const sA = sp[j * L + i], sB = sp[j * L + i + 1], sC = sp[(j + 1) * L + i], sD = sp[(j + 1) * L + i + 1];
      if (sA === sB && sB === sC) { ctx.fillStyle = FRUST; ctx.beginPath(); ctx.moveTo(SX(i, j, g), SY(j, g)); ctx.lineTo(SX(i + 1, j, g), SY(j, g)); ctx.lineTo(SX(i, j + 1, g), SY(j + 1, g)); ctx.closePath(); ctx.fill(); }
      if (sB === sC && sC === sD) { ctx.fillStyle = FRUST; ctx.beginPath(); ctx.moveTo(SX(i + 1, j, g), SY(j, g)); ctx.lineTo(SX(i, j + 1, g), SY(j + 1, g)); ctx.lineTo(SX(i + 1, j + 1, g), SY(j + 1, g)); ctx.closePath(); ctx.fill(); }
    }
    // spins as discs.
    const rad = g.dx * 0.42;
    for (let j = 0; j < L; j += 1) for (let i = 0; i < L; i += 1) {
      ctx.fillStyle = sp[j * L + i] > 0 ? UP : DOWN;
      ctx.beginPath(); ctx.arc(SX(i, j, g), SY(j, g), rad, 0, 2 * Math.PI); ctx.fill();
    }
  }
  ctx.restore();

  // readout strip.
  const m = magnetization(state.af), e = energyPerSite(state.af), ff = frustratedFraction(state.af);
  const sat = 0.5 - e / (6 * J_AF);
  const items = [[`T ${state.T.toFixed(2)}`, col.fg], [`|M| ${Math.abs(m).toFixed(3)}`, '#5bc0eb'], [`sat ${(100 * sat).toFixed(1)}%`, UP], [`frustr Δ ${(100 * ff).toFixed(1)}%`, '#f45656']];
  ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textBaseline = 'middle';
  let need = 0; for (const [t] of items) need += ctx.measureText(t).width + 18;
  if (need <= r.w) { ctx.textAlign = 'center'; items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 12); }); }
  else { ctx.textAlign = 'center'; items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * ((i % 2) + 0.5) / 2, r.y + r.h - (i < 2 ? 22 : 8)); }); }
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Satisfied bonds → 2/3 ceiling (frustration); |M| stays ≈ 0 (no order)');
  const padL = 44, padR = 14, padT = 26, padB = 26;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, y0 = r.y + padT, y1 = r.y + r.h - padB;
  const yOf = (v) => y1 - v * (y1 - y0);   // v in [0,1]
  // gridlines at 0, 2/3, 1.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.7; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const [v, lab] of [[0, '0'], [2 / 3, '2/3'], [1, '1']]) { ctx.beginPath(); ctx.moveTo(x0, yOf(v)); ctx.lineTo(x1, yOf(v)); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(lab, x0 - 5, yOf(v)); }
  // 2/3 frustration ceiling dashed.
  ctx.strokeStyle = 'rgba(245,185,66,0.55)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x0, yOf(2 / 3)); ctx.lineTo(x1, yOf(2 / 3)); ctx.stroke(); ctx.setLineDash([]);
  const h = state.hist;
  if (h.length > 1) {
    const X = (k) => x0 + (x1 - x0) * k / (h.length - 1);
    ctx.strokeStyle = UP; ctx.lineWidth = 2; ctx.beginPath();
    h.forEach((p, k) => { const Y = yOf(p.sat); k ? ctx.lineTo(X(k), Y) : ctx.moveTo(X(k), Y); }); ctx.stroke();
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.6; ctx.beginPath();
    h.forEach((p, k) => { const Y = yOf(p.m); k ? ctx.lineTo(X(k), Y) : ctx.moveTo(X(k), Y); }); ctx.stroke();
  }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = UP; ctx.fillText('satisfied bonds', x0 + 6, y0 + 4);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('|M|', x0 + 132, y0 + 4);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('Monte Carlo sweeps', (x0 + x1) / 2, y1 + 6);
}

function record() {
  const e = energyPerSite(state.af);
  state.hist.push({ sat: 0.5 - e / (6 * J_AF), m: Math.abs(magnetization(state.af)) });
  if (state.hist.length > 600) state.hist.shift();
}

function drawAll() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}
function tickN(n) { if (state.af) { sweep(state.af, n); record(); } }

sliderT.addEventListener('input', () => { state.T = parseFloat(sliderT.value); valueT.textContent = state.T.toFixed(2); if (state.af) setTemperature(state.af, state.T); });
sliderL.addEventListener('change', () => { state.L = parseInt(sliderL.value, 10); valueL.textContent = String(state.L); rebuild('hot'); record(); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
selView.addEventListener('change', () => { state.view = selView.value; valueView.textContent = state.view === 'spins' ? 'spins' : 'domains'; drawAll(); });
btnCold.addEventListener('click', () => { rebuild('cold'); record(); drawAll(); });
btnHot.addEventListener('click', () => { rebuild('hot'); record(); drawAll(); });
if (btnPlayPause) btnPlayPause.addEventListener('click', () => { state.playing = !state.playing; btnPlayPause.textContent = state.playing ? 'Pause' : 'Play'; btnPlayPause.setAttribute('aria-pressed', String(!state.playing)); });

window.addEventListener('resize', () => { relayout(); drawAll(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); drawAll(); }).observe(canvas);

function bootSync() {
  if (['spins', 'domains'].includes(urlParams.get('view'))) { state.view = urlParams.get('view'); selView.value = state.view; }
  relayout(); rebuild('hot');
  valueT.textContent = state.T.toFixed(2); valueL.textContent = String(state.L); valueSpeed.textContent = String(state.speed);
  valueView.textContent = state.view === 'spins' ? 'spins' : 'domains';
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const steps = 26, target = 1.6 - f * 1.45;
    for (let k = 0; k <= steps; k += 1) { setTemperature(state.af, 1.6 - (k / steps) * (1.6 - target)); sweep(state.af, 14); record(); }
    state.T = target; setTemperature(state.af, state.T); sliderT.value = state.T.toFixed(2); valueT.textContent = state.T.toFixed(2);
    drawAll();
    if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } })); window.__simulationReady = true; window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED }; }));
    return;
  }
  record(); drawAll();
}
function tick() { if (state.playing) { tickN(state.speed); drawAll(); } requestAnimationFrame(tick); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); }
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  if (!state.af) return { fields: [] };
  const m = magnetization(state.af), e = energyPerSite(state.af), ff = frustratedFraction(state.af);
  return {
    fields: [
      { key: 'temperature', label: 'temperature T', value: state.T, format: 'float' },
      { key: 'size', label: 'lattice L', value: state.L, format: 'int' },
      { key: 'magnetization', label: 'magnetization |M|', value: Math.abs(m), format: 'float' },
      { key: 'satisfied', label: 'satisfied-bond fraction', value: 0.5 - e / (6 * J_AF), format: 'float' },
      { key: 'frustrated', label: 'fully frustrated triangles', value: ff, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  if (!state.af) return [{ key: 'init', label: 'initializing', value: 'pending', status: 'pending' }];
  const m = Math.abs(magnetization(state.af));
  const sat = 0.5 - energyPerSite(state.af) / (6 * J_AF);
  return [
    { key: 'no-order', label: '|M| stays low (no ferromagnetic order)', value: m.toFixed(3), status: m < 0.15 ? 'pass' : 'pending' },
    { key: 'ceiling', label: 'satisfied bonds ≤ 2/3 (frustration)', value: sat.toFixed(3), status: sat <= 2 / 3 + 1e-3 ? 'pass' : 'drift' },
  ];
};
