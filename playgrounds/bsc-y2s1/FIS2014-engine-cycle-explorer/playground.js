import { ottoEfficiency, dieselEfficiency, carnotEfficiency, stirlingEfficiency, ottoPVCurve } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Engine Cycle Explorer, Canvas2D only. Scene: the PV diagram of the chosen
// ideal cycle, autoscaled to the loop, with the four processes coloured, the
// corner states numbered, a piston bar tied to the live volume, and a point
// tracing the loop. Diagnostic: the efficiency of all four cycles side by side
// so the Carnot (reversible) bound is plain.
//
// Reference: Callen, Thermodynamics, 2nd ed., Ch. 4-5 (`callen`); Reif, Ch. 5
// (`reif`).

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sR = document.getElementById('slider-r'), vR = document.getElementById('value-r');
const sRc = document.getElementById('slider-rc'), vRc = document.getElementById('value-rc');
const selC = document.getElementById('select-c');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const TPEAK = 6;            // peak-temperature ratio T3/T1 for the combustion cycles
const N = 30;              // points per process; 4 processes -> 4*(N+1) points
const SEG = N + 1;
const TC = 300, TH = 900;  // reservoir temps for Carnot/Stirling

const st = { r: 8, rc: 2, cycle: 'otto', t: 0, gamma: 1.4 };
if (['otto', 'diesel', 'carnot', 'stirling'].includes(params.get('cycle'))) st.cycle = params.get('cycle');
if (Number.isFinite(parseFloat(params.get('r')))) st.r = parseFloat(params.get('r'));
if (Number.isFinite(parseFloat(params.get('rc')))) st.rc = parseFloat(params.get('rc'));
let running = !prefersReducedMotion();

// Per-cycle process labels (4 segments, in trace order).
const PROC = {
  otto: ['adiabatic compress', 'heat in (V const)', 'adiabatic expand', 'heat out (V const)'],
  diesel: ['adiabatic compress', 'heat in (P const)', 'adiabatic expand', 'heat out (V const)'],
  carnot: ['isothermal expand (hot)', 'adiabatic expand', 'isothermal compress (cold)', 'adiabatic compress'],
  stirling: ['isothermal (hot)', 'cool (V const)', 'isothermal (cold)', 'heat (V const)'],
};
const SEGCOL = ['#5b8def', '#ef5466', '#ffd166', '#06d6a0'];   // compress, heat-in, expand, heat-out

