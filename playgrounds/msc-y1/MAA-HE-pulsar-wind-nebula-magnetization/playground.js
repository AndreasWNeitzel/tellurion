// Pulsar wind nebula (Crab-like), shown as the object itself: a
// rotating neutron star drives a cold relativistic wind that ends at a
// termination shock, beyond which a magnetized synchrotron bubble forms
// an equatorial torus and, when the magnetization sigma is high, bright
// collimated polar jets (the Crab "sigma problem"). The shock radius
// R_TS = sqrt(L_sd / 4 pi c P_ext) is mapped logarithmically to screen
// so both the spin-down luminosity and the external pressure visibly
// move it (the old linear map saturated and the pressure slider was
// dead). sigma sets the torus-vs-jet balance.
// Reference: Kennel and Coroniti, ApJ 283, 694 (1984); Rybicki and
// Lightman, Radiative Processes in Astrophysics (1979), Ch. 6.

import { terminationRadius } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sL = document.getElementById('slider-L'), vL = document.getElementById('value-L');
const sP = document.getElementById('slider-P'), vP = document.getElementById('value-P');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const DEF = { logL: 38.7, logP: -9, sigma: 0.003 };
const st = { ...DEF, t: 0 }; let running = true;
let last = performance.now();
const PC = 3.086e18, Q = 0.42;                 // view tilt (equatorial squash)
const stars = (() => { const r = makeRng(DEFAULT_SEED); const a = []; for (let i = 0; i < 140; i += 1) a.push([r(), r(), 0.5 + 1.4 * r()]); return a; })();

sL.addEventListener('input', () => { st.logL = parseFloat(sL.value); vL.textContent = st.logL.toFixed(1); if (!running) render(); });
sP.addEventListener('input', () => { st.logP = parseFloat(sP.value); vP.textContent = st.logP.toFixed(1); if (!running) render(); });
sS.addEventListener('input', () => { st.sigma = parseFloat(sS.value); vS.textContent = st.sigma.toFixed(3); if (!running) render(); });
btnR.addEventListener('click', () => { Object.assign(st, DEF); sL.value = '38.7'; sP.value = '-9'; sS.value = '0.003'; vL.textContent = '38.7'; vP.textContent = '-9.0'; vS.textContent = '0.003'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); startLoop(); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); startLoop(); });

// Diagnostic panel layout. Reserve the right ~30% of the canvas for
// quantitative plots (R_TS vs P_ext sweep, sigma vs jet/torus fraction
// chart). Required by CLAUDE.md rule 13.
const DIAG_W_FRAC = 0.32;
function diagBounds() {
  const W = canvas.width, H = canvas.height;
  // Bottom full-width diagnostics panel (portrait): scene fills the top.
  const y = Math.round(H * 0.55);
  return { x: 16, y, w: W - 32, h: H - y - 12 };
}

