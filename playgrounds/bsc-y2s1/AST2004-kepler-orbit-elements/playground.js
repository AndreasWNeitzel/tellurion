import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the Keplerian orbital elements, Canvas2D only.
// Top region: the orbit rendered in pseudo-3D against a reference plane,
// oriented by the inclination, node and periapsis angles, with the body
// moving on real Keplerian timing (Kepler's equation). Bottom region:
// the orbital distance r and speed v versus true anomaly, peaking and
// plunging through periapsis (Kepler's second law).
//
// Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics,
// 2nd ed., Sec. 2.3.

import { elementsToPos, solveKepler, trueAnomaly } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sE = document.getElementById('slider-e');
const sI = document.getElementById('slider-i');
const sOm = document.getElementById('slider-Om');
const sW = document.getElementById('slider-w');
const vE = document.getElementById('value-e');
const vI = document.getElementById('value-i');
const vOm = document.getElementById('value-Om');
const vW = document.getElementById('value-w');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const A = 1, VIEW = 1.9;
let running = !DETERMINISTIC;
let t = 0;
const D2R = Math.PI / 180;
function ecc() { return parseFloat(sE.value); }
function inc() { return parseFloat(sI.value) * D2R; }
function Om() { return parseFloat(sOm.value) * D2R; }
function wArg() { return parseFloat(sW.value) * D2R; }
function nuOf(time) { const M = time % (2 * Math.PI); return trueAnomaly(solveKepler(M, ecc()), ecc()); }

function syncVals() {
  vE.textContent = ecc().toFixed(2);
  vI.textContent = `${sI.value}°`; vOm.textContent = `${sOm.value}°`; vW.textContent = `${sW.value}°`;
}
[sE, sI, sOm, sW].forEach((el) => el.addEventListener('input', () => { syncVals(); render(); }));
btnReset.addEventListener('click', () => {
  sE.value = '0.5'; sI.value = '35'; sOm.value = '40'; sW.value = '60'; t = 0;
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null, SCN = null;
function computeSceneTransform() {
  const r = REG.scene;
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const size = Math.min(draw.w, draw.h);
  SCN = { draw, ox: draw.x + draw.w / 2, oy: draw.y + draw.h / 2, scale: size / (2 * VIEW) };
}
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.85 },
    { name: 'diagnostic', weight: 1.15 },
  ]);
  computeSceneTransform();
}

// orthographic camera: ecliptic = x-y, z up. azimuth AZ, elevation EL.
const AZ = 0.5, EL = 0.55;
const cA = Math.cos(AZ), sA = Math.sin(AZ), cE = Math.cos(EL), sE2 = Math.sin(EL);
function project(p) {
  const sx = -p[0] * sA + p[1] * cA;
  const up = -(p[0] * cA + p[1] * sA) * sE2 + p[2] * cE;
  const depth = (p[0] * cA + p[1] * sA) * cE + p[2] * sE2;
  return { sx, up, depth };
}
const PX = (q) => SCN.ox + q.sx * SCN.scale;
const PY = (q) => SCN.oy - q.up * SCN.scale;

