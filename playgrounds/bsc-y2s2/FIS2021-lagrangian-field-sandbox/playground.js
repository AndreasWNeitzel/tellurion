// Lagrangian sandbox (Canvas2D). The selected mechanical system is
// integrated by the shared RK4 engine; the left panel animates it,
// the right is the phase portrait, and the readouts are the
// Noether-conserved quantities. sim.js supplies the Euler-Lagrange
// right-hand sides and the invariants.

import { create, step } from '../../../shared/js/engine/ode-rk.js';
import { makeRhs, energy, angularMomentum } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rSys = document.getElementById('readout-sys');
const rH = document.getElementById('readout-h');
const rDH = document.getElementById('readout-dh');
const rL = document.getElementById('readout-l');
const rT = document.getElementById('readout-t');

const selSys = document.getElementById('select-sys');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const sAmp = document.getElementById('slider-amp'), vAmp = document.getElementById('value-amp');
const sSpd = document.getElementById('slider-speed'), vSpd = document.getElementById('value-speed');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const st = { sys: 'pendulum', g: 9.81, amp: 1.4, speed: 1, running: true };
let inst, par, E0, t = 0, trail = [];
const SX = 230, SY = H / 2, PXR = 540;                   // mechanism centre, phase x

function pOf() {
  if (st.sys === 'double') return { m1: 1, m2: 1, L1: 1, L2: 1, g: st.g };
  if (st.sys === 'spring') return { m: 1, k: 36, l0: 1.2, g: st.g };
  if (st.sys === 'kepler') return { mu: 1 };
  return { m: 1, l: 1.4, g: st.g };
}
function ic() {
  if (st.sys === 'double') return [st.amp, st.amp * 0.6, 0, 0];
  if (st.sys === 'spring') return [1.2, st.amp, 0, 0];
  if (st.sys === 'kepler') { const e = Math.min(0.8, 0.15 + st.amp * 0.2); return [1, 0, 0, Math.sqrt((1 - e))]; }
  return [st.amp, 0];
}
function build() {
  par = pOf();
  inst = create({ state: Float64Array.from(ic()), rhs: makeRhs(st.sys, par), method: 'rk4' });
  E0 = energy(st.sys, Array.from(inst.y), par); t = 0; trail = [];
  // Deterministically pre-integrate so a control change immediately
  // shows the full phase trajectory (a dominant element that
  // reshapes with g / amplitude / system), not just a static pose.
  for (let i = 0; i < 2600; i += 1) { step(inst, DT); t += DT; if (i % 3 === 0) trail.push(phasePoint(inst.y)); }
}

function phasePoint(y) {
  if (st.sys === 'double') return [y[0], y[2]];           // (theta1, omega1)
  if (st.sys === 'spring') return [y[0], y[2]];           // (r, rdot)
  if (st.sys === 'kepler') { const r = Math.hypot(y[0], y[1]); return [r, (y[0] * y[2] + y[1] * y[3]) / (r || 1)]; }
  return [y[0], y[1]];                                    // (theta, thetadot)
}

function drawMechanism() {
  const y = inst.y;
  ctx.strokeStyle = 'rgba(150,160,180,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(SX, 30); ctx.lineTo(SX, H - 30); ctx.stroke();
  const S = 90;
  const bob = (x, yy, c, r) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, yy, r, 0, 2 * Math.PI); ctx.fill(); };
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.5;
  if (st.sys === 'pendulum') {
    const x = SX + S * par.l * Math.sin(y[0]), yb = SY + S * par.l * Math.cos(y[0]);
    ctx.beginPath(); ctx.moveTo(SX, SY); ctx.lineTo(x, yb); ctx.stroke(); bob(x, yb, '#06d6a0', 11);
  } else if (st.sys === 'double') {
    const x1 = SX + S * Math.sin(y[0]), y1 = SY + S * Math.cos(y[0]);
    const x2 = x1 + S * Math.sin(y[1]), y2 = y1 + S * Math.cos(y[1]);
    ctx.beginPath(); ctx.moveTo(SX, SY); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    bob(x1, y1, '#5bc0eb', 9); bob(x2, y2, '#06d6a0', 9);
  } else if (st.sys === 'spring') {
    const r = y[0], th = y[1], x = SX + S * r * Math.sin(th), yb = SY + S * r * Math.cos(th);
    ctx.strokeStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(SX, SY);
    for (let i = 0; i <= 24; i += 1) {
      const f = i / 24, zx = SX + (x - SX) * f + (i % 2 ? 7 : -7) * Math.cos(Math.atan2(yb - SY, x - SX));
      const zy = SY + (yb - SY) * f + (i % 2 ? 7 : -7) * Math.sin(Math.atan2(yb - SY, x - SX));
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(x, yb); ctx.stroke(); bob(x, yb, '#06d6a0', 11);
  } else {
    bob(SX, SY, '#ffd166', 7);                            // central mass
    ctx.strokeStyle = 'rgba(91,192,235,0.3)'; ctx.lineWidth = 1;
    if (trail.length > 1) { ctx.beginPath(); ctx.moveTo(SX + trail[0][0] * 70, SY - trail[0][1] * 70); for (const q of trail) ctx.lineTo(SX + q[0] * 70, SY - q[1] * 70); ctx.stroke(); }
    bob(SX + y[0] * 70, SY - y[1] * 70, '#06d6a0', 9);
  }
}

