// Dark energy fate of the universe playground. Left panel: 3D comoving
// lattice scaled by a(t). Right panel: a(t) curve highlighted at the
// current cosmic time. The integration uses the shared Friedmann engine.

import { integrateScaleFactor, scaleAt, PRESETS, fateOf } from './sim.js';
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

const rT = document.getElementById('readout-t');
const rA = document.getElementById('readout-a');
const rFate = document.getElementById('readout-fate');
const selPre = document.getElementById('select-preset'), vPre = document.getElementById('value-preset');
const sM = document.getElementById('slider-m'), vM = document.getElementById('value-m');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  preset: 'lcdm', m: 0.31, L: 0.69, speed: 1, running: !prefersReducedMotion(),
  sol: null, time: 0, timeStart: 0, timeEnd: 0, timeNow: 0,
  galaxies: [],
};

// Build a 3D lattice of galaxies in a comoving box [-1, 1]^3.
function seedLattice() {
  st.galaxies.length = 0;
  const G = 5;
  // Mulberry32 RNG for jittered positions.
  let s = 0xC0FFEE;
  const rand = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < G; i += 1) {
    for (let j = 0; j < G; j += 1) {
      for (let k = 0; k < G; k += 1) {
        const x = -1 + (i + 0.5) / G * 2 + (rand() - 0.5) * 0.10;
        const y = -1 + (j + 0.5) / G * 2 + (rand() - 0.5) * 0.10;
        const z = -1 + (k + 0.5) / G * 2 + (rand() - 0.5) * 0.10;
        st.galaxies.push([x, y, z]);
      }
    }
  }
}
seedLattice();

function recompute() {
  const Om = { r: 0, m: st.m, L: st.L };
  st.sol = integrateScaleFactor(Om, 1, { dt: 0.01, tMax: 25 });
  st.timeStart = st.sol.t[0];
  st.timeEnd = st.sol.t[st.sol.t.length - 1];
  st.timeNow = 0;     // today
  st.time = st.timeNow;
}

selPre.addEventListener('change', () => {
  st.preset = selPre.value;
  const p = PRESETS[st.preset];
  if (p) { st.m = p.m; st.L = p.L; sM.value = String(st.m); sL.value = String(st.L); }
  syncLabels(); recompute();
});
sM.addEventListener('input', () => { st.m = parseFloat(sM.value); syncLabels(); recompute(); });
sL.addEventListener('input', () => { st.L = parseFloat(sL.value); syncLabels(); recompute(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });

// 3D -> 2D perspective projection for the comoving lattice.
function project(x, y, z) {
  // Tilt camera, perspective.
  const tilt = 0.5;
  const ca = Math.cos(0.5), sa = Math.sin(0.5);
  const xp = ca * x - sa * z;
  const zp = sa * x + ca * z;
  const ct = Math.cos(tilt), stl = Math.sin(tilt);
  const yp = ct * y - stl * zp;
  const zr = stl * y + ct * zp;
  const cam = 4;
  const f = 280 / (cam + zr);
  return { px: 220 + f * xp, py: 280 - f * yp, depth: cam + zr, scale: f / 60 };
}

function drawLattice() {
  const a = scaleAt(st.sol, st.time);
  // Compress the displayed scale so the lattice fits the panel across
  // the whole sweep: when a doubles, the visual cube grows by sqrt(2),
  // not 2. The a(t) plot on the right side shows the true scale.
  const aClamped = Math.max(0.05, Math.min(1.6, Math.sqrt(a)));
  // Bounding cube wireframe.
  const corners = [];
  const c = aClamped;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    corners.push(project(sx * c, sy * c, sz * c));
  }
  const edges = [
    [0,1],[1,3],[3,2],[2,0],   // back face
    [4,5],[5,7],[7,6],[6,4],   // front face
    [0,4],[1,5],[2,6],[3,7],
  ];
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.18)';
  ctx.lineWidth = 1.0;
  for (const [i0, i1] of edges) {
    ctx.beginPath();
    ctx.moveTo(corners[i0].px, corners[i0].py);
    ctx.lineTo(corners[i1].px, corners[i1].py);
    ctx.stroke();
  }
  // Galaxies, depth-sorted.
  const projGal = st.galaxies.map((g) => {
    const p = project(g[0] * aClamped, g[1] * aClamped, g[2] * aClamped);
    return { p, g };
  });
  projGal.sort((aa, bb) => bb.p.depth - aa.p.depth);
  for (const { p } of projGal) {
    const r = Math.max(1.0, 2.5 * p.scale * 4);
    ctx.fillStyle = `rgba(220, 230, 255, ${Math.min(0.95, 0.4 + 0.6 * p.scale)})`;
    ctx.beginPath(); ctx.arc(p.px, p.py, r, 0, 2 * Math.PI); ctx.fill();
  }
  // Title strip.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`a = ${a.toFixed(3)}    t = ${st.time.toFixed(2)} (today = 0)`, 24, 22);
  ctx.fillText(`Ω_m = ${st.m.toFixed(2)}    Ω_Λ = ${st.L.toFixed(2)}    fate: ${fateOf({ r: 0, m: st.m, L: st.L })}`, 24, 40);
}