// 3D vector helpers for drawing the element angle-arcs on the great circles
// that define them (Omega in the reference plane, i between the planes, omega
// and nu in the orbital plane).
function unit(p) { const m = Math.hypot(p[0], p[1], p[2]) || 1; return [p[0] / m, p[1] / m, p[2] / m]; }
function slerp(u, v, t) {
  let d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2]; d = Math.max(-1, Math.min(1, d));
  const th = Math.acos(d); if (th < 1e-6) return u; const s = Math.sin(th);
  const a = Math.sin((1 - t) * th) / s, b = Math.sin(t * th) / s;
  return [a * u[0] + b * v[0], a * u[1] + b * v[1], a * u[2] + b * v[2]];
}
function drawArc(u, v, radius, color, label) {
  u = unit(u); v = unit(v);
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
  const N = 28;
  for (let k = 0; k <= N; k += 1) { const w = slerp(u, v, k / N); const q = project([w[0] * radius, w[1] * radius, w[2] * radius]); if (k) ctx.lineTo(PX(q), PY(q)); else ctx.moveTo(PX(q), PY(q)); }
  ctx.stroke();
  if (label) { const w = slerp(u, v, 0.5); const q = project([w[0] * radius * 1.18, w[1] * radius * 1.18, w[2] * radius * 1.18]); ctx.fillStyle = color; ctx.font = fontString(canvas, 'caption', 'mono', 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, PX(q), PY(q)); }
}
function line3(p0, p1, color, w, dash) {
  const a = project(p0), b = project(p1);
  ctx.strokeStyle = color; ctx.lineWidth = w || 1.5; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(PX(a), PY(a)); ctx.lineTo(PX(b), PY(b)); ctx.stroke(); ctx.setLineDash([]);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    orbit: '#5bc0eb', star: '#ffd166', planet: '#e8e8e8', node: '#67d98c', peri: '#ef5466',
    rC: '#5bc0eb', vC: '#ef476f',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}
function pos(nu) { const p = elementsToPos(A, ecc(), inc(), Om(), wArg(), nu); return [p.x, p.y, p.z, p.r]; }

function panel(col, r, title) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

