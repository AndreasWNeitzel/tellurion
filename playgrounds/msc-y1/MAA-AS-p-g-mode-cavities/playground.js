// p- and g-mode cavities of a real n=3 polytrope. The top panel is a pulsating
// stellar cross-section: the mode displacement is large where it propagates and
// evanescent where it cannot, so a low-frequency mode rings in the buoyancy
// (g) cavity of the core, a high-frequency mode in the acoustic (p) cavity of
// the envelope, and an intermediate one is mixed, with oscillations in both
// coupled through the evanescent gap. The bottom panel is the propagation
// diagram, the buoyancy frequency N(r) and the Lamb frequency S_l(r) of the
// real polytrope with the chosen omega and the active cavities. Canvas2D only.
//
// Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology (2010),
// Ch. 3 (propagation diagram and mixed modes).

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
import { bruntN, lambS, cavities, modeType, turningPoints, eigenfunction, energySplit } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sW = document.getElementById('slider-w'), vW = document.getElementById('value-w');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const rC = document.getElementById('readout-c') || { textContent: '' };

const st = { omega: 2.4, l: 1, t: 0 };
let running = !DETERMINISTIC;

let view = { w: 800, h: 1000, dpr: 1 };
let REG = null;
// cached per (omega, l): eigenfunction, cavities, turning points, energy split.
let eig = null, cav = null, turns = null, esplit = null, mtype = 'mixed';
function rebuild() {
  eig = eigenfunction(st.omega, st.l);
  cav = cavities(st.omega, st.l);
  turns = turningPoints(st.omega, st.l);
  esplit = energySplit(st.omega, st.l);
  mtype = modeType(st.omega, st.l);
}
function xiAt(xfrac) {
  const x = Math.max(0, Math.min(1, xfrac)) * (eig.x.length - 1);
  const i = Math.floor(x), f = x - i, j = Math.min(eig.x.length - 1, i + 1);
  return eig.xi[i] * (1 - f) + eig.xi[j] * f;
}

function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.4 },
    { name: 'diagnostic', weight: 1.25 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#08090d',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)',
    pCol: '#5bc0eb', gCol: '#ef476f', omega: '#06d6a0',
  };
}

// RdBu blended toward a dark neutral so the zero-crossing is not a white flash.
function rdbuDark(f) {
  const c = rdbu(f);
  const w = Math.abs(f - 0.5) * 2;
  return { r: c.r * w + 30 * (1 - w), g: c.g * w + 34 * (1 - w), b: c.b * w + 48 * (1 - w) };
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

let starImg = null;
const SZ = 220;
function drawScene(col, r) {
  panel(col, r, 'Where the mode lives: a pulsating cross-section');
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const cx = draw.x + draw.w / 2, cy = draw.y + draw.h / 2;
  const Rpx = Math.min(draw.w, draw.h) * 0.46;
  const ph = Math.cos(st.t);

  if (!starImg) starImg = ctx.createImageData(SZ, SZ);
  const d = starImg.data;
  for (let py = 0; py < SZ; py += 1) {
    const ny = (py / (SZ - 1)) * 2 - 1;
    for (let px = 0; px < SZ; px += 1) {
      const nx = (px / (SZ - 1)) * 2 - 1;
      const rr = Math.hypot(nx, ny);
      const o = (py * SZ + px) * 4;
      if (rr > 1) { d[o] = 8; d[o + 1] = 9; d[o + 2] = 14; d[o + 3] = 255; continue; }
      const az = Math.atan2(ny, nx);
      const val = xiAt(rr) * Math.cos(st.l * az) * ph;
      const c = rdbuDark(0.5 + 0.5 * Math.max(-1, Math.min(1, val * 1.4)));
      const limb = 0.55 + 0.45 * Math.sqrt(Math.max(0, 1 - rr * rr));
      d[o] = c.r * limb; d[o + 1] = c.g * limb; d[o + 2] = c.b * limb; d[o + 3] = 255;
    }
  }
  ctx.save();
  clipTo(ctx, draw);
  const off = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(SZ, SZ) : Object.assign(document.createElement('canvas'), { width: SZ, height: SZ });
  off.getContext('2d').putImageData(starImg, 0, 0);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, 2 * Math.PI); ctx.clip();
  ctx.drawImage(off, cx - Rpx, cy - Rpx, 2 * Rpx, 2 * Rpx);
  ctx.restore();

  // cavity annuli (faint, so both cavities are visible even when one dominates).
  const ring = (segs, color) => {
    for (const [a, b] of segs) {
      ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, a * Rpx, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, b * Rpx, 0, 2 * Math.PI); ctx.stroke();
      ctx.setLineDash([]);
    }
  };
  ring(cav.gCavities, 'rgba(239,71,111,0.55)');
  ring(cav.pCavities, 'rgba(91,192,235,0.55)');
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, 2 * Math.PI); ctx.stroke();
  ctx.restore();

  // legend for the cavity rings.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = col.gCol; ctx.fillText('g-cavity (core)', draw.x + 10, draw.y + 12);
  ctx.fillStyle = col.pCol; ctx.fillText('p-cavity (envelope)', draw.x + 10, draw.y + 28);

  // readout strip.
  const items = [
    [`omega = ${st.omega.toFixed(2)}`, col.omega],
    [`l = ${st.l}`, col.fg],
    [mtype === 'mixed' ? 'mixed (p + g)' : mtype, mtype === 'g' ? col.gCol : mtype === 'p' ? col.pCol : col.fg],
    [`E: ${(100 * esplit.g).toFixed(0)}% g / ${(100 * esplit.p).toFixed(0)}% p`, col.muted],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [t] of items) widest = Math.max(widest, ctx.measureText(t).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

const FY_LO = 0.16, FY_HI = 32;     // log-frequency window for the diagram
function drawDiagnostic(col, r) {
  panel(col, r, 'Propagation diagram of the n=3 polytrope');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 46 };
  const xOf = (x) => inner.x + x * inner.w;
  const lLo = Math.log10(FY_LO), lHi = Math.log10(FY_HI);
  const yOf = (f) => inner.y + inner.h - (Math.log10(Math.max(FY_LO, Math.min(FY_HI, f))) - lLo) / (lHi - lLo) * inner.h;

  // shade cavities.
  for (const [a, b] of cav.gCavities) { ctx.fillStyle = 'rgba(239,71,111,0.14)'; ctx.fillRect(xOf(a), inner.y, xOf(b) - xOf(a), inner.h); }
  for (const [a, b] of cav.pCavities) { ctx.fillStyle = 'rgba(91,192,235,0.14)'; ctx.fillRect(xOf(a), inner.y, xOf(b) - xOf(a), inner.h); }

  // axes + decade gridlines.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const f of [0.3, 1, 3, 10, 30]) { const y = yOf(f); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(String(f), inner.x - 6, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // N(r) and S_l(r) of the real polytrope.
  const curve = (fn, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.beginPath();
    let pen = false;
    for (let i = 1; i <= 240; i += 1) {
      const x = i / 240 * 0.992; const f = fn(x);
      if (!(f > 0)) { pen = false; continue; }
      const X = xOf(x), Y = yOf(f);
      if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; }
    }
    ctx.stroke();
  };
  curve((x) => bruntN(x), '#ffd166');
  curve((x) => lambS(x, st.l), col.pCol);

  // omega line.
  ctx.strokeStyle = col.omega; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(st.omega)); ctx.lineTo(inner.x + inner.w, yOf(st.omega)); ctx.stroke(); ctx.setLineDash([]);

  // turning points (where omega crosses N or S_l).
  for (const tx of turns) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(xOf(tx), yOf(st.omega), 3, 0, 2 * Math.PI); ctx.fill(); }

  // labels.
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.fillStyle = '#ffd166'; ctx.fillText('N (buoyancy)', inner.x + 8, inner.y + 6);
  ctx.fillStyle = col.pCol; ctx.fillText(`S_l (Lamb, l=${st.l})`, inner.x + 8, inner.y + 22);
  ctx.fillStyle = col.omega; ctx.fillText(`omega = ${st.omega.toFixed(2)}`, inner.x + 8, inner.y + 38);

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const x of [0, 0.25, 0.5, 0.75, 1]) ctx.fillText(x.toFixed(2), xOf(x), inner.y + inner.h + 6);
  ctx.fillText('radius  r / R       (frequency in units c_0 / R, log scale)', inner.x + inner.w / 2, inner.y + inner.h + 22);

  rC.textContent = mtype;
}

