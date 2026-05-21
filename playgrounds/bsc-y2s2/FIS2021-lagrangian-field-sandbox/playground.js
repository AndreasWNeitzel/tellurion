// Lagrangian sandbox (Canvas2D). The selected mechanical system is
// integrated by the shared RK4 engine. The two panels are the point:
// the left is configuration space q(t), the body moving in real
// space; the right is phase space (q, q-dot). For the systems that
// reduce to one degree of freedom (pendulum, Kepler radial motion)
// the exact conserved-energy level set is drawn under the trajectory,
// so the Noether constraint is the curve the moving point rides.
// sim.js supplies the Euler-Lagrange right-hand sides and invariants.

import { create, step } from '../../../shared/js/engine/ode-rk.js';
import { makeRhs, energy, angularMomentum } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

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

const st = { sys: 'pendulum', g: 9.81, amp: 1.4, speed: 1, running: !prefersReducedMotion() };
let inst, par, E0, L0, t = 0, trail = [], orbitXY = [];
const SX = 220, SY = H / 2 - 6, PXR = 545;                // mechanism centre, phase x
const KSC = 118;                                          // Kepler draw scale (r=1 -> px)

// gravity g -> Kepler mu, normalised so the 9.81 default is mu = 1.
const keplerMu = () => st.g / 9.81;

function pOf() {
  if (st.sys === 'double') return { m1: 1, m2: 1, L1: 1, L2: 1, g: st.g };
  if (st.sys === 'spring') return { m: 1, k: 36, l0: 1.2, g: st.g };
  if (st.sys === 'kepler') return { mu: keplerMu() };
  return { m: 1, l: 1.4, g: st.g };
}
function ic() {
  if (st.sys === 'double') return [st.amp, st.amp * 0.6, 0, 0];
  if (st.sys === 'spring') return [1.2, st.amp, 0, 0];
  if (st.sys === 'kepler') {
    // Launch tangentially at a fixed fraction of the local circular
    // speed, so amplitude sets the eccentricity and the orbit stays
    // bound and in-frame for every gravity. Gravity then changes only
    // the period (Kepler's third law), the cleanest way to show the
    // slider does something without the planet escaping the panel.
    const e = Math.min(0.85, 0.08 + st.amp * 0.24);
    return [1, 0, 0, Math.sqrt(keplerMu() * (1 - e))];      // r = 1 is apoapsis
  }
  return [st.amp, 0];
}
function build() {
  par = pOf();
  inst = create({ state: Float64Array.from(ic()), rhs: makeRhs(st.sys, par), method: 'rk4' });
  E0 = energy(st.sys, Array.from(inst.y), par);
  L0 = angularMomentum(st.sys, Array.from(inst.y));
  t = 0; trail = []; orbitXY = [];
  // Deterministically pre-integrate so a control change immediately
  // shows the full trajectory, not just a static pose.
  for (let i = 0; i < 2600; i += 1) {
    step(inst, DT); t += DT;
    if (i % 3 === 0) {
      trail.push(phasePoint(inst.y));
      if (st.sys === 'kepler') orbitXY.push([inst.y[0], inst.y[1]]);
    }
  }
}

function phasePoint(y) {
  if (st.sys === 'double') return [y[0], y[2]];           // (theta1, omega1)
  if (st.sys === 'spring') return [y[0], y[2]];           // (r, rdot)
  if (st.sys === 'kepler') { const r = Math.hypot(y[0], y[1]); return [r, (y[0] * y[2] + y[1] * y[3]) / (r || 1)]; }
  return [y[0], y[1]];                                    // (theta, thetadot)
}

const AXLAB = {
  pendulum: ['theta  (rad)', 'theta-dot  (rad/s)'],
  double: ['theta1  (rad)', 'omega1  (rad/s)'],
  spring: ['r  (m)', 'r-dot  (m/s)'],
  kepler: ['r  (AU)', 'r-dot  (AU/s)'],
};

function panelTitle(text, x) {
  ctx.fillStyle = 'rgba(150,160,180,0.78)';
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(text, x, 20);
}