function drawScene(col, r) {
  panel(col, r, 'Orbital elements against the celestial reference frame');
  const Omv = Om(), iv = inc(), e = ecc();
  const OmC = '#ffd166', iC = '#5bc0eb', wC = '#c77dff', nuC = '#67d98c';

  ctx.save();
  clipTo(ctx, SCN.draw);

  // reference plane grid (z = 0, the ecliptic).
  const G = 1.55;
  ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
  for (let g = -G; g <= G + 1e-6; g += G / 3) {
    line3([g, -G, 0], [g, G, 0], col.grid, 1);
    line3([-G, g, 0], [G, g, 0], col.grid, 1);
  }

  // orbit samples + orbital-plane disk fill (shows the inclination tilt).
  const NS = 160, samp = [];
  for (let k = 0; k <= NS; k += 1) { const nu = 2 * Math.PI * k / NS; samp.push({ q: project(pos(nu)), nu }); }
  ctx.fillStyle = 'rgba(91,192,235,0.07)'; ctx.beginPath();
  samp.forEach((s, k) => { if (k) ctx.lineTo(PX(s.q), PY(s.q)); else ctx.moveTo(PX(s.q), PY(s.q)); }); ctx.closePath(); ctx.fill();

  // reference direction (vernal equinox) as a labelled axis from the origin.
  line3([0, 0, 0], [G * 1.05, 0, 0], 'rgba(255,255,255,0.7)', 2);
  { const rx = project([G * 1.05, 0, 0]); ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('♈ reference', PX(rx) + 4, PY(rx)); }

  // line of nodes (orbital plane ∩ reference plane).
  const nAsc = [Math.cos(Omv), Math.sin(Omv), 0];
  line3([-nAsc[0] * 1.4, -nAsc[1] * 1.4, 0], [nAsc[0] * 1.4, nAsc[1] * 1.4, 0], 'rgba(103,217,140,0.8)', 1.6);
  { const q = project([nAsc[0] * 1.4, nAsc[1] * 1.4, 0]); ctx.fillStyle = nuC; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('☊ asc. node', PX(q) + 4, PY(q)); }
  { const q = project([-nAsc[0] * 1.4, -nAsc[1] * 1.4, 0]); ctx.fillStyle = 'rgba(103,217,140,0.6)'; ctx.textAlign = 'right'; ctx.fillText('☋', PX(q) - 4, PY(q)); }

  // orbit ellipse, depth-shaded.
  let dmin = Infinity, dmax = -Infinity; for (const s of samp) { dmin = Math.min(dmin, s.q.depth); dmax = Math.max(dmax, s.q.depth); }
  for (let k = 1; k <= NS; k += 1) {
    const a0 = samp[k - 1], b0 = samp[k]; const dd = (a0.q.depth - dmin) / (dmax - dmin + 1e-9);
    ctx.strokeStyle = `rgba(91,192,235,${0.3 + 0.6 * dd})`; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(PX(a0.q), PY(a0.q)); ctx.lineTo(PX(b0.q), PY(b0.q)); ctx.stroke();
  }

  // element angle arcs.
  const pHat = unit(pos(0));                         // periapsis direction
  const nuNow = nuOf(t);
  const bHat = unit(pos(nuNow));                      // body direction
  const u1 = [-Math.sin(Omv), Math.cos(Omv), 0];      // ref-plane normal-to-node
  const u2 = [u1[0] * Math.cos(iv), u1[1] * Math.cos(iv), Math.sin(iv)]; // tilted into orbital plane
  drawArc([1, 0, 0], nAsc, 0.55, OmC, 'Ω');          // longitude of ascending node
  drawArc(u1, u2, 0.34, iC, 'i');                    // inclination (between planes)
  drawArc(nAsc, pHat, 0.72, wC, 'ω');                // argument of periapsis
  drawArc(pHat, bHat, 0.46, nuC, 'ν');               // true anomaly

  // radius vector + drop line to the reference plane (shows the height z).
  const bp = pos(nuNow);
  line3([0, 0, 0], [bp[0], bp[1], bp[2]], 'rgba(255,255,255,0.55)', 1.4);
  line3([bp[0], bp[1], bp[2]], [bp[0], bp[1], 0], 'rgba(255,255,255,0.3)', 1, [3, 3]);

  // periapsis marker.
  { const q = project(pos(0)); ctx.strokeStyle = col.peri; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(PX(q), PY(q), 5, 0, 2 * Math.PI); ctx.stroke(); ctx.fillStyle = col.peri; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('peri', PX(q) + 6, PY(q)); }

  // star at the focus.
  { const q = project([0, 0, 0]); ctx.fillStyle = col.star; ctx.beginPath(); ctx.arc(PX(q), PY(q), 7, 0, 2 * Math.PI); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.stroke(); }

  // trail + body.
  ctx.strokeStyle = 'rgba(232,232,232,0.5)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let m = 0; m <= 26; m += 1) { const tm = t - (26 - m) * 0.05; const q = project(pos(nuOf(tm))); if (m) ctx.lineTo(PX(q), PY(q)); else ctx.moveTo(PX(q), PY(q)); }
  ctx.stroke();
  const pq = project(pos(nuNow)); ctx.fillStyle = col.planet; ctx.beginPath(); ctx.arc(PX(pq), PY(pq), 5.5, 0, 2 * Math.PI); ctx.fill(); ctx.strokeStyle = col.orbit; ctx.lineWidth = 1.6; ctx.stroke();

  ctx.restore();

  // readout strip (also the colour key for the arcs).
  const P = pos(nuNow), rr = P[3], vv = Math.sqrt(Math.max(0, 2 / rr - 1 / A));
  const items = [[`Ω ${sOm.value}°`, OmC], [`i ${sI.value}°`, iC], [`ω ${sW.value}°`, wC], [`ν ${(nuNow * 180 / Math.PI).toFixed(0)}°`, nuC]];
  ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textBaseline = 'middle';
  let need = 0; for (const [t2] of items) need += ctx.measureText(t2).width + 18;
  if (need <= r.w) { ctx.textAlign = 'center'; items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); }); }
  else { ctx.textAlign = 'center'; items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * ((i % 2) + 0.5) / 2, r.y + r.h - (i < 2 ? 22 : 8)); }); }
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Distance and speed vs true anomaly (Kepler II)');

  const inner = { x: r.x + 40, y: r.y + 28, w: r.w - 40 - 16, h: r.h - 28 - 42 };
  const e = ecc();
  const rOf = (nu) => A * (1 - e * e) / (1 + e * Math.cos(nu));
  const vOf = (nu) => Math.sqrt(Math.max(0, 2 / rOf(nu) - 1 / A));
  let mx = 0.5;
  for (let k = 0; k <= 60; k++) { const nu = 2 * Math.PI * k / 60; mx = Math.max(mx, rOf(nu), vOf(nu)); }
  mx *= 1.1;
  const xOf = (nu) => inner.x + nu / (2 * Math.PI) * inner.w;
  const yOf = (val) => inner.y + inner.h - val / mx * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const frac of [0, 0.5, 1]) { const y = inner.y + inner.h - frac * inner.h; ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText((mx * frac).toFixed(1), inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const d of [0, 90, 180, 270, 360]) ctx.fillText(`${d}°`, xOf(d * D2R), inner.y + inner.h + 6);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  const plot = (f, c) => { ctx.strokeStyle = c; ctx.lineWidth = 2.6; ctx.beginPath(); for (let k = 0; k <= 120; k++) { const nu = 2 * Math.PI * k / 120; const X = xOf(nu), Y = yOf(f(nu)); if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.stroke(); };
  plot(rOf, col.rC); plot(vOf, col.vC);

  // peri/apo markers (at the bottom, clear of the legend) + current nu.
  ctx.fillStyle = col.peri; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText('peri', xOf(0) + 4, inner.y + inner.h - 4);
  ctx.textAlign = 'center'; ctx.fillText('apo', xOf(Math.PI), inner.y + inner.h - 4);
  const nuNow = nuOf(t);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xOf(nuNow), inner.y); ctx.lineTo(xOf(nuNow), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.rC; ctx.beginPath(); ctx.arc(xOf(nuNow), yOf(rOf(nuNow)), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = col.vC; ctx.beginPath(); ctx.arc(xOf(nuNow), yOf(vOf(nuNow)), 4, 0, 2 * Math.PI); ctx.fill();

  // labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('true anomaly ν', inner.x + inner.w / 2, inner.y + inner.h + 20);
  const leg = [['r (distance)', col.rC], ['v (speed)', col.vC]];
  let lx = inner.x + 8; const ly = inner.y + 11;
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const [lab, c] of leg) { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 12, ly); ctx.stroke(); ctx.fillStyle = col.fg; ctx.fillText(lab, lx + 15, ly); lx += 96; }
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) t += 0.55 * dt;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  for (const [key, el] of [['e', sE], ['i', sI], ['Om', sOm], ['w', sW]]) { const v = params.get(key); if (v !== null && Number.isFinite(parseFloat(v))) el.value = v; }
  syncVals(); relayout(); t = 0.9; render();
  if (CAPTURE_NAME && DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } })); }));
}

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const P = pos(nuOf(t)), rr = P[3];
  return {
    fields: [
      { key: 'e', label: 'eccentricity e', value: ecc(), format: 'float' },
      { key: 'i', label: 'inclination (deg)', value: parseFloat(sI.value), format: 'float' },
      { key: 'r', label: 'distance r (a)', value: rr, format: 'float' },
      { key: 'v', label: 'speed v', value: Math.sqrt(Math.max(0, 2 / rr - 1 / A)), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Kepler's equation drives the motion: the speed from the timed
    // position (finite difference) matches the vis-viva law v=sqrt(2/r-1/a).
    const d = 1e-3;
    const p1 = pos(nuOf(t)), p2 = pos(nuOf(t + d));
    const fd = Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]) / d;
    const visviva = Math.sqrt(Math.max(0, 2 / p1[3] - 1 / A));
    const rel = Math.abs(fd - visviva) / Math.max(1e-6, visviva);
    return [{
      key: 'visviva',
      label: 'v = √(2/r − 1/a) (vis-viva)',
      value: rel.toExponential(2),
      status: rel < 2e-2 ? 'pass' : (rel < 1e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
