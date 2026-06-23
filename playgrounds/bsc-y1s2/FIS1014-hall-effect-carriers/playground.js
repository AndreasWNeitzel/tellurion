// The Hall effect. Carriers drift along a bar in a transverse magnetic field; the
// Lorentz force deflects them to one edge until the Hall field they build cancels
// it, leaving a transverse Hall voltage V_H = I B / (n q t). The scene animates the
// deflection, the edge-charge buildup, and the voltmeter; the diagnostic plots
// V_H vs B for both carrier signs. Canvas2D only.
//
// Reference: Ashcroft and Mermin, Solid State Physics, Ch. 1.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { E, CARRIERS, driftSpeed, hallVoltage, hallCoefficient } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selCarrier = document.getElementById('select-carrier');
const btnReset = document.getElementById('btn-reset');
const sB = document.getElementById('s-B'), sI = document.getElementById('s-I'), sN = document.getElementById('s-n');
const vB = document.getElementById('v-B'), vI = document.getElementById('v-I'), vN = document.getElementById('v-n');

// fixed bar geometry, metres.
const WMM = 5e-3, TMM = 1e-3;
const DEF = { carrier: 'electron', B: 0.4, I: 5, n: 4 };
const st = { ...DEF };

// reduced-model animation constants.
const NPART = 60, VBASE = 0.5, KPUSH = 2.6, RELAX = 1.3, IREF = 5, NREF = 4;
let restore = 0, carriers = [], rngState = 0x9e3779b9;
function rng() { rngState |= 0; rngState = (rngState + 0x6d2b79f5) | 0; let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function seedCarriers() { rngState = 0x9e3779b9; carriers = []; for (let i = 0; i < NPART; i += 1) carriers.push({ x: rng(), y: -0.9 + 1.8 * rng(), j: 0.85 + 0.3 * rng() }); restore = 0; }

function carrier() { return CARRIERS[st.carrier]; }
function si() { return { I: st.I * 1e-3, B: st.B, n: st.n * 1e21, t: TMM, w: WMM, sign: carrier().sign }; }
function vdNorm() { return VBASE * (st.I / IREF) / (st.n / NREF); }
function pushTarget() { return KPUSH * vdNorm() * st.B; } // steady transverse drift target, +y for B>0
function VH_mV() { const p = si(); return hallVoltage(p.I, p.B, p.n, p.t, p.sign) * 1e3; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.25 }, { name: 'diag', weight: 0.95 }]); }
function syncVals() {
  selCarrier.value = st.carrier;
  sB.value = st.B; vB.textContent = `${st.B >= 0 ? '+' : ''}${st.B.toFixed(2)} T`;
  sI.value = st.I; vI.textContent = `${st.I.toFixed(1)} mA`;
  sN.value = st.n; vN.textContent = `${st.n.toFixed(0)} x10^21 /m^3`;
}
selCarrier.addEventListener('change', () => { st.carrier = selCarrier.value; syncVals(); });
btnReset.addEventListener('click', () => { Object.assign(st, DEF); seedCarriers(); syncVals(); });
sB.addEventListener('input', () => { st.B = +sB.value; syncVals(); });
sI.addEventListener('input', () => { st.I = +sI.value; syncVals(); });
sN.addEventListener('input', () => { st.n = +sN.value; syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', bar: '#11151f', barEdge: 'rgba(255,255,255,0.22)', pos: '#ff5d5d', neg: '#5b8cff', field: '#ffd166', cur: '#8de08a' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let BAR = null;
function setBar(r) {
  const voltW = 122, gap = 26, lm = r.w * 0.05;
  const bw = r.w - lm * 2 - voltW - gap;
  const bh = Math.min(r.h * 0.40, 190);
  const bxx = r.x + lm, byy = r.y + 40 + Math.max(0, (r.h - 40 - (bh + 64)) * 0.4);
  BAR = { x: bxx, y: byy, w: bw, h: bh, voltW, gap };
}
function bx(nx) { return BAR.x + nx * BAR.w; }
function by(ny) { return BAR.y + BAR.h * (0.5 - 0.5 * ny); } // ny in [-1,1], +1 = top
function arrow2(x0, y0, x1, y1, color, w) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0), s = 8.5;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - s * Math.cos(a - 0.45), y1 - s * Math.sin(a - 0.45)); ctx.lineTo(x1 - s * Math.cos(a + 0.45), y1 - s * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
}

