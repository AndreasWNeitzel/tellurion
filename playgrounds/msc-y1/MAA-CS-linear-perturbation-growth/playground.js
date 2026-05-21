// Linear density-perturbation growth. Three live panels:
//   LEFT (top): a 1D density field with sinusoidal perturbations whose
//     amplitude scales with the growth factor D(a). As cosmic time
//     advances (a evolves from 1e-3 to 1) the bumps grow visibly.
//   LEFT (bottom): density colour-strip view of the same field over a
//     window of x positions, evolving in time.
//   RIGHT: the static linear-theory diagnostic plots
//     - Omega_m(a) and f(a) = Omega_m^0.55
//     - delta(a) / delta(today), with a moving current-a marker.
// Live cosmic-time animation; user controls Omega_m,0.
//
// Reference: Liddle, Modern Cosmology Ch. 9; Mo, van den Bosch and
// White, Galaxy Formation and Evolution, Ch. 4.

import { Omega_m_at, growthFactor, deltaGrowth } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rD = document.getElementById('readout-d');
const sO = document.getElementById('slider-O'), vO = document.getElementById('value-O');
const btnR = document.getElementById('btn-reset');
const btnP = document.getElementById('btn-pause');

const st = {
  Om: 0.315,
  loga: -3,    // current log10(a), evolves from -3 to 0
  running: !prefersReducedMotion(),
};
let last = performance.now();

sO.addEventListener('input', () => { st.Om = parseFloat(sO.value); vO.textContent = st.Om.toFixed(3); });
btnR.addEventListener('click', () => {
  st.loga = -3;
  st.running = true;
  btnP.textContent = 'Pause';
  btnP.setAttribute('aria-pressed', 'false');
});
btnP.addEventListener('click', () => {
  st.running = !st.running;
  btnP.textContent = st.running ? 'Pause' : 'Play';
  btnP.setAttribute('aria-pressed', String(!st.running));
});

// =========================================================================
// 1D density field: rho(x) = 1 + delta(x), with delta(x) = D(a) * sum_k
// A_k sin(2 pi k x + phi_k). The mode amplitudes A_k are pinned per-
// session to give a reproducible "primordial" power spectrum.
// =========================================================================
const NMODES = 12;
const NX = 240;
const modeAmps = new Float64Array(NMODES);
const modePhases = new Float64Array(NMODES);
let _seed = 0xC0FFEE;
function rnd() { _seed = (Math.imul(_seed, 1664525) + 1013904223) >>> 0; return _seed / 4294967296; }
function seedModes() {
  _seed = 0xC0FFEE;
  for (let k = 0; k < NMODES; k += 1) {
    modeAmps[k] = (0.04 + 0.16 * rnd()) * Math.pow(k + 1, -0.7);   // ~ scale-free
    modePhases[k] = rnd() * 2 * Math.PI;
  }
}
seedModes();

function densityField(a, Om) {
  // delta_norm = D(a) / D(a=1), so the amplitude at "today" is unit-
  // normalised; the bumps reach order-unity contrast around a = 1.
  const D = deltaGrowth(a, Om) / deltaGrowth(1, Om);
  const rho = new Float64Array(NX);
  for (let i = 0; i < NX; i += 1) {
    const x = i / NX;
    let d = 0;
    for (let k = 0; k < NMODES; k += 1) {
      d += modeAmps[k] * Math.sin(2 * Math.PI * (k + 1) * x + modePhases[k]);
    }
    rho[i] = 1 + D * d;
  }
  return rho;
}

