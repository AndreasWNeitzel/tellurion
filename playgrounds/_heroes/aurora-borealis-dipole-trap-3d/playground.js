// Aurora borealis playground. Canvas2D 3D-projected Earth + dipole field
// lines + a swarm of charged particles integrated by the Boris pusher.
// Atmospheric excitation lights up the auroral oval. See sim.js for the
// integration; references Stormer 1955 and the Boris 1970 pusher.

import { stepLorentz, dipoleField, spawnParticle, checkAuroralExcitation, REARTH, RAURORA } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

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
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  inject: 3, mdip: 1.4, speed: 2, tilt: 0.5, az: 0.6, zoom: 1.0,
  running: !prefersReducedMotion(),
  particles: [], hits: [], nSteps: 0, nHits: 0,
  MAX_PARTICLES: 420, MAX_HITS: 120,
  // Diagnostic: hits binned by magnetic latitude (in degrees, -90..+90).
  latHist: new Int32Array(36),
  // Time series of particle count.
  particleCountHistory: [],
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
  // Camera distance is divided by zoom: zoom > 1 brings camera closer
  // (larger Earth, finer field-line detail visible).
  const cam = 15 / Math.max(0.4, Math.min(6, st.zoom));
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
  // Closed dipole field lines for several L-shells. Brightened from
  // the previous nearly-invisible alpha (0.10) so the magnetic
  // structure that guides charged particles to the poles is plainly
  // visible. More azimuthal samples (8) give the lines a "cage"
  // appearance.
  ctx.lineWidth = 1.1;
  for (const Lshell of [1.6, 2.2, 3.0, 4.0, 5.0, 6.5]) {
    const azs = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4];
    for (const az0 of azs) {
      const ca = Math.cos(az0), sa = Math.sin(az0);
      ctx.strokeStyle = `rgba(160, 200, 250, ${(0.22 + 0.10 * (Lshell / 6)).toFixed(2)})`;
      ctx.beginPath();
      const line = fieldLineFrom(Lshell);
      for (let k = 0; k < line.length; k += 1) {
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

// Ionosphere shell: translucent sphere at R = 1.05 R_E that the
// auroral oval sits on. Drawn AFTER the field lines and BEFORE the
// Earth so the structure reads as nested layers (B field outside,
// ionosphere shell, Earth at the centre).
function drawIonosphere() {
  const center = project(0, 0, 0);
  const refR = project(REARTH * 1.06, 0, 0);
  const Rpx = Math.hypot(refR.x - center.x, refR.y - center.y);
  const g = ctx.createRadialGradient(center.x, center.y, Rpx * 0.93, center.x, center.y, Rpx);
  g.addColorStop(0, 'rgba(60, 180, 230, 0.00)');
  g.addColorStop(0.85, 'rgba(60, 180, 230, 0.12)');
  g.addColorStop(1, 'rgba(120, 220, 255, 0.22)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(center.x, center.y, Rpx, 0, Math.PI * 2); ctx.fill();
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
  // Auroral oval at magnetic latitude ~ 67 deg, drawn as a thick glowing
  // GREEN BAND on the ionosphere shell (north = borealis, south =
  // australis). Two concentric rings (66 deg, 68 deg) shaded inwards
  // give the visual impression of a continuous band.
  for (const sign of [1, -1]) {
    for (let layer = 0; layer < 3; layer += 1) {
      const latDeg = 67 + (layer - 1) * 1.6;
      const lamA = (90 - latDeg) * Math.PI / 180;
      const alpha = sign > 0 ? (0.85 - layer * 0.18) : (0.55 - layer * 0.12);
      ctx.strokeStyle = `rgba(80, 235, 130, ${alpha.toFixed(2)})`;
      ctx.lineWidth = 3.5 - layer * 0.8;
      ctx.shadowColor = 'rgba(80, 235, 130, 0.6)';
      ctx.shadowBlur = layer === 1 ? 12 : 0;
      ctx.beginPath();
      for (let k = 0; k <= 96; k += 1) {
        const phi = (k / 96) * 2 * Math.PI;
        const r = REARTH * 1.04;
        const x = r * Math.sin(lamA) * Math.cos(phi);
        const z = r * Math.sin(lamA) * Math.sin(phi);
        const y = sign * r * Math.cos(lamA);
        const p = project(x, y, z);
        if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // Labels, placed well clear of the globe along the polar axis.
    const p = project(0, sign * 2.15, 0);
    ctx.fillStyle = 'rgba(110, 240, 150, 0.9)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.textAlign = 'center';
    ctx.fillText(sign > 0 ? 'aurora borealis (N)' : 'aurora australis (S)', p.x, p.y);
    ctx.textAlign = 'left';
  }
}

function drawParticles() {
  // Each particle is drawn as a short streak along its velocity, so
  // the incoming solar wind reads as a directed flow rather than a
  // dot cloud. Colour encodes the phase: cool blue in the free
  // streaming region, pale blue once gyrating in the magnetosphere,
  // and green as it magnetises and funnels along a field line toward
  // a pole. Z-ordered back-to-front.
  const ps = st.particles.map((p) => ({ p, proj: project(p.x, p.y, p.z) }));
  ps.sort((a, b) => b.proj.depth - a.proj.depth);
  for (const { p, proj } of ps) {
    if (proj.x < -30 || proj.x > W + 30 || proj.y < -30 || proj.y > H + 30) continue;
    const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz) || 1e-6;
    const k = 0.7 / sp;                              // streak ~ fixed world length
    const tail = project(p.x - p.vx * k, p.y - p.vy * k, p.z - p.vz * k);
    const sinLat = Math.abs(p.y) / Math.max(1e-6, r);
    let col;
    if (r > 4.6) col = 'rgba(140, 190, 255, 0.5)';            // free solar wind
    else if (sinLat > 0.6) col = 'rgba(120, 240, 160, 0.95)';  // funnelling to a pole
    else col = 'rgba(195, 220, 255, 0.85)';                    // gyrating / trapped
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(proj.x, proj.y); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(proj.x, proj.y, 1.4, 0, 2 * Math.PI); ctx.fill();
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
    // q/m raised so the gyroradius is far smaller than the field-line
    // scale near Earth: the particle becomes magnetised, follows the
    // converging field lines, and funnels to the poles. Far out the
    // field is negligible so the stream still travels nearly straight.
    stepLorentz(p, dt, 8.0, st.mdip);
    p.age += dt;
    // Check excitation
    const color = checkAuroralExcitation(p);
    if (color) {
      // Snap a hit at the impact position.
      st.hits.push({ x: p.x, y: p.y, z: p.z, color, age: 0 });
      if (st.hits.length > st.MAX_HITS) st.hits.shift();
      st.nHits += 1;
      // Bin the impact by magnetic latitude (= asin(y / |r|)) into a
      // 36-bin histogram from -90 to +90 deg. The bimodal peaks at
      // +/- 67 deg are the auroral ovals.
      const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      const latDeg = Math.asin(p.y / Math.max(1e-9, r)) * 180 / Math.PI;
      const bin = Math.max(0, Math.min(35, Math.floor((latDeg + 90) / 5)));
      st.latHist[bin] += 1;
      // Remove particle (it deposited its energy).
      st.particles.splice(i, 1);
      continue;
    }
    // Retire particles that escape or have lived long enough; keeping
    // long-lived trapped particles only builds a stale cloud that
    // hides the incoming stream.
    const r2 = p.x * p.x + p.y * p.y + p.z * p.z;
    if (r2 > 121 || p.age > 20) st.particles.splice(i, 1);
  }
  st.nSteps += 1;
  // Sample particle count time series every 4 steps.
  if (st.nSteps % 4 === 0) {
    st.particleCountHistory.push(st.particles.length);
    if (st.particleCountHistory.length > 240) st.particleCountHistory.shift();
  }
}

// Diagnostic panels along the right-hand edge: hits-by-latitude
// histogram and particle-count time series. These give the visualization
// physical depth beyond the 3D scene.
function drawDiagnostics() {
  // Panel layout: 220 px wide column on the right.
  const px = W - 232, py = 60, pw = 216;
  // Hits-by-latitude histogram.
  const hh = 130;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(px, py, pw, hh);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.30)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, hh - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText('hits / magnetic latitude', px + 8, py - 4);
  // Histogram bars.
  let hmax = 1;
  for (let b = 0; b < 36; b += 1) if (st.latHist[b] > hmax) hmax = st.latHist[b];
  const barW = (pw - 18) / 36;
  for (let b = 0; b < 36; b += 1) {
    const h = (st.latHist[b] / hmax) * (hh - 30);
    // Latitude of this bin (degrees): -90 + (b + 0.5) * 5.
    const lat = -90 + (b + 0.5) * 5;
    // Colour: green near +- 67 (auroral oval), faint elsewhere.
    const auroralBoost = Math.max(0, 1 - Math.abs(Math.abs(lat) - 67) / 12);
    const r = Math.round(80 + 80 * auroralBoost);
    const g = Math.round(180 + 40 * auroralBoost);
    const bcol = Math.round(120 - 40 * auroralBoost);
    ctx.fillStyle = `rgba(${r}, ${g}, ${bcol}, ${(0.5 + 0.45 * auroralBoost).toFixed(2)})`;
    ctx.fillRect(px + 9 + b * barW, py + hh - 16 - h, barW - 0.6, h);
  }
  // Latitude tick labels.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.65)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (const tlat of [-90, -45, 0, 45, 90]) {
    const x = px + 9 + ((tlat + 90) / 180) * (pw - 18);
    ctx.fillText(`${tlat}°`, x - 6, py + hh - 4);
  }
  // Auroral-oval reference lines at +- 67 degrees.
  ctx.strokeStyle = 'rgba(120, 220, 160, 0.65)';
  ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  for (const tlat of [-67, 67]) {
    const x = px + 9 + ((tlat + 90) / 180) * (pw - 18);
    ctx.beginPath(); ctx.moveTo(x, py + 6); ctx.lineTo(x, py + hh - 18); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Particle-count time series.
  const py2 = py + hh + 20, ph2 = 110;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(px, py2, pw, ph2);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.30)';
  ctx.strokeRect(px + 0.5, py2 + 0.5, pw - 1, ph2 - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText('particle population N(t)', px + 8, py2 - 4);
  const hist = st.particleCountHistory;
  let nmax = 1;
  for (const v of hist) if (v > nmax) nmax = v;
  ctx.strokeStyle = 'rgba(140, 220, 255, 0.95)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < hist.length; i += 1) {
    const x = px + 9 + (i / Math.max(1, hist.length - 1)) * (pw - 18);
    const y = py2 + ph2 - 10 - (hist[i] / nmax) * (ph2 - 28);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(180, 200, 240, 0.65)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`N_max = ${nmax}`, px + 8, py2 + 14);
  ctx.fillText(`now = ${st.particles.length}`, px + pw - 60, py2 + 14);
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

  // Order: field lines behind, Earth, ionosphere shell, auroral oval,
  // particles, hits in front. Ionosphere is a faint cyan glow ABOVE
  // the surface that the green oval band sits on.
  drawFieldLines();
  drawEarth();
  drawIonosphere();
  drawAuroralOval();
  drawParticles();
  drawAuroraHits();

  // Top-left HUD
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`particles: ${st.particles.length}    aurora hits: ${st.nHits}    step: ${st.nSteps}`, 24, 22);
  ctx.fillText(`solar-wind protons → magnetic mirror → atmospheric oxygen → 558 nm (green) / 630 nm (red)`, 24, 40);

  drawDiagnostics();

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
}

sInject.addEventListener('input', () => { st.inject = parseInt(sInject.value, 10); syncLabels(); });
sMdip.addEventListener('input', () => { st.mdip = parseFloat(sMdip.value); syncLabels(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.inject = 3; st.mdip = 1.4; st.speed = 2;
  st.particles.length = 0; st.hits.length = 0; st.nHits = 0; st.nSteps = 0;
  st.latHist.fill(0);
  _seed = 0xC0FFEE;
  sInject.value = '3'; sMdip.value = '1.4'; sSpeed.value = '2';
  syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

// Camera is fully drag-controlled: horizontal drag orbits (azimuth),
// vertical drag tilts. Wheel zooms. No camera slider (a slider for a
// 3D view reads as broken; direct drag is the expected interaction).
let dragging = false, lastX = 0, lastY = 0;
function dragStart(x, y) { dragging = true; lastX = x; lastY = y; }
function dragMove(x, y) {
  if (!dragging) return;
  st.az += (x - lastX) * 0.006;
  st.tilt = Math.max(-1.45, Math.min(1.45, st.tilt + (y - lastY) * 0.006));
  lastX = x; lastY = y;
}
canvas.addEventListener('pointerdown', (e) => { dragStart(e.clientX, e.clientY); canvas.setPointerCapture?.(e.pointerId); });
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => dragMove(e.clientX, e.clientY));
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  st.zoom = Math.max(0.4, Math.min(6, st.zoom * Math.exp(-e.deltaY * 0.0015)));
}, { passive: false });

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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
