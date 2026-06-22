// Expanding-universe hero. Cosmology from the shared Friedmann engine via
// ./sim.js. The 3D scene is rendered in Canvas2D: a comoving lattice of
// galaxies whose proper separations scale with the live a(t), observed from
// the centre, coloured by recession velocity. A Hubble-radius ring marks
// where recession reaches the speed of light. Click any galaxy to fire a
// photon that reddens as it crosses the expanding space and reports the
// cosmological redshift 1 + z = a(observe) / a(emit). The lower Canvas2D
// panel is the scale-factor history a(t) plus the density-era bands.
//
// References: Ryden, Introduction to Cosmology, 2nd ed., Ch. 5-6;
// Dodelson, Modern Cosmology, 2nd ed., Ch. 2.

import {
  integrateScaleFactor, scaleAt, redshift, recession, hubble,
  densityFractions, aEqMatterRadiation, aEqMatterLambda,
} from './sim.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const plot = document.getElementById('plot');
const pctx = plot.getContext('2d');
const controlsEl = document.getElementById('controls');

const FOV = 55;
const VIEW_SCALE = 16;          // proper world units per comoving unit at a=1
const PHOTON_RATE = 0.6;        // comoving units per second of flight
const LOOP_SECONDS = 16;        // wall-clock seconds for one full expansion arc
const NEIGHBORS = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 27, minRadius: 9, maxRadius: 70,
  azimuthDeg: 34, elevationDeg: 17, fovDeg: FOV,
});
window.__camera = camera;

// =========================================================================
// Comoving galaxy lattice: a jittered 3D grid centred on the observer, so
// the regular spacing makes the stretch of space obvious while the jitter
// keeps it from reading as a crystal. Positions are comoving; proper
// positions are these times a(t).
// =========================================================================
const GN = 8;                   // galaxies per axis
const CELL = 0.26;              // comoving cell size
const galaxies = (() => {
  const half = (GN - 1) / 2, out = [];
  for (let i = 0; i < GN; i++) for (let j = 0; j < GN; j++) for (let k = 0; k < GN; k++) {
    const seed = ((i * 73856093) ^ (j * 19349663) ^ (k * 83492791)) >>> 0;
    const jx = ((seed & 255) / 255 - 0.5) * 0.40;
    const jy = (((seed >> 8) & 255) / 255 - 0.5) * 0.40;
    const jz = (((seed >> 16) & 255) / 255 - 0.5) * 0.40;
    const cx = (i - half + jx) * CELL, cy = (j - half + jy) * CELL, cz = (k - half + jz) * CELL;
    const dC = Math.hypot(cx, cy, cz);
    out.push({ i, j, k, cx, cy, cz, dC: Math.max(1e-4, dC), ux: cx / (dC || 1), uy: cy / (dC || 1), uz: cz / (dC || 1), mag: 0.62 + 0.38 * (((seed >> 24) & 255) / 255) });
  }
  return out;
})();
const galIndex = new Map(galaxies.map((g) => [`${g.i},${g.j},${g.k}`, g]));

// Recession-velocity colour ramp (v in units of c): sub-c is blue-white,
// approaching c is gold, super-c recession is deep red.
function rampColor(t) {
  const x = Math.max(0, Math.min(1, t));
  const stops = [
    [0.00, [165, 205, 255]],
    [0.32, [248, 248, 240]],
    [0.62, [255, 198, 120]],
    [0.82, [255, 132, 86]],
    [1.00, [240, 70, 60]],
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) { if (x >= stops[i][0] && x <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; } }
  const f = (x - a[0]) / Math.max(1e-6, b[0] - a[0]);
  return [0, 1, 2].map((c) => Math.round(a[1][c] + f * (b[1][c] - a[1][c])));
}
// Pre-rendered tinted glow sprites so per-galaxy drawing is a cheap blit.
const NRAMP = 16;
const SPRITES = Array.from({ length: NRAMP }, (_, k) => {
  const col = rampColor(k / (NRAMP - 1));
  const s = document.createElement('canvas'); s.width = 48; s.height = 48;
  const g = s.getContext('2d');
  const grd = g.createRadialGradient(24, 24, 0, 24, 24, 24);
  grd.addColorStop(0.0, `rgba(${col[0]},${col[1]},${col[2]},1)`);
  grd.addColorStop(0.30, `rgba(${col[0]},${col[1]},${col[2]},0.78)`);
  grd.addColorStop(0.65, `rgba(${col[0]},${col[1]},${col[2]},0.22)`);
  grd.addColorStop(1.0, `rgba(${col[0]},${col[1]},${col[2]},0)`);
  g.fillStyle = grd; g.fillRect(0, 0, 48, 48);
  return s;
});

