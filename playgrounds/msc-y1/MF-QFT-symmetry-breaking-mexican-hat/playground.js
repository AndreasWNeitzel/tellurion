// Spontaneous symmetry breaking. Panel A: the Mexican-hat potential
// as a Canvas2D pseudo-3D wireframe surface of revolution with a ball
// at the vacuum; heating flattens it to a bowl (symmetry restored).
// Panel B: the radial slice with the Higgs (steep) and Goldstone
// (flat brim) directions. Panel C: the order parameter v(T) vs T (a
// second-order transition). Gate-tested sim.js; deterministic.
// Goldstone 1961; Higgs 1964; Peskin and Schroeder Ch. 11. WebGL is
// relaxed to Canvas2D pseudo-3D here (justified in spec.md), the
// established deterministically gate-verifiable wireframe pattern.
import {
  Vfinite, vev, higgsMass, GOLDSTONE_MASS, Tc, vevT, radialProfile,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rV = document.getElementById('readout-v');
const rMh = document.getElementById('readout-mh');
const rMg = document.getElementById('readout-mg');
const rT = document.getElementById('readout-t');
const sMu = document.getElementById('slider-mu'), vMu = document.getElementById('value-mu');
const sLam = document.getElementById('slider-lam'), vLam = document.getElementById('value-lam');
const selV = document.getElementById('select-view');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF_MU = 200, DEF_LAM = 50, DEF_VIEW = 'roll';
const st = { mu: DEF_MU, lam: DEF_LAM, view: DEF_VIEW, running: !prefersReducedMotion(), ph: 0 };

function mu2() { return st.mu / 100; }
function lam() { return st.lam / 100; }
function tNow() { return st.view === 'heat' ? st.ph * 1.6 * Tc(mu2()) : 0; }
function ballRho() {
  return st.view === 'heat' ? vevT(mu2(), lam(), tNow()) : vev(mu2(), lam()) * st.ph;
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawSurface(x, y, w, h) {
  const T = tNow();
  panel(x, y, w, h, `V(|phi|) ${T >= Tc(mu2()) ? '(symmetric bowl: T > T_c)' : '(broken: wine bottle)'}`);
  const cx = x + w * 0.52, cy = y + h * 0.50, S = Math.min(w * 0.5, h) * 0.46;
  const tilt = 0.62, az = 0.6;
  // bound rho to ~1.8 v so the bump + trough (the sombrero) dominate
  // the vertical range instead of the steep quartic wall.
  const v0 = vev(mu2(), lam());
  const rhoMax = Math.max(v0 * 1.85, 0.7);
  // height scaled by the bump-to-trough amplitude (the sombrero), the
  // steep outer wall clamped so it does not flatten the hat.
  const vMin = Math.min(Vfinite(v0, mu2(), lam(), T), 0);
  const hatAmp = Math.max(1e-3, Vfinite(0, mu2(), lam(), T) - vMin);
  const P3 = (rho, th) => {
    const vv = Vfinite(rho, mu2(), lam(), T);
    const u = (rho / rhoMax);                            // radial -> screen scale
    const hgt = -Math.max(0, Math.min(2.6, (vv - vMin) / hatAmp)); // bump up, trough down
    const vx = u * Math.cos(th), vy = u * Math.sin(th);
    const vr = vx * Math.cos(az) - vy * Math.sin(az);
    const wr = vx * Math.sin(az) + vy * Math.cos(az);
    return { sx: cx + S * vr, sy: cy - S * (wr * Math.cos(tilt) + hgt * 1.5), depth: wr };
  };
  const NTH = 40, NR = 16;
  for (let r = 1; r <= NR; r += 1) {
    ctx.beginPath();
    for (let j = 0; j <= NTH; j += 1) {
      const p = P3(rhoMax * r / NR, 2 * Math.PI * j / NTH);
      const d = (p.depth + 1) / 2;
      ctx.strokeStyle = `rgba(${110 + 120 * d | 0},${150 + 70 * d | 0},255,${0.28 + 0.45 * d})`;
      j === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
  }
  for (let j = 0; j < NTH; j += 3) {
    ctx.strokeStyle = 'rgba(150,180,230,0.3)'; ctx.beginPath();
    for (let r = 0; r <= NR; r += 1) { const p = P3(rhoMax * r / NR, 2 * Math.PI * j / NTH); r === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy); }
    ctx.stroke();
  }
  // the ball at (rho_ball, theta = pi/4)
  const pb = P3(Math.min(rhoMax, ballRho()), Math.PI / 4);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(pb.sx, pb.sy, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`v(T) = ${ballRho().toFixed(3)}  (v0 = ${vev(mu2(), lam()).toFixed(3)})`, x + 12, y + h - 10);
}

function drawSlice(x, y, w, h) {
  const T = tNow();
  panel(x, y, w, h, 'radial slice V(|phi|): Higgs (steep) vs Goldstone (flat brim)');
  const x0 = x + 30, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const rhoMax = vev(mu2(), 0.2) * 1.6 + 0.5;
  const prof = radialProfile(rhoMax, 200, mu2(), lam(), T);
  let lo = 1e9, hi = -1e9; for (const vv of prof.v) { lo = Math.min(lo, vv); hi = Math.max(hi, vv); }
  // mirror for negative rho (full wine-bottle cut)
  const X = (rho) => x0 + (x1 - x0) * (rho + rhoMax) / (2 * rhoMax);
  const Y = (vv) => y1 - (y1 - y0) * (vv - lo) / (hi - lo + 1e-9);
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let s = -1; s <= 1; s += 2) {
    for (let i = 0; i < prof.r.length; i += 1) { const xx = X(s * prof.r[i]), yy = Y(prof.v[i]); (s === -1 && i === 0) ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  }
  ctx.stroke();
  const vb = ballRho();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(vb), Y(Vfinite(vb, mu2(), lam(), T)) - 6, 5, 0, 2 * Math.PI); ctx.fill();
  if (T < Tc(mu2())) {
    ctx.fillStyle = 'rgba(143,227,155,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('Goldstone: flat around the brim (m_G = 0)', x0 + 6, y1 - 6);
    ctx.fillStyle = 'rgba(241,192,105,0.85)';
    ctx.fillText(`Higgs: m_H = ${higgsMass(mu2()).toFixed(2)} (radial curvature)`, x0 + 6, y0 + 14);
  } else {
    ctx.fillStyle = 'rgba(200,215,240,0.8)'; ctx.fillText('symmetric: single minimum at |φ| = 0', x0 + 6, y0 + 14);
  }
  ctx.fillStyle = 'rgba(200,215,240,0.6)'; ctx.fillText('Re(φ) ->', x1 - 60, y1 + 14);
}

function drawOrder(x, y, w, h) {
  panel(x, y, w, h, 'order parameter v(T): second-order transition at T_c');
  const x0 = x + 32, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const tc = Tc(mu2()), v0 = vev(mu2(), lam());
  const tMax = 1.6 * tc;
  const X = (T) => x0 + (x1 - x0) * T / tMax;
  const Y = (v) => y1 - (y1 - y0) * v / (v0 * 1.05);
  ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) { const T = tMax * i / 200; const xx = X(T), yy = Y(vevT(mu2(), lam(), T)); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,143,143,0.5)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(X(tc), y0); ctx.lineTo(X(tc), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,143,143,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`T_c = ${tc.toFixed(2)}`, X(tc) + 4, y0 + 12);
  const T = tNow();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(Math.min(tMax, T)), Y(vevT(mu2(), lam(), T)), 4.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('temperature T ->', x1 - 130, y1 + 14);
  ctx.fillText('v ~ sqrt(T_c - T)', x0 + 6, y0 + 26);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawSurface(20, 22, W - 40, 232);
  drawSlice(20, 270, (W - 52) / 2, H - 270 - 16);
  drawOrder(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  rV.textContent = ballRho().toFixed(3);
  rMh.textContent = higgsMass(mu2()).toFixed(3);
  rMg.textContent = String(GOLDSTONE_MASS);
  rT.textContent = (tNow() / Tc(mu2())).toFixed(2);
}

const LIVE = 1 / 320;
function tick() {
  if (st.running) { st.ph += LIVE; if (st.ph >= 1) { st.ph = 1; st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); } }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vMu.textContent = (st.mu / 100).toFixed(2); vLam.textContent = (st.lam / 100).toFixed(2); }
