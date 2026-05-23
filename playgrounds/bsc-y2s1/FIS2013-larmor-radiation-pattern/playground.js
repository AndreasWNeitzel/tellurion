// playground.js
// Larmor radiation made physical: an oscillating charge with its
// acceleration vector, the sin^2(theta) power lobe that breathes with
// |a(t)|, and pulse-train wavefronts streaming outward whose per-angle
// brightness is the sin^2(theta) directivity (strong broadside, null
// along the acceleration axis). Views: field / polar lobe / 3D torus.
// sim.js (dP/dOmega, Larmor P, integral) is unchanged.

import { dPdOmega, Ptotal, integratedPower } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rP = document.getElementById('readout-p');
const sA = document.getElementById('slider-amp'), vA = document.getElementById('value-amp');
const sF = document.getElementById('slider-f'), vF = document.getElementById('value-f');
const sV = document.getElementById('select-view');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const W = canvas.width, H = canvas.height;
const CX = W / 2, CY = H / 2;
const st = { amp: 1, fExp: 3, view: 'field', t: 0, running: !DETERMINISTIC };

sA.addEventListener('input', () => { st.amp = parseFloat(sA.value); vA.textContent = st.amp.toFixed(1); });
sF.addEventListener('input', () => { st.fExp = parseFloat(sF.value); vF.textContent = `1e${st.fExp.toFixed(1)}`; });
sV.addEventListener('change', () => { st.view = sV.value; });
btnR.addEventListener('click', () => { st.t = 0; st.running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { st.running = !st.running; btnP.textContent = st.running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!st.running)); });

// Visual cycle: one charge oscillation per CYCLE seconds of scene time.
const CYCLE = 1.4;
const WAVE_SPEED = 150;            // px per scene second

function polarGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for (const rr of [70, 140, 210, 280]) { ctx.beginPath(); ctx.arc(CX, CY, rr, 0, 2 * Math.PI); ctx.stroke(); }
  for (let k = 0; k < 12; k += 1) {
    const a = k * Math.PI / 6;
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + 300 * Math.sin(a), CY - 300 * Math.cos(a)); ctx.stroke();
  }
}