function render() {
  const W = canvas.width, H = canvas.height;
  const diag = diagBounds();
  // The scene now occupies only the left portion of the canvas; the
  // termination shock is centred in that sub-region rather than the
  // full canvas so it doesn't visually collide with the diagnostic.
  const sceneW = W;
  const cx = sceneW / 2, cy = Math.round(H * 0.28);
  ctx.fillStyle = '#04040a'; ctx.fillRect(0, 0, W, H);
  for (const [sx, sy, sr] of stars) { ctx.fillStyle = `rgba(180,195,230,${0.15 + 0.25 * sr / 1.9})`; ctx.fillRect(sx * sceneW, sy * H, sr, sr); }

  const L = Math.pow(10, st.logL), Pext = Math.pow(10, st.logP);
  const R_TS_pc = terminationRadius(L, Pext) / PC;
  // R_TS spans ~8 decades over the joint (L, P_ext) range; a wide,
  // gently sloped log map keeps BOTH sliders responsive everywhere
  // (a tight clamp pinned the shock and killed the pressure slider).
  const Rpx = Math.max(22, Math.min(236, 130 + 24 * (Math.log10(R_TS_pc) + 1)));
  const s = st.sigma, jetFrac = s / (1 + s), parFrac = 1 / (1 + s);   // mag vs particle
  const ph = CAPTURE_NAME ? CAPTURE_FRAC * 4 : st.t;

  // Outer synchrotron bubble.
  const og = ctx.createRadialGradient(cx, cy, Rpx, cx, cy, Rpx + 150);
  og.addColorStop(0, `rgba(120,90,200,${0.16 * parFrac + 0.05})`); og.addColorStop(1, 'rgba(120,90,200,0)');
  ctx.fillStyle = og; ctx.beginPath(); ctx.ellipse(cx, cy, Rpx + 150, (Rpx + 150) * Q, 0, 0, 6.28); ctx.fill();

  // Cold relativistic wind: faint radial streaks pulsar -> shock.
  for (let k = 0; k < 60; k += 1) {
    const a = k / 60 * 6.283, rr = 12 + ((ph * 60 + k * 7) % (Rpx - 14));
    ctx.fillStyle = 'rgba(120,200,255,0.30)';
    ctx.fillRect(cx + rr * Math.cos(a), cy + rr * Q * Math.sin(a), 1.5, 1.5);
  }

  // Equatorial torus (bright for particle-dominated, Crab-like).
  ctx.strokeStyle = `rgba(255,150,70,${0.20 + 0.6 * parFrac})`; ctx.lineWidth = 10 + 16 * parFrac;
  ctx.beginPath(); ctx.ellipse(cx, cy, Rpx + 26, (Rpx + 26) * Q, 0, 0, 6.28); ctx.stroke();
  ctx.strokeStyle = `rgba(255,220,140,${0.15 + 0.45 * parFrac})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, cy, Rpx + 26, (Rpx + 26) * Q, 0, 0, 6.28); ctx.stroke();

  // Termination shock ring.
  ctx.strokeStyle = '#ff5d8f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, cy, Rpx, Rpx * Q, 0, 0, 6.28); ctx.stroke();

  // Polar jets along the (vertical) spin axis: length and glow grow
  // with magnetization (the sigma problem of the Crab).
  const jLen = 30 + 230 * jetFrac;
  for (const sgn of [-1, 1]) {
    const jg = ctx.createLinearGradient(cx, cy, cx, cy + sgn * jLen);
    jg.addColorStop(0, `rgba(120,230,255,${0.25 + 0.6 * jetFrac})`); jg.addColorStop(1, 'rgba(120,230,255,0)');
    ctx.strokeStyle = jg; ctx.lineWidth = 4 + 10 * jetFrac;
    ctx.beginPath(); ctx.moveTo(cx, cy + sgn * Rpx * Q * 0.3); ctx.lineTo(cx, cy + sgn * jLen); ctx.stroke();
    if (jetFrac > 0.15) { ctx.fillStyle = `rgba(180,245,255,${0.5 * jetFrac})`; ctx.beginPath(); ctx.arc(cx, cy + sgn * jLen, 4 + 8 * jetFrac, 0, 6.28); ctx.fill(); }
  }

  // Drifting wisps just outside the shock (the Crab's moving wisps).
  for (let i = 0; i < 3; i += 1) {
    const rr = Rpx + 8 + ((ph * 26 + i * 22) % 56);
    ctx.strokeStyle = `rgba(255,210,150,${0.5 * (1 - (rr - Rpx) / 64)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * Q, 0, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * Q, 0, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
  }

  // Pulsar with sweeping lighthouse beams.
  const ba = ph * 6.0;
  for (const sgn of [0, Math.PI]) {
    const g = ctx.createLinearGradient(cx, cy, cx + 150 * Math.cos(ba + sgn), cy + 150 * Math.sin(ba + sgn) * Q);
    g.addColorStop(0, 'rgba(160,210,255,0.5)'); g.addColorStop(1, 'rgba(160,210,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 150 * Math.cos(ba + sgn), cy + 150 * Math.sin(ba + sgn) * Q); ctx.stroke();
  }
  const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
  pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, 'rgba(255,225,150,0)');
  ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 6.28); ctx.fill();

  ctx.fillStyle = '#cdd1d6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`R_TS = ${R_TS_pc < 0.01 ? R_TS_pc.toExponential(2) : R_TS_pc.toFixed(3)} pc`, 14, 22);
  ctx.fillText(`log L_sd = ${st.logL.toFixed(1)}   log P_ext = ${st.logP.toFixed(1)}`, 14, 40);
  ctx.fillStyle = s < 0.1 ? '#ff9d6e' : '#7cdfff';
  ctx.fillText(`σ = ${s.toFixed(3)}  ${s < 0.1 ? 'particle-dominated → torus (Crab)' : 'magnetically dominated → jets'}`, 14, H - 16);
  rR.textContent = `${R_TS_pc < 0.01 ? R_TS_pc.toExponential(2) : R_TS_pc.toFixed(3)} pc`;

  // ======================================================================
  // DIAGNOSTIC PANELS (right column).
  //  TOP: R_TS vs log10(P_ext) at the current L_sd.
  //  BOTTOM: σ-driven jet-vs-torus power fraction with the Crab point.
  // ======================================================================
  drawDiagPanels(diag, L, Pext, R_TS_pc, s);
}

