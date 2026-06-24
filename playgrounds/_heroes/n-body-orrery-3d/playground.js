// 3D orrery playground. Canvas2D perspective render of a sun + planets +
// ghost asteroids integrated by Yoshida-4 (from the shared symplectic
// engine via sim.js). Trail buffer per body for visible orbits; live
// energy-drift and ghost-separation readouts.

import { makeOrreryInstance, step, diagnostics } from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rT = document.getElementById('readout-t');
const rDE = document.getElementById('readout-de');
const rSep = document.getElementById('readout-sep');
const sDt = document.getElementById('slider-dt'), vDt = document.getElementById('value-dt');
const sSub = document.getElementById('slider-sub'), vSub = document.getElementById('value-sub');
const tGhosts = document.getElementById('toggle-ghosts');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  dt: 0.006, sub: 6, tiltX: 0.55, az: 0.6, running: !prefersReducedMotion(),
  showGhosts: true, inst: null, E0: 0,
  TRAIL: 600,
  trails: null,
};

function initTrails(N) {
  st.trails = [];
  for (let i = 0; i < N; i += 1) st.trails.push({ buf: new Float64Array(st.TRAIL * 3), idx: 0, len: 0 });
}

function pushTrail(i, x, y, z) {
  const tr = st.trails[i];
  tr.buf[tr.idx * 3] = x;
  tr.buf[tr.idx * 3 + 1] = y;
  tr.buf[tr.idx * 3 + 2] = z;
  tr.idx = (tr.idx + 1) % st.TRAIL;
  if (tr.len < st.TRAIL) tr.len += 1;
}

function reseed(seed = 0xC0FFEE) {
  st.inst = makeOrreryInstance({ seed, n_planets: 5, n_ghost: 2 });
  st.E0 = diagnostics(st.inst).energy;
  initTrails(st.inst.orrery.N);
}

// 3D -> 2D projection. The camera looks at the origin from above with
// tilt angle tiltX about the x axis and azimuth az about the z axis.
// Perspective division gives planet a depth-dependent size.
function project(x, y, z) {
  // Rotate about z (azimuth).
  const ca = Math.cos(st.az), sa = Math.sin(st.az);
  const xp = ca * x - sa * y;
  const yp = sa * x + ca * y;
  const zp = z;
  // Rotate about x (tilt).
  const ct = Math.cos(st.tiltX), stl = Math.sin(st.tiltX);
  const yr = ct * yp - stl * zp;
  const zr = stl * yp + ct * zp;
  // Perspective. Focal chosen so the outer orbit nearly fills the portrait
  // rather than floating as a small system in a large empty frame.
  const camDist = 8;
  const f = 540 / (camDist + zr);
  const sx = W / 2 + f * xp;
  const sy = H / 2 - f * yr;
  return { x: sx, y: sy, depth: camDist + zr, scale: f / 80 };
}

