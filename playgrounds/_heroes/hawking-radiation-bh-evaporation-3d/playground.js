// Hawking radiation playground. Canvas2D scene with a central BH,
// particle-antiparticle pair flashes at the horizon, escaping
// quanta streaming outward, and a side panel of M(t) and T_H(t).

import {
  schwarzschildRadius_m, hawkingTemperature_K, hawkingPower_W,
  evaporationTime_s, evaporationTime_yr, massAtTime_kg,
  peakFrequency_Hz, makeRng, PRIMORDIAL_BH_KG,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rM = document.getElementById('readout-M');
const rRs = document.getElementById('readout-rs');
const rT = document.getElementById('readout-T');
const rP = document.getElementById('readout-P');
const rTev = document.getElementById('readout-tev');

const sLogM = document.getElementById('slider-logM'), vLogM = document.getElementById('value-logM');
const sFrac = document.getElementById('slider-frac'), vFrac = document.getElementById('value-frac');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const selPreset = document.getElementById('select-preset'), vPreset = document.getElementById('value-preset');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  logM0: 11.2,        // initial mass in kg, log10
  frac: 0.20,         // fraction of t_evap elapsed
  speed: 2,
  running: !prefersReducedMotion(),
  rng: makeRng(0xC0FFEE),
  pairs: [],
  escapers: [],
  flashes: [],
  t: 0,
};

function M0_kg() { return Math.pow(10, st.logM0); }
function tEvap_s() { return evaporationTime_s(M0_kg()); }
function currentMass_kg() {
  const t = st.frac * tEvap_s();
  return massAtTime_kg(M0_kg(), t);
}

function spawnPair() {
  // Spawn a pair at a random angle around the horizon, slightly
  // outside r_s. Visually we use canvas units.
  const angle = st.rng() * 2 * Math.PI;
  return { angle, age: 0, lifetime: 0.4 + 0.6 * st.rng() };
}

function spawnEscaper(angle) {
  return {
    x: Math.cos(angle), y: Math.sin(angle),
    vx: Math.cos(angle) * 0.6, vy: Math.sin(angle) * 0.6,
    age: 0,
  };
}

function spawnFlash(angle) {
  return { angle, age: 0, lifetime: 0.3 };
}

function stepParticles(dt) {
  // Spawn rate proportional to power (which is huge for small M, slow
  // for big M). Visually, we cap to keep the canvas readable.
  const rate = Math.min(20, 5 + 4 * st.speed) * (1 + 5 * st.frac); // rate per second
  st._spawnAcc = (st._spawnAcc || 0) + dt;
  const interval = 1 / Math.max(0.5, rate);
  while (st._spawnAcc > interval) {
    st._spawnAcc -= interval;
    const angle = st.rng() * 2 * Math.PI;
    st.flashes.push(spawnFlash(angle));
    st.escapers.push(spawnEscaper(angle));
    if (st.escapers.length > 80) st.escapers.shift();
  }
  // Step
  for (const e of st.escapers) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.age += dt;
  }
  st.escapers = st.escapers.filter(e => Math.hypot(e.x, e.y) < 2.0);
  for (const f of st.flashes) f.age += dt;
  st.flashes = st.flashes.filter(f => f.age < f.lifetime);
}

const SCENE = { x: 0, y: 0, w: 0.58 * W, h: H };
const PANEL = { x: 0.60 * W, y: 30, w: 0.38 * W, h: H - 60 };

