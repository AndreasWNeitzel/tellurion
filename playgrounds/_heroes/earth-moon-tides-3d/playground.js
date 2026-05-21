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
  phaseDeg: 60, bulgeScale: 0.08, speed: 2,
  running: !prefersReducedMotion(),
  az: 0.6, tilt: 0.30, zoom: 1.0,
};

// sim.js uses z as the polar axis (Moon orbit in xy plane).
// The renderer uses y as the polar axis (Moon orbit in xz plane).
// Map sim (x, y, z) -> render (x, z, y) by swapping y and z.
function simToRender(sx, sy, sz) { return [sx, sz, sy]; }

// 3D perspective projection. Camera distance is modulated by st.zoom:
// larger zoom = camera closer to Earth so the bulge fills more of the
// canvas. Range [1, 6] keeps the geometry stable.
function project(x, y, z) {
  const ca = Math.cos(st.az), sa = Math.sin(st.az);
  const xp = ca * x - sa * z;
  const zp = sa * x + ca * z;
  const ct = Math.cos(st.tilt), stl = Math.sin(st.tilt);
  const yp = ct * y - stl * zp;
  const zr = stl * y + ct * zp;
  const cam = 6 / Math.max(0.5, Math.min(6, st.zoom || 1));
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
      // sim.js convention: (sinT cos phi, sinT sin phi, cosT). Polar = z.
      // Renderer convention: y is up. simToRender swaps y and z.
      const sx = r * sinT * Math.cos(phi);
      const sy = r * sinT * Math.sin(phi);
      const sz = r * cosT;
      const [rx, ry, rz] = simToRender(sx, sy, sz);
      verts[i * N_LON + j] = { p: project(rx, ry, rz), h };
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

  // Color the planet as a real water-world: dim blue ocean as the base,
  // with depth shading from the perspective projection (depth tint) and
  // a subtle highlight where the tide bulges OUT (toward the camera).
  // The bulge is communicated by the SHAPE distortion (r = 1 + s*h
  // already applied to the vertices), not by an arbitrary heatmap.
  for (const q of quads) {
    // Camera-facing brightness: closer (smaller depth) = brighter.
    // depth is in arbitrary units; map to a [0.35, 1] brightness.
    const depthShade = Math.max(0.35, Math.min(1, 1.0 - q.depth * 0.06));
    // Subtle warm tint on the bulge crest, cooler tint in the depression.
    const tideShade = Math.max(-1, Math.min(1, q.h / (Math.abs(q.h) + 0.5)));
    // Ocean: cool deep-blue base.
    const baseR = 18, baseG = 72, baseB = 130;
    // Highlight tint (crest): adds a slight cyan-white.
    const crestR = 130, crestG = 190, crestB = 230;
    const blend = Math.max(0, tideShade) * 0.55;
    const r = Math.round((baseR * (1 - blend) + crestR * blend) * depthShade);
    const g = Math.round((baseG * (1 - blend) + crestG * blend) * depthShade);
    const b = Math.round((baseB * (1 - blend) + crestB * blend) * depthShade);
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
  const [mxS, myS, mzS] = moonPosition(phase);
  const [mx, my, mz] = simToRender(mxS * moonDist, myS * moonDist, mzS * moonDist);
  const moonP = project(mx, my, mz);
  // Lunar orbit trace (equator in render frame).
  ctx.strokeStyle = 'rgba(220, 220, 220, 0.18)';
  ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k <= 96; k++) {
    const a = (k / 96) * 2 * Math.PI;
    const [px, py, pz] = simToRender(Math.cos(a) * moonDist, Math.sin(a) * moonDist, 0);
    const p = project(px, py, pz);
    if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // Moon.
  const g = ctx.createRadialGradient(moonP.x, moonP.y, 0, moonP.x, moonP.y, 18);
  g.addColorStop(0, 'rgba(220, 220, 220, 0.85)');
  g.addColorStop(1, 'rgba(220, 220, 220, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(moonP.x, moonP.y, 18, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#dddddd';
  ctx.beginPath(); ctx.arc(moonP.x, moonP.y, 6, 0, 2 * Math.PI); ctx.fill();
  // Sun: projected at large +x distance in sim frame (which is +x in render).
  // We cannot draw the Sun in its actual scale (1 AU); we put a visual marker
  // at a moderate distance and indicate that the real Sun is much farther.
  const sunDist = 9;
  const [sxR, syR, szR] = simToRender(sunDist, 0, 0);
  const sunP = project(sxR, syR, szR);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.95)';
  const sunGrad = ctx.createRadialGradient(sunP.x, sunP.y, 0, sunP.x, sunP.y, 22);
  sunGrad.addColorStop(0, 'rgba(255, 230, 150, 1)');
  sunGrad.addColorStop(0.4, 'rgba(255, 200, 100, 0.85)');
  sunGrad.addColorStop(1, 'rgba(255, 180, 80, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath(); ctx.arc(sunP.x, sunP.y, 22, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255, 220, 130, 1)';
  ctx.beginPath(); ctx.arc(sunP.x, sunP.y, 7, 0, 2 * Math.PI); ctx.fill();
  // Sunline arrow from sun to Earth showing tidal-force direction.
  ctx.strokeStyle = 'rgba(255, 200, 100, 0.30)';
  ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  const earthCenter = project(0, 0, 0);
  ctx.beginPath(); ctx.moveTo(sunP.x, sunP.y); ctx.lineTo(earthCenter.x, earthCenter.y); ctx.stroke();
  ctx.setLineDash([]);
  // Labels.
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Moon', moonP.x, moonP.y + 24);
  ctx.fillStyle = 'rgba(255, 220, 130, 0.95)';
  ctx.fillText('Sun (not to scale, real distance 390x lunar)', sunP.x, sunP.y + 28);
  ctx.textAlign = 'left';
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

  drawRangeDiagnostic();
}

// Rule-13 diagnostic: tidal range vs lunar phase over a full synodic
// cycle. The curve peaks at the syzygies (phase 0, 180: spring tides)
// and bottoms at quadratures (90, 270: neap tides). The current phase
// is marked, tying the 3D bulge to the spring-neap cycle.
function drawRangeDiagnostic() {
  const pw = 250, ph = 130, px = W - pw - 14, py = H - ph - 14;
  ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('tidal range vs lunar phase', px + 8, py + 14);
  const ax = px + 30, ay = py + 22, aw = pw - 44, ah = ph - 42;
  const rangeMax = A_LUNAR + A_SOLAR;
  const xOf = (deg) => ax + (deg / 360) * aw;
  const yOf = (r) => ay + ah - (r / (rangeMax * 1.1)) * ah;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (const d of [90, 180, 270]) {
    ctx.beginPath(); ctx.moveTo(xOf(d), ay); ctx.lineTo(xOf(d), ay + ah); ctx.stroke();
  }
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let d = 0; d <= 360; d += 4) {
    const r = tidalRegime(d * Math.PI / 180).range;
    const x = xOf(d), y = yOf(r);
    if (d === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current-phase marker.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(xOf(st.phaseDeg), yOf(tidalRegime(st.phaseDeg * Math.PI / 180).range), 4, 0, 6.28);
  ctx.fill();
  ctx.fillStyle = 'rgba(200,210,240,0.75)'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('0°', ax - 4, ay + ah + 11);
  ctx.fillText('spring', xOf(180) - 16, ay + ah + 11);
  ctx.fillText('360°', ax + aw - 18, ay + ah + 11);
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
  st.phaseDeg = 60; st.bulgeScale = 0.08; st.speed = 2;
  st.az = 0.6; st.tilt = 0.30;
  sPhase.value = '60'; sScale.value = '0.08'; sSpeed.value = '2';
  syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

// Drag to rotate: horizontal = azimuth, vertical = tilt.
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  st.az += (e.clientX - lastX) * 0.005;
  st.tilt = Math.max(-1.3, Math.min(1.3, st.tilt + (e.clientY - lastY) * 0.005));
  lastX = e.clientX;
  lastY = e.clientY;
});
// Mouse-wheel zoom: zoom into the Earth's surface to inspect the bulge.
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  st.zoom = Math.max(0.5, Math.min(6, st.zoom * Math.exp(-e.deltaY * 0.0015)));
}, { passive: false });

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
