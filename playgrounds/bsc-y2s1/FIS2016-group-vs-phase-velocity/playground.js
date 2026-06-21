import { omega, phaseVelocity, groupVelocity } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Group vs phase velocity in a dispersive medium, Canvas2D only. This is a real
// wave packet, a Gaussian band of wavenumbers summed up, not a two-tone beat:
//   psi(x,t) = sum_k A(k) cos(k x - omega(k) t).
// The carrier crests travel at the phase velocity v_p = omega/k0; the envelope
// travels at the group velocity v_g = domega/dk. When they differ the crests
// are born at one edge of the packet and die at the other as it moves, and
// because omega(k) is curved the packet SPREADS over time (group-velocity
// dispersion), which a pure beat can never show. Scene: the packet with both
// trackers. Diagnostic: the dispersion curve omega(k), with v_p as the slope of
// the chord from the origin and v_g as the slope of the tangent at k0.
//
// Reference: Crawford, Waves (BPC vol 3), Ch. 6 (`crawford-waves`); Pain, The
// Physics of Vibrations and Waves, Ch. 5 (`pain-vibrations`).

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rVp = document.getElementById('readout-vp'), rVg = document.getElementById('readout-vg');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const sD = document.getElementById('slider-dk'), vD = document.getElementById('value-dk');
const selD = document.getElementById('select-d');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const XSPAN = 30, TLOOP = 12, SPD = 1.4;
const st = { k0: 4, sigK: 0.5, disp: 'water-deep', t: 0 };
let running = !(DETERMINISTIC || prefersReducedMotion());

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
sK.addEventListener('input', () => { st.k0 = parseFloat(sK.value); vK.textContent = st.k0.toFixed(2); buildPacket(); if (!running) render(); });
sD.addEventListener('input', () => { st.sigK = parseFloat(sD.value); vD.textContent = st.sigK.toFixed(2); buildPacket(); if (!running) render(); });
selD.addEventListener('change', () => { st.disp = selD.value; buildPacket(); if (!running) render(); });
btnR.addEventListener('click', () => { st.t = 0; st.k0 = 4; st.sigK = 0.5; st.disp = 'water-deep'; sK.value = '4'; sD.value = '0.5'; selD.value = 'water-deep'; vK.textContent = '4.00'; vD.textContent = '0.50'; buildPacket(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.75 },
    { name: 'diagnostic', weight: 1.25 },
  ]);
}
function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    carrier: '#ffd166', env: '#5bc0eb', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

// Gaussian band of k around k0, rebuilt on parameter change.
let kArr = [], aArr = [], wArr = [], sumA = 1, xStart = 0;
function buildPacket() {
  kArr = []; aArr = []; wArr = []; sumA = 0;
  const kmin = Math.max(0.2, st.k0 - 3.2 * st.sigK), kmax = st.k0 + 3.2 * st.sigK;
  const N = 41;
  for (let i = 0; i < N; i += 1) {
    const k = kmin + (kmax - kmin) * i / (N - 1);
    const a = Math.exp(-((k - st.k0) ** 2) / (2 * st.sigK * st.sigK));
    kArr.push(k); aArr.push(a); wArr.push(omega(st.disp, k)); sumA += a;
  }
  const vg = groupVelocity(st.disp, st.k0);
  xStart = vg >= 0 ? 0.22 * XSPAN : 0.78 * XSPAN;
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 10, r.y + 7); }
}

// psi (real) and envelope (analytic-signal magnitude) at physical x, time t.
function field(xp, t) {
  let re = 0, im = 0;
  for (let i = 0; i < kArr.length; i += 1) {
    const ph = kArr[i] * (xp - xStart) - wArr[i] * t;
    re += aArr[i] * Math.cos(ph); im += aArr[i] * Math.sin(ph);
  }
  return { re, env: Math.hypot(re, im) };
}

