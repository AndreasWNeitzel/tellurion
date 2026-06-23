// The double-slit experiment and complementarity. Particles arrive one at a time
// and build up the interference pattern on the screen; the intensity profile and
// the fringe visibility are shown below. A which-path knob washes the fringes out
// as the path information grows, with V = sqrt(1 - D^2). Canvas2D only.
//
// Reference: Feynman Lectures, Vol. III, Ch. 1; Englert 1996, PRL 77, 2154.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { intensity, visibility, sampleDetection } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const sLam = document.getElementById('slider-lam'), vLam = document.getElementById('value-lam');
const sWP = document.getElementById('slider-wp'), vWP = document.getElementById('value-wp');
const btnPlay = document.getElementById('btn-playpause'), btnReset = document.getElementById('btn-reset');

let rngS = 0x9e3779b9 >>> 0;
function rnd() { rngS = (Math.imul(rngS, 1664525) + 1013904223) >>> 0; return (rngS >>> 8) / 16777216; }

const st = { d: 4, lam: 0.5, D: 0 };     // d in um, lam in um (visual units)
function aWidth() { return 0.28 * st.d; }   // slit width as a fraction of separation
const THMAX = () => 3.2 * st.lam / st.d;    // angular half-window (~few fringes)
let running = !DETERMINISTIC;
let dots = [], flying = [], NB = 90, hist = new Float64Array(NB), nDet = 0;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.3 }, { name: 'diag', weight: 0.95 }]);
}
function syncVals() { vD.textContent = `${st.d.toFixed(1)}`; vLam.textContent = `${st.lam.toFixed(2)}`; vWP.textContent = `${(st.D * 100).toFixed(0)} %`; }
function reset() { dots = []; flying = []; hist = new Float64Array(NB); nDet = 0; }
sD.addEventListener('input', () => { st.d = parseFloat(sD.value); reset(); syncVals(); });
sLam.addEventListener('input', () => { st.lam = parseFloat(sLam.value); reset(); syncVals(); });
sWP.addEventListener('input', () => { st.D = parseFloat(sWP.value); reset(); syncVals(); });
btnPlay.addEventListener('click', () => { running = !running; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!running)); });
btnReset.addEventListener('click', () => { st.d = 4; st.lam = 0.5; st.D = 0; sD.value = '4'; sLam.value = '0.5'; sWP.value = '0'; reset(); running = true; btnPlay.textContent = 'Pause'; syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', beam: '#5b9bd5', slit: '#cbd2dd', dot: '#ffd166', curve: '#ffd166', hist: 'rgba(91,155,213,0.55)', det: '#ff9d3c', vis: '#67d98c' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let GEO = null;
function drawScene(col, r) {
  panel(col, r, st.D > 0.02 ? 'Particles arrive one at a time; which-path info erodes the fringes' : 'Particles arrive one at a time and build the interference pattern');
  const m = { t: 26, b: 22, l: 20, r: 20 };
  const sx = r.x + m.l + 30, mx = r.x + r.w * 0.42, scx = r.x + r.w - m.r - 60;
  const cy = r.y + m.t + (r.h - m.t - m.b) / 2, halfH = (r.h - m.t - m.b) / 2 - 6;
  const dpix = Math.min(halfH * 0.5, st.d * 9);
  const Lvis = scx - mx;
  GEO = { sx, mx, scx, cy, halfH, dpix, Lvis };
  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + m.t - 4, w: r.w, h: r.h - m.t - m.b });
  // source.
  ctx.fillStyle = col.beam; ctx.beginPath(); ctx.arc(sx, cy, 5, 0, 6.28); ctx.fill();
  ctx.strokeStyle = 'rgba(91,155,213,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, cy); ctx.lineTo(mx, cy - dpix / 2); ctx.moveTo(sx, cy); ctx.lineTo(mx, cy + dpix / 2); ctx.stroke();
  // barrier with two slits.
  ctx.strokeStyle = col.slit; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(mx, r.y + m.t); ctx.lineTo(mx, cy - dpix / 2 - 5); ctx.moveTo(mx, cy - dpix / 2 + 5); ctx.lineTo(mx, cy + dpix / 2 - 5); ctx.moveTo(mx, cy + dpix / 2 + 5); ctx.lineTo(mx, r.y + r.h - m.b); ctx.stroke();
  // which-path detectors at the slits (when D > 0).
  if (st.D > 0.02) { ctx.fillStyle = `rgba(239,84,102,${0.3 + 0.6 * st.D})`; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.arc(mx + 10, cy + sgn * dpix / 2, 4, 0, 6.28); ctx.fill(); } ctx.fillStyle = col.det; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('which-path', mx + 16, cy - dpix / 2 - 12); }
  // screen.
  ctx.strokeStyle = col.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(scx, r.y + m.t); ctx.lineTo(scx, r.y + r.h - m.b); ctx.stroke();
  // accumulated detection dots (2D spray, perpendicular jitter to the right of the screen).
  ctx.fillStyle = col.dot;
  for (const dt of dots) { ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(scx + 4 + dt.jx, cy + dt.y, 1.3, 0, 6.28); ctx.fill(); }
  ctx.globalAlpha = 1;
  // in-flight particles.
  ctx.fillStyle = '#fff';
  for (const p of flying) { const x = mx + p.prog * (scx - mx), y = (cy + p.slitY) + p.prog * (cy + p.y - (cy + p.slitY)); ctx.beginPath(); ctx.arc(x, y, 2, 0, 6.28); ctx.fill(); }
  ctx.restore();
  // count readout.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${nDet} particles detected   |   visibility V = ${visibility(st.D).toFixed(2)}`, r.x + r.w / 2, r.y + r.h - 8);
}