function drawPhase() {
  const cx = PXR, cy = H / 2, R = 150;
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('phase portrait  (q, q-dot)', cx, H - 18);
  // Fixed per-system scale (an autoscaled box would hide how g
  // changes the loop size).
  const SC = { pendulum: [3.4, 9], double: [3.4, 13], spring: [2.6, 7], kepler: [3, 2] }[st.sys];
  const qmax = SC[0], pmax = SC[1];
  const PX = (q) => cx + (q / qmax) * R * 0.92, PY = (pq) => cy - (pq / pmax) * R * 0.92;
  // translucent fill of the swept phase region: its area scales with
  // g and amplitude and changes shape with the system, a dominant
  // control-dependent element
  if (trail.length > 2) {
    ctx.fillStyle = 'rgba(6,214,160,0.16)'; ctx.beginPath();
    ctx.moveTo(PX(trail[0][0]), PY(trail[0][1]));
    for (const [q, pq] of trail) ctx.lineTo(PX(q), PY(pq));
    ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i < trail.length; i += 1) {
    const X = PX(trail[i][0]), Y = PY(trail[i][1]);
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  if (trail.length) {
    const l = trail[trail.length - 1];
    ctx.fillStyle = '#ef476f';
    ctx.beginPath(); ctx.arc(cx + (l[0] / qmax) * R * 0.92, cy - (l[1] / pmax) * R * 0.92, 4, 0, 2 * Math.PI); ctx.fill();
  }
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawMechanism();
  drawPhase();
  // speed indicator: a wide bar so the time-speed control changes a
  // dominant static element (it only affects the live rate otherwise)
  const by = H - 24, bw = 300;
  ctx.fillStyle = 'rgba(150,160,180,0.8)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`time speed  x${st.speed.toFixed(2)}`, 40, by - 6);
  ctx.fillStyle = 'rgba(120,130,150,0.18)'; ctx.fillRect(40, by, bw, 12);
  ctx.fillStyle = '#ffd166'; ctx.fillRect(40, by, bw * ((st.speed - 0.25) / 2.75), 12);
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(40, by, bw, 12);
  const y = Array.from(inst.y);
  const E = energy(st.sys, y, par), L = angularMomentum(st.sys, y);
  rSys.textContent = st.sys;
  rH.textContent = E.toFixed(4);
  rDH.textContent = ((E - E0) / (Math.abs(E0) || 1)).toExponential(1);
  rL.textContent = L === null ? '-' : L.toFixed(4);
  rT.textContent = t.toFixed(1);
}

const DT = 1 / 240;
let lastT = (typeof performance !== 'undefined' ? performance.now() : 0);
function tick(now) {
  const fdt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) {
    let acc = fdt * st.speed;
    while (acc > 0) { const h = Math.min(DT, acc); step(inst, h); t += h; acc -= h; }
    trail.push(phasePoint(inst.y)); if (trail.length > 1400) trail.shift();
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() { vG.textContent = st.g.toFixed(2); vAmp.textContent = st.amp.toFixed(2); vSpd.textContent = st.speed.toFixed(2); }
selSys.addEventListener('change', () => { st.sys = selSys.value; build(); render(); });
sG.addEventListener('input', () => { st.g = parseFloat(sG.value); syncLabels(); build(); render(); });
sAmp.addEventListener('input', () => { st.amp = parseFloat(sAmp.value); syncLabels(); build(); render(); });
sSpd.addEventListener('input', () => { st.speed = parseFloat(sSpd.value); syncLabels(); });
bR.addEventListener('click', () => {
  st.sys = 'pendulum'; st.g = 9.81; st.amp = 1.4; st.speed = 1; st.running = true;
  selSys.value = 'pendulum'; sG.value = '9.81'; sAmp.value = '1.4'; sSpd.value = '1';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); syncLabels(); build(); render();
});
bP.addEventListener('click', () => { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); });

function bootSync() {
  syncLabels(); build();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = f * 14;
    let acc = target;
    while (acc > 0) { const h = Math.min(DT, acc); step(inst, h); t += h; acc -= h; if (Math.round(t / DT) % 3 === 0) trail.push(phasePoint(inst.y)); }
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