sR.addEventListener('input', () => { st.r = parseFloat(sR.value); vR.textContent = st.r.toFixed(1); rebuild(); });
sRc.addEventListener('input', () => { st.rc = parseFloat(sRc.value); vRc.textContent = st.rc.toFixed(2); rebuild(); });
selC.addEventListener('change', () => { st.cycle = selC.value; rebuild(); });
btnR.addEventListener('click', () => {
  st.t = 0; st.r = 8; st.rc = 2; st.cycle = 'otto';
  sR.value = '8'; sRc.value = '2'; selC.value = 'otto'; vR.textContent = '8.0'; vRc.textContent = '2.00';
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false');
  rebuild();
});
btnP.addEventListener('click', () => {
  running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.05 },
    { name: 'diagnostic', weight: 0.95 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

function buildPoints() {
  const V1 = 1, V2 = V1 / st.r, P1 = 1, g = st.gamma;
  const push4 = (segs) => segs;   // helper readability
  switch (st.cycle) {
    case 'otto': {
      return ottoPVCurve(V1, V2, P1, 300, 300 * TPEAK, g);
    }
    case 'diesel': {
      const P2 = P1 * Math.pow(V1 / V2, g);
      const V3 = V2 * st.rc, P3 = P2, P4 = P3 * Math.pow(V3 / V1, g);
      const pts = [];
      for (let i = 0; i <= N; i++) { const v = V1 + (V2 - V1) * i / N; pts.push({ V: v, P: P1 * Math.pow(V1 / v, g) }); }
      for (let i = 0; i <= N; i++) { const v = V2 + (V3 - V2) * i / N; pts.push({ V: v, P: P2 }); }
      for (let i = 0; i <= N; i++) { const v = V3 + (V1 - V3) * i / N; pts.push({ V: v, P: P3 * Math.pow(V3 / v, g) }); }
      for (let i = 0; i <= N; i++) { const t = i / N; pts.push({ V: V1, P: P4 + (P1 - P4) * t }); }
      return pts;
    }
    case 'carnot': {
      const Vr = 2, pts = [];
      for (let i = 0; i <= N; i++) { const v = V1 + (Vr * V1 - V1) * i / N; pts.push({ V: v, P: P1 * V1 / v }); }
      const V2c = Vr * V1, P2c = P1 / Vr;
      const V3c = V2c * Math.pow(TH / TC, 1 / (g - 1));
      for (let i = 0; i <= N; i++) { const v = V2c + (V3c - V2c) * i / N; pts.push({ V: v, P: P2c * Math.pow(V2c / v, g) }); }
      const P3c = P2c * Math.pow(V2c / V3c, g), V4c = V3c / Vr;
      for (let i = 0; i <= N; i++) { const v = V3c + (V4c - V3c) * i / N; pts.push({ V: v, P: P3c * V3c / v }); }
      const P4c = P3c * V3c / V4c;
      for (let i = 0; i <= N; i++) { const v = V4c + (V1 - V4c) * i / N; pts.push({ V: v, P: P4c * Math.pow(V4c / v, g) }); }
      return pts;
    }
    case 'stirling': {
      const ratio = TH / TC, pts = [];
      for (let i = 0; i <= N; i++) { const v = V1 + (V2 - V1) * i / N; pts.push({ V: v, P: P1 * V1 / v * ratio }); }
      const Phot2 = P1 * V1 / V2 * ratio, Pcold2 = P1 * V1 / V2;
      for (let i = 0; i <= N; i++) { const t = i / N; pts.push({ V: V2, P: Phot2 + (Pcold2 - Phot2) * t }); }
      for (let i = 0; i <= N; i++) { const v = V2 + (V1 - V2) * i / N; pts.push({ V: v, P: P1 * V1 / v }); }
      for (let i = 0; i <= N; i++) { const t = i / N; pts.push({ V: V1, P: P1 + (P1 * ratio - P1) * t }); }
      return pts;
    }
  }
  return [];
}

function efficiency(cycle) {
  switch (cycle) {
    case 'otto': return ottoEfficiency(st.r, st.gamma);
    case 'diesel': return dieselEfficiency(st.r, st.rc, st.gamma);
    case 'carnot': return carnotEfficiency(TC, TH);
    case 'stirling': return stirlingEfficiency(TC, TH);
  }
  return 0;
}
// Net work = area enclosed by the loop (shoelace on the PV path).
function loopWork(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.V * q.P - q.V * p.P;
  }
  return Math.abs(a) / 2;
}

let pts = [], bnds = null, work = 0;
function rebuild() {
  pts = buildPoints();
  let Vmn = Infinity, Vmx = -Infinity, Pmn = Infinity, Pmx = -Infinity;
  for (const p of pts) { Vmn = Math.min(Vmn, p.V); Vmx = Math.max(Vmx, p.V); Pmn = Math.min(Pmn, p.P); Pmx = Math.max(Pmx, p.P); }
  bnds = { Vmn, Vmx, Pmn, Pmx };
  work = loopWork(pts);
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 10, r.y + 7);
  }
}

