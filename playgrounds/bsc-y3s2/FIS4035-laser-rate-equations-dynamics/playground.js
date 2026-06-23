// Laser rate-equation dynamics: a pumped gain medium in a resonator.
// Below threshold the cavity is dark; above it the inversion clamps at
// n_th = 1/q0 (gain clamping) and the output rises linearly with pump.
// The class-B turn-on is a giant first photon spike followed by damped
// relaxation oscillations that ring down onto the steady state. The
// physics is the gate-tested closed-form / RK4 sim.js. The trace panel
// shows the full transient (decimated, not a FIFO window) so the spike
// and ring-down are always visible; the run freezes once settled.
// Canvas2D, deterministic (fixed spontaneous seed, no RNG).
import {
  createLaser, step, thresholdPump, steadyInversion, steadyPhotons, outputPower, SEED,
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
const rThr = document.getElementById('readout-thr');
const rInv = document.getElementById('readout-inv');
const rPhi = document.getElementById('readout-phi');
const rReg = document.getElementById('readout-regime');
const selReg = document.getElementById('select-regime');
const sR = document.getElementById('slider-pump'), vR = document.getElementById('value-pump');
const sQ = document.getElementById('slider-q'), vQ = document.getElementById('value-q');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

// RK4 step for stability; the trace is sampled every SAMPLE_DT of sim
// time so the whole transient (turn-on spike, ring-down, clamp) fits in
// a bounded buffer. T_WINDOW is the simulated time a cw/below run plays
// before it freezes on its settled state. The cw default r = 12,
// q0 = 0.25 is well underdamped (Jacobian damping ratio
// r q0 / (2 sqrt(r - 1/q0)) = 0.53), n_th = 1/q0 = 4, so several
// relaxation oscillations are visible before the clamp.
const STEP_DT = 2e-3;
const SAMPLE_DT = 0.05;
const T_WINDOW = 24;
const LIVE_DT = 0.06;                                  // sim time advanced per animation frame
const DEF_R = 12, DEF_Q0 = 0.25;
const st = {
  regime: 'cw', r: DEF_R, q0: DEF_Q0, running: !prefersReducedMotion(),
  sim: null, hist: [], lastK: -1, qs: null,
};

function rebuild() {
  if (st.regime === 'below') { st.r = 0.6 * thresholdPump(st.q0); st.qs = null; }
  else if (st.regime === 'cw') { st.r = Math.max(st.r, 3 * thresholdPump(st.q0)); st.qs = null; }
  else if (st.regime === 'qswitch') { st.qs = { phase: 'charge', q0Low: 0.25, q0High: Math.max(st.q0, 2), nI: 0 }; st.r = 3; }
  st.sim = createLaser({ r: st.r, q0: st.regime === 'qswitch' ? st.qs.q0Low : st.q0, n0: 0, p0: SEED });
  st.hist = []; st.lastK = -1; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
  sample();
}

function sample() {
  const k = Math.floor(st.sim.t / SAMPLE_DT + 1e-9);
  if (k > st.lastK) {
    st.lastK = k;
    st.hist.push([st.sim.t, st.sim.n, st.sim.p]);
    if (st.hist.length > 2400) st.hist.shift();        // safety bound (qswitch runs unbounded)
  }
}

// Advance the simulation to absolute sim time T using fixed RK4 steps,
// sampling the decimated history as it goes. Q-switch phase timing is
// expressed in sim time, so it is independent of frame rate / capture.
function advanceTo(T) {
  let guard = 0;
  while (st.sim.t < T - 1e-9 && guard < 200000) {
    guard += 1;
    if (st.regime === 'qswitch' && st.qs) {
      if (st.qs.phase === 'charge') {
        st.sim.r = 3; st.sim.q0 = st.qs.q0Low;
        if (st.sim.t > 24) { st.qs.nI = st.sim.n; st.sim.q0 = st.qs.q0High; st.qs.phase = 'dump'; st.qs.dumpT = st.sim.t; }
      } else if (st.sim.t - st.qs.dumpT > 30) {
        rebuild(); return;                             // recharge: repeat the giant pulse
      }
    }
    step(st.sim, STEP_DT);
    sample();
  }
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawResonator(x, y, w, h) {
  panel(x, y, w, h, 'resonator: gain medium (inversion bar) and intracavity photons');
  const mx0 = x + 40, mx1 = x + w - 40, cy = y + h * 0.56;
  ctx.strokeStyle = '#9fb6d8'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(mx0, cy - 50); ctx.lineTo(mx0, cy + 50); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx1, cy - 50); ctx.lineTo(mx1, cy + 50); ctx.stroke();
  const p = Math.min(1, st.sim.p / Math.max(0.5, steadyPhotons(st.r, st.q0) * 1.4 + 0.5));
  const grd = ctx.createLinearGradient(mx0, 0, mx1, 0);
  grd.addColorStop(0, `rgba(255,170,90,${0.05 + 0.5 * p})`);
  grd.addColorStop(0.5, `rgba(255,210,120,${0.1 + 0.7 * p})`);
  grd.addColorStop(1, `rgba(255,170,90,${0.05 + 0.5 * p})`);
  ctx.fillStyle = grd; ctx.fillRect(mx0 + 4, cy - 14, mx1 - mx0 - 8, 28);
  const nClamp = steadyInversion(1e9, st.q0);          // n_th = 1/q0
  const nFrac = Math.max(0, Math.min(1, st.sim.n / (Math.max(nClamp, st.r) * 1.1)));
  const gmx = (mx0 + mx1) / 2;
  ctx.fillStyle = 'rgba(120,170,255,0.25)'; ctx.fillRect(gmx - 36, cy - 56, 72, 112);
  ctx.fillStyle = '#6fa0ff'; ctx.fillRect(gmx - 30, cy + 50 - 100 * nFrac, 60, 100 * nFrac);
  const tF = Math.max(0, Math.min(1, nClamp / (Math.max(nClamp, st.r) * 1.1)));
  ctx.strokeStyle = 'rgba(255,210,120,0.8)'; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(gmx - 36, cy + 50 - 100 * tF); ctx.lineTo(gmx + 36, cy + 50 - 100 * tF); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,210,120,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('n_th = 1/q0', gmx + 40, cy + 50 - 100 * tF + 3);
  ctx.fillStyle = 'rgba(200,215,240,0.75)';
  ctx.fillText('inversion n', gmx - 28, cy + 70);
}

function drawTraces(x, y, w, h) {
  panel(x, y, w, h, 'turn-on transient: photon number phi(t) [amber], inversion n(t) [blue], full run');
  if (st.hist.length < 2) return;
  const tEnd = st.regime === 'qswitch' ? Math.max(SAMPLE_DT, st.sim.t) : T_WINDOW;
  let pmax = 1e-9, nmax = 1e-9;
  for (const [, n, p] of st.hist) { if (p > pmax) pmax = p; if (n > nmax) nmax = n; }
  // n_th is the gain-clamp inversion 1/q0 (steadyInversion at high pump), not
  // the threshold pump rate; scale the inversion axis to keep it on the plot.
  const nth = steadyInversion(1e9, st.q0);
  nmax = Math.max(nmax, nth) * 1.08;
  const x0 = x + 8, x1 = x + w - 8, y0 = y + 22, y1 = y + h - 12;
  const X = (t) => x0 + (x1 - x0) * Math.min(1, t / tEnd);
  const Yp = (p) => y1 - (y1 - y0) * p / pmax;
  const Yn = (n) => y1 - (y1 - y0) * n / nmax;
  // steady-state reference lines (clamp targets)
  const pSt = steadyPhotons(st.r, st.q0);
  ctx.strokeStyle = 'rgba(111,160,255,0.35)'; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(x0, Yn(nth)); ctx.lineTo(x1, Yn(nth)); ctx.stroke();
  if (pSt > 0) { ctx.strokeStyle = 'rgba(241,192,105,0.35)'; ctx.beginPath(); ctx.moveTo(x0, Yp(pSt)); ctx.lineTo(x1, Yp(pSt)); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(111,160,255,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`n_th = ${nth.toFixed(2)}`, x1 - 78, Yn(nth) - 4);
  ctx.strokeStyle = '#f1c069'; ctx.lineWidth = 1.5; ctx.beginPath();
  st.hist.forEach(([t, , p], i) => { const xx = X(t), yy = Yp(p); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); });
  ctx.stroke();
  ctx.strokeStyle = '#6fa0ff'; ctx.lineWidth = 1.2; ctx.beginPath();
  st.hist.forEach(([t, n], i) => { const xx = X(t), yy = Yn(n); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); });
  ctx.stroke();
}