function drawLobe(scale, color, fill) {
  ctx.beginPath();
  for (let i = 0; i <= 360; i += 2) {
    const th = i * Math.PI / 180;
    const r = scale * Math.sin(th) ** 2;
    const x = CX + r * Math.sin(th), y = CY - r * Math.cos(th);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
}

function chargeAndAccel(aRel) {
  // Electron oscillates along the vertical (acceleration) axis.
  const yOff = -34 * Math.cos(2 * Math.PI * st.t / CYCLE);
  ctx.strokeStyle = 'rgba(91,192,235,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(CX, CY - 56); ctx.lineTo(CX, CY + 56); ctx.stroke();
  // Acceleration vector (a ~ -cos, opposes displacement).
  const av = 46 * aRel;
  ctx.strokeStyle = '#ef476f'; ctx.fillStyle = '#ef476f'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(CX, CY + yOff); ctx.lineTo(CX, CY + yOff - av); ctx.stroke();
  const dir = av >= 0 ? -1 : 1, mag = Math.abs(av);
  ctx.beginPath();
  ctx.moveTo(CX, CY + yOff - av);
  ctx.lineTo(CX - 5, CY + yOff - av + dir * 8 * Math.sign(mag || 1));
  ctx.lineTo(CX + 5, CY + yOff - av + dir * 8 * Math.sign(mag || 1));
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#06d6a0';
  ctx.beginPath(); ctx.arc(CX, CY + yOff, 8, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ef476f'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('a', CX + 8, CY + yOff - av);
}

function drawField(aRel) {
  polarGrid();
  // Pulse-train wavefronts: a new shell is emitted each half-cycle
  // (power peaks twice per oscillation). Per-angle brightness is the
  // sin^2(theta) directivity, so the shells are bright broadside and
  // pinch to nothing along the vertical acceleration axis.
  const half = CYCLE / 2;
  const newest = Math.floor(st.t / half);
  for (let k = newest; k >= 0; k -= 1) {
    const age = st.t - k * half;
    const r0 = age * WAVE_SPEED;
    if (r0 < 6 || r0 > 320) continue;
    const aEmit = Math.abs(Math.cos(2 * Math.PI * (k * half) / CYCLE)) * st.amp;
    const fade = Math.max(0, 1 - r0 / 320) * (0.35 + 0.65 * aEmit);
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 180; i += 2) {
      const th = i * Math.PI / 180;
      const w = Math.sin(th) ** 2;
      if (w < 0.02) continue;
      ctx.strokeStyle = `rgba(255,209,102,${(fade * w).toFixed(3)})`;
      ctx.beginPath();
      const a0 = th, a1 = (i + 2) * Math.PI / 180;
      ctx.arc(CX, CY, r0, a0 - Math.PI / 2, a1 - Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(CX, CY, r0, -(a0) - Math.PI / 2, -(a1) - Math.PI / 2, true);
      ctx.stroke();
    }
  }
  // Breathing intensity lobe (instantaneous emitted power ~ a^2).
  drawLobe(170 * (0.25 + 0.75 * aRel * aRel) + 30, 'rgba(255,209,102,0.7)', 'rgba(255,209,102,0.08)');
  chargeAndAccel(aRel);
}

function draw3D() {
  polarGrid();
  for (let i = 0; i < 30; i += 1) {
    const phi = i * Math.PI / 15;
    const shade = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(phi));
    ctx.strokeStyle = `rgba(127,177,216,${shade.toFixed(2)})`; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let j = 0; j <= 40; j += 1) {
      const th = j * Math.PI / 40;
      const r = 200 * Math.sin(th) ** 2 * (0.5 + 0.5 * st.amp);
      const X = r * Math.sin(th) * Math.cos(phi);
      const Y = r * Math.cos(th);
      const Z = r * Math.sin(th) * Math.sin(phi);
      const px = CX + X + 0.42 * Z, py = CY - Y + 0.30 * Z;
      if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(CX, CY - 150); ctx.lineTo(CX, CY + 150); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('toroidal sin^2(θ) pattern about the acceleration axis', CX, CY + 250);
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const aRel = Math.cos(2 * Math.PI * st.t / CYCLE);
  if (st.view === '3d') draw3D();
  else if (st.view === 'lobe') {
    polarGrid();
    drawLobe(220 * st.amp, '#ffd166', 'rgba(255,209,102,0.07)');
    chargeAndAccel(aRel);
  } else drawField(aRel);

  const a_peak = 1e10 * st.amp;
  const a_inst = a_peak * aRel;
  const P = Ptotal(a_peak);
  const dpdo = dPdOmega(Math.PI / 2, a_peak);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`a(t) = ${(a_inst * 1e-9).toFixed(2)} GA/s   a_peak = ${(a_peak * 1e-9).toFixed(2)} GA/s   freq = 1e${st.fExp.toFixed(1)} Hz`, 12, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`P_tot = ${P.toExponential(2)} W (Larmor)   dP/dOmega|_90 = ${dpdo.toExponential(2)} W/sr`, 12, 40);
  rP.textContent = `${P.toExponential(2)} W`;
}

function tick(now) {
  if (st.running) st.t += 1 / 60;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  vA.textContent = st.amp.toFixed(1);
  vF.textContent = `1e${st.fExp.toFixed(1)}`;
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.t = 0.4 + f * 2.4;                 // wavefronts at increasing radii
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
// State reports the peak acceleration, the total Larmor power and the
// peak dP/dOmega. The invariant checks that the sin^2(theta) angular
// pattern integrated over the full solid angle reproduces the
// closed-form Larmor power q^2 a^2 / (6 pi eps0 c^3).
window.playground = window.playground || {};
window.playground.getState = function () {
  const a = 1e10 * st.amp;
  return {
    fields: [
      { key: 'acceleration', label: 'peak acceleration (m/s^2)', value: a, format: 'float' },
      { key: 'total-power', label: 'Larmor power (W)', value: Ptotal(a), format: 'float' },
      { key: 'peak-dpdomega', label: 'peak dP/dOmega (W/sr)', value: dPdOmega(Math.PI / 2, a), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const a = 1e10 * st.amp;
  const numeric = integratedPower(a);
  const closed = Ptotal(a);
  const drift = Math.abs(numeric - closed) / Math.max(1e-30, closed);
  return [{
    key: 'larmor',
    label: 'angular pattern integrates to the Larmor power',
    value: drift.toExponential(2),
    status: drift < 1e-3 ? 'pass' : (drift < 1e-2 ? 'pending' : 'drift'),
  }];
};