// Fixed starfield (deterministic), drawn faint behind the lattice.
const STARS = (() => {
  let s = 0xBEEF1234 >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return Array.from({ length: 220 }, () => ({ x: rnd() * W, y: rnd() * H, b: 0.1 + 0.5 * rnd(), big: rnd() < 0.05 }));
})();

// =========================================================================
// Camera projection (Canvas2D), built from the orbit-camera eye position.
// =========================================================================
function makeCamBasis() {
  const eye = camera.eyePosition();
  const fx = -eye[0], fy = -eye[1], fz = -eye[2];
  const fl = Math.hypot(fx, fy, fz) || 1;
  const f = [fx / fl, fy / fl, fz / fl];
  // right = normalize(f x worldUp) with worldUp = (0,1,0); up = right x f.
  let rx = -f[2], ry = 0, rz = f[0];
  const rl = Math.hypot(rx, ry, rz) || 1; rx /= rl; ry /= rl; rz /= rl;
  const ux = ry * f[2] - rz * f[1], uy = rz * f[0] - rx * f[2], uz = rx * f[1] - ry * f[0];
  return { eye, f, r: [rx, ry, rz], u: [ux, uy, uz], tanHalfFov: Math.tan(FOV * Math.PI / 180 / 2), aspect: W / H };
}
function w2s(p, cam) {
  const dx = p[0] - cam.eye[0], dy = p[1] - cam.eye[1], dz = p[2] - cam.eye[2];
  const zf = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
  if (zf <= 0.02) return null;
  const xr = dx * cam.r[0] + dy * cam.r[1] + dz * cam.r[2];
  const yu = dx * cam.u[0] + dy * cam.u[1] + dz * cam.u[2];
  const xn = xr / (zf * cam.tanHalfFov * cam.aspect);
  const yn = yu / (zf * cam.tanHalfFov);
  return { x: (xn * 0.5 + 0.5) * W, y: (1 - (yn * 0.5 + 0.5)) * H, depth: zf };
}

// =========================================================================
// State and Friedmann solution.
// =========================================================================
const ui = { Om: 0.3, OL: 0.7, H0: 1.0, time: 0, phase: 0, dir: 1, running: !prefersReducedMotion() };
let sol = integrateScaleFactor({ m: ui.Om, L: ui.OL }, ui.H0, { dt: 0.004, tMax: 40 });
const pulses = [];
let lastZ = null;

// Keep the auto-play window so the lattice stays in frame: start just after
// the Big Bang, end when a exceeds a cap (closed models run their whole life).
function loopWindow(s) {
  const ACAP = 2.6;
  let i0 = 0; while (i0 < s.a.length && s.a[i0] < 0.12) i0 += 1;
  let i1 = i0 + 1;
  while (i1 < s.a.length - 1 && s.a[i1] < ACAP) i1 += 1;
  if (s.Ok < -0.02) { i1 = s.a.length - 1; }
  s.tLoop0 = s.t[Math.max(0, i0 - 1)];
  s.tLoop1 = s.t[Math.min(s.t.length - 1, i1)];
  if (s.tLoop1 - s.tLoop0 < 1) s.tLoop1 = s.tLoop0 + Math.min(8, s.t[s.t.length - 1] - s.tLoop0);
}
function resolve() {
  sol = integrateScaleFactor({ m: ui.Om, L: ui.OL }, ui.H0, { dt: 0.004, tMax: 40 });
  loopWindow(sol);
  ui.time = sol.tLoop0 + ui.phase * (sol.tLoop1 - sol.tLoop0);
  pulses.length = 0;
}
loopWindow(sol);
ui.time = sol.tLoop0 + ui.phase * (sol.tLoop1 - sol.tLoop0);