function drawTrails() {
  if (!st.trails) return;
  for (let i = 1; i < st.inst.orrery.N; i += 1) {
    if (!st.showGhosts && i >= 1 + st.inst.orrery.n_planets) continue;
    const tr = st.trails[i];
    if (tr.len < 2) continue;
    const isGhost = i >= 1 + st.inst.orrery.n_planets;
    const colorBase = isGhost
      ? (i % 2 === 0 ? 'rgba(255,180,200,' : 'rgba(180,220,255,')
      : 'rgba(180,200,250,';
    for (let k = 0; k < tr.len - 1; k += 1) {
      const i0 = (tr.idx - tr.len + k + st.TRAIL) % st.TRAIL;
      const i1 = (tr.idx - tr.len + k + 1 + st.TRAIL) % st.TRAIL;
      const p0 = project(tr.buf[i0 * 3], tr.buf[i0 * 3 + 1], tr.buf[i0 * 3 + 2]);
      const p1 = project(tr.buf[i1 * 3], tr.buf[i1 * 3 + 1], tr.buf[i1 * 3 + 2]);
      const a = 0.10 + 0.55 * (k / tr.len);
      ctx.strokeStyle = colorBase + a.toFixed(3) + ')';
      ctx.lineWidth = isGhost ? 0.9 : 1.2;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  }
}

function drawBodies() {
  const q = st.inst.q;
  const N = st.inst.orrery.N;
  // Build a depth-sorted index list.
  const idx = [];
  for (let i = 0; i < N; i += 1) {
    if (!st.showGhosts && i >= 1 + st.inst.orrery.n_planets) continue;
    const p = project(q[3 * i], q[3 * i + 1], q[3 * i + 2]);
    idx.push({ i, p });
  }
  idx.sort((a, b) => b.p.depth - a.p.depth);
  for (const { i, p } of idx) {
    if (i === 0) {
      // Sun: bright with corona.
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 60);
      g.addColorStop(0, 'rgba(255, 220, 130, 0.85)');
      g.addColorStop(1, 'rgba(255, 220, 130, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, 60, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI); ctx.fill();
    } else if (i < 1 + st.inst.orrery.n_planets) {
      // Planet. Per-body fixed angular size scaled by perspective.
      const baseR = [4.5, 5.5, 5.0, 3.5, 6.5][i - 1] || 4;
      const rPix = Math.max(2.0, baseR * (8 / Math.max(2, p.depth)));
      ctx.fillStyle = ['#9aa9ff', '#7cb3ff', '#84caff', '#ffa84a', '#e0c068'][i - 1] || '#aab';
      ctx.beginPath(); ctx.arc(p.x, p.y, rPix, 0, 2 * Math.PI); ctx.fill();
    } else {
      // Ghost asteroid.
      const ghostIdx = i - (1 + st.inst.orrery.n_planets);
      ctx.fillStyle = ghostIdx === 0 ? '#ff80a0' : '#80c0ff';
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 2 * Math.PI); ctx.fill();
    }
  }
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // Starfield: a few hundred faint dots, deterministic.
  ctx.fillStyle = 'rgba(180, 200, 255, 0.25)';
  let s = 7;
  for (let i = 0; i < 240; i += 1) {
    s = (s * 16807) | 0;
    const u = ((s >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
    s = (s * 16807) | 0;
    const v = ((s >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
    ctx.fillRect(u * W, v * H, 1, 1);
  }

  drawTrails();
  drawBodies();

  // Bottom-strip ghost-separation hint.
  const q = st.inst.q;
  const planets = st.inst.orrery.n_planets;
  const i0 = 1 + planets, i1 = i0 + 1;
  const dxG = q[3 * i0] - q[3 * i1];
  const dyG = q[3 * i0 + 1] - q[3 * i1 + 1];
  const dzG = q[3 * i0 + 2] - q[3 * i1 + 2];
  const sep = Math.sqrt(dxG * dxG + dyG * dyG + dzG * dzG);

  const E = diagnostics(st.inst).energy;
  const dE = Math.abs(E - st.E0) / Math.max(1e-12, Math.abs(st.E0));

  rT.textContent = st.inst.t.toFixed(2);
  rDE.textContent = dE.toExponential(2);
  rSep.textContent = sep.toExponential(2);
}

function tick() {
  if (st.running) {
    for (let s = 0; s < st.sub; s += 1) {
      step(st.inst, st.dt);
    }
    const q = st.inst.q;
    for (let i = 0; i < st.inst.orrery.N; i += 1) {
      pushTrail(i, q[3 * i], q[3 * i + 1], q[3 * i + 2]);
    }
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vDt.textContent = st.dt.toFixed(3);
  vSub.textContent = String(st.sub);
}

sDt.addEventListener('input', () => { st.dt = parseFloat(sDt.value); syncLabels(); });
sSub.addEventListener('input', () => { st.sub = parseInt(sSub.value, 10); syncLabels(); });
tGhosts.addEventListener('change', () => { st.showGhosts = tGhosts.checked; });
btnReset.addEventListener('click', () => {
  st.dt = 0.006; st.sub = 6; st.tiltX = 0.55; st.az = 0.6; st.running = true; st.showGhosts = true;
  sDt.value = '0.006'; sSub.value = '6'; tGhosts.checked = true;
  btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false');
  syncLabels(); reseed();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

// Camera is fully drag-controlled: horizontal drag orbits (azimuth),
// vertical drag tilts. A slider for a 3D view reads as broken.
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  st.az += (e.clientX - lastX) * 0.005;
  st.tiltX = Math.max(0.05, Math.min(1.45, st.tiltX + (e.clientY - lastY) * 0.005));
  lastX = e.clientX; lastY = e.clientY;
});

function getState() { return { seed: 0xC0FFEE, ghost_visible: st.showGhosts ? 1 : 0 }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.ghost_visible !== undefined) { st.showGhosts = String(s.ghost_visible) === '1'; tGhosts.checked = st.showGhosts; }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  reseed();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.az = 0.6 + f * 1.5;
    // Step forward enough that planets have populated trails and the
    // ghost separation has started growing.
    const steps = Math.round(40 + f * 1200);
    for (let n = 0; n < steps; n += 1) {
      step(st.inst, st.dt);
      const q = st.inst.q;
      if (n % 2 === 0) for (let i = 0; i < st.inst.orrery.N; i += 1) pushTrail(i, q[3 * i], q[3 * i + 1], q[3 * i + 2]);
    }
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
// The orrery is integrated symplectically, so total energy is the
// invariant: a good integrator keeps the relative drift bounded and
// small rather than letting it grow secularly.
window.playground = window.playground || {};
window.playground.getState = function () {
  const planets = st.inst ? st.inst.orrery.n_planets : 0;
  const t = st.inst ? st.inst.t : 0;
  return {
    fields: [
      { key: 'sim-time', label: 'integration time', value: t.toFixed(2), format: 'float' },
      { key: 'planets', label: 'planet count', value: planets },
      { key: 'ghosts', label: 'ghost system shown', value: st.showGhosts ? 'on' : 'off' },
    ],
  };
};
window.playground.getInvariants = function () {
  if (!st.inst) return [];
  const E = diagnostics(st.inst).energy;
  const dE = Math.abs(E - st.E0) / Math.max(1e-12, Math.abs(st.E0));
  return [
    {
      key: 'energy',
      label: 'total energy conserved (rel. drift)',
      value: dE.toExponential(2),
      status: dE < 1e-3 ? 'pass' : (dE < 1e-2 ? 'pending' : 'drift'),
    },
  ];
};
