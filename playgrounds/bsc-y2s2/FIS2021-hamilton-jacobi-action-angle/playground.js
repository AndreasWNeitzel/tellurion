// Action-angle variables (Canvas2D). Left: the phase orbit with the
// enclosed action area shaded. Right: the action-angle picture, the
// harmonic orbit a circle of radius sqrt(2J) swept uniformly. sim.js
// is the gate-tested action/period engine.

import {
  potential, energyOf, turningPoints, action, omegaOfE, toCircle,
} from './sim.js';

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
const tAdia = document.getElementById('toggle-adia');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const st = { pot: 'harmonic', E: 0.6, w0: 1.0, adia: false, running: true };
let q = 0, p = 0, th = 0, t = 0, J0 = 0;
const LCX = 220, RCX = 560, CY = H / 2 - 8, SC = 95;

function force(qq) {
  if (st.pot === 'pendulum') return -st.w0 * st.w0 * Math.sin(qq);
  if (st.pot === 'quartic') return -st.w0 * st.w0 * qq * qq * qq;
  return -st.w0 * st.w0 * qq;
}
function reset() {
  const tp = turningPoints(st.pot, st.E, st.w0);
  q = tp ? tp[1] : 1; p = 0; th = 0; t = 0;
  J0 = action(st.pot, st.E, st.w0);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const Ecur = energyOf(st.pot, q, p, st.w0);
  const Jnow = action(st.pot, st.E, st.w0);
  const w = omegaOfE(st.pot, st.E, st.w0);

  // left panel: phase orbit + shaded action area
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(LCX - 150, CY); ctx.lineTo(LCX + 150, CY);
  ctx.moveTo(LCX, CY - 150); ctx.lineTo(LCX, CY + 150); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('phase orbit  (q, p)', LCX, H - 16);
  const tp = turningPoints(st.pot, st.E, st.w0);
  if (tp) {
    const [qm, qp] = tp, pts = [];
    for (let i = 0; i <= 160; i += 1) { const x = qm + (i / 160) * (qp - qm); const v = 2 * (st.E - potential(st.pot, x, st.w0)); pts.push([x, v > 0 ? Math.sqrt(v) : 0]); }
    ctx.fillStyle = 'rgba(6,214,160,0.16)'; ctx.beginPath();
    ctx.moveTo(LCX + pts[0][0] * SC, CY - pts[0][1] * SC);
    for (const [x, pp] of pts) ctx.lineTo(LCX + x * SC, CY - pp * SC);
    for (let i = pts.length - 1; i >= 0; i -= 1) ctx.lineTo(LCX + pts[i][0] * SC, CY + pts[i][1] * SC);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2.2; ctx.beginPath();
    ctx.moveTo(LCX + pts[0][0] * SC, CY - pts[0][1] * SC);
    for (const [x, pp] of pts) ctx.lineTo(LCX + x * SC, CY - pp * SC);
    for (let i = pts.length - 1; i >= 0; i -= 1) ctx.lineTo(LCX + pts[i][0] * SC, CY + pts[i][1] * SC);
    ctx.closePath(); ctx.stroke();
  }
  ctx.fillStyle = '#ef476f';
  ctx.beginPath(); ctx.arc(LCX + q * SC, CY - p * SC, 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(6,214,160,0.8)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('shaded area = 2 pi J', LCX, H - 34);

  // right panel: the action-angle circle
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(RCX - 150, CY); ctx.lineTo(RCX + 150, CY);
  ctx.moveTo(RCX, CY - 150); ctx.lineTo(RCX, CY + 150); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.textAlign = 'center';
  ctx.fillText('action-angle  (uniform theta)', RCX, H - 16);
  const rJpx = Math.sqrt(2 * Jnow) * SC * 0.7;
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.2;
  if (st.pot === 'harmonic') {
    ctx.beginPath(); ctx.arc(RCX, CY, rJpx, 0, 2 * Math.PI); ctx.stroke();
  } else {
    ctx.beginPath(); let st0 = false;
    for (let a = 0; a <= 2 * Math.PI + 0.01; a += 0.05) {
      const qq = (tp ? tp[1] : 1) * Math.cos(a);
      const v = 2 * (st.E - potential(st.pot, qq, st.w0));
      const pp = (v > 0 ? Math.sqrt(v) : 0) * (a < Math.PI ? -1 : 1);
      const c = toCircle(qq, pp, st.w0);
      const X = RCX + c.Q * SC * 0.7, Y = CY - c.P * SC * 0.7;
      if (!st0) { ctx.moveTo(X, Y); st0 = true; } else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }
  const rr = Math.sqrt(2 * Jnow) * SC * 0.7;
  ctx.strokeStyle = 'rgba(255,209,102,0.8)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(RCX, CY); ctx.lineTo(RCX + rr * Math.cos(-th), CY + rr * Math.sin(-th)); ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(RCX + rr * Math.cos(-th), CY + rr * Math.sin(-th), 5, 0, 2 * Math.PI); ctx.fill();

  rJ.textContent = Jnow.toFixed(4);
  rE.textContent = Ecur.toFixed(4);
  rW.textContent = w.toFixed(4);
  rTh.textContent = ((th % (2 * Math.PI)) / Math.PI).toFixed(2) + ' pi';
  rDJ.textContent = ((Jnow - J0) / (Math.abs(J0) || 1)).toExponential(1);
}

const DT = 1 / 360;
let lastT = (typeof performance !== 'undefined' ? performance.now() : 0);
function physics(h) {
  if (st.adia) { st.w0 = 1.0 + 0.5 * (1 + Math.sin(0.05 * t)); }   // slow ramp
  const a0 = force(q); p += 0.5 * a0 * h; q += p * h; p += 0.5 * force(q) * h;
  t += h;
  th = (th + omegaOfE(st.pot, energyOf(st.pot, q, p, st.w0), st.w0) * h) % (2 * Math.PI);
  st.E = energyOf(st.pot, q, p, st.w0);
}
function tick(now) {
  const fdt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) { let acc = fdt; while (acc > 0) { const h = Math.min(DT, acc); physics(h); acc -= h; } }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() { vE.textContent = st.E.toFixed(2); vW.textContent = st.w0.toFixed(2); }
selPot.addEventListener('change', () => { st.pot = selPot.value; reset(); render(); });
sE.addEventListener('input', () => { st.E = parseFloat(sE.value); syncLabels(); reset(); render(); });
sW.addEventListener('input', () => { st.w0 = parseFloat(sW.value); syncLabels(); reset(); render(); });
tAdia.addEventListener('change', () => { st.adia = tAdia.checked; reset(); });
bR.addEventListener('click', () => {
  st.pot = 'harmonic'; st.E = 0.6; st.w0 = 1.0; st.adia = false; st.running = true;
  selPot.value = 'harmonic'; sE.value = '0.6'; sW.value = '1.0'; tAdia.checked = false;
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