// Cosmological redshift of light from a galaxy at comoving distance dC seen
// at cosmic time tObs: back-track the null geodesic (dchi = dt/a) until the
// accumulated comoving distance equals dC, giving the emission time, then
// 1 + z = a(tObs) / a(tEmit). Robust at any instant, play or pause.
function lookbackRedshift(dC, tObs) {
  const aObs = scaleAt(sol, tObs);
  const step = 0.01, tMin = sol.t[0];
  let chi = 0, t = tObs;
  while (chi < dC && t > tMin + step) { chi += step / Math.max(1e-4, scaleAt(sol, t)); t -= step; }
  const aEmit = Math.max(1e-4, scaleAt(sol, t));
  return Math.max(0, aObs / aEmit - 1);
}

// =========================================================================
// Controls.
// =========================================================================
function slider(label, min, max, stp, value, fmt, onInput) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
  inp.addEventListener('input', () => { val.textContent = fmt(parseFloat(inp.value)); onInput(parseFloat(inp.value)); });
  row.append(lab, inp, val); controlsEl.appendChild(row); return { inp, val, fmt };
}
const cOm = slider('Omega_m', 0, 2, 0.02, ui.Om, (v) => v.toFixed(2), (v) => { ui.Om = v; resolve(); syncPreset(); });
const cOL = slider('Omega_Lambda', 0, 1.5, 0.02, ui.OL, (v) => v.toFixed(2), (v) => { ui.OL = v; resolve(); syncPreset(); });
slider('H0 (rate)', 0.5, 1.6, 0.02, ui.H0, (v) => v.toFixed(2), (v) => { ui.H0 = v; resolve(); });
const cTime = slider('cosmic time', -3, 30, 0.05, ui.time, (v) => v.toFixed(2), (v) => { ui.time = v; ui.phase = (v - sol.tLoop0) / Math.max(1e-6, sol.tLoop1 - sol.tLoop0); ui.running = false; bPause.textContent = 'Play'; });

function selRow(label, opts, on) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.value = o.k; op.textContent = o.t; s.appendChild(op); }
  const v = document.createElement('span'); v.className = 'value'; v.textContent = '';
  s.addEventListener('change', () => on(s.value)); row.append(lab, s, v); controlsEl.appendChild(row); return s;
}
const PRESETS = {
  lcdm: { Om: 0.3, OL: 0.7 }, matter: { Om: 1.0, OL: 0.0 },
  crunch: { Om: 2.0, OL: 0.0 }, empty: { Om: 0.0, OL: 0.0 },
};
const selPreset = selRow('preset', [
  { k: 'lcdm', t: 'dark energy (our universe)' },
  { k: 'matter', t: 'matter-dominated' },
  { k: 'crunch', t: 'closed (Big Crunch)' },
  { k: 'empty', t: 'empty (coasting)' },
], (p) => {
  const q = PRESETS[p]; if (!q) return;
  ui.Om = q.Om; ui.OL = q.OL; ui.phase = 0; ui.running = true; bPause.textContent = 'Pause';
  cOm.inp.value = q.Om.toFixed(2); cOm.val.textContent = q.Om.toFixed(2);
  cOL.inp.value = q.OL.toFixed(2); cOL.val.textContent = q.OL.toFixed(2);
  resolve();
});
function syncPreset() {
  let hit = '';
  for (const [k, q] of Object.entries(PRESETS)) { if (Math.abs(q.Om - ui.Om) < 0.011 && Math.abs(q.OL - ui.OL) < 0.011) hit = k; }
  if (hit) selPreset.value = hit;
}

const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bRev = document.createElement('button'); bRev.type = 'button'; bRev.textContent = 'Reverse';
const bNow = document.createElement('button'); bNow.type = 'button'; bNow.textContent = 'Today';
const bClr = document.createElement('button'); bClr.type = 'button'; bClr.textContent = 'Clear light';
btnRow.append(bPause, bRev, bNow, bClr); controlsEl.appendChild(btnRow);
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bRev.addEventListener('click', () => { ui.dir *= -1; });
bNow.addEventListener('click', () => { ui.phase = (0 - sol.tLoop0) / Math.max(1e-6, sol.tLoop1 - sol.tLoop0); ui.time = 0; });
bClr.addEventListener('click', () => { pulses.length = 0; lastZ = null; });

