// Aurora borealis playground. Canvas2D 3D-projected Earth + dipole field
// lines + a swarm of charged particles integrated by the Boris pusher.
// Atmospheric excitation lights up the auroral oval. See sim.js for the
// integration; references Stormer 1955 and the Boris 1970 pusher.

import { stepLorentz, dipoleField, spawnParticle, checkAuroralExcitation, REARTH, RAURORA } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rN = document.getElementById('readout-n');
const rHits = document.getElementById('readout-hits');
const rStep = document.getElementById('readout-step');
const sInject = document.getElementById('slider-inject'), vInject = document.getElementById('value-inject');
const sMdip = document.getElementById('slider-mdip'), vMdip = document.getElementById('value-mdip');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const sTilt = document.getElementById('slider-tilt'), vTilt = document.getElementById('value-tilt');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  inject: 3, mdip: 1.4, speed: 2, tilt: 0.5, az: 0.6,
  running: !prefersReducedMotion(),
  particles: [], hits: [], nSteps: 0, nHits: 0,
  MAX_PARTICLES: 200, MAX_HITS: 80,
};

// Deterministic LCG so animation is reproducible.
let _seed = 0xC0FFEE;
function rand() {
  _seed = (_seed * 1664525 + 1013904223) | 0;
  return ((_seed >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
}

function project(x, y, z) {
  const ca = Math.cos(st.az), sa = Math.sin(st.az);
  const xp = ca * x - sa * z;
  const zp = sa * x + ca * z;
  const ct = Math.cos(st.tilt), stl = Math.sin(st.tilt);
  const yp = ct * y - stl * zp;
  const zr = stl * y + ct * zp;
  const cam = 15;
  const f = 380 / (cam + zr);
  return { x: W * 0.5 + f * xp, y: H * 0.5 - f * yp, depth: cam + zr, scale: f / 25 };
}

function fieldLineFrom(L_shell) {
  // Closed dipole field line parameterized by latitude lambda
  //   r(lambda) = L_shell * cos^2(lambda)
  // Return array of (x, y, z) in the y=0 plane.
  const pts = [];
  for (let i = 0; i <= 64; i += 1) {
    const lam = -Math.PI / 2 + Math.PI * (i / 64);
    const r = L_shell * Math.cos(lam) * Math.cos(lam);
    if (r < REARTH * 0.95) continue;
    pts.push([r * Math.cos(lam), r * Math.sin(lam), 0]);
  }
  return pts;
}

function drawFieldLines() {
  // Draw closed dipole field lines for several L-shells, projected.
  ctx.lineWidth = 0.8;
  for (const Lshell of [1.6, 2.2, 3.0, 4.0, 5.0, 6.5]) {
    const azs = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4];
    for (const az0 of azs) {
      const ca = Math.cos(az0), sa = Math.sin(az0);
      ctx.strokeStyle = `rgba(120, 160, 220, ${0.10 + 0.05 * (Lshell / 6)})`;
      ctx.beginPath();
      const line = fieldLineFrom(Lshell);
      for (let k = 0; k < line.length; k += 1) {
        // Rotate around z by az0
        const x = line[k][0] * ca - line[k][2] * sa;
        const z = line[k][0] * sa + line[k][2] * ca;
        const y = line[k][1];
        const p = project(x, y, z);
        if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }
}

function drawEarth() {
  // Render Earth as a shaded sphere. Compute the projected radius via
  // the camera scale at the origin, which is sign-independent and
  // always positive.
  const center = project(0, 0, 0);
  const R = Math.max(8, center.scale * 80);   // map "1 world unit" -> pixels
  // Globe
  const g = ctx.createRadialGradient(center.x - R * 0.3, center.y - R * 0.3, R * 0.1, center.x, center.y, R);
  g.addColorStop(0, '#3b6eb0');
  g.addColorStop(0.6, '#1a3a66');
  g.addColorStop(1, '#0b1e36');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(center.x, center.y, R, 0, Math.PI * 2); ctx.fill();
  // Equator + meridians
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.18)';
  ctx.lineWidth = 1;
  // Equator: y=0 great circle in the rotated frame
  ctx.beginPath();
  for (let k = 0; k <= 64; k += 1) {
    const phi = (k / 64) * 2 * Math.PI;
    const p = project(Math.cos(phi), 0, Math.sin(phi));
    if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  // Polar axis
  const top = project(0, 1.4, 0);
  const bot = project(0, -1.4, 0);
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bot.x, bot.y); ctx.stroke();
}

function drawAuroralOval() {
  // Auroral oval at latitude lambda ~ 67 deg.
  const lamA = (90 - 67) * Math.PI / 180;
  for (const sign of [1, -1]) {
    ctx.strokeStyle = sign > 0 ? 'rgba(80, 220, 120, 0.55)' : 'rgba(80, 220, 120, 0.35)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let k = 0; k <= 64; k += 1) {
      const phi = (k / 64) * 2 * Math.PI;
      const r = REARTH * 1.02;
      const x = r * Math.sin(lamA) * Math.cos(phi);
      const z = r * Math.sin(lamA) * Math.sin(phi);
      const y = sign * r * Math.cos(lamA);
      const p = project(x, y, z);
      if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
}

function drawParticles() {
  // Z-order by depth.
  const ps = st.particles.map((p) => ({ p, proj: project(p.x, p.y, p.z) }));
  ps.sort((a, b) => b.proj.depth - a.proj.depth);
  for (const { p, proj } of ps) {
    if (proj.x < 0 || proj.x > W || proj.y < 0 || proj.y > H) continue;
    ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
    ctx.beginPath(); ctx.arc(proj.x, proj.y, 1.6, 0, 2 * Math.PI); ctx.fill();
  }
}

function drawAuroraHits() {
  // Fade-out the recent auroral-emission deposits.
  for (let i = st.hits.length - 1; i >= 0; i -= 1) {
    const h = st.hits[i];
    h.age += 1;
    if (h.age > 60) { st.hits.splice(i, 1); continue; }
    const a = (1 - h.age / 60) * 0.85;
    const col = h.color === 'green'
      ? `rgba(80, 235, 130, ${a.toFixed(2)})`
      : `rgba(245, 100, 100, ${a.toFixed(2)})`;
    const p = project(h.x, h.y, h.z);
    // Glow
    const r = 14 + (1 - h.age / 60) * 8;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, col.replace(/\d.\d+\)$/, '0)'));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 2 * Math.PI); ctx.fill();
  }
}