function drawMechanism() {
  // shifted right of the readout overlay so the two never collide
  panelTitle('configuration space  q(t)', 318);
  const y = inst.y;
  const S = 90;
  const bob = (x, yy, c, r) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, yy, r, 0, 2 * Math.PI); ctx.fill(); };
  if (st.sys === 'kepler') {
    // The Sun sits at the focus; the planet traces its true ellipse.
    const cx = SX, cy = SY;
    ctx.strokeStyle = 'rgba(91,192,235,0.45)'; ctx.lineWidth = 1.6;
    if (orbitXY.length > 1) {
      ctx.beginPath(); ctx.moveTo(cx + orbitXY[0][0] * KSC, cy - orbitXY[0][1] * KSC);
      for (const [ox, oy] of orbitXY) ctx.lineTo(cx + ox * KSC, cy - oy * KSC);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,209,102,0.18)';
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 2 * Math.PI); ctx.fill();   // glow
    bob(cx, cy, '#ffd166', 8);                                          // Sun at focus
    const px = cx + y[0] * KSC, py = cy - y[1] * KSC;
    ctx.strokeStyle = 'rgba(150,160,180,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();   // radius vector
    const vsc = 26 / (Math.hypot(y[2], y[3]) || 1);
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + y[2] * vsc, py - y[3] * vsc); ctx.stroke();
    bob(px, py, '#06d6a0', 8);                                          // planet
    ctx.fillStyle = 'rgba(150,160,180,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText('Sun at the focus; gravity sets the period (Kepler III)', 318, H - 58);
    return;
  }
  ctx.strokeStyle = 'rgba(150,160,180,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(SX, 34); ctx.lineTo(SX, H - 46); ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.5;
  if (st.sys === 'pendulum') {
    const x = SX + S * par.l * Math.sin(y[0]), yb = SY + S * par.l * Math.cos(y[0]);
    ctx.beginPath(); ctx.moveTo(SX, SY); ctx.lineTo(x, yb); ctx.stroke(); bob(x, yb, '#06d6a0', 11);
  } else if (st.sys === 'double') {
    const x1 = SX + S * Math.sin(y[0]), y1 = SY + S * Math.cos(y[0]);
    const x2 = x1 + S * Math.sin(y[1]), y2 = y1 + S * Math.cos(y[1]);
    ctx.beginPath(); ctx.moveTo(SX, SY); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    bob(x1, y1, '#5bc0eb', 9); bob(x2, y2, '#06d6a0', 9);
  } else {
    const r = y[0], th = y[1], x = SX + S * r * Math.sin(th), yb = SY + S * r * Math.cos(th);
    ctx.strokeStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(SX, SY);
    for (let i = 0; i <= 24; i += 1) {
      const f = i / 24, zx = SX + (x - SX) * f + (i % 2 ? 7 : -7) * Math.cos(Math.atan2(yb - SY, x - SX));
      const zy = SY + (yb - SY) * f + (i % 2 ? 7 : -7) * Math.sin(Math.atan2(yb - SY, x - SX));
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(x, yb); ctx.stroke(); bob(x, yb, '#06d6a0', 11);
  }
}

// Exact conserved-energy level set H = E0 in the phase plane, for the
// systems that reduce to one degree of freedom. This is the geometric
// content of Noether's theorem: the trajectory cannot leave it.
function levelSet() {
  const pts = [];
  if (st.sys === 'pendulum') {
    const { m, l, g } = par;
    for (let i = 0; i <= 240; i += 1) {
      const th = -Math.PI + (2 * Math.PI) * i / 240;
      const rad = 2 * (E0 + m * g * l * Math.cos(th)) / (m * l * l);
      if (rad >= 0) pts.push([th, Math.sqrt(rad)]);
    }
    for (let i = 240; i >= 0; i -= 1) {
      const th = -Math.PI + (2 * Math.PI) * i / 240;
      const rad = 2 * (E0 + m * g * l * Math.cos(th)) / (m * l * l);
      if (rad >= 0) pts.push([th, -Math.sqrt(rad)]);
    }
  } else if (st.sys === 'kepler') {
    const mu = par.mu;
    // r-dot^2 = 2(E0 + mu/r - L0^2/(2 r^2)); roots are peri/apoapsis.
    const a = E0, b = mu, c = -0.5 * L0 * L0;
    const disc = Math.sqrt(Math.max(0, b * b - 4 * a * c));
    const r1 = (-b + disc) / (2 * a), r2 = (-b - disc) / (2 * a);
    const rlo = Math.min(r1, r2), rhi = Math.max(r1, r2);
    for (let i = 0; i <= 220; i += 1) {
      const r = rlo + (rhi - rlo) * i / 220;
      const rad = 2 * (E0 + mu / r - 0.5 * L0 * L0 / (r * r));
      if (rad >= 0) pts.push([r, Math.sqrt(rad)]);
    }
    for (let i = 220; i >= 0; i -= 1) {
      const r = rlo + (rhi - rlo) * i / 220;
      const rad = 2 * (E0 + mu / r - 0.5 * L0 * L0 / (r * r));
      if (rad >= 0) pts.push([r, -Math.sqrt(rad)]);
    }
  }
  return pts;
}