// =========================================================================
// Click a galaxy: pick the projected galaxy nearest the pointer and fire a
// photon inward. Distinguish a click from an orbit drag by total movement.
// =========================================================================
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  const dtms = performance.now() - downAt.t; downAt = null;
  if (moved > 6 || dtms > 600) return;          // that was a drag/hold, not a click
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width * W;
  const py = (e.clientY - rect.top) / rect.height * H;
  const cam = makeCamBasis();
  const a = scaleAt(sol, ui.time);
  let best = null, bestD = 1e9;
  for (const g of galaxies) {
    const p = w2s([g.cx * a * VIEW_SCALE, g.cy * a * VIEW_SCALE, g.cz * a * VIEW_SCALE], cam);
    if (!p) continue;
    const d = Math.hypot(p.x - px, p.y - py);
    if (d < bestD) { bestD = d; best = g; }
  }
  if (best && bestD < 48) {
    const z = lookbackRedshift(best.dC, ui.time);
    lastZ = z;
    pulses.push({ g: best, cov: 0, arrived: false, z, hold: 0 });
  }
});

// =========================================================================
// Scene.
// =========================================================================
function drawScene() {
  const a = scaleAt(sol, ui.time);
  const cam = makeCamBasis();
  // Background: deep-space vertical gradient.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#04060f'); bg.addColorStop(1, '#020308');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  for (const s of STARS) { ctx.fillStyle = `rgba(200,216,255,${s.b.toFixed(3)})`; ctx.fillRect(s.x, s.y, s.big ? 2 : 1, s.big ? 2 : 1); }

  const Hnow = hubble(a, sol.Om, ui.H0);
  const Oproj = w2s([0, 0, 0], cam);

  // Hubble-radius ring (recession = c): proper radius 1/H, world = VIEW_SCALE/H.
  if (Oproj && Hnow > 1e-3) {
    const rW = VIEW_SCALE / Hnow;
    const edge = w2s([cam.r[0] * rW, cam.r[1] * rW, cam.r[2] * rW], cam);
    if (edge) {
      const rPx = Math.hypot(edge.x - Oproj.x, edge.y - Oproj.y);
      ctx.strokeStyle = 'rgba(120, 220, 235, 0.42)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(Oproj.x, Oproj.y, rPx, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(150, 230, 245, 0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('Hubble radius (recession = c)', Oproj.x, Oproj.y - rPx - 4);
    }
  }

  // Comoving grid lines to +i/+j/+k neighbours: they stretch as space expands,
  // which is the clearest signature of the metric expansion.
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(110, 150, 215, 0.14)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (const g of galaxies) {
    const p0 = w2s([g.cx * a * VIEW_SCALE, g.cy * a * VIEW_SCALE, g.cz * a * VIEW_SCALE], cam);
    if (!p0) continue;
    for (const d of NEIGHBORS) {
      const nb = galIndex.get(`${g.i + d[0]},${g.j + d[1]},${g.k + d[2]}`);
      if (!nb) continue;
      const p1 = w2s([nb.cx * a * VIEW_SCALE, nb.cy * a * VIEW_SCALE, nb.cz * a * VIEW_SCALE], cam);
      if (!p1) continue;
      ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
    }
  }
  ctx.stroke();

  // Galaxies, projected, depth-sorted far-to-near, coloured by recession.
  const proj = [];
  for (const g of galaxies) {
    const p = w2s([g.cx * a * VIEW_SCALE, g.cy * a * VIEW_SCALE, g.cz * a * VIEW_SCALE], cam);
    if (!p) continue;
    const v = Hnow * a * g.dC;                  // recession speed in units of c
    proj.push({ g, p, v });
  }
  proj.sort((u, w) => w.p.depth - u.p.depth);
  for (const q of proj) {
    const size = Math.max(7, Math.min(36, 700 / q.p.depth)) * q.g.mag;
    ctx.globalAlpha = Math.max(0.5, Math.min(1, 36 / q.p.depth)) * (0.72 + 0.28 * q.g.mag);
    const idx = Math.round(Math.max(0, Math.min(1, q.v)) * (NRAMP - 1));
    ctx.drawImage(SPRITES[idx], q.p.x - size / 2, q.p.y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;

  // Light pulses (photons) travelling inward, reddening as they go.
  for (const pl of pulses) {
    const rem = Math.max(0, pl.g.dC - pl.cov);
    const x = pl.g.ux * rem * a * VIEW_SCALE, y = pl.g.uy * rem * a * VIEW_SCALE, z = pl.g.uz * rem * a * VIEW_SCALE;
    const p = w2s([x, y, z], cam);
    if (!p) continue;
    const col = rampColor(Math.min(1, pl.z / 3));
    // trail toward the observer.
    if (Oproj) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.30)`; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(Oproj.x, Oproj.y); ctx.stroke();
    }
    const r = pl.arrived ? 7 : 4.5;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.95)`;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // Observer marker at the centre.
  if (Oproj) {
    ctx.fillStyle = 'rgba(120, 235, 180, 0.95)';
    ctx.beginPath(); ctx.arc(Oproj.x, Oproj.y, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(120, 235, 180, 0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(Oproj.x, Oproj.y, 8, 0, 2 * Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(150, 240, 195, 0.9)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('you are here', Oproj.x + 12, Oproj.y);
  }

  drawHUD(a, Hnow);
}

function fateLabel() {
  const last = sol.a[sol.a.length - 1];
  if (sol.Ok < -0.02 && last < 0.05) return 'closed: Big Crunch ahead';
  if (ui.OL > 0.01) return 'dark energy: accelerating forever';
  if (Math.abs(ui.Om) < 0.02 && ui.OL < 0.02) return 'empty: coasting';
  return 'matter: decelerating, expands forever';
}

function drawHUD(a, Hnow) {
  const lines = [
    ['cosmic time t', `${ui.time.toFixed(2)} / H0`],
    ['scale factor a', a.toFixed(3)],
    ['Hubble rate H', Hnow.toFixed(3)],
    ['fate', fateLabel()],
    ['last redshift z', lastZ == null ? 'click a galaxy' : lastZ.toFixed(2)],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono');
  let wMax = 0; for (const [k, v] of lines) wMax = Math.max(wMax, ctx.measureText(`${k}  ${v}`).width);
  const bx = 12, by = 12, bw = wMax + 22, bh = lines.length * 18 + 14;
  ctx.fillStyle = 'rgba(3, 5, 12, 0.82)'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = 'rgba(150, 170, 210, 0.25)'; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let yy = by + 16;
  for (const [k, v] of lines) {
    ctx.fillStyle = 'rgba(150, 162, 188, 0.9)'; ctx.fillText(k, bx + 10, yy);
    ctx.fillStyle = k === 'fate' ? 'rgba(255, 214, 120, 0.95)' : (k === 'last redshift z' && lastZ != null ? 'rgba(255, 150, 110, 0.95)' : 'rgba(228, 236, 255, 0.96)');
    ctx.textAlign = 'right'; ctx.fillText(v, bx + bw - 10, yy); ctx.textAlign = 'left';
    yy += 18;
  }
}

// =========================================================================
// Diagnostic panel: a(t) history plus density-era bands (kept from the
// original; physically the most informative companion to the scene).
// =========================================================================
function drawPlot() {
  const PW = plot.width, PH = plot.height;
  pctx.fillStyle = '#07080b'; pctx.fillRect(0, 0, PW, PH);
  const topH = Math.round(PH * 0.60);
  const botH = PH - topH - 4;
  const t0 = sol.t[0], t1 = sol.t[sol.t.length - 1];
  let aMax = 0; for (const v of sol.a) aMax = Math.max(aMax, v);
  const xOf = (t) => 40 + (t - t0) / (t1 - t0) * (PW - 60);
  const yOf = (av) => topH - 22 - (av / aMax) * (topH - 40);
  pctx.strokeStyle = '#23252a'; pctx.beginPath(); pctx.moveTo(40, yOf(0)); pctx.lineTo(PW - 20, yOf(0)); pctx.stroke();
  pctx.strokeStyle = '#9b8cff'; pctx.lineWidth = 1.8; pctx.beginPath();
  for (let i = 0; i < sol.t.length; i += 2) { const X = xOf(sol.t[i]), Y = yOf(sol.a[i]); if (i === 0) pctx.moveTo(X, Y); else pctx.lineTo(X, Y); }
  pctx.stroke();
  const cx = xOf(Math.max(t0, Math.min(t1, ui.time)));
  pctx.strokeStyle = '#ffd166'; pctx.beginPath(); pctx.moveTo(cx, 18); pctx.lineTo(cx, PH - 18); pctx.stroke();
  pctx.fillStyle = '#7a818c'; pctx.font = fontString(canvas, 'caption', 'mono'); pctx.textAlign = 'left';
  pctx.fillText('scale factor a(t)   (yellow = now; t=0 is today)', 8, 14);

  const py0 = topH + 4, py1 = topH + botH;
  pctx.fillStyle = 'rgba(15, 22, 36, 0.85)'; pctx.fillRect(40, py0, PW - 60, py1 - py0);
  pctx.strokeStyle = 'rgba(220, 230, 255, 0.20)'; pctx.strokeRect(40 + 0.5, py0 + 0.5, PW - 61, py1 - py0 - 1);
  pctx.fillStyle = 'rgba(220, 230, 255, 0.85)'; pctx.font = fontString(canvas, 'caption', 'mono', 600);
  pctx.fillText('density fractions  r / m / Lambda   (log a)', 44, py0 + 12);
  const aLo = -8, aHi = 0;
  const xOfLogA = (la) => 50 + ((la - aLo) / (aHi - aLo)) * (PW - 70);
  const NSTEPS = 80, bandY = py0 + 20, bandH = py1 - py0 - 26;
  for (let i = 0; i < NSTEPS; i += 1) {
    const la = aLo + (i / (NSTEPS - 1)) * (aHi - aLo);
    const f = densityFractions(Math.pow(10, la), { Om: ui.Om, OL: ui.OL });
    const x = xOfLogA(la), wstep = (PW - 70) / NSTEPS + 1;
    pctx.fillStyle = '#5bc0eb'; pctx.fillRect(x, bandY + (1 - f.r) * bandH, wstep, f.r * bandH);
    pctx.fillStyle = '#ffd166'; pctx.fillRect(x, bandY + (1 - f.r - f.m) * bandH, wstep, f.m * bandH);
    pctx.fillStyle = '#ef476f'; pctx.fillRect(x, bandY, wstep, f.l * bandH);
  }
  const aEq_mr = aEqMatterRadiation({ Om: ui.Om });
  const aEq_mL = aEqMatterLambda({ Om: ui.Om, OL: Math.max(1e-6, ui.OL) });
  pctx.font = fontString(canvas, 'caption', 'mono');
  if (aEq_mr > Math.pow(10, aLo) && aEq_mr < 1) {
    const xx = xOfLogA(Math.log10(aEq_mr));
    pctx.strokeStyle = 'rgba(255,255,255,0.85)'; pctx.setLineDash([3, 3]); pctx.beginPath(); pctx.moveTo(xx, bandY); pctx.lineTo(xx, bandY + bandH); pctx.stroke(); pctx.setLineDash([]);
    pctx.fillStyle = '#fff'; pctx.fillText('m=r', xx + 2, bandY + 10);
  }
  if (aEq_mL > Math.pow(10, aLo) && aEq_mL < 1) {
    const xx = xOfLogA(Math.log10(aEq_mL));
    pctx.strokeStyle = 'rgba(255,255,255,0.85)'; pctx.setLineDash([3, 3]); pctx.beginPath(); pctx.moveTo(xx, bandY); pctx.lineTo(xx, bandY + bandH); pctx.stroke(); pctx.setLineDash([]);
    pctx.fillStyle = '#fff'; pctx.fillText('m=L', xx + 2, bandY + 22);
  }
  pctx.fillStyle = 'rgba(200, 210, 240, 0.85)';
  for (let la = aLo; la <= aHi; la += 2) { pctx.fillText(`10^${la}`, xOfLogA(la) - 10, py1 - 2); }
}

// =========================================================================
// Update loop.
// =========================================================================
function advancePulses(dt) {
  const a = Math.max(0.05, scaleAt(sol, ui.time));
  for (const pl of pulses) {
    if (!pl.arrived) { pl.cov += dt * PHOTON_RATE / a; if (pl.cov >= pl.g.dC) pl.arrived = true; }
    else pl.hold += dt;
  }
  for (let i = pulses.length - 1; i >= 0; i--) { if (pulses[i].hold > 3.2) pulses.splice(i, 1); }
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (ui.running) {
    ui.phase += ui.dir * dt / LOOP_SECONDS;
    if (ui.phase > 1) { ui.phase = 0; pulses.length = 0; }
    if (ui.phase < 0) { ui.phase = 1; pulses.length = 0; }
    ui.time = sol.tLoop0 + ui.phase * (sol.tLoop1 - sol.tLoop0);
    cTime.inp.value = ui.time.toFixed(2); cTime.val.textContent = ui.time.toFixed(2);
  }
  advancePulses(dt);
  camera.tickIdle(now);
  drawScene(); drawPlot();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const kinds = [{ Om: 0.3, OL: 0.7 }, { Om: 1.0, OL: 0 }, { Om: 2.0, OL: 0 }, { Om: 0.3, OL: 0.7 }, { Om: 0, OL: 0 }];
    const K = kinds[Math.min(kinds.length - 1, Math.floor(CAPTURE_FRAC * kinds.length + 1e-6))];
    ui.Om = K.Om; ui.OL = K.OL; resolve();
    ui.time = sol.tLoop0 + CAPTURE_FRAC * (sol.tLoop1 - sol.tLoop0);
    if (camera.setAzimuthDeg) camera.setAzimuthDeg(34 + CAPTURE_FRAC * 36);
    drawScene(); drawPlot();
    if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
    else window.__simulationReady = true;
    return;
  }
  syncPreset();
  drawScene(); drawPlot();
  window.__simulationReady = true;
}

window.__physicsCheck = async () => {
  const s = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.002, tMax: 8 });
  let ok = true, worst = 0;
  for (let i = s.iNow + 5; i < s.iNow + 200; i += 40) {
    const adot = (s.a[i + 1] - s.a[i - 1]) / (s.t[i + 1] - s.t[i - 1]);
    const rhs = 0.3 / s.a[i] ** 3 + 0.7;
    const e = Math.abs((adot / s.a[i]) ** 2 - rhs) / Math.max(rhs, 1e-6);
    worst = Math.max(worst, e); if (e > 1e-3) ok = false;
  }
  return { name: 'Friedmann constraint (a_dot/a)^2 = H0^2 E(a)', pass: ok, msg: `worst rel error ${worst.toExponential(1)}` };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'Canvas2D scene; cosmology validated by __physicsCheck and invariants' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const a = scaleAt(sol, ui.time);
  return {
    fields: [
      { key: 'time', label: 'cosmic time', value: ui.time, format: 'float' },
      { key: 'scale', label: 'scale factor a', value: a, format: 'float' },
      { key: 'hubble', label: 'Hubble rate H(a)', value: hubble(a, sol.Om, ui.H0), format: 'float' },
      { key: 'omega-m', label: 'Omega_m', value: ui.Om, format: 'float' },
      { key: 'omega-l', label: 'Omega_Lambda', value: ui.OL, format: 'float' },
      { key: 'probe-z', label: 'last redshift z', value: lastZ == null ? 0 : lastZ, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const sum = ui.Om + ui.OL + sol.Ok;
  const a = scaleAt(sol, ui.time);
  return [
    { key: 'friedmann-closure', label: 'density parameters close to 1', value: sum.toFixed(3), status: Math.abs(sum - 1) < 0.01 ? 'pass' : 'drift' },
    { key: 'scale-positive', label: 'scale factor stays positive', value: a.toFixed(3), status: a > 0 ? 'pass' : 'drift' },
  ];
};