function drawPvP(x, y, w, h) {
  panel(x, y, w, h, 'output power vs pump: the threshold kink (operating point marked)');
  const rth = thresholdPump(st.q0), rMax = Math.max(6 * rth, st.r * 1.2);
  const px = (r) => x + 8 + (w - 16) * (r / rMax);
  let pMax = 1e-6;
  for (let r = 0; r <= rMax; r += rMax / 120) pMax = Math.max(pMax, outputPower(r, st.q0));
  const py = (P) => y + h - 14 - (h - 30) * (pMax > 0 ? P / pMax : 0);
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const r = rMax * i / 120; const xx = px(r), yy = py(outputPower(r, st.q0)); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,210,120,0.6)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(px(rth), y + 22); ctx.lineTo(px(rth), y + h - 14); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,210,120,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('threshold r_th = 1/q0', px(rth) + 4, y + 34);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(px(st.r), py(outputPower(st.r, st.q0)), 5, 0, 2 * Math.PI); ctx.fill();
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawResonator(20, 24, W - 40, 170);
  drawTraces(20, 210, W - 40, 150);
  drawPvP(20, 376, W - 40, H - 376 - 16);
  rThr.textContent = thresholdPump(st.q0).toFixed(3);
  const nth = thresholdPump(st.q0);
  const clamped = st.r > nth && Math.abs(st.sim.n - nth) / nth < 0.06;
  rInv.textContent = st.sim.n.toFixed(3) + (clamped ? ' (= n_th)' : '');
  rPhi.textContent = st.sim.p.toExponential(2);
  rReg.textContent = st.regime + (!st.running && st.regime !== 'qswitch' ? ' (settled)' : '');
}

