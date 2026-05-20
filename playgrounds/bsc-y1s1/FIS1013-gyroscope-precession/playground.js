// playground.js
// Gyroscope precession as a real 3D spinning flywheel (hand-projected
// Canvas2D, no WebGL): a shaded disc with rotating spokes on an axle
// pivoted on a pedestal, leaning at theta and precessing under gravity.
// Vectors show the spin angular momentum L, the weight Mg, and the
// torque tau = r x W that drives the precession (dL/dt = tau). A side
// panel keeps the Omega_p(omega_s) ~ 1/omega_s relation. sim.js carries
// the leading-order top physics unchanged.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createTop, stepTop, precessionRate, tipPosition, L_VIS,
  M_TOP, G_GRAV, R_COM, I_SPIN,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderOmega  = document.getElementById('slider-omega');
const sliderTheta  = document.getElementById('slider-theta');
const sliderSpeed  = document.getElementById('slider-speed');
const valueOmega   = document.getElementById('value-omega');
const valueTheta   = document.getElementById('value-theta');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  omega_s: 50,
  theta0: 0.6,
  speed: 3,
  sim: null,
  tipTrail: [],
  az: 0.6,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  cool: cssVar('--accent-cool', '#7fb1d8'),
  warm: cssVar('--accent-warm', '#d68a69'),
};

// Left-panel 3D camera.
const SC = 150, ELEV = 0.42;
const CX = W * 0.30, CY = H * 0.58;
function proj(x, y, z) {
  const ca = Math.cos(state.az), sa = Math.sin(state.az);
  const ex = x * ca - y * sa, ey = x * sa + y * ca;
  return { sx: CX + ex * SC, sy: CY - z * SC * Math.cos(ELEV) + ey * SC * Math.sin(ELEV) };
}

function rebuild() {
  state.sim = createTop({ theta: state.theta0, omega_spin: state.omega_s });
  state.tipTrail = [];
}

function arrow3(p0, p1, color, lw) {
  const a = proj(p0[0], p0[1], p0[2]), b = proj(p1[0], p1[1], p1[2]);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
  const ang = Math.atan2(b.sy - a.sy, b.sx - a.sx), hl = 9;
  ctx.beginPath();
  ctx.moveTo(b.sx, b.sy);
  ctx.lineTo(b.sx - hl * Math.cos(ang - 0.4), b.sy - hl * Math.sin(ang - 0.4));
  ctx.lineTo(b.sx - hl * Math.cos(ang + 0.4), b.sy - hl * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
}

function drawScene() {
  const s = state.sim;
  const th = s.theta, ph = s.phi;
  const u = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
  // Orthonormal frame perpendicular to the axle u.
  let e1 = [-Math.sin(ph), Math.cos(ph), 0];
  const e2 = [u[1] * e1[2] - u[2] * e1[1], u[2] * e1[0] - u[0] * e1[2], u[0] * e1[1] - u[1] * e1[0]];

  // Pedestal: base ring + column up to the pivot at origin.
  ctx.strokeStyle = 'rgba(160,166,178,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 40; i += 1) {
    const a = (i / 40) * 2 * Math.PI;
    const p = proj(0.5 * Math.cos(a), 0.5 * Math.sin(a), -1.25);
    if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
  }
  ctx.stroke();
  const base = proj(0, 0, -1.25), piv = proj(0, 0, 0);
  ctx.strokeStyle = 'rgba(190,196,208,0.7)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(base.sx, base.sy); ctx.lineTo(piv.sx, piv.sy); ctx.stroke();
  ctx.fillStyle = '#aeb6c4'; ctx.beginPath(); ctx.arc(piv.sx, piv.sy, 5, 0, 2 * Math.PI); ctx.fill();

  // Tip precession-cone trace.
  if (state.tipTrail.length > 1) {
    ctx.strokeStyle = 'rgba(127,177,216,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i < state.tipTrail.length; i += 1) {
      const t = state.tipTrail[i], p = proj(t[0], t[1], t[2]);
      if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
  }

  // Axle.
  const tip = [L_VIS * u[0], L_VIS * u[1], L_VIS * u[2]];
  const pA = proj(0, 0, 0), pB = proj(tip[0], tip[1], tip[2]);
  ctx.strokeStyle = '#cdd3df'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(pA.sx, pA.sy); ctx.lineTo(pB.sx, pB.sy); ctx.stroke();

  // Flywheel disc at the centre of mass, normal = u, with rotating spokes.
  const Rd = 0.42, dc = R_COM * 1.4;
  const c = [dc * u[0], dc * u[1], dc * u[2]];
  const rim = [];
  for (let i = 0; i <= 48; i += 1) {
    const a = (i / 48) * 2 * Math.PI;
    rim.push([c[0] + Rd * (Math.cos(a) * e1[0] + Math.sin(a) * e2[0]),
              c[1] + Rd * (Math.cos(a) * e1[1] + Math.sin(a) * e2[1]),
              c[2] + Rd * (Math.cos(a) * e1[2] + Math.sin(a) * e2[2])]);
  }
  const proj2 = rim.map((p) => proj(p[0], p[1], p[2]));
  const grad = ctx.createLinearGradient(
    Math.min(...proj2.map((p) => p.sx)), 0, Math.max(...proj2.map((p) => p.sx)), 0);
  grad.addColorStop(0, '#2a3340'); grad.addColorStop(0.5, tok.cool); grad.addColorStop(1, '#1a2028');
  ctx.fillStyle = grad;
  ctx.beginPath();
  proj2.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.6; ctx.stroke();
  // Spokes rotate at the spin angle psi.
  const cp = proj(c[0], c[1], c[2]);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.4;
  for (let k = 0; k < 6; k += 1) {
    const a = s.psi + k * Math.PI / 3;
    const rp = proj(c[0] + Rd * (Math.cos(a) * e1[0] + Math.sin(a) * e2[0]),
                    c[1] + Rd * (Math.cos(a) * e1[1] + Math.sin(a) * e2[1]),
                    c[2] + Rd * (Math.cos(a) * e1[2] + Math.sin(a) * e2[2]));
    ctx.beginPath(); ctx.moveTo(cp.sx, cp.sy); ctx.lineTo(rp.sx, rp.sy); ctx.stroke();
  }
  ctx.fillStyle = '#e8ecf2'; ctx.beginPath(); ctx.arc(cp.sx, cp.sy, 4, 0, 2 * Math.PI); ctx.fill();

  // Vectors at the centre of mass: L (along axle), weight W (down),
  // torque tau = r x W (horizontal, tangent to the precession circle).
  const Llen = 0.7;
  arrow3(c, [c[0] + Llen * u[0], c[1] + Llen * u[1], c[2] + Llen * u[2]], '#ffd166', 2.5);
  arrow3(c, [c[0], c[1], c[2] - 0.6], '#ef476f', 2.5);
  const r = c, Wv = [0, 0, -1];
  let tau = [r[1] * Wv[2] - r[2] * Wv[1], r[2] * Wv[0] - r[0] * Wv[2], r[0] * Wv[1] - r[1] * Wv[0]];
  const tl = Math.hypot(tau[0], tau[1], tau[2]) || 1;
  tau = [tau[0] / tl * 0.55, tau[1] / tl * 0.55, tau[2] / tl * 0.55];
  arrow3(c, [c[0] + tau[0], c[1] + tau[1], c[2] + tau[2]], '#06d6a0', 2.5);

  // Vector key.
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'left';
  const keyY = H - 70;
  ctx.fillStyle = '#ffd166'; ctx.fillText('L  spin angular momentum', 30, keyY);
  ctx.fillStyle = '#ef476f'; ctx.fillText('W  weight Mg', 30, keyY + 16);
  ctx.fillStyle = '#06d6a0'; ctx.fillText('tau = r x W  drives precession', 30, keyY + 32);
}

