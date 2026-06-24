// Stellar pulsation 3D playground. Canvas2D perspective render of a
// displaced lat-long mesh with the displacement field colored by sign.
// See sim.js for the spherical-harmonic computation. Reference: Aerts
// et al., Asteroseismology, Ch. 3.

import { realSphericalHarmonic, surfaceDisplacement } from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rLM = document.getElementById('readout-lm');
const rPhase = document.getElementById('readout-phase');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const sM = document.getElementById('slider-m'), vM = document.getElementById('value-m');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const sAmp = document.getElementById('slider-amp'), vAmp = document.getElementById('value-amp');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  l: 2, m: 2, omega: 1, amp: 0.16, speed: 1, running: !prefersReducedMotion(),
  t: 0, az: 0.6, tilt: 0.5, cam: 4,
  N_LAT: 40, N_LON: 60,
};

// The pulsating star is the hero in the top region; two diagnostics sit
// below it: the flat nodal-line map (how l and m are read off the
// pattern) and the surface-oscillation time trace.
const HERO_CY = 332;
const DIAG = { y: 668, h: 360, lx: 12, rx: 420, w: 388 };

// 3D -> 2D perspective projection.
function project(x, y, z) {
  const ca = Math.cos(st.az), sa = Math.sin(st.az);
  const xp = ca * x - sa * z;
  const zp = sa * x + ca * z;
  const ct = Math.cos(st.tilt), stl = Math.sin(st.tilt);
  const yp = ct * y - stl * zp;
  const zr = stl * y + ct * zp;
  const cam = st.cam;
  // Focal chosen so the pulsating star fills the top hero region (it clears
  // the title and the maximum mode displacement stays on-canvas), leaving
  // the lower third for the nodal map and the oscillation trace.
  const f = 860 / (cam + zr);
  return { x: W * 0.5 + f * xp, y: HERO_CY - f * yp, depth: cam + zr, scale: f / 90 };
}

function divergingRB(v) {
  // v in [-1, 1] -> warm orange for positive, cool blue for negative,
  // dark midpoint so the zero-displacement equator reads dark.
  const a = Math.max(-1, Math.min(1, v));
  if (a >= 0) {
    return `rgb(${Math.round(30 + 215 * a)}, ${Math.round(40 + 70 * a)}, ${Math.round(50 + 30 * a)})`;
  }
  const u = -a;
  return `rgb(${Math.round(40 + 30 * u)}, ${Math.round(70 + 100 * u)}, ${Math.round(120 + 110 * u)})`;
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = 'rgba(14, 16, 22, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(150, 170, 210, 0.28)'; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(224, 232, 255, 0.9)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.textAlign = 'left';
  ctx.fillText(title, x + 8, y + 14);
}

// The angular pattern Y_l^m is time-independent, so its flat map and the
// nodal lines are cached per (l, m) and only redrawn when the mode changes.
let _mapCanvas = null, _mapKey = '', _mapW = 0, _mapH = 0;
function buildNodalMap(mapW, mapH) {
  const key = `${st.l}|${st.m}|${mapW}|${mapH}`;
  if (key === _mapKey && _mapCanvas) return;
  const NC = 110, NR = 56;
  const vals = new Array(NR);
  let ymax = 1e-9;
  for (let i = 0; i < NR; i += 1) {
    const th = (i + 0.5) / NR * Math.PI;
    vals[i] = new Float64Array(NC);
    for (let j = 0; j < NC; j += 1) {
      const ph = (j + 0.5) / NC * 2 * Math.PI;
      const v = realSphericalHarmonic(st.l, st.m, th, ph);
      vals[i][j] = v;
      if (Math.abs(v) > ymax) ymax = Math.abs(v);
    }
  }
  _mapCanvas = new OffscreenCanvas(mapW, mapH);
  const g = _mapCanvas.getContext('2d');
  const cw = mapW / NC, ch = mapH / NR;
  for (let i = 0; i < NR; i += 1) for (let j = 0; j < NC; j += 1) {
    g.fillStyle = divergingRB(vals[i][j] / ymax);
    g.fillRect(j * cw, i * ch, cw + 1, ch + 1);
  }
  // Nodal lines: trace the zero-crossings between adjacent cells.
  g.strokeStyle = 'rgba(255, 255, 255, 0.8)'; g.lineWidth = 1;
  for (let i = 0; i < NR; i += 1) for (let j = 0; j < NC; j += 1) {
    const v = vals[i][j];
    if (j + 1 < NC && v * vals[i][j + 1] < 0) {
      const xx = (j + 1) * cw; g.beginPath(); g.moveTo(xx, i * ch); g.lineTo(xx, (i + 1) * ch); g.stroke();
    }
    if (i + 1 < NR && v * vals[i + 1][j] < 0) {
      const yy = (i + 1) * ch; g.beginPath(); g.moveTo(j * cw, yy); g.lineTo((j + 1) * cw, yy); g.stroke();
    }
  }
  _mapKey = key; _mapW = mapW; _mapH = mapH;
}