function drawDiagPanels(d, L, Pext, R_TS_pc, s) {
  const W = canvas.width, H = canvas.height;
  // Frame.
  ctx.fillStyle = 'rgba(15, 20, 36, 0.85)';
  ctx.fillRect(d.x, d.y, d.w, d.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(d.x + 0.5, d.y + 0.5, d.w - 1, d.h - 1);

  // ===== Top panel: R_TS(P_ext) curve =====
  const tp = { x: d.x + 8, y: d.y + 6, w: d.w - 16, h: Math.floor(d.h * 0.50) - 8 };
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('R_TS  vs  log P_ext', tp.x + 2, tp.y + 12);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(200, 210, 240, 0.65)';
  ctx.fillText(`L_sd fixed at 10^${st.logL.toFixed(1)} erg/s`, tp.x + 2, tp.y + 24);

  const pLo = -12, pHi = -6;
  const rLo = -3, rHi = 1;   // log10(R_TS / pc) range
  const axY = tp.y + tp.h - 22, axX = tp.x + 30;
  const axW = tp.w - 36, axH = tp.h - 50;
  function xOfP(lp) { return axX + ((lp - pLo) / (pHi - pLo)) * axW; }
  function yOfR(lr) { return axY - ((lr - rLo) / (rHi - rLo)) * axH; }
  // Grid.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  for (let lp = pLo; lp <= pHi; lp += 1) {
    ctx.beginPath(); ctx.moveTo(xOfP(lp), tp.y + 30); ctx.lineTo(xOfP(lp), axY); ctx.stroke();
  }
  for (let lr = rLo; lr <= rHi; lr += 1) {
    ctx.beginPath(); ctx.moveTo(axX, yOfR(lr)); ctx.lineTo(axX + axW, yOfR(lr)); ctx.stroke();
  }
  // Curve.
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) {
    const lp = pLo + (i / 120) * (pHi - pLo);
    const Rpc = terminationRadius(L, Math.pow(10, lp)) / PC;
    const lr = Math.log10(Math.max(1e-20, Rpc));
    if (i === 0) ctx.moveTo(xOfP(lp), yOfR(lr));
    else ctx.lineTo(xOfP(lp), yOfR(lr));
  }
  ctx.stroke();
  // Crab reference.
  ctx.fillStyle = 'rgba(255, 210, 110, 0.95)';
  ctx.beginPath(); ctx.arc(xOfP(-9), yOfR(Math.log10(0.1)), 4, 0, 6.28); ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Crab', xOfP(-9) + 6, yOfR(Math.log10(0.1)) - 6);
  // Current point.
  ctx.fillStyle = '#fff';
  const lrNow = Math.log10(Math.max(1e-20, R_TS_pc));
  ctx.beginPath(); ctx.arc(xOfP(st.logP), yOfR(lrNow), 5, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(xOfP(st.logP), yOfR(lrNow), 5, 0, 6.28); ctx.stroke();
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 240, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let lp = pLo; lp <= pHi; lp += 2) ctx.fillText(`${lp}`, xOfP(lp) - 6, axY + 12);
  for (let lr = rLo; lr <= rHi; lr += 1) ctx.fillText(`10^${lr}`, axX - 28, yOfR(lr) + 3);
  ctx.fillText('log P_ext (dyn/cm²)', axX + axW / 2 - 40, axY + 22);
  ctx.save();
  ctx.translate(tp.x + 6, axY - axH / 2 + 30);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('R_TS (pc)', 0, 0);
  ctx.restore();

  // ===== Bottom panel: σ -> jet vs torus power =====
  const bp = { x: d.x + 8, y: d.y + Math.floor(d.h * 0.50) + 8, w: d.w - 16, h: Math.floor(d.h * 0.50) - 16 };
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('σ  →  jet vs torus power', bp.x + 2, bp.y + 12);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(200, 210, 240, 0.70)';
  ctx.fillText('jet: σ/(1+σ),  torus: 1/(1+σ)', bp.x + 2, bp.y + 24);
  const bAxY = bp.y + bp.h - 22, bAxX = bp.x + 36;
  const bAxW = bp.w - 44, bAxH = bp.h - 52;
  const sLo = -4, sHi = 1;        // log10(σ) sweep range.
  function xOfS(ls) { return bAxX + ((ls - sLo) / (sHi - sLo)) * bAxW; }
  function yOfF(f) { return bAxY - f * bAxH; }
  // Grid.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  for (let f = 0; f <= 1.01; f += 0.25) {
    ctx.beginPath(); ctx.moveTo(bAxX, yOfF(f)); ctx.lineTo(bAxX + bAxW, yOfF(f)); ctx.stroke();
  }
  for (let ls = sLo; ls <= sHi; ls += 1) {
    ctx.beginPath(); ctx.moveTo(xOfS(ls), bp.y + 30); ctx.lineTo(xOfS(ls), bAxY); ctx.stroke();
  }
  // Curves.
  function curve(fn, col) {
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 120; i += 1) {
      const ls = sLo + (i / 120) * (sHi - sLo);
      const sig = Math.pow(10, ls);
      const v = fn(sig);
      if (i === 0) ctx.moveTo(xOfS(ls), yOfF(v));
      else ctx.lineTo(xOfS(ls), yOfF(v));
    }
    ctx.stroke();
  }
  curve((sg) => sg / (1 + sg), '#7cdfff');     // jet fraction
  curve((sg) => 1 / (1 + sg), '#ff9d6e');      // torus fraction
  // Current sigma marker.
  const lsNow = Math.log10(Math.max(1e-10, s));
  if (lsNow >= sLo && lsNow <= sHi) {
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
    ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xOfS(lsNow), bp.y + 30); ctx.lineTo(xOfS(lsNow), bAxY); ctx.stroke();
    ctx.setLineDash([]);
    const jf = s / (1 + s), tf = 1 / (1 + s);
    ctx.fillStyle = '#7cdfff'; ctx.beginPath(); ctx.arc(xOfS(lsNow), yOfF(jf), 4, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#ff9d6e'; ctx.beginPath(); ctx.arc(xOfS(lsNow), yOfF(tf), 4, 0, 6.28); ctx.fill();
  }
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 240, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let ls = sLo; ls <= sHi; ls += 1) ctx.fillText(`10^${ls}`, xOfS(ls) - 10, bAxY + 12);
  for (let f = 0; f <= 1.01; f += 0.25) ctx.fillText(f.toFixed(2), bAxX - 28, yOfF(f) + 3);
  ctx.fillText('σ', bAxX + bAxW + 6, bAxY + 4);
  // Legend.
  ctx.fillStyle = '#7cdfff';
  ctx.fillRect(bp.x + 4, bp.y + 36, 10, 3);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('jet', bp.x + 18, bp.y + 40);
  ctx.fillStyle = '#ff9d6e';
  ctx.fillRect(bp.x + 50, bp.y + 36, 10, 3);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.fillText('torus', bp.x + 64, bp.y + 40);
}