function render() {
  if (!REG) relayout();
  if (!eig) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function tick() {
  if (running) st.t += 0.05 * st.omega * 0.5;
  render();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

// --- controls --------------------------------------------------------------
sW.addEventListener('input', () => { st.omega = parseFloat(sW.value); vW.textContent = st.omega.toFixed(2); rebuild(); render(); });
sL.addEventListener('input', () => { st.l = parseInt(sL.value, 10); vL.textContent = String(st.l); rebuild(); render(); });
btnR.addEventListener('click', () => {
  st.omega = 2.4; st.l = 1; st.t = 0; sW.value = '2.4'; vW.textContent = '2.40'; sL.value = '1'; vL.textContent = '1';
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); rebuild(); render();
});
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

st.omega = parseFloat(sW.value) || 2.4; st.l = parseInt(sL.value, 10) || 1;
vW.textContent = st.omega.toFixed(2); vL.textContent = String(st.l);
relayout(); rebuild(); render();

if (DETERMINISTIC) {
  const presets = [1.1, 1.8, 2.4, 3.2, 4.0];   // g -> mixed -> p
  const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0.5;
  st.omega = presets[Math.min(presets.length - 1, Math.round(frac * (presets.length - 1)))];
  sW.value = String(st.omega); vW.textContent = st.omega.toFixed(2);
  st.t = 0.9; rebuild(); render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  requestAnimationFrame(tick);
}

window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'frequency', label: 'Frequency omega (c0/R)', value: st.omega, format: 'float' },
    { key: 'degree', label: 'Degree l', value: st.l, format: 'float' },
    { key: 'type', label: 'Mode type', value: mtype, format: 'text' },
    { key: 'eg', label: 'Energy in g-cavity', value: esplit ? esplit.g : 0, format: 'float' },
    { key: 'ep', label: 'Energy in p-cavity', value: esplit ? esplit.p : 0, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const nCav = cav ? cav.pCavities.length + cav.gCavities.length : 0;
  // A mixed mode must show one cavity of each kind.
  const mixedOk = mtype !== 'mixed' || (cav.pCavities.length >= 1 && cav.gCavities.length >= 1);
  return [
    { key: 'cavity-count', label: 'Active cavities (p + g)', value: String(nCav), status: nCav > 0 ? 'pass' : 'drift' },
    { key: 'mixed-consistent', label: 'Mixed mode has both cavities', value: mixedOk ? 'pass' : 'fail', status: mixedOk ? 'pass' : 'drift' },
  ];
};