function update(dt) {
  // Inject new particles.
  for (let k = 0; k < st.inject; k += 1) {
    if (st.particles.length < st.MAX_PARTICLES) {
      const p = spawnParticle(rand);
      st.particles.push(p);
    }
  }
  // Step each particle.
  for (let i = st.particles.length - 1; i >= 0; i -= 1) {
    const p = st.particles[i];
    stepLorentz(p, dt, 1.0, st.mdip);
    p.age += dt;
    // Check excitation
    const color = checkAuroralExcitation(p);
    if (color) {
      // Snap a hit at the impact position.
      st.hits.push({ x: p.x, y: p.y, z: p.z, color, age: 0 });
      if (st.hits.length > st.MAX_HITS) st.hits.shift();
      st.nHits += 1;
      // Remove particle (it deposited its energy).
      st.particles.splice(i, 1);
      continue;
    }
    // Particle escaped too far
    const r2 = p.x * p.x + p.y * p.y + p.z * p.z;
    if (r2 > 100 || p.age > 30) st.particles.splice(i, 1);
  }
  st.nSteps += 1;
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  // Faint starfield
  let s = 7;
  ctx.fillStyle = 'rgba(180, 200, 255, 0.2)';
  for (let i = 0; i < 220; i += 1) {
    s = (s * 16807) | 0;
    const u = ((s >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
    s = (s * 16807) | 0;
    const v = ((s >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
    ctx.fillRect(u * W, v * H, 1, 1);
  }

  // Order: field lines behind, Earth, auroral oval, particles, hits in front.
  drawFieldLines();
  drawEarth();
  drawAuroralOval();
  drawParticles();
  drawAuroraHits();

  // Top-left HUD
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`particles: ${st.particles.length}    aurora hits: ${st.nHits}    step: ${st.nSteps}`, 24, 22);
  ctx.fillText(`solar-wind protons → magnetic mirror → atmospheric oxygen → 558 nm (green) / 630 nm (red)`, 24, 40);

  rN.textContent = String(st.particles.length);
  rHits.textContent = String(st.nHits);
  rStep.textContent = String(st.nSteps);
}

function tick() {
  if (st.running) {
    const dt = 0.04 * Math.max(1, st.speed);
    for (let k = 0; k < st.speed; k += 1) update(dt / Math.max(1, st.speed));
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vInject.textContent = String(st.inject);
  vMdip.textContent = st.mdip.toFixed(1);
  vSpeed.textContent = String(st.speed);
  vTilt.textContent = st.tilt.toFixed(2);
}

sInject.addEventListener('input', () => { st.inject = parseInt(sInject.value, 10); syncLabels(); });
sMdip.addEventListener('input', () => { st.mdip = parseFloat(sMdip.value); syncLabels(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });
sTilt.addEventListener('input', () => { st.tilt = parseFloat(sTilt.value); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.inject = 3; st.mdip = 1.4; st.speed = 2; st.tilt = 0.5;
  st.particles.length = 0; st.hits.length = 0; st.nHits = 0; st.nSteps = 0;
  _seed = 0xC0FFEE;
  sInject.value = '3'; sMdip.value = '1.4'; sSpeed.value = '2'; sTilt.value = '0.5';
  syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

// Drag to rotate.
let dragging = false, lastX = 0;
canvas.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; });
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  st.az += (e.clientX - lastX) * 0.005;
  lastX = e.clientX;
});

function getState() { return { seed: 0xC0FFEE }; }
function restoreState() { /* nothing to restore beyond defaults */ }

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.az = 0.4 + f * 1.6;
    // Cap particle budget for capture to keep gate within 30s.
    st.inject = 1;
    st.MAX_PARTICLES = 30;
    const steps = 15 + Math.floor(f * 15);
    for (let n = 0; n < steps; n += 1) update(0.04);
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
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
