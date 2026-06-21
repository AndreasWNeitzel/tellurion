// playground.js
// RC discharge: a capacitor charged to V0 drains through a resistor.
//
// Vertical 4:5 composition, top to bottom:
//   1. CIRCUIT: an animated loop. Charge glows on the capacitor and fades as
//      it drains; current dots circulate fast then stall as the current dies;
//      the resistor glows with the power it dissipates. Big tau / V / I readout.
//   2. VOLTAGE: V(t) = V0 e^(-t/tau) against tau markers, with the 37% (1/e)
//      level called out and a live cursor sweeping the decay.
//   3. ENERGY: the stored energy (decaying as e^(-2t/tau)) and the cumulative
//      heat dumped in the resistor, which add to the initial store. The
//      quantitative diagnostic: energy is conserved, just relocated to heat.

import { vC, iR, energyC, energyDissipated, powerR } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { stack, setupCanvas } from '../../../shared/js/render/vertical-layout.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderV0 = document.getElementById('slider-v0');
const sliderR = document.getElementById('slider-R');
const sliderC = document.getElementById('slider-C');
const valueV0 = document.getElementById('value-v0');
const valueR = document.getElementById('value-R');
const valueC = document.getElementById('value-C');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

let V0 = parseFloat(sliderV0.value);
let R = parseFloat(sliderR.value) * 1e3;  // kOhm -> Ohm
let C = parseFloat(sliderC.value) * 1e-6; // uF -> F

let t = 0;
let running = !prefersReducedMotion();
let lastTime = (typeof performance !== 'undefined' ? performance.now() : 0);

const SWEEP_SECONDS = 13;  // wall-clock time to sweep one discharge (slower so the charge flow reads)
const T_SPAN = 6;          // plot horizon in units of tau

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;

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
    orange: '#f0a35e',  // voltage / stored energy
    blue: '#5bb8e8',    // current / dissipated energy
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.10)',
  };
}

// Current dots circulate the loop; their parameter lives in [0,1) so they
// survive a resize. Advanced in tick() at a rate set by the live current.
const NDOTS = 22;
const dots = Array.from({ length: NDOTS }, (_, i) => i / NDOTS);

function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'circuit', weight: 1.8 },
    { name: 'volt', weight: 2.2 },
    { name: 'energy', weight: 1.1 },
  ]);
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
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

// Point at perimeter parameter s in [0,1) of a rectangle, clockwise from the
// top-left corner.
function perim(x0, y0, x1, y1, s) {
  const W = x1 - x0, H = y1 - y0, P = 2 * (W + H);
  let d = ((s % 1) + 1) % 1 * P;
  if (d < W) return [x0 + d, y0];
  d -= W;
  if (d < H) return [x1, y0 + d];
  d -= H;
  if (d < W) return [x1 - d, y1];
  d -= W;
  return [x0, y1 - d];
}