function drawScene(col, r) {
  panel(col, r, `${st.cycle[0].toUpperCase() + st.cycle.slice(1)} cycle on the P-V plane`);
  const padL = 50, padR = 18, padT = 30, padB = 38;
  const ax = { x: r.x + padL, y: r.y + padT, w: r.w - padL - padR, h: r.h - padT - padB };
  // autoscaled axes with a little headroom.
  const Vpad = 0.06 * (bnds.Vmx - bnds.Vmn);
  const Vlo = Math.max(0, bnds.Vmn - Vpad), Vhi = bnds.Vmx + Vpad;
  const Phi = bnds.Pmx * 1.08, Plo = 0;
  const X = (V) => ax.x + (V - Vlo) / (Vhi - Vlo) * ax.w;
  const Y = (P) => ax.y + ax.h - (P - Plo) / (Phi - Plo) * ax.h;

  // grid + axis frame.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.7;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 4; k++) { const P = Plo + (Phi - Plo) * k / 4, y = Y(P); ctx.beginPath(); ctx.moveTo(ax.x, y); ctx.lineTo(ax.x + ax.w, y); ctx.stroke(); ctx.fillText(P.toFixed(1), ax.x - 6, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let k = 0; k <= 4; k++) { const V = Vlo + (Vhi - Vlo) * k / 4, x = X(V); ctx.fillText(V.toFixed(2), x, ax.y + ax.h + 6); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(ax.x, ax.y); ctx.lineTo(ax.x, ax.y + ax.h); ctx.lineTo(ax.x + ax.w, ax.y + ax.h); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('P', ax.x + 4, ax.y - 2);
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('V', ax.x + ax.w, ax.y + ax.h - 4);

  ctx.save();
  clipTo(ctx, { x: ax.x, y: ax.y, w: ax.w, h: ax.h });
  // shaded work area.
  ctx.beginPath(); pts.forEach((p, i) => { const x = X(p.V), y = Y(p.P); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
  ctx.fillStyle = 'rgba(255,209,102,0.10)'; ctx.fill();
  // coloured process segments.
  ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
  for (let s = 0; s < 4; s++) {
    ctx.strokeStyle = SEGCOL[s]; ctx.beginPath();
    for (let i = s * SEG; i <= s * SEG + N; i++) { const p = pts[i], x = X(p.V), y = Y(p.P); (i === s * SEG) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
  }
  // numbered corner states (start of each segment).
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let s = 0; s < 4; s++) {
    const p = pts[s * SEG]; const x = X(p.V), y = Y(p.P);
    ctx.fillStyle = col.panel; ctx.beginPath(); ctx.arc(x, y, 8, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = col.fg; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = col.fg; ctx.fillText(String(s + 1), x, y + 0.5);
  }
  // tracing point.
  const len = pts.length;
  const idx = ((Math.floor(st.t * 24) % len) + len) % len;
  const cur = pts[idx];
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(cur.V), Y(cur.P), 5.5, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = SEGCOL[Math.min(3, Math.floor(idx / SEG))]; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();

  // piston bar (top-right): a cylinder with a piston at the current volume.
  const cw = Math.min(190, ax.w * 0.32), ch = 26, cx = ax.x + ax.w - cw - 6, cy = ax.y + 8;
  ctx.strokeStyle = col.muted; ctx.lineWidth = 1.4; ctx.strokeRect(cx, cy, cw, ch);
  const vf = (cur.V - bnds.Vmn) / Math.max(1e-9, bnds.Vmx - bnds.Vmn);
  const pistonX = cx + 6 + vf * (cw - 12);
  ctx.fillStyle = 'rgba(239,84,102,0.18)'; ctx.fillRect(cx + 1, cy + 1, pistonX - cx - 1, ch - 2);   // gas
  ctx.fillStyle = col.accent; ctx.fillRect(pistonX, cy + 1, 4, ch - 2);                                // piston
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText('piston (volume)', cx, cy - 2);

  // process legend (current process highlighted), right-aligned to the panel
  // edge so the labels never overflow on the narrow fold.
  const segNow = Math.min(3, Math.floor(idx / SEG));
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  let ly = ax.y + 44;
  for (let s = 0; s < 4; s++) {
    const label = `${s + 1}→${s === 3 ? 1 : s + 2}  ${PROC[st.cycle][s]}`;
    const tw = ctx.measureText(label).width;
    const textX = ax.x + ax.w - 6 - tw, swX = textX - 14;
    ctx.globalAlpha = s === segNow ? 1 : 0.6;
    ctx.fillStyle = SEGCOL[s]; ctx.fillRect(swX, ly - 4, 9, 9);
    ctx.fillStyle = s === segNow ? col.fg : col.muted;
    ctx.fillText(label, textX, ly);
    ly += 15; ctx.globalAlpha = 1;
  }

  // readout strip.
  const items = [[`cycle ${st.cycle}`, col.fg], [`η = ${efficiency(st.cycle).toFixed(3)}`, col.accent], [`net work ${work.toFixed(3)}`, col.fg], [`r = ${st.r.toFixed(1)}`, col.muted]];
  ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Efficiency by cycle (Carnot is the reversible bound)');
  const inner = { x: r.x + 90, y: r.y + 30, w: r.w - 90 - 70, h: r.h - 30 - 30 };
  const cycles = ['otto', 'diesel', 'stirling', 'carnot'];
  const xOf = (e) => inner.x + e * inner.w;
  // gridlines 0..1.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.7; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let k = 0; k <= 5; k++) { const e = k / 5, x = xOf(e); ctx.beginPath(); ctx.moveTo(x, inner.y); ctx.lineTo(x, inner.y + inner.h); ctx.stroke(); ctx.fillText(e.toFixed(1), x, inner.y + inner.h + 5); }
  const carnotE = carnotEfficiency(TC, TH);
  // Carnot bound line.
  ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xOf(carnotE), inner.y); ctx.lineTo(xOf(carnotE), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);

  const bh = inner.h / cycles.length;
  ctx.textBaseline = 'middle';
  cycles.forEach((cyc, i) => {
    const e = efficiency(cyc), y = inner.y + i * bh + bh / 2;
    const active = cyc === st.cycle;
    ctx.fillStyle = active ? col.accent : 'rgba(120,140,170,0.5)';
    ctx.fillRect(inner.x, y - bh * 0.3, xOf(e) - inner.x, bh * 0.6);
    ctx.fillStyle = active ? col.fg : col.muted; ctx.textAlign = 'right'; ctx.font = fontString(canvas, 'tick', 'mono', active ? 700 : 400);
    ctx.fillText(cyc, inner.x - 8, y);
    ctx.textAlign = 'left'; ctx.fillStyle = active ? col.accent : col.muted;
    ctx.fillText(e.toFixed(3), xOf(e) + 6, y);
  });
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('efficiency  η', inner.x + inner.w / 2, inner.y + inner.h + 18);
}

function render() {
  if (!REG) relayout();
  if (!pts.length) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  if (running) st.t += dt * 0.5;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  selC.value = st.cycle; sR.value = String(st.r); sRc.value = String(st.rc);
  vR.textContent = st.r.toFixed(1); vRc.textContent = st.rc.toFixed(2);
  relayout(); rebuild();
  st.t = CAPTURE_FRAC * 4;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); }
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'cycle-type', label: 'thermodynamic cycle', value: st.cycle, format: 'text' },
      { key: 'efficiency', label: 'efficiency η', value: efficiency(st.cycle), format: 'float' },
      { key: 'net-work', label: 'net work (loop area)', value: work, format: 'float' },
      { key: 'compression-ratio', label: 'compression ratio r', value: st.r, format: 'float' },
      { key: 'cutoff-ratio', label: 'cutoff ratio rc', value: st.rc, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  if (!pts.length) return [{ key: 'init', label: 'initializing', value: 'pending', status: 'pending' }];
  const first = pts[0], lastp = pts[pts.length - 1];
  const closure = Math.hypot(first.V - lastp.V, first.P - lastp.P) / Math.max(1e-9, bnds.Vmx);
  return [
    { key: 'closure', label: 'P-V loop closes (start = end)', value: closure.toExponential(2), status: closure < 1e-2 ? 'pass' : 'drift' },
  ];
};