function drawScene(col, r) {
  panel(col, r, 'Lorentz force vs Hall field: the balance that sets V_H');
  setBar(r);
  const c = carrier(), p = si();
  const VH = VH_mV();
  const hasB = Math.abs(st.B) > 1e-3;
  const accum = hasB ? (st.B > 0 ? 1 : -1) : 0;            // +1: carriers pile on top edge, -1: bottom
  const edgeInt = hasB ? Math.min(1, Math.abs(restore) * 2.6 + 0.32) : 0;
  const band = 11;
  const topCharge = accum > 0 ? c.sign : -c.sign;         // charge on the top edge (carrier sign on the pile edge)

  // bar body, soft metallic gradient.
  const grad = ctx.createLinearGradient(0, BAR.y, 0, BAR.y + BAR.h);
  grad.addColorStop(0, '#171c28'); grad.addColorStop(0.5, '#10141d'); grad.addColorStop(1, '#0b0e15');
  ctx.fillStyle = grad; ctx.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);

  // B field symbols (dots out of page for B>0, crosses into page for B<0).
  if (hasB) {
    const fa = Math.min(0.42, 0.12 + Math.abs(st.B) * 0.32);
    ctx.strokeStyle = `rgba(255,209,102,${fa.toFixed(3)})`; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 1.2;
    for (let i = 0; i < 9; i += 1) for (let j = 0; j < 4; j += 1) {
      const X = bx((i + 0.5) / 9), Y = by(0.75 - j * 0.5), R = 5;
      ctx.beginPath(); ctx.arc(X, Y, R, 0, 6.28); ctx.stroke();
      if (st.B > 0) { ctx.beginPath(); ctx.arc(X, Y, 1.5, 0, 6.28); ctx.fill(); }
      else { ctx.beginPath(); ctx.moveTo(X - 3.4, Y - 3.4); ctx.lineTo(X + 3.4, Y + 3.4); ctx.moveTo(X + 3.4, Y - 3.4); ctx.lineTo(X - 3.4, Y + 3.4); ctx.stroke(); }
    }
  }

  // edge charge: bold bands and rows of + / - signs that intensify as charge piles up.
  if (hasB) {
    const drawEdge = (yTop, charge) => {
      ctx.fillStyle = charge > 0 ? `rgba(255,93,93,${(0.55 * edgeInt).toFixed(3)})` : `rgba(91,140,255,${(0.55 * edgeInt).toFixed(3)})`;
      ctx.fillRect(BAR.x, yTop, BAR.w, band);
      ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = charge > 0 ? col.pos : col.neg;
      for (let i = 0; i < 10; i += 1) ctx.fillText(charge > 0 ? '+' : '−', bx((i + 0.5) / 10), yTop + band / 2 + 1);
    };
    drawEdge(BAR.y, topCharge); drawEdge(BAR.y + BAR.h - band, -topCharge);
  }

  // background carriers drifting along the bar.
  for (const k of carriers) { ctx.fillStyle = c.color; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(bx(k.x), by(k.y), 2.4, 0, 6.28); ctx.fill(); }
  ctx.globalAlpha = 1;

  // the would-be deflection: a carrier driven by the magnetic force alone curves into
  // the pile-up edge (dashed); the Hall field straightens it (solid centre line).
  if (hasB) {
    ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]); ctx.beginPath();
    for (let s = 0; s <= 24; s += 1) { const tt = s / 24; const nxp = 0.1 + tt * 0.5; const nyp = accum * tt * tt * 0.78; const X = bx(nxp), Y = by(nyp); s ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('without Hall field', bx(0.12), by(accum * 0.55));
  }

  // representative carrier on the centre line with the two balancing forces.
  const rcx = bx(0.46), rcy = by(0);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(bx(0.1), by(0)); ctx.lineTo(bx(0.92), by(0)); ctx.stroke(); ctx.setLineDash([]);
  const Lf = hasB ? Math.min(BAR.h * 0.34, 24 + 34 * Math.min(1, Math.abs(st.B) / 0.6)) : 0;
  const upScreen = accum > 0 ? -1 : 1;                    // screen direction toward the pile-up edge
  // drift velocity arrow (holes drift with the current +x, electrons against it).
  const vdir = c.sign > 0 ? 1 : -1;
  arrow2(rcx, rcy, rcx + vdir * 34, rcy, col.cur, 2.2);
  ctx.fillStyle = col.cur; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = vdir > 0 ? 'left' : 'right'; ctx.textBaseline = 'middle'; ctx.fillText('v_d', rcx + vdir * 40, rcy);
  if (hasB) {
    // magnetic force qv x B toward the pile-up edge (violet), and the Hall force
    // qE_H opposing it (yellow); distinct from the red/blue charge colours.
    const FB = '#b487ff';
    arrow2(rcx, rcy, rcx, rcy + upScreen * Lf, FB, 2.4);
    ctx.fillStyle = FB; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = upScreen < 0 ? 'bottom' : 'top'; ctx.fillText('F = qv x B', rcx, rcy + upScreen * (Lf + 6));
    arrow2(rcx, rcy, rcx, rcy - upScreen * Lf, col.field, 2.4);
    ctx.fillStyle = col.field; ctx.textBaseline = upScreen < 0 ? 'top' : 'bottom'; ctx.fillText('q E_Hall', rcx, rcy - upScreen * (Lf + 6));
  }
  ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(rcx, rcy, 5.5, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();

  // Hall field arrow across the bar near the right, from + edge to - edge.
  if (hasB && edgeInt > 0.04) {
    const fx = bx(0.82); const yPlus = topCharge > 0 ? BAR.y + band + 6 : BAR.y + BAR.h - band - 6; const yMinus = topCharge > 0 ? BAR.y + BAR.h - band - 6 : BAR.y + band + 6;
    arrow2(fx, yPlus, fx, yMinus, col.field, 2);
    ctx.save(); ctx.translate(fx + 12, (BAR.y + BAR.y + BAR.h) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillStyle = col.field; ctx.fillText('E_Hall', 0, 0); ctx.restore();
  }

  // bar outline.
  ctx.strokeStyle = col.barEdge; ctx.lineWidth = 1.5; ctx.strokeRect(BAR.x, BAR.y, BAR.w, BAR.h);

  // field note above the bar.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillStyle = col.field; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(`B = ${st.B >= 0 ? '+' : ''}${st.B.toFixed(2)} T (${st.B >= 0 ? 'out of' : 'into'} page)`, BAR.x, BAR.y - 6);

  // current arrow below the bar (conventional current direction).
  const ay = BAR.y + BAR.h + 26;
  arrow2(BAR.x, ay, BAR.x + BAR.w, ay, col.cur, 2);
  ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.fillStyle = col.cur; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(`current I = ${st.I.toFixed(1)} mA`, BAR.x + 4, ay - 6);

  // voltmeter to the right, wired to the two edges (+ lead on the positive edge).
  const vmW = BAR.voltW, vmH = 56, vmX = BAR.x + BAR.w + BAR.gap, vmY = BAR.y + BAR.h / 2 - vmH / 2;
  const topPos = topCharge > 0;
  ctx.strokeStyle = col.muted; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(BAR.x + BAR.w, BAR.y + 3); ctx.lineTo(vmX + 16, BAR.y + 3); ctx.lineTo(vmX + 16, vmY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(BAR.x + BAR.w, BAR.y + BAR.h - 3); ctx.lineTo(vmX + vmW - 16, BAR.y + BAR.h - 3); ctx.lineTo(vmX + vmW - 16, vmY + vmH); ctx.stroke();
  if (hasB) { ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = topPos ? col.pos : col.neg; ctx.fillText(topPos ? '+' : '−', vmX + 16, vmY - 8); ctx.fillStyle = topPos ? col.neg : col.pos; ctx.fillText(topPos ? '−' : '+', vmX + vmW - 16, vmY + vmH + 8); }
  ctx.fillStyle = '#0c1018'; ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.fillRect(vmX, vmY, vmW, vmH); ctx.strokeRect(vmX + 0.5, vmY + 0.5, vmW - 1, vmH - 1);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.fillText('voltmeter V_H', vmX + vmW / 2, vmY + 14);
  ctx.font = fontString(canvas, 'heading', 'mono', 700); ctx.fillStyle = VH > 0 ? col.pos : VH < 0 ? col.neg : col.muted;
  ctx.fillText(`${VH >= 0 ? '+' : ''}${VH.toFixed(2)} mV`, vmX + vmW / 2, vmY + 36);

  // readout strip below.
  const vd = driftSpeed(p.I, p.n, p.w, p.t), RH = hallCoefficient(p.n, p.sign);
  const items = [[c.label.split(' ')[0], c.color], [`R_H = ${RH >= 0 ? '+' : ''}${RH.toExponential(1)}`, col.field], [`v_d = ${vd.toFixed(2)} m/s`, col.cur]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  const ry = BAR.y + BAR.h + 50;
  items.forEach(([t, cc], i) => { ctx.fillStyle = cc; ctx.fillText(t, r.x + r.w * (i + 0.5) / 3, ry); });
}

function drawDiag(col, r) {
  panel(col, r, 'V_H vs B: the slope sign distinguishes the carriers (1/nq)');
  const inner = { x: r.x + 52, y: r.y + 28, w: r.w - 52 - 18, h: r.h - 28 - 34 };
  const p = si(); const Bmax = 1;
  const VHof = (B, sign) => hallVoltage(p.I, B, p.n, p.t, sign) * 1e3;
  const vmax = Math.max(Math.abs(VHof(Bmax, 1)), 1e-6) * 1.15;
  const xOf = (B) => inner.x + (B + Bmax) / (2 * Bmax) * inner.w;
  const yOf = (v) => inner.y + inner.h * (0.5 - 0.5 * v / vmax);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // axes.
  ctx.strokeStyle = col.grid; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.moveTo(xOf(0), inner.y); ctx.lineTo(xOf(0), inner.y + inner.h); ctx.stroke();
  // both carrier lines.
  for (const key of ['hole', 'electron']) {
    const sign = CARRIERS[key].sign, active = key === st.carrier;
    ctx.strokeStyle = active ? CARRIERS[key].color : 'rgba(255,255,255,0.18)'; ctx.lineWidth = active ? 2.4 : 1.4;
    if (!active) ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(xOf(-Bmax), yOf(VHof(-Bmax, sign))); ctx.lineTo(xOf(Bmax), yOf(VHof(Bmax, sign))); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = fontString(canvas, 'tick', 'mono', active ? 700 : 400); ctx.fillStyle = ctx.strokeStyle; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(CARRIERS[key].label.split(' ')[0], xOf(Bmax) - 56, yOf(VHof(Bmax * 0.92, sign)));
  }
  // operating point.
  const X = xOf(st.B), Y = yOf(VHof(st.B, p.sign));
  ctx.fillStyle = carrier().color; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, 5, 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = col.grid; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(X, yOf(0)); ctx.lineTo(X, Y); ctx.stroke(); ctx.setLineDash([]);
  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('B (T)', inner.x + inner.w / 2, inner.y + inner.h + 8);
  ctx.save(); ctx.translate(r.x + 16, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('V_H (mV)', 0, 0); ctx.restore();
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(`+${vmax.toFixed(2)}`, inner.x - 4, inner.y + 6); ctx.fillText(`${(-vmax).toFixed(2)}`, inner.x - 4, inner.y + inner.h - 6);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('-1', xOf(-1), yOf(0) + 4); ctx.fillText('+1', xOf(1), yOf(0) + 4);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

function advance(dt) {
  const target = pushTarget();
  restore += (target - restore) * RELAX * dt;
  const vy = target - restore;
  const vdx = carrier().sign * vdNorm();
  // The bulk density stays uniform; only a thin surface charge accumulates (the
  // edge bands). The transverse velocity vy is the transient charging current: it
  // sweeps carriers toward the edge until the Hall field cancels it (vy -> 0). Wrap
  // in y so the bulk never empties.
  for (const k of carriers) {
    k.x += vdx * k.j * dt;
    if (k.x > 1) k.x -= 1; else if (k.x < 0) k.x += 1;
    k.y += vy * dt;
    if (k.y > 0.9) k.y -= 1.8; else if (k.y < -0.9) k.y += 1.8;
  }
}

let running = true, last = 0;
function tick(ts) {
  if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05;
  if (running) advance(dt);
  render();
  requestAnimationFrame(tick);
}

function boot() {
  if (params.get('carrier') && CARRIERS[params.get('carrier')]) st.carrier = params.get('carrier');
  if (params.get('B') !== null) st.B = Math.max(-1, Math.min(1, +params.get('B')));
  seedCarriers(); syncVals(); relayout(); render();
  if (DETERMINISTIC) {
    for (let i = 0; i < 260; i += 1) advance(0.03); // settle the transient for a clean frame
    render();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
  } else {
    requestAnimationFrame(tick);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const p = si();
  return { fields: [
    { key: 'carrier', label: 'carrier', value: carrier().label, format: 'text' },
    { key: 'B', label: 'field B', value: st.B, format: 'float', unit: 'T' },
    { key: 'I', label: 'current I', value: st.I, format: 'float', unit: 'mA' },
    { key: 'n', label: 'density n', value: st.n, format: 'float', unit: 'e21 /m3' },
    { key: 'VH', label: 'Hall voltage V_H', value: VH_mV(), format: 'float', unit: 'mV' },
  ] };
};
window.playground.getInvariants = function () {
  const p = si();
  const vh = hallVoltage(p.I, p.B, p.n, p.t, p.sign);
  const cons = Math.abs(vh) - Math.abs(driftSpeed(p.I, p.n, p.w, p.t) * p.B * p.w);
  const signOk = st.B === 0 || Math.sign(vh) === Math.sign(p.sign * p.B);
  return [
    { key: 'sign', label: 'sign(V_H) tracks carrier and field', value: vh >= 0 ? '+' : '−', status: signOk ? 'pass' : 'drift' },
    { key: 'cons', label: 'V_H = E_H x width', value: cons.toExponential(1), status: Math.abs(cons) < 1e-12 ? 'pass' : 'drift' },
  ];
};