function drawCircuit(col, reg) {
  panel(col, reg, null);
  const tau = R * C;
  const V = vC(t, V0, tau);
  const I = iR(t, V0, R, tau);
  const frac = V0 > 0 ? clamp(V / V0, 0, 1) : 0;        // charge remaining
  const I0 = V0 / R;
  const iNorm = I0 > 0 ? clamp(I / I0, 0, 1) : 0;        // current fraction
  const pNorm = iNorm * iNorm;                           // power fraction

  // Loop rectangle, leaving room for the readout strip at the bottom.
  const m = 34;
  const x0 = reg.x + m, x1 = reg.x + reg.w - m;
  const y0 = reg.y + 30, y1 = reg.y + reg.h - 86;
  const midY = (y0 + y1) / 2;

  // Wire loop.
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

  // Circulating current dots (blue): the moving charge. Kept clearly visible
  // throughout (alpha floor) and given a soft glow so the flow reads even as
  // the current dies away, rather than vanishing after the first instant.
  for (const s of dots) {
    const [px, py] = perim(x0, y0, x1, y1, s);
    const a = 0.4 + 0.55 * iNorm;
    const rad = 3.4 + 1.8 * iNorm;
    const gd = ctx.createRadialGradient(px, py, 0, px, py, rad * 2.4);
    gd.addColorStop(0, `rgba(120,200,245,${a})`);
    gd.addColorStop(1, 'rgba(120,200,245,0)');
    ctx.fillStyle = gd;
    ctx.beginPath(); ctx.arc(px, py, rad * 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(150,210,250,${Math.min(1, a + 0.15)})`;
    ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill();
  }

  // Capacitor on the left edge: two plates with a charge glow that fades.
  const capY = midY;
  const plateH = Math.min(46, (y1 - y0) * 0.34);
  const gap = 10;
  ctx.strokeStyle = col.orange;
  ctx.lineWidth = 4;
  for (const dx of [-gap, gap]) {
    ctx.beginPath();
    ctx.moveTo(x0 + dx, capY - plateH / 2);
    ctx.lineTo(x0 + dx, capY + plateH / 2);
    ctx.stroke();
  }
  // Charge glow between the plates, opacity tracks remaining charge.
  const grd = ctx.createRadialGradient(x0, capY, 2, x0, capY, plateH);
  grd.addColorStop(0, `rgba(240,163,94,${0.15 + 0.65 * frac})`);
  grd.addColorStop(1, 'rgba(240,163,94,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x0, capY, plateH, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillStyle = col.orange;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', x0 - 18, capY);

  // Resistor on the right edge: zigzag with a heat glow from dissipated power.
  const resH = Math.min(58, (y1 - y0) * 0.4);
  const rTop = midY - resH / 2, rBot = midY + resH / 2;
  // Heat halo.
  const hg = ctx.createRadialGradient(x1, midY, 2, x1, midY, resH * 1.1);
  hg.addColorStop(0, `rgba(255,90,40,${0.55 * pNorm})`);
  hg.addColorStop(1, 'rgba(255,90,40,0)');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(x1, midY, resH * 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const zig = 7;
  ctx.moveTo(x1, rTop);
  for (let i = 0; i < 6; i += 1) {
    const yy = rTop + ((i + 1) / 7) * (rBot - rTop);
    ctx.lineTo(x1 + (i % 2 === 0 ? zig : -zig), yy);
  }
  ctx.lineTo(x1, rBot);
  ctx.stroke();
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillStyle = col.fg;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', x1 + 14, midY - 8);
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255,140,90,0.9)';
  ctx.fillText('P=I²R', x1 + 14, midY + 8);

  // Parameters, top-left.
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = col.muted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`V₀=${V0.toFixed(1)} V   R=${(R / 1e3).toFixed(1)} kΩ   C=${(C / 1e-6).toFixed(1)} µF`, reg.x + 8, reg.y + 7);

  // Readout strip: tau prominent, then V / I / P (instantaneous power dumped in
  // R, which is what makes it glow and is maximal at t = 0).
  const P = powerR(t, V0, R, tau);
  const cx = reg.x + reg.w / 2;
  ctx.font = fontString(canvas, 'title', 'mono', 700);
  ctx.fillStyle = col.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`τ = RC = ${tau.toFixed(2)} s`, cx, reg.y + reg.h - 44);
  ctx.font = fontString(canvas, 'heading', 'mono', 600);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
  ctx.fillStyle = col.orange; ctx.fillText(`V ${V.toFixed(2)} V`, reg.x + reg.w * 0.22, reg.y + reg.h - 16);
  ctx.fillStyle = col.blue; ctx.fillText(`I ${(I * 1e3).toFixed(2)} mA`, reg.x + reg.w * 0.5, reg.y + reg.h - 16);
  ctx.fillStyle = '#ff8c5a'; ctx.fillText(`P ${(P * 1e3).toFixed(1)} mW`, reg.x + reg.w * 0.78, reg.y + reg.h - 16);
}

function drawVoltage(col, reg) {
  panel(col, reg, null);
  const tau = R * C;
  const padL = 42, padR = 14, padT = 30, padB = 30;
  const x0 = reg.x + padL, x1 = reg.x + reg.w - padR, pw = x1 - x0;
  const y0 = reg.y + padT, y1 = reg.y + reg.h - padB, ph = y1 - y0;
  const tMax = T_SPAN * tau;
  const fx = (tt) => x0 + pw * (tt / tMax);
  const fy = (frac) => y1 - ph * frac;  // frac of V0 in [0,1]

  // tau gridlines.
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let k = 0; k <= T_SPAN; k += 1) {
    const x = fx(k * tau);
    ctx.strokeStyle = k === 1 ? 'rgba(255,209,102,0.35)' : col.grid;
    ctx.lineWidth = k === 1 ? 1.2 : 0.6;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
    ctx.fillStyle = col.muted;
    ctx.fillText(k === 0 ? '0' : `${k}τ`, x, y1 + 4);
  }
  // 37% (1/e) reference line.
  const eInv = Math.exp(-1);
  ctx.strokeStyle = 'rgba(255,209,102,0.45)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, fy(eInv)); ctx.lineTo(x1, fy(eInv)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,209,102,0.9)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('37% at t = τ', x0 + 4, fy(eInv) - 2);

  // y axis ticks (V).
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = col.muted;
  for (let f = 0; f <= 1.0001; f += 0.25) {
    const y = fy(f);
    ctx.strokeStyle = col.grid;
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.fillText((f * V0).toFixed(0), x0 - 4, y);
  }

  // V(t) curve, filled under for weight.
  ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) {
    const tt = tMax * i / 240;
    const px = fx(tt), py = fy(vC(tt, V0, tau) / V0);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.closePath();
  ctx.fillStyle = 'rgba(240,163,94,0.12)';
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) {
    const tt = tMax * i / 240;
    const px = fx(tt), py = fy(vC(tt, V0, tau) / V0);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = col.orange;
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Live cursor + marker.
  const tc = clamp(t, 0, tMax);
  const xc = fx(tc), yc = fy(vC(tc, V0, tau) / V0);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xc, y0); ctx.lineTo(xc, y1); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = col.orange;
  ctx.beginPath(); ctx.arc(xc, yc, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = col.accent; ctx.lineWidth = 1.6; ctx.stroke();

  // Title.
  ctx.font = fontString(canvas, 'heading', 'sans', 600);
  ctx.fillStyle = col.orange;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('V(t) = V₀ e^(−t/τ)', reg.x + 8, reg.y + 7);
}

// Power dissipated in R, P(t) = I^2 R, which peaks at t = 0 and decays: the
// resistor is hottest at the start and cools as the current dies (matching the
// scene glow). The area under the curve is energy: shaded left of the cursor is
// heat already delivered to R, shaded right is the energy still stored in C, and
// the two always sum to U0. This makes the "resistor cools while total heat
// accumulates" story a single picture instead of a contradiction.
function drawPower(col, reg) {
  panel(col, reg, 'power into R = I²R  (area = energy)');
  const tau = R * C;
  const padL = 42, padR = 14, padT = 26, padB = 24;
  const x0 = reg.x + padL, x1 = reg.x + reg.w - padR, pw = x1 - x0;
  const y0 = reg.y + padT, y1 = reg.y + reg.h - padB, ph = y1 - y0;
  const tMax = T_SPAN * tau;
  const P0 = powerR(0, V0, R, tau) || 1;
  const fx = (tt) => x0 + pw * (tt / tMax);
  const fy = (frac) => y1 - ph * clamp(frac, 0, 1);
  const Pf = (tt) => powerR(tt, V0, R, tau) / P0;     // = e^(-2t/tau)
  const tc = clamp(t, 0, tMax);

  // axes.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(x0, fy(1)); ctx.lineTo(x1, fy(1)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, fy(0)); ctx.lineTo(x1, fy(0)); ctx.stroke();
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('P₀', x0 - 4, fy(1)); ctx.fillText('0', x0 - 4, fy(0));
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let k = 0; k <= T_SPAN; k += 1) ctx.fillText(k === 0 ? '0' : `${k}τ`, fx(k * tau), y1 + 4);

  // shaded areas: heat delivered (left of cursor) and energy still stored (right).
  const fillArea = (ta, tb, color) => {
    ctx.beginPath(); ctx.moveTo(fx(ta), fy(0));
    const N = 140;
    for (let i = 0; i <= N; i += 1) { const tt = ta + (tb - ta) * i / N; ctx.lineTo(fx(tt), fy(Pf(tt))); }
    ctx.lineTo(fx(tb), fy(0)); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  };
  fillArea(0, tc, 'rgba(91,184,232,0.32)');      // heat delivered to R
  fillArea(tc, tMax, 'rgba(240,163,94,0.22)');   // energy still in C

  // power curve.
  ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) { const tt = tMax * i / 240; const px = fx(tt), py = fy(Pf(tt)); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
  ctx.strokeStyle = '#ff7a4d'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();

  // cursor + marker at the current power (tracks the resistor glow).
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(fx(tc), y0); ctx.lineTo(fx(tc), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ff7a4d'; ctx.beginPath(); ctx.arc(fx(tc), fy(Pf(tc)), 4.5, 0, Math.PI * 2); ctx.fill();

  // labels.
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(91,184,232,0.95)'; ctx.textAlign = 'left'; ctx.fillText('heat delivered to R', x0 + 6, y0 + 2);
  ctx.fillStyle = 'rgba(240,163,94,0.95)'; ctx.textAlign = 'right'; ctx.fillText('energy still in C', x1 - 6, y0 + 2);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawCircuit(col, REG.circuit);
  drawVoltage(col, REG.volt);
  drawPower(col, REG.energy);
}

let holdUntil = 0;
function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  const tau = R * C;
  if (running) {
    if (holdUntil > 0) {
      if (now >= holdUntil) { holdUntil = 0; t = 0; }
    } else {
      t += dt * (T_SPAN * tau / SWEEP_SECONDS);
      // Advance current dots at a rate set by the live current.
      const iNorm = clamp(Math.exp(-t / tau), 0, 1);
      for (let i = 0; i < dots.length; i += 1) dots[i] = (dots[i] + dt * (0.18 + 0.5 * iNorm)) % 1;
      if (t > T_SPAN * tau) { t = T_SPAN * tau; holdUntil = now + 1100; }
    }
  }
  render();
  requestAnimationFrame(tick);
}

sliderV0.addEventListener('input', () => { V0 = parseFloat(sliderV0.value); valueV0.textContent = V0.toFixed(1); t = 0; render(); });
sliderR.addEventListener('input', () => { R = parseFloat(sliderR.value) * 1e3; valueR.textContent = parseFloat(sliderR.value).toFixed(1); t = 0; render(); });
sliderC.addEventListener('input', () => { C = parseFloat(sliderC.value) * 1e-6; valueC.textContent = parseFloat(sliderC.value).toFixed(1); t = 0; render(); });
btnReset.addEventListener('click', () => { t = 0; holdUntil = 0; render(); });
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

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
  valueV0.textContent = V0.toFixed(1);
  valueR.textContent = (R / 1e3).toFixed(1);
  valueC.textContent = (C / 1e-6).toFixed(1);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    t = frac * T_SPAN * (R * C);
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, V0, R, C, t };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const tau = R * C;
  const V = vC(t, V0, tau);
  const I = iR(t, V0, R, tau);
  const U0 = energyC(0, V0, C, tau) || 1;
  return {
    fields: [
      { key: 'tau', label: 'time constant tau (s)', value: tau, format: 'float' },
      { key: 'voltage', label: 'capacitor voltage V(t) (V)', value: V, format: 'float' },
      { key: 'current', label: 'current I(t) (mA)', value: I * 1e3, format: 'float' },
      { key: 'stored', label: 'energy stored / U0', value: energyC(t, V0, C, tau) / U0, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const tau = R * C;
  const h = tau * 1e-3;
  const dVdt = (vC(t + h, V0, tau) - vC(t - h, V0, tau)) / (2 * h);
  const expected = -vC(t, V0, tau) / tau;
  const drift = Math.abs(dVdt - expected) / Math.max(1e-12, Math.abs(expected));
  const U0 = energyC(0, V0, C, tau) || 1;
  const balance = Math.abs((energyC(t, V0, C, tau) + energyDissipated(t, V0, C, tau)) / U0 - 1);
  return [
    {
      key: 'rc-ode',
      label: 'V(t) satisfies dV/dt = -V / (RC)',
      value: drift.toExponential(2),
      status: drift < 1e-3 ? 'pass' : (drift < 1e-2 ? 'pending' : 'drift'),
    },
    {
      key: 'energy-balance',
      label: 'stored + dissipated = U0',
      value: balance.toExponential(2),
      status: balance < 1e-9 ? 'pass' : (balance < 1e-6 ? 'pending' : 'drift'),
    },
  ];
};