function drawCurve() {
  const px = W * 0.60, py = 70, pw = W - px - 30, ph = H - py - 90;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  const wMin = 10, wMax = 200;
  const pMax = precessionRate(wMin);
  const xF = (w) => px + pw * (w - wMin) / (wMax - wMin);
  const yF = (p) => py + ph * (1 - p / pMax);
  ctx.strokeStyle = tok.cool; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) {
    const w = wMin + (wMax - wMin) * i / 120;
    const X = xF(w), Y = yF(precessionRate(w));
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  const xc = xF(state.omega_s);
  ctx.strokeStyle = tok.warm; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xc, py); ctx.lineTo(xc, py + ph); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = tok.warm;
  const yc = yF(precessionRate(state.omega_s));
  ctx.beginPath(); ctx.arc(xc, yc, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Omega_p vs omega_s  (1/omega_s)', px + 8, py + 16);
  ctx.textAlign = 'center';
  ctx.fillText('omega_s', px + pw / 2, py + ph + 18);
}

function drawAll() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;
  const Op = precessionRate(state.omega_s), Tp = 2 * Math.PI / Op;
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.textAlign = 'left';
  ctx.fillText(`omega_s = ${state.omega_s}   theta = ${state.theta0.toFixed(2)} rad`, 24, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`Omega_p = M g r / (I_s omega_s) = ${Op.toFixed(3)} rad/s   T_p = ${Tp.toFixed(2)} s`, 24, 42);
  drawScene();
  drawCurve();
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepTop(state.sim, 0.01);
    if (state.sim.nSteps % 2 === 0) {
      const t = tipPosition(state.sim);
      state.tipTrail.push([t.x, t.y, t.z]);
      if (state.tipTrail.length > 2000) state.tipTrail.shift();
    }
  }
}

sliderOmega.addEventListener('input', () => { state.omega_s = parseInt(sliderOmega.value, 10); valueOmega.textContent = String(state.omega_s); if (state.sim) state.sim.omega_spin = state.omega_s; });
sliderTheta.addEventListener('input', () => { state.theta0 = parseFloat(sliderTheta.value); valueTheta.textContent = state.theta0.toFixed(2); if (state.sim) state.sim.theta = state.theta0; });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  valueOmega.textContent = String(state.omega_s);
  valueTheta.textContent = state.theta0.toFixed(2);
  valueSpeed.textContent = String(state.speed);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.az = 0.6;
    tickN(Math.round((0.05 + frac * 1.0) * 900));
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
      }));
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    tickN(state.speed);
    state.az += 0.0015;
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