function drawNodalMap(x, y, w, h) {
  panel(x, y, w, h, 'mode pattern  Y_l^m  (white = nodal lines)');
  const mapX = x + 34, mapY = y + 26, mapW = w - 46, mapH = h - 70;
  buildNodalMap(mapW, mapH);
  if (_mapCanvas) ctx.drawImage(_mapCanvas, mapX, mapY);
  ctx.strokeStyle = 'rgba(150,170,210,0.3)'; ctx.strokeRect(mapX + 0.5, mapY + 0.5, mapW - 1, mapH - 1);
  ctx.fillStyle = 'rgba(180, 200, 240, 0.7)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText('longitude  0 .. 2pi', mapX + mapW / 2, mapY + mapH + 14);
  ctx.save(); ctx.translate(x + 12, mapY + mapH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('lat +90..-90', 0, 0); ctx.restore();
  const latN = st.l - Math.abs(st.m), lonN = Math.abs(st.m);
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(`${latN} latitude + ${lonN} longitude nodes  (total = l = ${st.l})`, x + 8, y + h - 9);
}

function drawTimeTrace(x, y, w, h) {
  panel(x, y, w, h, 'surface oscillation  xi(t) = cos(omega t)');
  const px = x + 30, py = y + 26, pw = w - 42, ph = h - 56;
  const midY = py + ph / 2, ampPx = ph / 2 - 4;
  ctx.strokeStyle = 'rgba(150, 170, 210, 0.14)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px, midY); ctx.lineTo(px + pw, midY); ctx.stroke();
  ctx.fillStyle = 'rgba(180, 200, 240, 0.6)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  ctx.fillText('+1', px - 4, py + 8); ctx.fillText('0', px - 4, midY + 3); ctx.fillText('-1', px - 4, py + ph);
  const TWIN = 6 * Math.PI;   // ~3 periods at omega = 1
  ctx.strokeStyle = 'rgba(255, 210, 120, 0.95)'; ctx.lineWidth = 1.8; ctx.beginPath();
  const N = 220;
  for (let k = 0; k <= N; k += 1) {
    const tt = st.t - TWIN + (k / N) * TWIN;
    const v = Math.cos(st.omega * tt);
    const xx = px + (k / N) * pw, yy = midY - v * ampPx;
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  const vNow = Math.cos(st.omega * st.t);
  ctx.fillStyle = 'rgba(255, 255, 200, 1)';
  ctx.beginPath(); ctx.arc(px + pw, midY - vNow * ampPx, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(180, 200, 240, 0.6)'; ctx.textAlign = 'right';
  ctx.fillText('time ->', px + pw, py + ph + 14);
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.fillText(`phase cos(omega t) = ${vNow.toFixed(2)}`, x + 8, y + h - 9);
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // Generate displaced (theta, phi) -> 3D positions + face colors.
  const { N_LAT, N_LON, l, m, t, omega, amp } = st;
  // Mesh of vertices.
  const verts = new Array(N_LAT * N_LON);
  const disp = new Float64Array(N_LAT * N_LON);
  for (let i = 0; i < N_LAT; i += 1) {
    const theta = (i + 0.5) / N_LAT * Math.PI;
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    for (let j = 0; j < N_LON; j += 1) {
      const phi = (j / N_LON) * 2 * Math.PI;
      const D = surfaceDisplacement(l, m, theta, phi, t, omega, amp);
      const r = 1 + D;
      const x = r * sinT * Math.cos(phi);
      const y = r * cosT;
      const z = r * sinT * Math.sin(phi);
      verts[i * N_LON + j] = project(x, y, z);
      disp[i * N_LON + j] = D / Math.max(1e-6, amp);
    }
  }

  // Build quads with back-face culling (only draw visible). Sort by
  // depth so transparent overlap reads correctly.
  const quads = [];
  for (let i = 0; i < N_LAT - 1; i += 1) {
    for (let j = 0; j < N_LON; j += 1) {
      const jp = (j + 1) % N_LON;
      const v00 = verts[i * N_LON + j];
      const v01 = verts[i * N_LON + jp];
      const v10 = verts[(i + 1) * N_LON + j];
      const v11 = verts[(i + 1) * N_LON + jp];
      // Average depth.
      const depth = 0.25 * (v00.depth + v01.depth + v10.depth + v11.depth);
      // Average displacement (for color).
      const dv = 0.25 * (disp[i * N_LON + j] + disp[i * N_LON + jp] + disp[(i + 1) * N_LON + j] + disp[(i + 1) * N_LON + jp]);
      quads.push({ v00, v01, v10, v11, depth, dv });
    }
  }
  quads.sort((a, b) => b.depth - a.depth);
  for (const q of quads) {
    ctx.fillStyle = divergingRB(q.dv);
    ctx.beginPath();
    ctx.moveTo(q.v00.x, q.v00.y);
    ctx.lineTo(q.v01.x, q.v01.y);
    ctx.lineTo(q.v11.x, q.v11.y);
    ctx.lineTo(q.v10.x, q.v10.y);
    ctx.closePath();
    ctx.fill();
  }

  // Top-left label.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  const sign = st.m < 0 ? -1 : 1;
  const mLabel = st.m === 0 ? '0' : (sign > 0 ? `+${st.m}` : `${st.m}`);
  ctx.fillText(`Y_l^m  with  (ℓ = ${st.l}, m = ${mLabel})`, 24, 24);
  ctx.fillText(`drag to orbit, scroll to zoom; warm = pushed out, cool = pulled in`, 24, 42);

  // Diagnostics below the star.
  drawNodalMap(DIAG.lx, DIAG.y, DIAG.w, DIAG.h);
  drawTimeTrace(DIAG.rx, DIAG.y, DIAG.w, DIAG.h);

  rLM.textContent = `(${st.l}, ${mLabel})`;
  rPhase.textContent = `${(Math.cos(omega * t)).toFixed(2)}`;
}

function tick() {
  if (st.running) st.t += 0.04 * (st.speed || 0);
  render();
  requestAnimationFrame(tick);
}

function clampM() {
  if (st.m > st.l) st.m = st.l;
  if (st.m < -st.l) st.m = -st.l;
  sM.value = String(st.m);
  vM.textContent = String(st.m);
}

function syncLabels() {
  vL.textContent = String(st.l);
  vM.textContent = String(st.m);
  vSpeed.textContent = String(st.speed);
  vAmp.textContent = st.amp.toFixed(2);
}

sL.addEventListener('input', () => { st.l = parseInt(sL.value, 10); clampM(); syncLabels(); });
sM.addEventListener('input', () => { st.m = parseInt(sM.value, 10); clampM(); syncLabels(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });
sAmp.addEventListener('input', () => { st.amp = parseFloat(sAmp.value); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.l = 2; st.m = 2; st.speed = 1; st.amp = 0.16; st.running = true;
  st.cam = 4; st.az = 0.6; st.tilt = 0.5;
  sL.value = '2'; sM.value = '2'; sSpeed.value = '1'; sAmp.value = '0.16';
  btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false');
  syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

// Free-orbit camera: horizontal drag spins the star, vertical drag tilts
// it, the wheel zooms. Grabbing the lower diagnostics does not orbit.
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const yCanvas = (e.clientY - rect.top) / rect.height * H;
  if (yCanvas > DIAG.y - 8) return;
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  st.az += (e.clientX - lastX) * 0.006;
  st.tilt = Math.max(-1.45, Math.min(1.45, st.tilt + (e.clientY - lastY) * 0.006));
  lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  st.cam = Math.max(2.6, Math.min(8, st.cam * Math.exp(e.deltaY * 0.0012)));
}, { passive: false });

function getState() { return { l: st.l, m: st.m, omega: st.omega }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.l) { st.l = parseInt(s.l, 10); sL.value = String(st.l); }
  if (s.m !== undefined) { st.m = parseInt(s.m, 10); sM.value = String(st.m); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  clampM(); syncLabels();
  if (CAPTURE_NAME) {
    // Sweep (l, m) and time phase across captures: (1, 0), (2, 0),
    // (2, 2), (3, 1), (4, 2).
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const presets = [[1, 0], [2, 0], [2, 2], [3, 1], [4, 2]];
    const idx = Math.min(presets.length - 1, Math.floor(f * presets.length));
    st.l = presets[idx][0]; st.m = presets[idx][1];
    sL.value = String(st.l); sM.value = String(st.m);
    syncLabels();
    st.t = 0.4;     // fixed phase for distinguishable goldens
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'l-mode', label: 'Angular degree l', value: st.l, format: 'float' },
      { key: 'm-mode', label: 'Azimuthal order m', value: st.m, format: 'float' },
      { key: 'speed', label: 'Pulsation speed', value: st.speed, format: 'float' },
      { key: 'amplitude', label: 'Amplitude', value: st.amp, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const valid_mode = st.l >= 0 && Math.abs(st.m) <= st.l;
  return [
    {
      key: 'mode-validity',
      label: '|m| <= l',
      value: valid_mode ? 'pass' : `l=${st.l}, m=${st.m}`,
      status: valid_mode ? 'pass' : 'drift'
    }
  ];
};