let rafOn = false;
function tick(now) { const dt = Math.min((now - last) / 1000, 0.05); last = now; if (running) st.t += dt; render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; last = performance.now(); requestAnimationFrame(tick); } }
function bootSync() {
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); startLoop(); }, { once: true }); } else { bootSync(); startLoop(); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const L = Math.pow(10, st.logL);
  const Pext = Math.pow(10, st.logP);
  const R_TS_pc = terminationRadius(L, Pext) / PC;
  return {
    fields: [
      { key: 'spin-down-lum', label: '$\\log L_{sd}$ (erg/s)', value: st.logL, format: 'float' },
      { key: 'ext-pressure', label: '$\\log P_{ext}$ (dyne/cm$^2$)', value: st.logP, format: 'float' },
      { key: 'shock-radius', label: '$R_{TS}$ (pc)', value: R_TS_pc, format: 'float' },
      { key: 'magnetization', label: 'Magnetization $\\sigma$', value: st.sigma, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const L = Math.pow(10, st.logL);
  const Pext = Math.pow(10, st.logP);
  const R_TS = terminationRadius(L, Pext);
  return [
    { key: 'radius-positive', label: '$R_{TS} > 0$', value: R_TS > 0 ? 'yes' : 'no', status: R_TS > 0 ? 'pass' : 'drift' },
    { key: 'sigma-bounded', label: '$0 < \\sigma < 1$', value: st.sigma > 0 && st.sigma < 1 ? 'yes' : 'no', status: st.sigma > 0 && st.sigma < 1 ? 'pass' : 'drift' }
  ];
};
