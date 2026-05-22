// Alfvén wave made physical: a shear Alfvén wave is a transverse kink
// running along magnetic field lines, with magnetic tension as the
// restoring force and the plasma frozen into the field (ideal MHD). A
// driver at the coronal base shakes the field-line footpoints; the
// perturbation propagates outward at v_A. Plasma parcels ride the lines
// (Walen relation v_y = -/+ b_y/sqrt(mu0 rho)). The b_y/v_y curves are
// kept as a quantitative strip. sim.js is unchanged.

import { alfvenSpeedMS, bField, vField, MU0 } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas = document.getElementById('stage');
const ctx    = canvas.getContext('2d', { alpha: false });
const rV     = document.getElementById('readout-v');
const sB     = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const sN     = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const btnR   = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const W = canvas.width, H = canvas.height;
let st = { B_nT: 5, n_amu_cc: 5, t: 0 };
let running = !prefersReducedMotion();

const LAMBDA = 1e7;          // m, display wavelength (sim.js convention)
const XSPAN  = 2e7;          // m, domain shown
const AMP    = 0.5;          // b_y amplitude (sim.js convention)

sB.addEventListener('input', () => { st.B_nT = parseFloat(sB.value); vB.textContent = st.B_nT.toFixed(1); });
sN.addEventListener('input', () => { st.n_amu_cc = parseFloat(sN.value); vN.textContent = st.n_amu_cc.toFixed(1); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function render() {
  ctx.fillStyle = '#05060a';
  ctx.fillRect(0, 0, W, H);
  const B0 = st.B_nT * 1e-9, rho = st.n_amu_cc * 1.66e-27 * 1e6;
  const vA = alfvenSpeedMS(B0, rho);

  const sceneTop = 40, sceneH = H * 0.58;
  const x0 = 56, x1 = W - 24;
  const xToPx = (x) => x0 + (x + XSPAN / 2) / XSPAN * (x1 - x0);
  // Transverse displacement of a field line is proportional to b_y.
  const AMP_PX = sceneH * 0.052;

  // Coronal base / driver at the left: a shaded footpoint region that
  // shakes the field lines (the wave launcher).
  const baseGrad = ctx.createLinearGradient(x0 - 30, 0, x0 + 40, 0);
  baseGrad.addColorStop(0, 'rgba(255,180,90,0.30)');
  baseGrad.addColorStop(1, 'rgba(255,180,90,0)');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(x0 - 30, sceneTop, 70, sceneH);
  ctx.fillStyle = 'rgba(255,200,120,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.save(); ctx.translate(x0 - 16, sceneTop + sceneH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('coronal-base driver', -60, 0); ctx.restore();

  // Magnetic field lines: equilibrium B0 along +x, each line transversely
  // kinked by b_y(x, t). The kink runs to the right at v_A.
  const NLINES = 11;
  for (let li = 0; li < NLINES; li += 1) {
    const y0 = sceneTop + sceneH * (li + 0.5) / NLINES;
    ctx.beginPath();
    let maxDisp = 0;
    for (let i = 0; i <= 240; i += 1) {
      const x = -XSPAN / 2 + XSPAN * i / 240;
      // Driver envelope: amplitude ramps in from the base so the wave is
      // clearly launched there and propagates outward.
      const env = Math.min(1, (x + XSPAN / 2) / (XSPAN * 0.12));
      const b = bField(x, st.t, LAMBDA, AMP, vA) * env;
      maxDisp = Math.max(maxDisp, Math.abs(b));
      const px = xToPx(x), py = y0 - b * AMP_PX;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    // Colour by displacement strength (magnetic activity).
    const g = Math.min(1, maxDisp / AMP);
    ctx.strokeStyle = `rgba(${110 + 140 * g},${150 + 40 * g},${235 - 120 * g},0.85)`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // Plasma parcels frozen into three sample lines: they ride the field
  // transversely with v_y, demonstrating flux-freezing and the Walen
  // antiphase relation. Velocity arrows (cyan) and field perturbation
  // arrows (orange) at each parcel.
  const sampleLines = [2, 5, 8];
  for (const li of sampleLines) {
    const y0 = sceneTop + sceneH * (li + 0.5) / NLINES;
    for (let p = 0; p < 9; p += 1) {
      const x = -XSPAN / 2 + XSPAN * (p + 0.5) / 9;
      const env = Math.min(1, (x + XSPAN / 2) / (XSPAN * 0.12));
      const b = bField(x, st.t, LAMBDA, AMP, vA) * env;
      const vy = vField(x, st.t, LAMBDA, AMP, vA, B0, rho) * env / 1e6;
      const px = xToPx(x), py = y0 - b * AMP_PX;
      ctx.fillStyle = '#dfe6f5';
      ctx.beginPath(); ctx.arc(px, py, 3, 0, 2 * Math.PI); ctx.fill();
      // v_y arrow (cyan): plasma transverse velocity.
      ctx.strokeStyle = 'rgba(91,192,235,0.9)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - vy * AMP_PX * 1.4); ctx.stroke();
      // b_y arrow (orange): field perturbation, antiphase with v_y.
      ctx.strokeStyle = 'rgba(255,200,120,0.55)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 14, py + b * AMP_PX * 0.5); ctx.stroke();
    }
  }

  // Propagation marker: a wave crest advancing along x at v_A.
  const crestX = ((vA * st.t) % XSPAN) / XSPAN;          // 0..1 across domain
  const cpx = xToPx(-XSPAN / 2 + crestX * XSPAN);
  ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.setLineDash([4, 5]);
  ctx.beginPath(); ctx.moveTo(cpx, sceneTop); ctx.lineTo(cpx, sceneTop + sceneH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('crest -> v_A', cpx, sceneTop - 4);

  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('shear Alfven wave: magnetic field lines whipped by the driver, propagating along B0 at v_A', 46, 16);
  ctx.fillStyle = 'rgba(91,192,235,0.9)';
  ctx.fillText('cyan = plasma v_y (frozen-in)', 46, sceneTop + sceneH + 18);
  ctx.fillStyle = 'rgba(255,200,120,0.9)';
  ctx.fillText('orange = b_y; magnetic tension restores; Walen: v_y = -/+ b_y / sqrt(mu0 rho)', 250, sceneTop + sceneH + 18);

  // Quantitative strip: b_y(x) and v_y(x), showing the antiphase.
  const stripTop = sceneTop + sceneH + 30, stripH = H - stripTop - 24;
  const midY = stripTop + stripH / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(x0, midY); ctx.lineTo(x1, midY); ctx.stroke();
  const A2 = stripH * 0.40;
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) {
    const x = -XSPAN / 2 + XSPAN * i / 300;
    const b = bField(x, st.t, LAMBDA, AMP, vA);
    const px = xToPx(x), py = midY - b / AMP * A2;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) {
    const x = -XSPAN / 2 + XSPAN * i / 300;
    const v = vField(x, st.t, LAMBDA, AMP, vA, B0, rho) / 1e6;
    const px = xToPx(x), py = midY - v * A2;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('b_y / v_y (antiphase)', x0, stripTop + 10);
  ctx.textAlign = 'right';
  ctx.fillText(`v_A = ${(vA / 1000).toFixed(0)} km/s   B0 = ${st.B_nT.toFixed(1)} nT   n = ${st.n_amu_cc.toFixed(1)} amu/cm^3`, x1, H - 8);
  rV.textContent = `${(vA / 1000).toFixed(0)} km/s`;
}

let last = performance.now();
function tick(now) {
  const dt = (now - last) / 1000; last = now;
  if (running) st.t += dt * 0.4;
  if (st.t > 1e4) st.t = 0;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (Number.isFinite(CAPTURE_FRAC)) {
    // Stage the frames: walk the wave forward and vary B0 so v_A (hence
    // the wavelength-per-time advance) visibly differs across stills.
    st.B_nT = 2 + 12 * CAPTURE_FRAC;
    sB.value = String(st.B_nT); vB.textContent = st.B_nT.toFixed(1);
    st.t = 1.5 + 5 * CAPTURE_FRAC;
  } else {
    st.t = 5;
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const B0 = st.B_nT * 1e-9;
  const rho = st.n_amu_cc * 1.66e-27 * 1e6;
  const vA = alfvenSpeedMS(B0, rho);
  return {
    fields: [
      { key: 'B0', label: 'Magnetic field B0', value: st.B_nT, format: 'float' },
      { key: 'rho', label: 'Plasma density n', value: st.n_amu_cc, format: 'float' },
      { key: 'vA', label: 'Alfven speed vA', value: vA / 1000, format: 'float' },
      { key: 'time', label: 'Simulation time', value: st.t, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const B0 = st.B_nT * 1e-9;
  const rho = st.n_amu_cc * 1.66e-27 * 1e6;
  const vA = alfvenSpeedMS(B0, rho);
  const invs = [];
  // Check Walen relation: at a sample point, v_y = -b_y / sqrt(mu0 rho)
  // Sample at x=0, which has both signal amplitude
  const xSamp = 0;
  const bSamp = bField(xSamp, st.t, LAMBDA, AMP, vA);
  const vSamp = vField(xSamp, st.t, LAMBDA, AMP, vA, B0, rho);
  const vWalen = -bSamp / Math.sqrt(MU0 * rho);
  const relErr = Math.abs((vSamp - vWalen) / Math.max(1, Math.abs(vWalen)));
  invs.push({
    key: 'walen-relation',
    label: 'Walen relation (v_y = -b_y / sqrt(mu0 rho))',
    value: relErr < 1e-10 ? 'pass' : (relErr < 1e-8 ? 'drift' : 'fail'),
    status: relErr < 1e-8 ? 'pass' : (relErr < 1e-6 ? 'drift' : 'fail')
  });
  return invs;
};
