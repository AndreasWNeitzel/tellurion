// playground.js
// Elastic and inelastic 2D collisions.
//
// Ball 1 enters from the left at speed v1 with impact parameter b and strikes
// ball 2 at rest. The impulse acts along the line of centres with restitution
// e (sim.js collide2d). Total momentum is conserved for any e; kinetic energy
// only for e = 1.
//
// Vertical 4:5 composition:
//   1. SCENE: the collision, big. Disks sized by mass, velocity arrows, fading
//      trails, the contact normal at impact, and a corner inset adding the two
//      momenta tip to tail to the (constant) total.
//   2. DIAGNOSTIC: kinetic energy and total momentum over time, normalised to
//      their initial values. Momentum stays flat; energy steps down at impact
//      unless the bounce is perfect.

import { collide2d, ke2d } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { stack, setupCanvas } from '../../../shared/js/render/vertical-layout.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutV = document.getElementById('readout-v');
const readoutKE = document.getElementById('readout-ke');

const ids = ['m1', 'm2', 'u1', 'u2', 'e'].map((k) => ({
  k, s: document.getElementById('slider-' + k), v: document.getElementById('value-' + k),
}));
const st = { m1: 1, m2: 2, u1: 3, u2: 0.4, e: 0.9 };
for (const { k, s, v } of ids) {
  st[k] = parseFloat(s.value);
  s.addEventListener('input', () => { st[k] = parseFloat(s.value); v.textContent = parseFloat(s.value).toFixed(2); reset(); });
}
const btnR = document.getElementById('btn-reset');
const btnP = document.getElementById('btn-pause');
let running = !prefersReducedMotion();
btnR.addEventListener('click', reset);
btnP.addEventListener('click', () => {
  running = !running;
  btnP.textContent = running ? 'Pause' : 'Play';
  btnP.setAttribute('aria-pressed', String(!running));
});

const PHYSICS_DT = 1 / 240;
const T_PLOT = 4.0;            // diagnostic horizon (s)
const APPROACH = 0.85;         // ball 1 reaches the origin in ~this many seconds
const RAD = 0.4;               // disk radius factor (radius = RAD * sqrt(mass))
let last = (typeof performance !== 'undefined' ? performance.now() : 0);
let acc = 0;

let p1, p2, v1, v2, t, collided, tCollide, trail1, trail2, hist;
function speed0() { return Math.max(0.3, st.u1); }
function KE0() { return 0.5 * st.m1 * speed0() ** 2; }
function P0() { return st.m1 * speed0(); }

function reset() {
  const u = speed0();
  p1 = [-(u * APPROACH) - 0.6, st.u2]; v1 = [u, 0];
  p2 = [0, 0]; v2 = [0, 0];
  t = 0; collided = false; tCollide = -1;
  trail1 = []; trail2 = []; hist = [];
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false');
}
reset();

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.5 },
    { name: 'diag', weight: 1.7 },
  ]);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function colors() {
  const css = getComputedStyle(document.body);
  const g = (k, d) => css.getPropertyValue(k).trim() || d;
  return {
    bg: g('--bg', '#07090f'),
    panel: '#0a0c12',
    fg: g('--fg', '#e8e8e8'),
    muted: 'rgba(255,255,255,0.5)',
    accent: g('--accent', '#ffd166'),
    cool: '#7fb1d8',
    warm: '#e0925f',
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.10)',
  };
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

function arrow(x0, y0, x1, y1, color, width, head) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const hl = head || 8;
  ctx.strokeStyle = color; ctx.lineWidth = width || 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - hl * Math.cos(a - 0.4), y1 - hl * Math.sin(a - 0.4));
  ctx.lineTo(x1 - hl * Math.cos(a + 0.4), y1 - hl * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
}

function step() {
  const r1 = RAD * Math.sqrt(st.m1), r2 = RAD * Math.sqrt(st.m2);
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  if (!collided && Math.hypot(dx, dy) <= r1 + r2) {
    const r = collide2d(st.m1, p1, v1, st.m2, p2, v2, st.e);
    v1 = r.v1; v2 = r.v2; collided = true; tCollide = t;
  }
  p1[0] += v1[0] * PHYSICS_DT; p1[1] += v1[1] * PHYSICS_DT;
  p2[0] += v2[0] * PHYSICS_DT; p2[1] += v2[1] * PHYSICS_DT;
  trail1.push([p1[0], p1[1]]); trail2.push([p2[0], p2[1]]);
  if (trail1.length > 320) trail1.shift();
  if (trail2.length > 320) trail2.shift();
  const ke = ke2d(st.m1, v1, st.m2, v2);
  const px = st.m1 * v1[0] + st.m2 * v2[0], py = st.m1 * v1[1] + st.m2 * v2[1];
  hist.push({ t, ke: ke / KE0(), p: Math.hypot(px, py) / P0() });
  if (hist.length > 1400) hist.shift();
  t += PHYSICS_DT;
}