function drawBackground() {
  ctx.fillStyle = '#03050b';
  ctx.fillRect(0, 0, W, H);
  // Starfield
  for (let i = 0; i < 110; i++) {
    const ix = (i * 23.7) % SCENE.w;
    const iy = (i * 31.1) % SCENE.h;
    const sb = 0.15 + 0.45 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(190, 200, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
}

function drawBlackHole() {
  const cx = SCENE.x + SCENE.w / 2;
  const cy = SCENE.y + SCENE.h / 2;
  // Visual radius: fix r_s in canvas pixels to a fraction of canvas
  // (the actual r_s spans 30 orders of magnitude, so we always render
  // it at a consistent size).
  const r = 70;
  // Photon ring (warm glow scaling with T_H).
  const T = hawkingTemperature_K(currentMass_kg());
  const glowAlpha = Math.min(0.95, Math.max(0.25, Math.log10(T + 1) * 0.04 + 0.3));
  const grad = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.4);
  grad.addColorStop(0, `rgba(255, 150, 80, ${glowAlpha})`);
  grad.addColorStop(0.5, 'rgba(255, 100, 200, 0.18)');
  grad.addColorStop(1, 'rgba(100, 80, 220, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2); ctx.fill();
  // Event horizon (solid black disk).
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 180, 100, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
}

function drawHorizonParticles() {
  const cx = SCENE.x + SCENE.w / 2;
  const cy = SCENE.y + SCENE.h / 2;
  const r = 70;
  // Pair flashes: pop just outside the horizon.
  for (const f of st.flashes) {
    const fr = r * (1 + 0.04 + 0.3 * (f.age / f.lifetime));
    const px = cx + fr * Math.cos(f.angle);
    const py = cy + fr * Math.sin(f.angle);
    const a = 1 - f.age / f.lifetime;
    ctx.fillStyle = `rgba(255, 255, 220, ${a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(px, py, 4 + 6 * a, 0, Math.PI * 2); ctx.fill();
    // Tiny in-falling streak: a short trail from outside to inside.
    ctx.strokeStyle = `rgba(200, 220, 255, ${(0.4 * a).toFixed(3)})`;
    ctx.lineWidth = 1.0;
    const a1 = f.angle;
    const pInside = { x: cx + (r - 4 * a) * Math.cos(a1), y: cy + (r - 4 * a) * Math.sin(a1) };
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(pInside.x, pInside.y); ctx.stroke();
  }
  // Escaping quanta: small white-blue dots moving outward.
  for (const e of st.escapers) {
    const px = cx + e.x * r * 2.0;
    const py = cy + e.y * r * 2.0;
    const a = Math.max(0.05, 1 - 0.5 * Math.hypot(e.x, e.y));
    ctx.fillStyle = `rgba(190, 230, 255, ${a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
    // Tail
    ctx.strokeStyle = `rgba(190, 230, 255, ${(a * 0.4).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - e.vx * r * 0.4, py - e.vy * r * 0.4);
    ctx.stroke();
  }
}

function drawSidePanel() {
  const { x, y, w, h } = PANEL;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Evaporation timeline', x + 8, y - 6);

  // Top half: M(t) curve. Bottom half: T_H(t) curve.
  const midY = y + h / 2;
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.25)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(x, midY); ctx.lineTo(x + w, midY); ctx.stroke();
  ctx.setLineDash([]);

  // Sample M and T_H over [0, t_evap].
  const M0 = M0_kg();
  const tev = tEvap_s();
  const N = 200;
  // M(t) curve
  ctx.strokeStyle = 'rgba(140, 220, 255, 0.95)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    const f = k / (N - 1);
    const t = f * tev;
    const M = massAtTime_kg(M0, t);
    const xx = x + 20 + (k / (N - 1)) * (w - 40);
    const yy = (midY - 8) - (M / M0) * ((midY - y) * 0.85);
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // T_H(t) curve (normalized log).
  ctx.strokeStyle = 'rgba(255, 150, 120, 0.95)';
  ctx.lineWidth = 1.6;
  // T_H at t -> inf goes to infinity, so log scale.
  const Tmin = Math.log10(hawkingTemperature_K(M0));
  const Tmax = Math.log10(hawkingTemperature_K(M0 / 100));     // large enough
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    const f = k / (N - 1);
    const t = f * tev;
    const M = massAtTime_kg(M0, t);
    if (M <= 0) break;
    const Tk = hawkingTemperature_K(M);
    const lt = Math.log10(Tk);
    const u = (lt - Tmin) / Math.max(1e-9, (Tmax - Tmin));
    const xx = x + 20 + (k / (N - 1)) * (w - 40);
    const yy = (y + h - 8) - Math.max(0, Math.min(1, u)) * ((y + h - midY) * 0.85);
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Current-position markers.
  const xCur = x + 20 + st.frac * (w - 40);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xCur, y + 8); ctx.lineTo(xCur, y + h - 8); ctx.stroke();
  ctx.setLineDash([]);

  // Labels
  ctx.fillStyle = 'rgba(140, 220, 255, 0.95)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('M(t) (linear)', x + 24, y + 18);
  ctx.fillStyle = 'rgba(255, 150, 120, 0.95)';
  ctx.fillText('T_H(t) (log)', x + 24, midY + 14);
  // Axis labels (time).
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('0', x + 20, y + h - 10);
  ctx.fillText('t_evap', x + w - 45, y + h - 10);
}

function updateReadout() {
  const M = currentMass_kg();
  const rs = schwarzschildRadius_m(M);
  const T = hawkingTemperature_K(M);
  const P = hawkingPower_W(M);
  const tev = evaporationTime_yr(M);
  rM.textContent = M.toExponential(3) + ' kg';
  rRs.textContent = rs < 1 ? rs.toExponential(2) + ' m' : (rs).toExponential(2) + ' m';
  rT.textContent = T.toExponential(3) + ' K';
  rP.textContent = P.toExponential(3) + ' W';
  rTev.textContent = tev.toExponential(2) + ' yr';
}

function draw() {
  drawBackground();
  drawBlackHole();
  drawHorizonParticles();
  drawSidePanel();
  updateReadout();
  // Caption strip
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`M0 = ${M0_kg().toExponential(2)} kg, t/t_evap = ${st.frac.toFixed(2)}`, 14, H - 14);
}

function readSliders() {
  st.logM0 = parseFloat(sLogM.value);
  st.frac = parseFloat(sFrac.value);
  st.speed = parseInt(sSpeed.value, 10);
  vLogM.textContent = st.logM0.toFixed(1);
  vFrac.textContent = st.frac.toFixed(2);
  vSpeed.textContent = String(st.speed);
}

function applyPreset(name) {
  if (name === 'primordial') st.logM0 = Math.log10(PRIMORDIAL_BH_KG);
  else if (name === 'solar') st.logM0 = Math.log10(1.989e30);
  else if (name === 'kilo') st.logM0 = 5.0;
  sLogM.value = String(st.logM0);
  readSliders();
}

[sLogM, sFrac, sSpeed].forEach(el => el.addEventListener('input', readSliders));
selPreset.addEventListener('change', () => applyPreset(selPreset.value));
btnReset.addEventListener('click', () => {
  st.t = 0; st.frac = 0; sFrac.value = '0'; readSliders();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  mass_kg: { get: () => st.logM0, set: v => { st.logM0 = parseFloat(v); sLogM.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  st.frac = 0.05 + 0.85 * (CAPTURE_FRAC || 0);
  sFrac.value = String(st.frac);
  // Pre-step particle animation.
  let tt = 0;
  while (tt < 1.5) {
    stepParticles(0.05);
    tt += 0.05;
  }
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) {
      stepParticles(dt);
      st.t += dt;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const M = currentMass_kg();
  return {
    fields: [
      { key: 'mass', label: 'black hole mass (kg)', value: M, format: 'sci' },
      { key: 'hawking-temp', label: 'Hawking temperature (K)', value: hawkingTemperature_K(M), format: 'sci' },
      { key: 'hawking-power', label: 'Hawking power (W)', value: hawkingPower_W(M), format: 'sci' },
      { key: 'schwarzschild', label: 'Schwarzschild radius (m)', value: schwarzschildRadius_m(M), format: 'sci' },
    ],
  };
};
// The Hawking temperature is inversely proportional to the black
// hole mass, T = hbar c^3 / (8 pi G k M), so the product T*M is a
// universal constant: comparing it at M and 2M is the invariant.
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const M = currentMass_kg();
      if (!(M > 0)) return [];
      const p1 = hawkingTemperature_K(M) * M;
      const p2 = hawkingTemperature_K(2 * M) * (2 * M);
      if (!(p1 > 0)) return [];
      const dev = Math.abs(p1 - p2) / p1;
      return [{
        key: 'hawking-scaling',
        label: 'Hawking temperature scales as 1/M',
        value: dev.toExponential(2),
        status: dev < 1e-6 ? 'pass' : (dev < 1e-3 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}
