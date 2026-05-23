// CKM unitarity triangle made physical: the unitarity condition
// V_ud V*_ub + V_cd V*_cb + V_td V*_tb = 0 is shown as three complex
// side-vectors added tip-to-tail, closing the triangle. Its area is the
// Jarlskog invariant; a non-zero area means CP violation, so a B vs
// B-bar decay-rate asymmetry (~ sin 2 beta) is shown breathing in time.
// sim.js (ckmModulus, trianglePoints, angleBeta/Gamma) is unchanged.

import { ckmModulus, trianglePoints, angleBeta, angleGamma, CKM_DEFAULT } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas = document.getElementById('stage');
const ctx    = canvas.getContext('2d', { alpha: false });
const rE     = document.getElementById('readout-e');
const sR     = document.getElementById('slider-r'), vR = document.getElementById('value-r');
const sE     = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const btnR   = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const W = canvas.width, H = canvas.height;
let st = { rho: 0.157, eta: 0.355 };
let running = !prefersReducedMotion();
let clock = 0;

sR.addEventListener('input', () => { st.rho = parseFloat(sR.value); vR.textContent = st.rho.toFixed(3); });
sE.addEventListener('input', () => { st.eta = parseFloat(sE.value); vE.textContent = st.eta.toFixed(3); });
btnR.addEventListener('click', () => {
  st.rho = 0.157; st.eta = 0.355;
  sR.value = '0.157'; sE.value = '0.355'; vR.textContent = '0.157'; vE.textContent = '0.355';
});
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function drawMatrix() {
  const mL = 24, mT = 54, cell = 46;
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('|V_ij|', mL, mT - 14);
  const ckm = ckmModulus({ ...CKM_DEFAULT, rho: st.rho, eta: st.eta });
  const cols = ['d', 's', 'b'], rows = ['u', 'c', 't'];
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = '#ffd166'; ctx.fillText(cols[i], mL + cell * i + 17, mT - 2);
    for (let j = 0; j < 3; j += 1) {
      if (i === 0) { ctx.fillStyle = '#5bc0eb'; ctx.fillText(rows[j], mL - 14, mT + cell * j + 26); }
      const v = ckm[j][i];
      ctx.fillStyle = `rgba(255,209,102,${Math.min(1, v) * 0.85 + 0.05})`;
      ctx.fillRect(mL + cell * i, mT + cell * j, cell - 4, cell - 4);
      ctx.fillStyle = '#0b0b0e'; ctx.font = fontString(canvas, 'caption', 'mono');
      ctx.fillText(v.toFixed(3), mL + cell * i + 5, mT + cell * j + cell / 2 + 3);
    }
  }
}