// =========================================================================
// RENDER.
// =========================================================================
function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const padL = 60, padR = 30, padT = 24, padB = 50;
  const halfW = (W - padL - padR) / 2;
  const a = Math.pow(10, st.loga);

  // ===== LEFT TOP: 1D density profile (live) =====
  const leftX = padL, rightX = padL + halfW + 30;
  const rightW = W - padR - rightX;
  const ltY0 = padT, ltY1 = padT + (H - padT - padB) * 0.55;
  ctx.fillStyle = 'rgba(15, 22, 36, 0.85)';
  ctx.fillRect(leftX, ltY0, halfW, ltY1 - ltY0);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.30)';
  ctx.strokeRect(leftX + 0.5, ltY0 + 0.5, halfW - 1, ltY1 - ltY0 - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(`density field ρ(x) = 1 + δ(x)   at a = ${a.toExponential(2)}`, leftX + 8, ltY0 + 16);
  // Plot.
  const rho = densityField(a, st.Om);
  const px0 = leftX + 28, py0 = ltY0 + 28, pw = halfW - 40, ph = ltY1 - ltY0 - 50;
  // Y range: 0.4 to 1.6 (covers the linear regime).
  function yOf(v) { return py0 + ph - ((v - 0.4) / 1.2) * ph; }
  // Grid + reference line at rho = 1.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  for (let yv = 0.5; yv <= 1.6; yv += 0.25) {
    ctx.beginPath(); ctx.moveTo(px0, yOf(yv)); ctx.lineTo(px0 + pw, yOf(yv)); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.beginPath(); ctx.moveTo(px0, yOf(1)); ctx.lineTo(px0 + pw, yOf(1)); ctx.stroke();
  // Overdensities fill in red, underdensities in blue.
  ctx.beginPath();
  ctx.moveTo(px0, yOf(1));
  for (let i = 0; i < NX; i += 1) ctx.lineTo(px0 + (i / (NX - 1)) * pw, yOf(rho[i]));
  ctx.lineTo(px0 + pw, yOf(1));
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 130, 110, 0.30)';
  ctx.fill();
  // Density curve.
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < NX; i += 1) {
    const x = px0 + (i / (NX - 1)) * pw;
    if (i === 0) ctx.moveTo(x, yOf(rho[i])); else ctx.lineTo(x, yOf(rho[i]));
  }
  ctx.stroke();
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 240, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'right';
  for (const yv of [0.5, 0.75, 1.0, 1.25, 1.5]) ctx.fillText(yv.toFixed(2), px0 - 4, yOf(yv) + 3);
  ctx.textAlign = 'center';
  ctx.fillText('x  (comoving)', (px0 + px0 + pw) / 2, py0 + ph + 14);
  ctx.textAlign = 'left';

  // ===== LEFT BOTTOM: density colour strip (this is the live diagnostic) =====
  const lbY0 = ltY1 + 12, lbY1 = H - padB;
  ctx.fillStyle = 'rgba(15, 22, 36, 0.85)';
  ctx.fillRect(leftX, lbY0, halfW, lbY1 - lbY0);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.30)';
  ctx.strokeRect(leftX + 0.5, lbY0 + 0.5, halfW - 1, lbY1 - lbY0 - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('density map ρ(x)  (red over, blue under)', leftX + 8, lbY0 + 16);
  // One-row colored strip.
  const cpx0 = leftX + 28, cpy0 = lbY0 + 28, cpw = halfW - 40, cph = lbY1 - lbY0 - 40;
  for (let i = 0; i < NX; i += 1) {
    const t = Math.max(-0.5, Math.min(0.5, rho[i] - 1));      // ±0.5 contrast cap.
    let r, g, b;
    if (t >= 0) {
      const u = t / 0.5;
      r = Math.round(255 * u + 30 * (1 - u));
      g = Math.round(130 * u + 40 * (1 - u));
      b = Math.round(110 * u + 70 * (1 - u));
    } else {
      const u = -t / 0.5;
      r = Math.round(30 * u + 30 * (1 - u));
      g = Math.round(110 * u + 40 * (1 - u));
      b = Math.round(255 * u + 70 * (1 - u));
    }
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(cpx0 + (i / NX) * cpw, cpy0, cpw / NX + 0.5, cph);
  }

  // ===== RIGHT TOP: Omega_m(a) and f(a) =====
  const rt = { x0: rightX, y0: padT, x1: rightX + rightW, y1: padT + (H - padT - padB) * 0.48 };
  ctx.fillStyle = 'rgba(15, 22, 36, 0.85)';
  ctx.fillRect(rt.x0, rt.y0, rt.x1 - rt.x0, rt.y1 - rt.y0);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.30)';
  ctx.strokeRect(rt.x0 + 0.5, rt.y0 + 0.5, rt.x1 - rt.x0 - 1, rt.y1 - rt.y0 - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Ω_m(a) and growth index f(a) = Ω_m(a)^{0.55}', rt.x0 + 8, rt.y0 + 16);
  const rtX0 = rt.x0 + 38, rtX1 = rt.x1 - 14;
  const rtY0 = rt.y0 + 26, rtY1 = rt.y1 - 22;
  function xOfA(a_) { return rtX0 + (Math.log10(a_) + 3) / 3 * (rtX1 - rtX0); }
  function yOf01(v) { return rtY1 - v * (rtY1 - rtY0); }
  // Grid.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  for (let l = -3; l <= 0; l += 1) {
    ctx.beginPath(); ctx.moveTo(xOfA(Math.pow(10, l)), rtY0); ctx.lineTo(xOfA(Math.pow(10, l)), rtY1); ctx.stroke();
  }
  for (let yv = 0; yv <= 1.001; yv += 0.25) {
    ctx.beginPath(); ctx.moveTo(rtX0, yOf01(yv)); ctx.lineTo(rtX1, yOf01(yv)); ctx.stroke();
  }
  // Omega_m(a).
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const aa = Math.pow(10, -3 + 3 * i / 200);
    if (i === 0) ctx.moveTo(xOfA(aa), yOf01(Omega_m_at(aa, st.Om)));
    else ctx.lineTo(xOfA(aa), yOf01(Omega_m_at(aa, st.Om)));
  }
  ctx.stroke();
  // f(a).
  ctx.strokeStyle = '#5bc0eb';
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const aa = Math.pow(10, -3 + 3 * i / 200);
    if (i === 0) ctx.moveTo(xOfA(aa), yOf01(growthFactor(aa, st.Om)));
    else ctx.lineTo(xOfA(aa), yOf01(growthFactor(aa, st.Om)));
  }
  ctx.stroke();
  // Current-a marker (animated).
  ctx.strokeStyle = '#fff'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(xOfA(a), rtY0); ctx.lineTo(xOfA(a), rtY1); ctx.stroke();
  ctx.setLineDash([]);
  // Axes.
  ctx.fillStyle = 'rgba(200, 210, 240, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  for (let l = -3; l <= 0; l += 1) ctx.fillText(`10^${l}`, xOfA(Math.pow(10, l)), rtY1 + 12);
  ctx.textAlign = 'right';
  for (const yv of [0, 0.25, 0.5, 0.75, 1.0]) ctx.fillText(yv.toFixed(2), rtX0 - 4, yOf01(yv) + 3);
  ctx.textAlign = 'left';
  // Legend.
  ctx.fillStyle = '#ffd166'; ctx.fillText('Ω_m(a)', rt.x1 - 80, rt.y0 + 30);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('f(a) = Ω_m^{0.55}', rt.x1 - 100, rt.y0 + 46);

  // ===== RIGHT BOTTOM: delta(a) =====
  const rb = { x0: rightX, y0: rt.y1 + 12, x1: rightX + rightW, y1: H - padB };
  ctx.fillStyle = 'rgba(15, 22, 36, 0.85)';
  ctx.fillRect(rb.x0, rb.y0, rb.x1 - rb.x0, rb.y1 - rb.y0);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.30)';
  ctx.strokeRect(rb.x0 + 0.5, rb.y0 + 0.5, rb.x1 - rb.x0 - 1, rb.y1 - rb.y0 - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('linear growth function δ(a) / δ(today)', rb.x0 + 8, rb.y0 + 16);
  const rbX0 = rb.x0 + 38, rbX1 = rb.x1 - 14;
  const rbY0 = rb.y0 + 26, rbY1 = rb.y1 - 22;
  function xOfA2(a_) { return rbX0 + (Math.log10(a_) + 3) / 3 * (rbX1 - rbX0); }
  function yOfDelta(v) { return rbY1 - v / 1.05 * (rbY1 - rbY0); }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  for (let l = -3; l <= 0; l += 1) {
    ctx.beginPath(); ctx.moveTo(xOfA2(Math.pow(10, l)), rbY0); ctx.lineTo(xOfA2(Math.pow(10, l)), rbY1); ctx.stroke();
  }
  for (let yv = 0; yv <= 1.001; yv += 0.25) {
    ctx.beginPath(); ctx.moveTo(rbX0, yOfDelta(yv)); ctx.lineTo(rbX1, yOfDelta(yv)); ctx.stroke();
  }
  const dToday = deltaGrowth(1, st.Om);
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const aa = Math.pow(10, -3 + 3 * i / 200);
    const dd = deltaGrowth(aa, st.Om) / dToday;
    if (i === 0) ctx.moveTo(xOfA2(aa), yOfDelta(dd));
    else ctx.lineTo(xOfA2(aa), yOfDelta(dd));
  }
  ctx.stroke();
  // Current-a marker.
  const dNow = deltaGrowth(a, st.Om) / dToday;
  ctx.strokeStyle = '#fff'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(xOfA2(a), rbY0); ctx.lineTo(xOfA2(a), rbY1); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(xOfA2(a), yOfDelta(dNow), 5, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(xOfA2(a), yOfDelta(dNow), 5, 0, 6.28); ctx.stroke();
  // Axes.
  ctx.fillStyle = 'rgba(200, 210, 240, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  for (let l = -3; l <= 0; l += 1) ctx.fillText(`10^${l}`, xOfA2(Math.pow(10, l)), rbY1 + 12);
  ctx.textAlign = 'right';
  for (const yv of [0, 0.25, 0.5, 0.75, 1.0]) ctx.fillText(yv.toFixed(2), rbX0 - 4, yOfDelta(yv) + 3);
  ctx.textAlign = 'left';
  ctx.fillText('a (log)', (rbX0 + rbX1) / 2 - 16, rbY1 + 26);

  // Footer.
  ctx.fillStyle = 'rgba(200, 210, 240, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`Ω_m,0 = ${st.Om.toFixed(3)}   a = ${a.toExponential(2)}   δ/δ_today = ${dNow.toFixed(3)}`, 12, H - 14);
  rD.textContent = dNow.toFixed(3);
}

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (st.running) {
    // Sweep log(a) from -3 to 0 in ~ 6 seconds, then loop.
    st.loga += dt * (3 / 6);
    if (st.loga > 0) st.loga = -3;
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
