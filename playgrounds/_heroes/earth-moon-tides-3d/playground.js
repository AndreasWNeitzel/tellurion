// Tides playground. Canvas2D perspective render of a 3D Earth with
// surface displaced by the lunar+solar L=2 tidal bulge. The Moon
// orbits Earth at the chosen phase; the Sun sits at +x.

import { tideAt, moonPosition, tidalRegime, A_LUNAR, A_SOLAR } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rPhase = document.getElementById('readout-phase');
const rRange = document.getElementById('readout-range');
const rRegime = document.getElementById('readout-regime');
const sPhase = document.getElementById('slider-phase'), vPhase = document.getElementById('value-phase');
const sScale = document.getElementById('slider-scale'), vScale = document.getElementById('value-scale');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  phaseDeg: 60, bulgeScale: 0.20, speed: 2,
  running: !prefersReducedMotion(),
  az: 0.6, tilt: 0.45,
};

// 3D perspective projection.
function project(x, y, z) {
  const ca = Math.cos(st.az), sa = Math.sin(st.az);
  const xp = ca * x - sa * z;
  const zp = sa * x + ca * z;
  const ct = Math.cos(st.tilt), stl = Math.sin(st.tilt);
  const yp = ct * y - stl * zp;
  const zr = stl * y + ct * zp;
  const cam = 6;
  const f = 280 / (cam + zr);
  return { x: W * 0.5 + f * xp, y: H * 0.5 - f * yp, depth: cam + zr, scale: f / 50 };
}

function drawEarthWithTides() {
  const phase = st.phaseDeg * Math.PI / 180;
  // Mesh on a sphere: lat-long grid
  const N_LAT = 32, N_LON = 48;
  const verts = new Array(N_LAT * N_LON);
  const heights = new Array(N_LAT * N_LON);
  for (let i = 0; i < N_LAT; i += 1) {
    const theta = (i + 0.5) / N_LAT * Math.PI;
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    for (let j = 0; j < N_LON; j += 1) {
      const phi = (j / N_LON) * 2 * Math.PI;
      const h = tideAt(theta, phi, phase);
      heights[i * N_LON + j] = h;
      const r = 1 + st.bulgeScale * h;
      const x = r * sinT * Math.cos(phi);
      const y = r * cosT;
      const z = r * sinT * Math.sin(phi);
      verts[i * N_LON + j] = { p: project(x, y, z), h };
    }
  }
  // Render as quads, depth-sorted.
  const quads = [];
  for (let i = 0; i < N_LAT - 1; i += 1) {
    for (let j = 0; j < N_LON; j += 1) {
      const jp = (j + 1) % N_LON;
      const v00 = verts[i * N_LON + j];
      const v01 = verts[i * N_LON + jp];
      const v10 = verts[(i + 1) * N_LON + j];
      const v11 = verts[(i + 1) * N_LON + jp];
      const depth = 0.25 * (v00.p.depth + v01.p.depth + v10.p.depth + v11.p.depth);
      const hAvg = 0.25 * (v00.h + v01.h + v10.h + v11.h);
      quads.push({ v00, v01, v10, v11, depth, h: hAvg });
    }
  }
  quads.sort((a, b) => b.depth - a.depth);

  // Color: blue Earth tinted by tide height (red where high, blue where low).
  for (const q of quads) {
    // Normalize h to [-1, 1] roughly
    const t = Math.max(-1.5, Math.min(1.5, q.h)) / 1.5;
    let r, g, b;
    if (t >= 0) {
      r = Math.round(50 + 180 * t);
      g = Math.round(80 + 80 * t);
      b = Math.round(100 - 50 * t);
    } else {
      const u = -t;
      r = Math.round(50 + 30 * u);
      g = Math.round(100 + 90 * u);
      b = Math.round(160 + 60 * u);
    }
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.moveTo(q.v00.p.x, q.v00.p.y);
    ctx.lineTo(q.v01.p.x, q.v01.p.y);
    ctx.lineTo(q.v11.p.x, q.v11.p.y);
    ctx.lineTo(q.v10.p.x, q.v10.p.y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawMoonAndSun() {
  const phase = st.phaseDeg * Math.PI / 180;
  const moonDist = 3.2;
  const [mx, my, mz] = moonPosition(phase);
  const moonP = project(mx * moonDist, my * moonDist, mz * moonDist);
  // Moon
  const g = ctx.createRadialGradient(moonP.x, moonP.y, 0, moonP.x, moonP.y, 18);
  g.addColorStop(0, 'rgba(220, 220, 220, 0.8)');
  g.addColorStop(1, 'rgba(220, 220, 220, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(moonP.x, moonP.y, 18, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#dddddd';
  ctx.beginPath(); ctx.arc(moonP.x, moonP.y, 6, 0, 2 * Math.PI); ctx.fill();
  // Sun (small, on the right edge of canvas)
  ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
  ctx.beginPath(); ctx.arc(W - 50, H / 2, 10, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
  ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(W - 60, H / 2); ctx.lineTo(project(1, 0, 0).x + 10, project(1, 0, 0).y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Moon', moonP.x, moonP.y + 24);
  ctx.fillText('→ Sun', W - 50, H / 2 + 24);
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  drawEarthWithTides();
  drawMoonAndSun();

  const phase = st.phaseDeg * Math.PI / 180;
  const reg = tidalRegime(phase);

  // Top label band.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`phase ${st.phaseDeg}°    A_lunar = ${A_LUNAR.toFixed(2)}    A_solar = ${A_SOLAR.toFixed(2)}`, 24, 22);
  let regLabel;
  if (reg.kind === 'spring') {
    regLabel = `SPRING TIDE: Sun and Moon align, tidal range = ${reg.range.toFixed(2)} (max ~ ${(A_LUNAR + A_SOLAR).toFixed(2)})`;
  } else {
    regLabel = `NEAP TIDE: Sun and Moon at quadrature, tidal range = ${reg.range.toFixed(2)} (min ~ ${(A_LUNAR - A_SOLAR).toFixed(2)})`;
  }
  ctx.fillStyle = reg.kind === 'spring' ? '#ffd166' : '#7dd3fc';
  ctx.fillText(regLabel, 24, 40);

  rPhase.textContent = `${st.phaseDeg}°`;
  rRange.textContent = reg.range.toFixed(3);
  rRegime.textContent = reg.kind;
}

function tick() {
  if (st.running) {
    st.phaseDeg = (st.phaseDeg + 0.3 * st.speed) % 360;
    sPhase.value = String(Math.round(st.phaseDeg));
    vPhase.textContent = String(Math.round(st.phaseDeg));
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vPhase.textContent = String(Math.round(st.phaseDeg));
  vScale.textContent = st.bulgeScale.toFixed(2);
  vSpeed.textContent = String(st.speed);
}

sPhase.addEventListener('input', () => { st.phaseDeg = parseInt(sPhase.value, 10); syncLabels(); });
sScale.addEventListener('input', () => { st.bulgeScale = parseFloat(sScale.value); syncLabels(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.phaseDeg = 60; st.bulgeScale = 0.20; st.speed = 2;
  sPhase.value = '60'; sScale.value = '0.20'; sSpeed.value = '2';
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

function getState() { return { phase: st.phaseDeg }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.phase) { st.phaseDeg = parseInt(s.phase, 10); sPhase.value = String(st.phaseDeg); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    // Sweep phase from new moon through quarter to full moon and back.
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.phaseDeg = Math.round(f * 360);
    sPhase.value = String(st.phaseDeg);
    syncLabels();
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
