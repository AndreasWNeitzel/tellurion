// Earth-Moon-Sun eclipse predictor playground. Heliocentric 3D Canvas2D
// rendering of the three bodies plus the Moon's tilted orbit. Eclipse
// detection uses the angular-radius test from sim.js. Reference:
// Meeus, Astronomical Algorithms, 2nd ed.

import { ephemeris, eclipseState, predictNext, REAL } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rDay = document.getElementById('readout-day');
const rTheta = document.getElementById('readout-theta');
const rState = document.getElementById('readout-state');
const sT = document.getElementById('slider-t'), vT = document.getElementById('value-t');
const sTilt = document.getElementById('slider-tilt'), vTilt = document.getElementById('value-tilt');
const btnNextSolar = document.getElementById('btn-next-solar');
const btnNextLunar = document.getElementById('btn-next-lunar');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = { t: 0, tilt: 0.5, az: 0.6, running: false };

// 3D -> 2D perspective projection. Heliocentric coords with x-y in
// ecliptic, z perpendicular.
function project(x, y, z) {
  const ca = Math.cos(st.az), sa = Math.sin(st.az);
  const xp = ca * x - sa * y;
  const yp = sa * x + ca * y;
  const ct = Math.cos(st.tilt), stl = Math.sin(st.tilt);
  const yr = ct * yp - stl * z;
  const zr = stl * yp + ct * z;
  const camDist = 3;
  const f = 280 / (camDist + zr);
  return { x: W * 0.5 + f * xp, y: H * 0.5 - f * yr, depth: camDist + zr, scale: f / 80 };
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const e = ephemeris(st.t);
  const ecl = eclipseState(st.t);

  // Earth orbit (ecliptic circle).
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k <= 64; k += 1) {
    const ph = (k / 64) * 2 * Math.PI;
    const p = project(Math.cos(ph), Math.sin(ph), 0);
    if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // Moon's tilted orbit around Earth (scaled up for visualization).
  const a_moon_scale = 0.13;
  const i = REAL.i_moon_rad;
  ctx.strokeStyle = ecl.isSolar ? 'rgba(255, 209, 102, 0.95)' : ecl.isLunar ? 'rgba(255, 130, 130, 0.95)' : 'rgba(180, 200, 255, 0.25)';
  ctx.lineWidth = ecl.isSolar || ecl.isLunar ? 2 : 1;
  ctx.beginPath();
  for (let k = 0; k <= 64; k += 1) {
    const ph = (k / 64) * 2 * Math.PI;
    const xMl = a_moon_scale * Math.cos(ph);
    const yMl = a_moon_scale * Math.sin(ph);
    const xMt = xMl;
    const yMt = yMl * Math.cos(i);
    const zMt = yMl * Math.sin(i);
    const p = project(e.xE + xMt, e.yE + yMt, e.zE + zMt);
    if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // Determine draw order by depth.
  const bodies = [];
  bodies.push({ name: 'sun', p: project(0, 0, 0), r: 20, color: '#ffd166', corona: true });
  const pE = project(e.xE, e.yE, e.zE);
  bodies.push({ name: 'earth', p: pE, r: 9, color: '#5bc0eb' });
  // Moon (scaled position).
  const ph = (2 * Math.PI * st.t / REAL.T_moon) % (2 * Math.PI);
  const xMt = a_moon_scale * Math.cos(ph);
  const yMt = a_moon_scale * Math.sin(ph) * Math.cos(i);
  const zMt = a_moon_scale * Math.sin(ph) * Math.sin(i);
  const pM = project(e.xE + xMt, e.yE + yMt, e.zE + zMt);
  bodies.push({ name: 'moon', p: pM, r: 4, color: '#cccccc' });
  bodies.sort((a, b) => b.p.depth - a.p.depth);
  for (const b of bodies) {
    if (b.corona) {
      const g = ctx.createRadialGradient(b.p.x, b.p.y, 0, b.p.x, b.p.y, b.r * 3);
      g.addColorStop(0, 'rgba(255, 220, 130, 0.55)');
      g.addColorStop(1, 'rgba(255, 220, 130, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.p.x, b.p.y, b.r * 3, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.p.x, b.p.y, b.r, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.stroke();
  }

  // Top label band.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`day ${st.t.toFixed(1)}    θ = ${(ecl.theta * 180 / Math.PI).toFixed(3)}°`, 24, 22);
  let stateLabel;
  if (ecl.isSolar) stateLabel = 'SOLAR ECLIPSE: Moon between Earth and Sun';
  else if (ecl.isLunar) stateLabel = 'LUNAR ECLIPSE: Moon in Earth\'s shadow';
  else stateLabel = `no eclipse (next would need θ within ${((ecl.angSun + ecl.angMoon) * 180 / Math.PI).toFixed(2)}°)`;
  const col = ecl.isSolar ? '#ffd166' : ecl.isLunar ? '#ff8080' : 'rgba(255,255,255,0.65)';
  ctx.fillStyle = col;
  ctx.fillText(stateLabel, 24, 40);

  rDay.textContent = st.t.toFixed(1);
  rTheta.textContent = `${(ecl.theta * 180 / Math.PI).toFixed(2)}°`;
  rState.textContent = ecl.isSolar ? 'SOLAR' : ecl.isLunar ? 'LUNAR' : 'none';
}

function tick() {
  if (st.running) {
    st.t += 0.5;
    if (st.t > 730) st.t = 0;
    sT.value = String(st.t);
    vT.textContent = st.t.toFixed(1);
  }
  render();
  requestAnimationFrame(tick);
}

sT.addEventListener('input', () => { st.t = parseFloat(sT.value); vT.textContent = st.t.toFixed(1); });
sTilt.addEventListener('input', () => { st.tilt = parseFloat(sTilt.value); vTilt.textContent = st.tilt.toFixed(2); });
btnNextSolar.addEventListener('click', () => {
  const found = predictNext(st.t, 'solar', 500, 0.25);
  if (found) { st.t = found.t; sT.value = String(st.t); vT.textContent = st.t.toFixed(1); render(); }
});
btnNextLunar.addEventListener('click', () => {
  const found = predictNext(st.t, 'lunar', 500, 0.25);
  if (found) { st.t = found.t; sT.value = String(st.t); vT.textContent = st.t.toFixed(1); render(); }
});
btnReset.addEventListener('click', () => {
  st.t = 0; st.tilt = 0.5; st.az = 0.6; st.running = false;
  sT.value = '0'; sTilt.value = '0.5';
  vT.textContent = '0'; vTilt.textContent = '0.50';
  btnPause.textContent = 'Play'; btnPause.setAttribute('aria-pressed', 'true');
  render();
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

function bootSync() {
  if (CAPTURE_NAME) {
    // Sweep cosmic time across captures; t-050 should be near an
    // eclipse for the goldens to be distinct.
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Find the first solar eclipse and place captures around it.
    const found = predictNext(0, 'solar', 400, 0.25);
    const tEcl = found ? found.t : 30;
    st.t = tEcl - 60 + f * 120;
    sT.value = String(st.t);
    vT.textContent = st.t.toFixed(1);
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