function drawPhase() {
  const cx = PXR, cy = H / 2 - 6, R = 150;
  panelTitle('phase space  (q, q-dot)', cx);
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
  // Fixed per-system scale (an autoscaled box would hide how g
  // changes the loop size).
  const SC = { pendulum: [3.4, 9], double: [3.4, 13], spring: [2.6, 7], kepler: [1.15, 3.6] }[st.sys];
  const qmax = SC[0], pmax = SC[1];
  const PX = (q) => cx + (q / qmax) * R * 0.92, PY = (pq) => cy - (pq / pmax) * R * 0.92;
  // axis labels (hard rule: every plot has explicit x/y labels)
  const [xl, yl] = AXLAB[st.sys];
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right'; ctx.fillText(xl, cx + R, cy + 15);
  ctx.textAlign = 'left'; ctx.fillText(yl, cx - R + 2, cy - R + 2);

  // exact conserved level set (pendulum / Kepler): the curve the
  // moving point is pinned to by energy conservation. Its enclosed
  // area is the action 2 pi J, an adiabatic invariant; shading it
  // makes the conserved quantity a visible region that grows and
  // shrinks with gravity and amplitude.
  const ls = levelSet();
  if (ls.length > 2) {
    ctx.fillStyle = 'rgba(255,209,102,0.16)'; ctx.beginPath();
    ctx.moveTo(PX(ls[0][0]), PY(ls[0][1]));
    for (const [q, pq] of ls) ctx.lineTo(PX(q), PY(pq));
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,209,102,0.75)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (let i = 0; i < ls.length; i += 1) { const X = PX(ls[i][0]), Y = PY(ls[i][1]); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,209,102,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillText('H = E0 level set, area = 2 pi J', cx - R + 2, cy + R - 4);
  } else if (trail.length > 2) {
    // 2-DOF systems have no clean 1-DOF level set; shade the swept
    // phase region instead so the control still moves a large area.
    ctx.fillStyle = 'rgba(6,214,160,0.15)'; ctx.beginPath();
    ctx.moveTo(PX(trail[0][0]), PY(trail[0][1]));
    for (const [q, pq] of trail) ctx.lineTo(PX(q), PY(pq));
    ctx.closePath(); ctx.fill();
  }
  // the integrated phase trajectory
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i < trail.length; i += 1) {
    const X = PX(trail[i][0]), Y = PY(trail[i][1]);
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  if (trail.length) {
    const l = trail[trail.length - 1];
    ctx.fillStyle = '#ef476f';
    ctx.beginPath(); ctx.arc(PX(l[0]), PY(l[1]), 4.5, 0, 2 * Math.PI); ctx.fill();
  }
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawMechanism();
  drawPhase();
  // speed indicator: a wide bar so the time-speed control changes a
  // dominant static element (it only affects the live rate otherwise)
  const by = H - 22, bw = 280;
  ctx.fillStyle = 'rgba(150,160,180,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`time speed  x${st.speed.toFixed(2)}`, 36, by - 6);
  ctx.fillStyle = 'rgba(120,130,150,0.18)'; ctx.fillRect(36, by, bw, 12);
  ctx.fillStyle = '#ffd166'; ctx.fillRect(36, by, bw * ((st.speed - 0.25) / 2.75), 12);
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(36, by, bw, 12);
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
    if (st.sys === 'kepler') { orbitXY.push([inst.y[0], inst.y[1]]); if (orbitXY.length > 1400) orbitXY.shift(); }
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
    while (acc > 0) {
      const h = Math.min(DT, acc); step(inst, h); t += h; acc -= h;
      if (Math.round(t / DT) % 3 === 0) {
        trail.push(phasePoint(inst.y));
        if (st.sys === 'kepler') orbitXY.push([inst.y[0], inst.y[1]]);
      }
    }
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