function drawScene(col) {
  const r = REG.scene;
  panel(col, r, null);
  const pad = 16;
  const xMin = -6, xMax = 6, yMin = -3.2, yMax = 3.2;
  const domW = xMax - xMin, domH = yMax - yMin;
  const scale = Math.min((r.w - 2 * pad) / domW, (r.h - 2 * pad) / domH);
  const ox = r.x + pad + ((r.w - 2 * pad) - domW * scale) / 2;
  const oy = r.y + pad + ((r.h - 2 * pad) - domH * scale) / 2;
  const X = (x) => ox + (x - xMin) * scale;
  const Y = (y) => oy + (yMax - y) * scale;
  const r1 = RAD * Math.sqrt(st.m1), r2 = RAD * Math.sqrt(st.m2);

  // Centre axis.
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(X(xMin), Y(0)); ctx.lineTo(X(xMax), Y(0)); ctx.stroke();

  // Trails.
  const drawTrail = (tr, rgb) => {
    for (let i = 1; i < tr.length; i += 1) {
      ctx.strokeStyle = `rgba(${rgb},${(0.03 + 0.35 * i / tr.length).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(tr[i - 1][0]), Y(tr[i - 1][1])); ctx.lineTo(X(tr[i][0]), Y(tr[i][1])); ctx.stroke();
    }
  };
  drawTrail(trail1, '127,177,216');
  drawTrail(trail2, '224,146,95');

  // Contact normal (line of centres) once collided, fading.
  if (collided) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d, ny = dy / d, L = 1.4;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
    ctx.beginPath(); ctx.moveTo(X(mx - nx * L), Y(my - ny * L)); ctx.lineTo(X(mx + nx * L), Y(my + ny * L)); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Disks.
  const disk = (p, rr, fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), rr * scale, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.4; ctx.stroke();
  };
  disk(p2, r2, 'rgba(224,146,95,0.9)');
  disk(p1, r1, 'rgba(127,177,216,0.9)');

  // Velocity arrows (scaled).
  const va = 0.55;
  const vArrow = (p, v, color) => {
    const m = Math.hypot(v[0], v[1]); if (m < 1e-3) return;
    arrow(X(p[0]), Y(p[1]), X(p[0] + v[0] * va), Y(p[1] + v[1] * va), color, 2.8, 10);
  };
  vArrow(p1, v1, col.cool);
  vArrow(p2, v2, col.warm);

  // Momentum inset: p1 and p2 added tip to tail to the constant total.
  const iw = Math.min(180, r.w * 0.42), ih = 78;
  const ix = r.x + r.w - iw - 8, iy = r.y + r.h - ih - 8;
  ctx.fillStyle = 'rgba(8,10,18,0.8)';
  ctx.fillRect(ix, iy, iw, ih);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
  ctx.font = fontString(canvas, 'tick', 'sans');
  ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('p₁ + p₂ = total (fixed)', ix + 6, iy + 5);
  const p1v = [st.m1 * v1[0], st.m1 * v1[1]];
  const p2v = [st.m2 * v2[0], st.m2 * v2[1]];
  const ms = (iw - 24) / (P0() * 1.05);
  const sx = ix + 12, sy = iy + ih - 22;
  // total (constant) reference, dashed.
  ctx.strokeStyle = 'rgba(255,209,102,0.45)';
  ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + P0() * ms, sy); ctx.stroke();
  ctx.setLineDash([]);
  // p1 then p2 tip to tail.
  const t1x = sx + p1v[0] * ms, t1y = sy - p1v[1] * ms;
  arrow(sx, sy, t1x, t1y, col.cool, 2, 6);
  arrow(t1x, t1y, t1x + p2v[0] * ms, t1y - p2v[1] * ms, col.warm, 2, 6);

  // Readout overlay (top).
  const keNow = ke2d(st.m1, v1, st.m2, v2);
  const loss = KE0() > 0 ? 100 * (1 - keNow / KE0()) : 0;
  ctx.font = fontString(canvas, 'mono', 'mono');
  ctx.fillStyle = col.fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`m₁ ${st.m1.toFixed(1)}   m₂ ${st.m2.toFixed(1)}   e ${st.e.toFixed(2)}   b ${st.u2.toFixed(2)}`, r.x + 10, r.y + 8);
  ctx.fillStyle = col.accent;
  ctx.fillText(`KE loss ${loss.toFixed(0)}%`, r.x + 10, r.y + 26);

  // Disk labels.
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillStyle = col.cool; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText('m₁', r.x + r.w - 10, r.y + 8);
  ctx.fillStyle = col.warm;
  ctx.fillText('m₂', r.x + r.w - 10, r.y + 24);
}

function drawDiag(col) {
  const r = REG.diag;
  panel(col, r, null);
  const padL = 40, padR = 14, padT = 26, padB = 24;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, pw = x1 - x0;
  const y0 = r.y + padT, y1 = r.y + r.h - padB, ph = y1 - y0;
  const yMaxVal = 1.18;
  const fx = (tt) => x0 + clamp(tt / T_PLOT, 0, 1) * pw;
  const fy = (val) => y1 - (val / yMaxVal) * ph;

  // Gridlines 0, 0.5, 1.
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const v of [0, 0.5, 1.0]) {
    const py = fy(v);
    ctx.strokeStyle = v === 1 ? 'rgba(255,255,255,0.18)' : col.grid;
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke();
    ctx.fillText(v.toFixed(1), x0 - 5, py);
  }
  // time axis ticks.
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let s = 0; s <= T_PLOT + 1e-9; s += 1) {
    const px = fx(s);
    ctx.beginPath(); ctx.strokeStyle = col.grid; ctx.moveTo(px, y1); ctx.lineTo(px, y1 + 3); ctx.stroke();
    ctx.fillText(`${s}s`, px, y1 + 5);
  }

  // Collision marker.
  if (tCollide >= 0) {
    const cxp = fx(tCollide);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cxp, y0); ctx.lineTo(cxp, y1); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = fontString(canvas, 'tick', 'sans');
    ctx.fillText('impact', cxp + 3, y0 + 2);
  }

  // Traces.
  const trace = (key, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath();
    let first = true;
    for (const h of hist) {
      if (h.t > T_PLOT) break;
      const px = fx(h.t), py = fy(clamp(h[key], 0, yMaxVal));
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  };
  trace('p', col.cool);       // total momentum / initial (flat at 1)
  trace('ke', col.accent);    // kinetic energy / initial (steps down)

  // Labels.
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.cool; ctx.fillText('|p| / |p₀|  (conserved)', r.x + 8, r.y + 7);
  ctx.fillStyle = col.accent; ctx.fillText('KE / KE₀', r.x + 8, r.y + 23);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col);
  drawDiag(col);
  const keNow = ke2d(st.m1, v1, st.m2, v2);
  const loss = KE0() > 0 ? 100 * (1 - keNow / KE0()) : 0;
  if (readoutV) readoutV.textContent = `${Math.hypot(v1[0], v1[1]).toFixed(2)}, ${Math.hypot(v2[0], v2[1]).toFixed(2)}`;
  if (readoutKE) readoutKE.textContent = `${loss.toFixed(1)}%`;
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  if (running) {
    acc += dt;
    while (acc >= PHYSICS_DT) { step(); acc -= PHYSICS_DT; }
    if (t > T_PLOT + 0.6 || p1[0] > xMaxExit() || p2[0] > xMaxExit()) reset();
  }
  render();
  requestAnimationFrame(tick);
}
function xMaxExit() { return 7.5; }

if (typeof ResizeObserver !== 'undefined') {
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { relayout(); render(); });
  });
  ro.observe(canvas);
}

function bootSync() {
  relayout();
  for (const { k, v } of ids) v.textContent = st[k].toFixed(2);
  if (CAPTURE_NAME) {
    const T = (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 2.6;
    for (let i = 0; i < T / PHYSICS_DT; i += 1) step();
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const ke = ke2d(st.m1, v1, st.m2, v2);
  return {
    fields: [
      { key: 'restitution', label: 'restitution e', value: st.e, format: 'float' },
      { key: 'm-ratio', label: 'mass ratio m1/m2', value: st.m1 / st.m2, format: 'float' },
      { key: 'ke', label: 'total kinetic energy', value: ke, format: 'float' },
      { key: 'phase', label: 'phase', value: collided ? 'after collision' : 'approaching' },
    ],
  };
};
window.playground.getInvariants = function () {
  const p0x = P0();
  const px = st.m1 * v1[0] + st.m2 * v2[0];
  const py = st.m1 * v1[1] + st.m2 * v2[1];
  const pDrift = Math.hypot(px - p0x, py) / Math.max(1e-9, Math.abs(p0x));
  const ke = ke2d(st.m1, v1, st.m2, v2);
  const ke0 = KE0();
  const out = [{
    key: 'momentum',
    label: 'total momentum conserved',
    value: pDrift.toExponential(2),
    status: pDrift < 2e-3 ? 'pass' : (pDrift < 2e-2 ? 'pending' : 'drift'),
  }];
  if (st.e >= 0.999) {
    const keDrift = Math.abs(ke - ke0) / Math.max(1e-9, ke0);
    out.push({
      key: 'energy', label: 'kinetic energy conserved (elastic)',
      value: keDrift.toExponential(2),
      status: keDrift < 5e-3 ? 'pass' : (keDrift < 5e-2 ? 'pending' : 'drift'),
    });
  } else {
    out.push({
      key: 'energy', label: 'kinetic energy never increases (inelastic)',
      value: `${Math.round((100 * ke) / Math.max(1e-9, ke0))}% of initial`,
      status: ke <= ke0 * 1.002 ? 'pass' : 'drift',
    });
  }
  return out;
};