function drawDiag(col, r) {
  panel(col, r, 'Screen intensity (curve), detections (bars), complementarity V^2 + D^2 = 1');
  const inner = { x: r.x + 16, y: r.y + 26, w: r.w - 32, h: r.h - 26 - 56 };
  const thmax = THMAX();
  const xOf = (th) => inner.x + (th + thmax) / (2 * thmax) * inner.w;
  const yOf = (I) => inner.y + inner.h - I * inner.h * 0.95;
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // histogram (normalised to its own max).
  let hmax = 1; for (const v of hist) hmax = Math.max(hmax, v);
  ctx.fillStyle = col.hist; const bw = inner.w / NB;
  for (let b = 0; b < NB; b += 1) { const h = hist[b] / hmax; if (h <= 0) continue; ctx.fillRect(inner.x + b * bw, inner.y + inner.h - h * inner.h, bw, h * inner.h); }
  // analytic intensity curve.
  ctx.strokeStyle = col.curve; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) { const th = -thmax + 2 * thmax * i / 300; const X = xOf(th), Y = yOf(intensity(st.d, aWidth(), st.lam, th, st.D)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
  ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('screen position (angle)', inner.x + inner.w / 2, inner.y + inner.h + 6);
  // complementarity bar.
  const V = visibility(st.D), bar = { x: inner.x, y: inner.y + inner.h + 28, w: inner.w, h: 16 };
  ctx.fillStyle = 'rgba(103,217,140,0.5)'; ctx.fillRect(bar.x, bar.y, bar.w * V, bar.h);
  ctx.fillStyle = 'rgba(239,84,102,0.5)'; ctx.fillRect(bar.x + bar.w * V, bar.y, bar.w * st.D, bar.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(bar.x, bar.y, bar.w, bar.h);
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0a0c12'; ctx.textAlign = 'left'; if (V > 0.12) ctx.fillText(`V = ${V.toFixed(2)}`, bar.x + 6, bar.y + bar.h / 2);
  ctx.textAlign = 'right'; if (st.D > 0.12) ctx.fillText(`D = ${st.D.toFixed(2)}`, bar.x + bar.w - 6, bar.y + bar.h / 2);
}

function spawn() {
  const th = sampleDetection(st.d, aWidth(), st.lam, st.D, THMAX(), rnd);
  if (!GEO) return;
  const y = (th / THMAX()) * GEO.halfH;
  const slitY = (rnd() < 0.5 ? -1 : 1) * GEO.dpix / 2;
  flying.push({ prog: 0, y, slitY });
}
function advance() {
  if (GEO) for (let k = 0; k < 3; k += 1) if (flying.length < 60) spawn();
  for (let i = flying.length - 1; i >= 0; i -= 1) {
    flying[i].prog += 0.04;
    if (flying[i].prog >= 1) {
      const p = flying[i]; dots.push({ y: p.y, jx: (rnd() - 0.5) * 40 }); if (dots.length > 3200) dots.shift();
      const b = Math.floor((p.y / GEO.halfH * THMAX() + THMAX()) / (2 * THMAX()) * NB); if (b >= 0 && b < NB) hist[b] += 1;
      nDet += 1; flying.splice(i, 1);
    }
  }
}
function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}
function tick() { if (running) advance(); render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

function boot() {
  syncVals(); relayout(); render();        // first render sets GEO so advance() can spawn
  if (CAPTURE_NAME) { for (let i = 0; i < 900; i += 1) advance(); }
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
    { key: 'd', label: 'slit separation', value: st.d, format: 'float' },
    { key: 'lam', label: 'wavelength', value: st.lam, format: 'float' },
    { key: 'D', label: 'which-path info D', value: st.D, format: 'float' },
    { key: 'V', label: 'fringe visibility V', value: visibility(st.D), format: 'float' },
    { key: 'n', label: 'particles detected', value: nDet, format: 'int' },
  ] };
};
window.playground.getInvariants = function () {
  const V = visibility(st.D);
  const comp = V * V + st.D * st.D;
  return [
    { key: 'comp', label: 'V^2 + D^2 = 1 (complementarity)', value: comp.toFixed(4), status: Math.abs(comp - 1) < 1e-6 ? 'pass' : 'drift' },
  ];
};