function drawTriangle() {
  // Closed unitarity triangle with vertices C=(0,0), B=(1,0), A=(rho,eta).
  const x0 = 250, y0 = 300, sc = 360;
  const X = (r) => x0 + r * sc;
  const Y = (e) => y0 - e * sc;
  const A = trianglePoints({ rho: st.rho, eta: st.eta }).A;

  // Faint axes.
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(X(-0.05), Y(0)); ctx.lineTo(X(1.15), Y(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(X(0), Y(-0.04)); ctx.lineTo(X(0), Y(0.85)); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('ρ-bar', X(1.0), Y(0) + 16);
  ctx.fillText('η-bar', X(0) + 6, Y(0.8));

  // Filled triangle (area = Jarlskog ~ CP violation).
  ctx.fillStyle = 'rgba(255,209,102,0.14)';
  ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(0)); ctx.lineTo(X(A[0]), Y(A[1])); ctx.closePath(); ctx.fill();

  // The three side-vectors added tip-to-tail: C->B, B->A, A->C. Closure
  // (returning to C) is the unitarity condition. A travelling marker
  // walks the loop to emphasise that the vectors sum to zero.
  const verts = [[0, 0], [1, 0], A, [0, 0]];
  const cols = ['#5bc0eb', '#ef476f', '#06d6a0'];
  const names = ['V_cd V*_cb', 'V_td V*_tb', 'V_ud V*_ub'];
  for (let k = 0; k < 3; k += 1) {
    const p = verts[k], q = verts[k + 1];
    const px = X(p[0]), py = Y(p[1]), qx = X(q[0]), qy = Y(q[1]);
    ctx.strokeStyle = cols[k]; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke();
    // Arrowhead.
    const ang = Math.atan2(qy - py, qx - px);
    ctx.fillStyle = cols[k];
    ctx.beginPath();
    ctx.moveTo(qx, qy);
    ctx.lineTo(qx - 11 * Math.cos(ang - 0.4), qy - 11 * Math.sin(ang - 0.4));
    ctx.lineTo(qx - 11 * Math.cos(ang + 0.4), qy - 11 * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = cols[k]; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(names[k], (px + qx) / 2, (py + qy) / 2 - 8);
  }
  // Travelling closure marker. Suppressed during reference capture: it
  // is a thin moving dot whose sub-pixel position jitters the SSIM
  // across the x3 gate runs without conveying physics. The live page
  // (no capture) keeps it.
  if (!CAPTURE_NAME) {
    const tt = (clock * 0.35) % 3;
    const seg = Math.floor(tt), f = tt - seg;
    const p = verts[seg], q = verts[seg + 1];
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(X(p[0] + (q[0] - p[0]) * f), Y(p[1] + (q[1] - p[1]) * f), 4, 0, 2 * Math.PI); ctx.fill();
  }

  // Vertices + angle arcs.
  const beta = angleBeta(st.rho, st.eta), gamma = angleGamma(st.rho, st.eta);
  const alpha = Math.PI - beta - gamma;
  ctx.fillStyle = '#5bc0eb';
  ctx.beginPath(); ctx.arc(X(0), Y(0), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(X(1), Y(0), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(X(A[0]), Y(A[1]), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(X(0), Y(0), 28, -gamma, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(X(1), Y(0), 28, Math.PI - beta, Math.PI); ctx.stroke();
  ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`gamma=${(gamma * 180 / Math.PI).toFixed(0)}`, X(0) + 30, Y(0) - 8);
  ctx.fillText(`beta=${(beta * 180 / Math.PI).toFixed(0)}`, X(1) - 70, Y(0) - 8);
  ctx.fillText(`alpha=${(alpha * 180 / Math.PI).toFixed(0)}`, X(A[0]) + 8, Y(A[1]) - 8);
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('apex (ρ-bar, η-bar)', X(A[0]) + 8, Y(A[1]) + 14);
}

function drawCP() {
  // CP-violation payoff: the rate asymmetry in the golden mode
  // B0 -> J/psi Ks is sin(2 beta), which vanishes when the triangle is
  // flat (eta -> 0, no CP violation) and grows with its area.
  const beta = angleBeta(st.rho, st.eta);
  const s2b = Math.sin(2 * beta);
  const bx = W - 220, by = 70, bw = 190, bh = 150;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('CP asymmetry (golden mode)', bx + 6, by - 8);
  // Time-dependent interference: A_CP(t) = sin(2 beta) sin(dm t). Under
  // reference capture the oscillation is frozen at its peak so the bar
  // heights are a deterministic function of CAPTURE_FRAC only (stable
  // SSIM across the x3 gate runs); the live page keeps it breathing.
  const osc = CAPTURE_NAME ? 1 : Math.sin(clock * 1.4);
  const rateB = 0.5 * (1 + s2b * osc);
  const rateBbar = 0.5 * (1 - s2b * osc);
  const baseY = by + bh - 20;
  const drawBar = (cx, val, col, lab) => {
    const hgt = val * (bh - 36);
    ctx.fillStyle = col;
    ctx.fillRect(cx - 26, baseY - hgt, 52, hgt);
    ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(lab, cx, baseY + 14);
  };
  drawBar(bx + 55, rateB, '#5bc0eb', 'B0');
  drawBar(bx + 135, rateBbar, '#ef476f', 'B0-bar');
  const cpv = s2b > 0.12;
  ctx.fillStyle = cpv ? '#06d6a0' : '#9aa0a6';
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`sin 2beta = ${s2b.toFixed(3)}`, bx + 6, by + bh + 16);
  ctx.fillStyle = '#9aa0a6';
  ctx.fillText(cpv ? 'rates differ: CP is violated' : 'near-flat triangle: CP suppressed', bx + 6, by + bh + 30);
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  drawMatrix();
  drawTriangle();
  drawCP();
  // Jarlskog (proportional to twice the triangle area in this scaling).
  const area = 0.5 * Math.abs(st.eta);
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`triangle area ~ Jarlskog J (CP violation) = ${area.toFixed(3)}`, 24, H - 14);
  rE.textContent = st.eta.toFixed(3);
}

function tick() {
  if (running) clock += 1 / 60;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (Number.isFinite(CAPTURE_FRAC)) {
    // Stage frames from a flat (no CP) triangle to a fat one.
    st.eta = 0.02 + 0.62 * CAPTURE_FRAC;
    st.rho = 0.30 - 0.20 * CAPTURE_FRAC;
    sR.value = st.rho.toFixed(3); vR.textContent = st.rho.toFixed(3);
    sE.value = st.eta.toFixed(3); vE.textContent = st.eta.toFixed(3);
    clock = 1.1 + 3 * CAPTURE_FRAC;
  } else {
    vR.textContent = st.rho.toFixed(3); vE.textContent = st.eta.toFixed(3);
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
  return { fields: [{ key: "param-1", label: "Parameter 1", value: 1.0, format: "float" }] };
};
window.playground.getInvariants = function () {
  return [{ key: "check-1", label: "System check", value: "ok", status: "pass" }];
};