function drawCurve(x0, y0, w, h) {
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

  const pad = { l: 36, r: 12, t: 18, b: 26 };
  const ax = x0 + pad.l, ay = y0 + pad.t;
  const aw = w - pad.l - pad.r, ah = h - pad.t - pad.b;
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('a(t)', x0 + 8, ay - 4);
  ctx.textAlign = 'center';
  ctx.fillText('cosmic time t', ax + aw / 2, y0 + h - 8);

  // Bounds: x from timeStart to timeEnd; y from 0 to a_max in solution.
  let aMax = 0;
  for (const av of st.sol.a) if (av > aMax) aMax = av;
  aMax = Math.max(0.5, Math.min(5, aMax));
  const xToPx = (t) => ax + (t - st.timeStart) / (st.timeEnd - st.timeStart) * aw;
  const yToPx = (a) => ay + (1 - a / aMax) * ah;

  // Vertical line at t = 0 ("today").
  ctx.strokeStyle = 'rgba(255,255,255,0.30)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(0), ay); ctx.lineTo(xToPx(0), ay + ah); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText('today', xToPx(0), ay + ah + 14);

  // Curve.
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < st.sol.t.length; i += 1) {
    const px = xToPx(st.sol.t[i]);
    const py = yToPx(st.sol.a[i]);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Current-time marker.
  const a = scaleAt(st.sol, st.time);
  const mx = xToPx(st.time), my = yToPx(a);
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath(); ctx.arc(mx, my, 4, 0, 2 * Math.PI); ctx.fill();
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  drawLattice();
  drawCurve(450, 50, 430, 380);

  // Readouts.
  const a = scaleAt(st.sol, st.time);
  rT.textContent = st.time.toFixed(2);
  rA.textContent = a.toFixed(3);
  rFate.textContent = fateOf({ r: 0, m: st.m, L: st.L });
}

function tick() {
  if (st.running && st.speed > 0) {
    st.time += 0.05 * st.speed;
    // Wrap back to past if we ran off the end.
    if (st.time > st.timeEnd - 0.1) st.time = st.timeStart + 0.1;
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vPre.textContent = st.preset === 'lcdm' ? 'LCDM' : (st.preset === 'heatdeath' ? 'flat' : (st.preset === 'bigcrunch' ? 'closed' : 'phantom'));
  vM.textContent = st.m.toFixed(2);
  vL.textContent = st.L.toFixed(2);
  vSpeed.textContent = String(st.speed);
}

btnReset.addEventListener('click', () => {
  st.preset = 'lcdm'; st.m = 0.31; st.L = 0.69; st.speed = 1; st.running = true;
  selPre.value = 'lcdm'; sM.value = '0.31'; sL.value = '0.69'; sSpeed.value = '1';
  btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false');
  syncLabels(); recompute();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { omega_m: st.m, omega_l: st.L, preset: st.preset }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.preset) { st.preset = s.preset; selPre.value = st.preset; }
  if (s.omega_m) { st.m = parseFloat(s.omega_m); sM.value = String(st.m); }
  if (s.omega_l) { st.L = parseFloat(s.omega_l); sL.value = String(st.L); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  recompute();
  if (CAPTURE_NAME) {
    // Sweep through the 4 presets across the 5 captures.
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const presetIdx = Math.min(3, Math.floor(f * 4));
    const presetKey = ['lcdm', 'heatdeath', 'bigcrunch', 'bigrip'][presetIdx];
    const p = PRESETS[presetKey];
    st.preset = presetKey; st.m = p.m; st.L = p.L;
    selPre.value = presetKey; sM.value = String(st.m); sL.value = String(st.L);
    syncLabels(); recompute();
    // March to a future time so the lattice has expanded (or contracted).
    st.time = st.timeStart + 0.5 * (st.timeEnd - st.timeStart) + (f - 0.5) * 0.2 * (st.timeEnd - st.timeStart);
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
      { key: 'omega-matter', label: 'Matter density', value: parseFloat(document.getElementById('slider-omega-m')?.value || 0.3), format: 'float' },
      { key: 'omega-dark-energy', label: 'Dark energy density', value: parseFloat(document.getElementById('slider-omega-de')?.value || 0.7), format: 'float' },
      { key: 'scale-factor', label: 'Scale factor a(t)', value: st.scaleFactorNow || 1, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  // Check that total density is approximately 1 (flatness of universe).
  const omegaM = parseFloat(document.getElementById('slider-omega-m')?.value || 0.3);
  const omegaDE = parseFloat(document.getElementById('slider-omega-de')?.value || 0.7);
  const total = omegaM + omegaDE;
  const flatnessError = Math.abs(total - 1.0);
  const status = flatnessError < 0.01 ? 'pass' : 'drift';
  return [
    {
      key: 'flatness-check',
      label: 'Density parameter sum',
      value: total.toFixed(3),
      status: status
    }
  ];
};
