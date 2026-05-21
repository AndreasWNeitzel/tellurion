// Action-angle variables (Canvas2D). Left: the phase orbit with the
// enclosed action area shaded. Right: the action-angle loop, the
// harmonic orbit a circle of radius sqrt(2J) swept uniformly. A
// J(t) strip makes the conservation explicit: with the ramp off or
// slow the action stays flat (adiabatic invariant); ramp fast and it
// visibly jumps. Potentials include a Kepler radial orbit, the one
// non-pendulum example. sim.js is the gate-tested action engine.

import {
  potential, energyOf, turningPoints, action, omegaOfE, toCircle,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rJ = document.getElementById('readout-j');
const rE = document.getElementById('readout-e');
const rW = document.getElementById('readout-w');
const rTh = document.getElementById('readout-th');
const rDJ = document.getElementById('readout-dj');

const selPot = document.getElementById('select-pot');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const sW = document.getElementById('slider-w'), vW = document.getElementById('value-w');
const sRamp = document.getElementById('slider-ramp'), vRamp = document.getElementById('value-ramp');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const st = { pot: 'harmonic', E: 0.6, w0: 1.0, ramp: 0, running: !prefersReducedMotion() };
let q = 0, p = 0, th = 0, t = 0, J0 = 0, jHist = [];
const LCX = 210, RCX = 560, CY = H / 2 + 6, SC = 92;

// For Kepler the energy slider maps to a bound radial energy Ek < 0
// and the omega0 slider to the angular momentum L, kept inside the
// bound window 1 + 2 Ek L^2 > 0 for the whole slider range.
// Kepler: keep the bound orbit away from r -> 0. With L ~ 0.8 the
// circular orbit sits at r = L^2 = 0.64 (E_circ = -1/2L^2 = -0.78);
// the E slider spans modest to eccentric orbits whose pericentre
// stays >~ 0.35, so the radial force never becomes too stiff for
// the (substepped) integrator and the live (r, p_r) point rides the
// analytic loop.
function Epar() {
  if (st.pot === 'kepler') return -0.74 + 0.49 * ((st.E - 0.1) / 1.7);   // [-0.74,-0.25]
  return st.E;
}
function baseW() {
  if (st.pot === 'kepler') return 0.70 + 0.20 * ((st.w0 - 0.5) / 1.5);   // L in [0.70,0.90]
  return st.w0;
}
// The parameter actually felt now: a sinusoidal ramp about the base
// whose rate grows with the slider. Off -> static (J exactly
// conserved); slow -> adiabatic (J conserved); fast -> non-adiabatic.
function wEff() {
  const b = baseW();
  if (st.ramp < 1e-3) return b;
  const rate = 0.03 + st.ramp * 1.6;
  return b * (1 + 0.32 * Math.sin(2 * Math.PI * rate * t));
}

function force(qq, wE) {
  if (st.pot === 'pendulum') return -wE * wE * Math.sin(qq);
  if (st.pot === 'quartic') return -wE * wE * qq * qq * qq;
  if (st.pot === 'kepler') { const r = Math.max(1e-6, qq); return -1 / (r * r) + (wE * wE) / (r * r * r); }
  return -wE * wE * qq;
}
function reset() {
  const wE = baseW(), Eb = Epar();
  const tp = turningPoints(st.pot, Eb, wE);
  q = tp ? (st.pot === 'kepler' ? tp[0] : tp[1]) : 1; p = 0; th = 0; t = 0;
  J0 = action(st.pot, Eb, wE);
  jHist = [];
}

// Generic bound-orbit sampler over [qm,qp]: p = +-sqrt(2(E-V)).
function orbitPoints(Ecur, wE, n) {
  const tp = turningPoints(st.pot, Ecur, wE);
  if (!tp) return null;
  const [qm, qp] = tp, out = [];
  for (let i = 0; i <= n; i += 1) {
    const x = qm + (i / n) * (qp - qm);
    const v = 2 * (Ecur - potential(st.pot, x, wE));
    out.push([x, v > 0 ? Math.sqrt(v) : 0]);
  }
  return out;
}

function drawJStrip(Jnow) {
  const x0 = W / 2 - 182, x1 = W / 2 + 182, y0 = 18, y1 = 62;
  jHist.push([t, Jnow]); if (jHist.length > 480) jHist.shift();
  ctx.strokeStyle = 'rgba(150,160,180,0.45)'; ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  const drift = Math.abs((Jnow - J0) / (Math.abs(J0) || 1));
  const ok = drift < 0.03;
  // shared vertical scale around J0 so a flat line reads as conserved
  const span = Math.max(0.18 * Math.abs(J0) + 1e-6, 1.25 * Math.max(...jHist.map(([, j]) => Math.abs(j - J0))) || 1e-6);
  const yOfJ = (j) => (y0 + y1) / 2 - ((j - J0) / span) * ((y1 - y0) / 2 - 4);
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(x0, yOfJ(J0)); ctx.lineTo(x1, yOfJ(J0)); ctx.stroke(); ctx.setLineDash([]);
  const t0 = jHist[0][0], tspan = Math.max(1e-6, jHist[jHist.length - 1][0] - t0);
  ctx.strokeStyle = ok ? '#06d6a0' : '#ef476f'; ctx.lineWidth = 1.8; ctx.beginPath();
  jHist.forEach(([tt, jj], i) => {
    const X = x0 + ((tt - t0) / tspan) * (x1 - x0), Y = yOfJ(jj);
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  });
  ctx.stroke();
  ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(150,160,180,0.8)'; ctx.fillText('J(t)', x0 + 4, y0 - 4);
  ctx.textAlign = 'right'; ctx.fillStyle = ok ? '#06d6a0' : '#ef476f';
  ctx.fillText(ok ? 'J conserved (adiabatic)' : 'J drifting: ramp too fast', x1, y0 - 4);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const wE = wEff();
  const Ecur = energyOf(st.pot, q, p, wE);
  const Jnow = action(st.pot, Ecur, wE);
  const w = omegaOfE(st.pot, Ecur, wE);

  drawJStrip(Jnow);

  // left panel: phase orbit + shaded action area
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(LCX - 150, CY); ctx.lineTo(LCX + 150, CY);
  ctx.moveTo(LCX, CY - 138); ctx.lineTo(LCX, CY + 138); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(st.pot === 'kepler' ? 'radial phase orbit  (r, p_r)' : 'phase orbit  (q, p)', LCX, H - 14);
  // centre the orbit on its own interval so Kepler (r in [r-,r+])
  // is not pushed off-axis
  const tp = turningPoints(st.pot, Ecur, wE);
  const mid = tp ? 0.5 * (tp[0] + tp[1]) : 0;
  const pts = orbitPoints(Ecur, wE, 180);
  if (pts) {
    ctx.fillStyle = 'rgba(6,214,160,0.16)'; ctx.beginPath();
    ctx.moveTo(LCX + (pts[0][0] - mid) * SC, CY - pts[0][1] * SC);
    for (const [x, pp] of pts) ctx.lineTo(LCX + (x - mid) * SC, CY - pp * SC);
    for (let i = pts.length - 1; i >= 0; i -= 1) ctx.lineTo(LCX + (pts[i][0] - mid) * SC, CY + pts[i][1] * SC);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2.2; ctx.beginPath();
    ctx.moveTo(LCX + (pts[0][0] - mid) * SC, CY - pts[0][1] * SC);
    for (const [x, pp] of pts) ctx.lineTo(LCX + (x - mid) * SC, CY - pp * SC);
    for (let i = pts.length - 1; i >= 0; i -= 1) ctx.lineTo(LCX + (pts[i][0] - mid) * SC, CY + pts[i][1] * SC);
    ctx.closePath(); ctx.stroke();
  }
  ctx.fillStyle = '#ef476f';
  ctx.beginPath(); ctx.arc(LCX + (q - mid) * SC, CY - p * SC, 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(6,214,160,0.85)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('shaded area = 2 pi J', LCX, H - 32);

  // right panel: the action-angle loop (a circle for the harmonic)
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(RCX - 150, CY); ctx.lineTo(RCX + 150, CY);
  ctx.moveTo(RCX, CY - 138); ctx.lineTo(RCX, CY + 138); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.textAlign = 'center';
  ctx.fillText('action-angle  (theta winds uniformly)', RCX, H - 14);
  // The whole point of action-angle variables: the canonical
  // transform turns ANY 1-DOF bound orbit into a circle of radius
  // sqrt(2 J) swept at the constant rate omega, for Kepler exactly
  // as for the harmonic. So the loop is always a clean circle (the
  // earlier toCircle map was the harmonic-only transform and made
  // Kepler a wrong, weird blob).
  const rJpx = Math.sqrt(2 * Math.max(0, Jnow)) * SC * 0.7;
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(RCX, CY, rJpx, 0, 2 * Math.PI); ctx.stroke();
  const rr = rJpx || 1;
  ctx.strokeStyle = 'rgba(255,209,102,0.85)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(RCX, CY); ctx.lineTo(RCX + rr * Math.cos(-th), CY + rr * Math.sin(-th)); ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(RCX + rr * Math.cos(-th), CY + rr * Math.sin(-th), 5, 0, 2 * Math.PI); ctx.fill();

  rJ.textContent = Number.isFinite(Jnow) ? Jnow.toFixed(4) : 'inf';
  rE.textContent = Ecur.toFixed(4);
  rW.textContent = Number.isFinite(w) ? w.toFixed(4) : '-';
  rTh.textContent = ((th % (2 * Math.PI)) / Math.PI).toFixed(2) + ' pi';
  rDJ.textContent = ((Jnow - J0) / (Math.abs(J0) || 1)).toExponential(1);
}

const DT = 1 / 360;
let lastT = (typeof performance !== 'undefined' ? performance.now() : 0);
function physics(h) {
  const wE = wEff();
  // Kepler's radial force ~ 1/r^2 is stiff near pericentre; substep
  // velocity-Verlet (more substeps the closer r is) so energy is
  // conserved and the live (r, p_r) point stays exactly on the
  // analytic phase loop instead of spiralling off it.
  let nsub = 1;
  if (st.pot === 'kepler') nsub = Math.max(1, Math.min(64, Math.ceil(h / (0.02 * q * q + 1e-4))));
  const hs = h / nsub;
  for (let s = 0; s < nsub; s += 1) {
    const a0 = force(q, wE); p += 0.5 * a0 * hs; q += p * hs; p += 0.5 * force(q, wE) * hs;
    if (st.pot === 'kepler') q = Math.max(1e-4, q);
  }
  t += h;
  const wN = wEff();
  th = (th + omegaOfE(st.pot, energyOf(st.pot, q, p, wN), wN) * h) % (2 * Math.PI);
}
function tick(now) {
  const fdt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) { let acc = fdt; while (acc > 0) { const h = Math.min(DT, acc); physics(h); acc -= h; } }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() { vE.textContent = st.E.toFixed(2); vW.textContent = st.w0.toFixed(2); vRamp.textContent = st.ramp.toFixed(2); }
selPot.addEventListener('change', () => { st.pot = selPot.value; reset(); render(); });
sE.addEventListener('input', () => { st.E = parseFloat(sE.value); syncLabels(); reset(); render(); });
sW.addEventListener('input', () => { st.w0 = parseFloat(sW.value); syncLabels(); reset(); render(); });
sRamp.addEventListener('input', () => { st.ramp = parseFloat(sRamp.value); syncLabels(); });
bR.addEventListener('click', () => {
  st.pot = 'harmonic'; st.E = 0.6; st.w0 = 1.0; st.ramp = 0; st.running = true;
  selPot.value = 'harmonic'; sE.value = '0.6'; sW.value = '1.0'; sRamp.value = '0';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); syncLabels(); reset(); render();
});
bP.addEventListener('click', () => { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); });

function bootSync() {
  syncLabels(); reset();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.E = 0.15 + f * 1.5; sE.value = String(st.E); syncLabels(); reset();
    let acc = 3.0; while (acc > 0) { const h = Math.min(DT, acc); physics(h); acc -= h; }
  }
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
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