function tick() {
  if (st.running) {
    if (st.regime === 'qswitch') {
      advanceTo(st.sim.t + LIVE_DT);
    } else {
      advanceTo(Math.min(st.sim.t + LIVE_DT, T_WINDOW));
      if (st.sim.t >= T_WINDOW - 1e-9) {
        st.running = false;
        bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true');
      }
    }
  }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vR.textContent = st.r.toFixed(2); vQ.textContent = st.q0.toFixed(2); }
selReg.addEventListener('change', () => { st.regime = selReg.value; rebuild(); syncLabels(); draw(); });
sR.addEventListener('input', () => { st.r = parseFloat(sR.value) / 100; if (st.regime !== 'qswitch') { st.regime = st.r > thresholdPump(st.q0) ? 'cw' : 'below'; selReg.value = st.regime; } syncLabels(); rebuild(); });
sQ.addEventListener('input', () => { st.q0 = parseFloat(sQ.value) / 100; syncLabels(); rebuild(); });
bR.addEventListener('click', () => {
  st.regime = 'cw'; st.r = DEF_R; st.q0 = DEF_Q0;
  selReg.value = 'cw'; sR.value = String(DEF_R * 100); sQ.value = String(DEF_Q0 * 100);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.regime !== 'qswitch' && st.sim.t >= T_WINDOW - 1e-9) rebuild();   // replay
  else {
    st.running = !st.running;
    bP.textContent = st.running ? 'Pause' : 'Play';
    bP.setAttribute('aria-pressed', String(!st.running));
  }
});

function getState() { return { regime: st.regime, pump: st.r.toFixed(2), q0: st.q0.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.regime) { st.regime = s.regime; selReg.value = s.regime; }
  if (s.pump) { st.r = parseFloat(s.pump); sR.value = String(Math.round(st.r * 100)); }
  if (s.q0) { st.q0 = parseFloat(s.q0); sQ.value = String(Math.round(st.q0 * 100)); }
}

function boot() {
  restoreState(); syncLabels(); rebuild();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    st.regime = 'cw'; st.r = DEF_R; st.q0 = DEF_Q0; rebuild();
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    advanceTo(f * T_WINDOW);
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
  const nth = thresholdPump(st.q0);
  const fields = [
    { key: 'regime', label: 'laser regime', value: st.regime, format: 'string' },
    { key: 'pump-rate', label: 'pump rate r', value: parseFloat(st.r.toFixed(2)), format: 'float' },
    { key: 'cavity-q', label: 'cavity Q0', value: parseFloat(st.q0.toFixed(2)), format: 'float' },
    { key: 'threshold-pump', label: 'threshold r_th', value: parseFloat(nth.toFixed(3)), format: 'float' },
  ];
  return { fields };
};
window.playground.getInvariants = function () {
  const inv = [];
  const nth = thresholdPump(st.q0);
  const nSt = steadyInversion(st.r, st.q0);
  const pSt = steadyPhotons(st.r, st.q0);
  inv.push({
    key: 'inversion-nonneg',
    label: 'inversion n >= 0',
    value: st.sim.n >= -1e-10 ? 'pass' : 'drift',
    status: st.sim.n >= -1e-10 ? 'pass' : 'drift',
  });
  inv.push({
    key: 'photons-nonneg',
    label: 'photons p >= 0',
    value: st.sim.p >= -1e-10 ? 'pass' : 'drift',
    status: st.sim.p >= -1e-10 ? 'pass' : 'drift',
  });
  if (st.r > nth) {
    const nErr = Math.abs(st.sim.n - nSt) / nSt;
    inv.push({
      key: 'gain-clamp',
      label: 'gain clamped near n_th',
      value: nErr.toExponential(2),
      status: nErr < 0.05 ? 'pass' : (nErr < 0.2 ? 'pending' : 'drift'),
    });
  }
  return inv;
};