function drawScene(col, r) {
  panel(col, r, 'A wave packet travelling in a dispersive medium');
  const padL = 16, padR = 16, padT = 28, padB = 34;
  const ax = { x: r.x + padL, y: r.y + padT, w: r.w - padL - padR, h: r.h - padT - padB };
  const cy = ax.y + ax.h * 0.5;
  const X = (xp) => ax.x + xp / XSPAN * ax.w;
  const yS = 0.44 * ax.h / sumA;
  const t = st.t;

  ctx.save(); clipTo(ctx, ax);
  // zero axis.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax.x, cy); ctx.lineTo(ax.x + ax.w, cy); ctx.stroke();

  const NS = 640;
  // envelope (filled, cyan) computed once.
  const env = new Float64Array(NS + 1), car = new Float64Array(NS + 1);
  for (let i = 0; i <= NS; i += 1) { const xp = XSPAN * i / NS; const f = field(xp, t); env[i] = f.env; car[i] = f.re; }
  ctx.fillStyle = 'rgba(91,192,235,0.12)';
  ctx.beginPath(); ctx.moveTo(ax.x, cy);
  for (let i = 0; i <= NS; i += 1) ctx.lineTo(X(XSPAN * i / NS), cy - env[i] * yS);
  for (let i = NS; i >= 0; i -= 1) ctx.lineTo(X(XSPAN * i / NS), cy + env[i] * yS);
  ctx.closePath(); ctx.fill();
  // envelope outline.
  ctx.strokeStyle = col.env; ctx.lineWidth = 1.6;
  ctx.beginPath(); for (let i = 0; i <= NS; i += 1) { const X0 = X(XSPAN * i / NS), Y = cy - env[i] * yS; i ? ctx.lineTo(X0, Y) : ctx.moveTo(X0, Y); } ctx.stroke();
  ctx.beginPath(); for (let i = 0; i <= NS; i += 1) { const X0 = X(XSPAN * i / NS), Y = cy + env[i] * yS; i ? ctx.lineTo(X0, Y) : ctx.moveTo(X0, Y); } ctx.stroke();
  // carrier (gold).
  ctx.strokeStyle = col.carrier; ctx.lineWidth = 1.6;
  ctx.beginPath(); for (let i = 0; i <= NS; i += 1) { const X0 = X(XSPAN * i / NS), Y = cy - car[i] * yS; i ? ctx.lineTo(X0, Y) : ctx.moveTo(X0, Y); } ctx.stroke();

  // trackers: phase rides a crest at v_p; group rides the envelope at v_g.
  const vp = phaseVelocity(st.disp, st.k0), vg = groupVelocity(st.disp, st.k0);
  const wrap = (xp) => ((xp % XSPAN) + XSPAN) % XSPAN;
  const xpP = wrap(xStart + vp * t), xpG = wrap(xStart + vg * t);
  ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(255,209,102,0.7)'; ctx.beginPath(); ctx.moveTo(X(xpP), ax.y); ctx.lineTo(X(xpP), ax.y + ax.h); ctx.stroke();
  ctx.strokeStyle = 'rgba(91,192,235,0.7)'; ctx.beginPath(); ctx.moveTo(X(xpG), ax.y); ctx.lineTo(X(xpG), ax.y + ax.h); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // tracker labels (outside clip).
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  ctx.fillStyle = col.carrier; ctx.fillText('v_p (crest)', clamp(X(xpP), ax.x + 30, ax.x + ax.w - 30), ax.y + 2);
  ctx.fillStyle = col.env; ctx.textBaseline = 'bottom'; ctx.fillText('v_g (packet)', clamp(X(xpG), ax.x + 30, ax.x + ax.w - 30), ax.y + ax.h - 2);

  // readout strip.
  const wpp = omega(st.disp, st.k0 + 1e-2) - 2 * omega(st.disp, st.k0) + omega(st.disp, st.k0 - 1e-2);
  const disperses = Math.abs(wpp / 1e-4) > 1e-3;
  const items = [
    [`v_p ${vp.toFixed(2)}`, col.carrier],
    [`v_g ${vg.toFixed(2)}`, col.env],
    [`v_g/v_p ${(vg / vp).toFixed(2)}`, col.fg],
    [disperses ? 'packet spreads' : 'no spreading', disperses ? col.accent : col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textBaseline = 'middle';
  let need = 0; for (const [t2] of items) need += ctx.measureText(t2).width + 18;
  if (need <= r.w) { ctx.textAlign = 'center'; items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); }); }
  else { ctx.textAlign = 'center'; items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * ((i % 2) + 0.5) / 2, r.y + r.h - (i < 2 ? 24 : 9)); }); }
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Dispersion ω(k): v_p = chord slope, v_g = tangent slope');
  const padL = 48, padR = 16, padT = 28, padB = 36;
  const ax = { x: r.x + padL, y: r.y + padT, w: r.w - padL - padR, h: r.h - padT - padB };
  const kmin = 0, kmax = 10.5;
  // sample omega over k for autoscale and curve.
  let wmax = 1e-9;
  const samp = [];
  for (let i = 0; i <= 200; i += 1) { const k = 0.25 + (kmax - 0.25) * i / 200; const w = omega(st.disp, k); samp.push([k, w]); if (Number.isFinite(w)) wmax = Math.max(wmax, w); }
  const w0 = omega(st.disp, st.k0); wmax = Math.max(wmax, w0) * 1.08;
  const X = (k) => ax.x + (k - kmin) / (kmax - kmin) * ax.w;
  const Y = (w) => ax.y + ax.h - clamp(w / wmax, 0, 1) * ax.h;

  // grid + frame.
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(ax.x, ax.y, ax.w, ax.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let k = 0; k <= 10; k += 2) { ctx.strokeStyle = col.grid; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(X(k), ax.y); ctx.lineTo(X(k), ax.y + ax.h); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(String(k), X(k), ax.y + ax.h + 5); }

  const vp = phaseVelocity(st.disp, st.k0), vg = groupVelocity(st.disp, st.k0);
  // chord from origin (slope v_p).
  ctx.strokeStyle = col.carrier; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(st.k0), Y(w0)); ctx.stroke(); ctx.setLineDash([]);
  // tangent at k0 (slope v_g): w = w0 + vg (k - k0).
  ctx.strokeStyle = col.env; ctx.lineWidth = 1.6;
  const tkLo = Math.max(kmin, st.k0 - 3), tkHi = Math.min(kmax, st.k0 + 3);
  ctx.beginPath(); ctx.moveTo(X(tkLo), Y(w0 + vg * (tkLo - st.k0))); ctx.lineTo(X(tkHi), Y(w0 + vg * (tkHi - st.k0))); ctx.stroke();
  // dispersion curve.
  ctx.strokeStyle = col.fg; ctx.lineWidth = 2.4; ctx.beginPath();
  let started = false;
  for (const [k, w] of samp) { if (!Number.isFinite(w)) continue; const X0 = X(k), Y0 = Y(w); if (!started) { ctx.moveTo(X0, Y0); started = true; } else ctx.lineTo(X0, Y0); }
  ctx.stroke();
  // marker at (k0, w0).
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(st.k0), Y(w0), 4.5, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = col.accent; ctx.lineWidth = 1.4; ctx.stroke();

  // axis labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('wavenumber k', ax.x + ax.w / 2, ax.y + ax.h + 18);
  ctx.save(); ctx.translate(ax.x - 32, ax.y + ax.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('frequency ω', 0, 0); ctx.restore();
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = col.carrier; ctx.fillText('chord = v_p', ax.x + 8, ax.y + 12);
  ctx.fillStyle = col.env; ctx.fillText('tangent = v_g', ax.x + 8, ax.y + 28);
  rVp.textContent = vp.toFixed(3); rVg.textContent = vg.toFixed(3);
}