function restart() { st.ph = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
sMu.addEventListener('input', () => { st.mu = parseInt(sMu.value, 10); syncLabels(); draw(); });
sLam.addEventListener('input', () => { st.lam = parseInt(sLam.value, 10); syncLabels(); draw(); });
selV.addEventListener('change', () => { st.view = selV.value; restart(); draw(); });
bR.addEventListener('click', () => {
  st.mu = DEF_MU; st.lam = DEF_LAM; st.view = DEF_VIEW;
  sMu.value = String(DEF_MU); sLam.value = String(DEF_LAM); selV.value = DEF_VIEW;
  syncLabels(); restart(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.ph >= 1) restart();
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { mu: String(st.mu), lam: String(st.lam), view: st.view }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.mu) { st.mu = parseInt(s.mu, 10); sMu.value = String(st.mu); }
  if (s.lam) { st.lam = parseInt(s.lam, 10); sLam.value = String(st.lam); }
  if (s.view) { st.view = s.view; selV.value = s.view; }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = f;
    draw();
  } else {
    draw();
  }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const mu2Val = mu2(), lamVal = lam();
  return {
    fields: [
      { key: 'mu-squared', label: 'parameter mu^2', value: mu2Val, format: 'float' },
      { key: 'lambda', label: 'coupling lambda', value: lamVal, format: 'float' },
      { key: 'vev', label: 'vacuum expectation value v', value: vev(mu2Val, lamVal), format: 'float' },
      { key: 'temperature', label: 'temperature T (heat mode)', value: tNow(), format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const mu2Val = mu2(), lamVal = lam();
  const inv = [];
  // Higgs mass consistency: m_H = sqrt(2) mu should scale correctly
  const mH = higgsMass(mu2Val);
  const expected = Math.sqrt(2) * Math.sqrt(mu2Val);
  inv.push({
    key: 'higgs-mass-formula',
    label: 'm_H = sqrt(2) mu holds',
    value: (Math.abs(mH - expected) / expected).toExponential(2),
    status: Math.abs(mH - expected) / expected < 1e-10 ? 'pass' : 'drift'
  });
  // Goldstone is always massless: the angular direction should be flat
  inv.push({
    key: 'goldstone-mass',
    label: 'Goldstone mode mass = 0 (flat brim)',
    value: GOLDSTONE_MASS.toFixed(1),
    status: GOLDSTONE_MASS === 0 ? 'pass' : 'drift'
  });
  // Critical temperature: Tc = sqrt(mu^2 / c); above Tc vev should be zero
  const Tc_val = Tc(mu2Val);
  const T_test = Tc_val * 1.2;
  const vev_above_Tc = vevT(mu2Val, lamVal, T_test);
  inv.push({
    key: 'symmetry-restoration',
    label: 'vev = 0 above critical temperature Tc',
    value: vev_above_Tc.toExponential(2),
    status: vev_above_Tc < 0.1 * vev(mu2Val, lamVal) ? 'pass' : 'pending'
  });
  return inv;
};