function render() {
  if (!REG) relayout();
  if (!kArr.length) buildPacket();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) { st.t += dt * SPD; if (st.t > TLOOP) st.t = 0; }
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (['light', 'water-deep', 'shrod', 'plasma', 'anomalous'].includes(params.get('disp'))) { st.disp = params.get('disp'); selD.value = st.disp; }
  if (Number.isFinite(parseFloat(params.get('k0')))) { st.k0 = parseFloat(params.get('k0')); sK.value = String(st.k0); vK.textContent = st.k0.toFixed(2); }
  relayout(); buildPacket();
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * TLOOP : 0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const vp = phaseVelocity(st.disp, st.k0), vg = groupVelocity(st.disp, st.k0);
  return {
    fields: [
      { key: 'k0', label: 'carrier wavenumber k0', value: st.k0, format: 'float' },
      { key: 'sigK', label: 'band width σ_k', value: st.sigK, format: 'float' },
      { key: 'disp', label: 'dispersion relation', value: st.disp, format: 'text' },
      { key: 'vp', label: 'phase velocity v_p', value: vp, format: 'float' },
      { key: 'vg', label: 'group velocity v_g', value: vg, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const vp = phaseVelocity(st.disp, st.k0), vg = groupVelocity(st.disp, st.k0);
  const ratio = vg / vp;
  let expected = 1;
  switch (st.disp) {
    case 'light': expected = 1; break;
    case 'water-deep': expected = 0.5; break;
    case 'shrod': expected = 2; break;
    case 'plasma': expected = (st.k0 * st.k0) / (4 + st.k0 * st.k0); break;
    case 'anomalous': expected = -1 / (1 + 4 / (3 * st.k0)); break;
  }
  const err = Math.abs(ratio - expected) / Math.max(1e-6, Math.abs(expected));
  return [{
    key: 'ratio',
    label: 'v_g/v_p matches dω/dk ÷ (ω/k)',
    value: err.toExponential(2),
    status: err < 1e-2 ? 'pass' : (err < 1e-1 ? 'pending' : 'drift'),
  }];
};
