// Chandrasekhar dynamical friction shown as what it physically does:
// a massive satellite (a sinking globular cluster or subhalo) spirals
// inward through a host stellar system because the trailing
// gravitational wake it raises pulls back on it. The view is a tilted
// 3D star cloud with the satellite on a decaying orbit, a luminous
// overdense wake dragged behind it, and the inspiral trail. For an
// isothermal host (flat rotation curve V0, sigma = V0/sqrt2) the
// sinking obeys r dr/dt proportional to -G M lnLambda f(X), so a
// heavier satellite sinks dramatically faster and raises a bigger
// wake. The perturber-mass slider drives the whole scene.
// Reference: Binney and Tremaine, Galactic Dynamics (2nd ed.),
// Sec. 8.1 (the sinking-satellite problem).

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { fOfX, chandrasekharDecel } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const SEED = parseInt(params.get('seed') ?? DEFAULT_SEED, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const cx = W / 2, cy = H / 2 + 10, SCALE = Math.min(W, H) * 0.40;
const INC = 1.05;                                  // view inclination (rad)
const cI = Math.cos(INC), sI = Math.sin(INC);
const V0 = 1.0, SIGMA = V0 / Math.SQRT2, LNL = 4, R0 = 1.0, RMIN = 0.05;
const DEF_M = 2.0;
const state = { M: DEF_M, t: 0 };
let rng = makeRng(SEED), host = [], sat, trail, running = true;
let last = performance.now();

// 3D (orbit plane = xy, z up) -> screen, tilted about x. Returns
// [sx, sy, depth] with depth larger = nearer the viewer.
function project(x, y, z) {
  const yt = y * cI - z * sI, zt = y * sI + z * cI;
  return [cx + x * SCALE, cy - yt * SCALE, zt];
}

function reset() {
  rng = makeRng(SEED);
  host = [];
  for (let i = 0; i < 320; i += 1) {
    // Flattened isothermal-ish ellipsoid of field stars.
    const u = rng() * 2 - 1, ang = rng() * 2 * Math.PI, rr = Math.cbrt(rng()) * 1.15;
    const rho = Math.sqrt(1 - u * u);
    host.push({ x: rr * rho * Math.cos(ang), y: rr * rho * Math.sin(ang), z: rr * u * 0.5, ph: rng() * 6.28 });
  }
  sat = { r: R0, phi: 0 };
  trail = [];
  state.t = 0;
}
reset();

const dt = 0.02;
function step() {
  const r = sat.r;
  const X = V0 / (Math.SQRT2 * SIGMA);
  // Isothermal host: circular speed V0 is flat, so X and f(X) are
  // constant; the friction torque drains angular momentum and
  // r dr/dt = -K M lnLambda f(X)  =>  the satellite sinks ever faster.
  const aDF = chandrasekharDecel(V0, SIGMA, 1.0, LNL);
  const drdt = -0.0012 * state.M * aDF * fOfX(X) / Math.max(r, RMIN);
  sat.r = Math.max(RMIN, sat.r + drdt * dt);
  sat.phi += (V0 / Math.max(sat.r, RMIN)) * dt * 2.0;
  trail.push({ r: sat.r, phi: sat.phi });
  if (trail.length > 520) trail.shift();
  state.t += dt;
  if (sat.r <= RMIN + 1e-4) { reset(); }
}

function render() {
  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
  // Soft host glow.
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, SCALE * 1.2);
  g.addColorStop(0, 'rgba(70,80,140,0.20)'); g.addColorStop(1, 'rgba(70,80,140,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const sx = sat.r * Math.cos(sat.phi), sy = sat.r * Math.sin(sat.phi);
  const [pSatX, pSatY, pSatD] = project(sx, sy, 0.0);

  // Build a draw list: field stars, the wake clump, depth sorted so the
  // tilt reads as 3D (near stars larger and brighter).
  const items = [];
  for (const s of host) {
    const dx = sx - s.x, dy = sy - s.y, dz = -s.z;
    const d2 = dx * dx + dy * dy + dz * dz;
    // Stars just behind the satellite are focused into the wake.
    const behind = (dx * -Math.sin(sat.phi) + dy * Math.cos(sat.phi));
    const inWake = d2 < 0.10 && behind < 0;
    const [X2, Y2, D] = project(s.x, s.y, s.z);
    items.push({ X: X2, Y: Y2, D, wake: inWake });
  }
  // Dense luminous wake trailing the satellite (the overdensity that
  // causes the drag); its richness scales with the satellite mass.
  const nWake = Math.round(26 + 26 * state.M);
  for (let i = 0; i < nWake; i += 1) {
    const back = 0.04 + 0.34 * (i / nWake);
    const jx = (rngHash(i) - 0.5) * 0.13, jy = (rngHash(i + 99) - 0.5) * 0.13;
    const wx = sx - back * Math.cos(sat.phi) + jx, wy = sy - back * Math.sin(sat.phi) + jy;
    const [X2, Y2, D] = project(wx, wy, (rngHash(i + 7) - 0.5) * 0.12);
    items.push({ X: X2, Y: Y2, D, wakeStar: true });
  }
  items.sort((a, b) => a.D - b.D);
  for (const it of items) {
    const t = (it.D + 1.2) / 2.4;                       // depth 0..1
    if (it.wakeStar) { ctx.fillStyle = `rgba(255,${170 - 60 * t | 0},${90 - 40 * t | 0},${0.5 + 0.4 * t})`; ctx.beginPath(); ctx.arc(it.X, it.Y, 1.6 + 1.6 * t, 0, 6.28); ctx.fill(); }
    else if (it.wake) { ctx.fillStyle = `rgba(255,150,80,${0.4 + 0.4 * t})`; ctx.fillRect(it.X - 1, it.Y - 1, 3, 3); }
    else { ctx.fillStyle = `rgba(150,170,225,${0.22 + 0.45 * t})`; ctx.fillRect(it.X, it.Y, 1 + 1.4 * t, 1 + 1.4 * t); }
  }

  // Inspiral trail (the decaying orbit).
  ctx.strokeStyle = 'rgba(124,200,255,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
  trail.forEach((q, i) => { const [tx, ty] = project(q.r * Math.cos(q.phi), q.r * Math.sin(q.phi), 0); i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty); });
  ctx.stroke();

  // Host centre.
  ctx.fillStyle = '#ffe7a8'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 6.28); ctx.fill();

  // Satellite with glow, size scaling with its mass.
  const rad = 6 + 3.2 * state.M;
  const gl = ctx.createRadialGradient(pSatX, pSatY, 0, pSatX, pSatY, rad * 3);
  gl.addColorStop(0, 'rgba(255,225,150,0.85)'); gl.addColorStop(1, 'rgba(255,225,150,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(pSatX, pSatY, rad * 3, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(pSatX, pSatY, rad, 0, 6.28); ctx.fill();

  const X = V0 / (Math.SQRT2 * SIGMA);
  if (readoutEl) {
    readoutEl.innerHTML =
      `<span class="label">M_sat</span><span class="value">${state.M.toFixed(2)}</span>` +
      `<span class="label">orbit r</span><span class="value">${sat.r.toFixed(3)} R₀</span>` +
      `<span class="label">X=V/√2σ</span><span class="value">${X.toFixed(2)}</span>` +
      `<span class="label">f(X)</span><span class="value">${fOfX(X).toFixed(3)}</span>` +
      `<span class="label">t</span><span class="value">${state.t.toFixed(1)}</span>`;
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('satellite sinking by dynamical friction; heavier ⇒ faster inspiral, bigger wake', 16, H - 14);
}

// Cheap deterministic hash for wake jitter (stable per index, no rng
// stream drift so capture stays reproducible).
function rngHash(i) { const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return s - Math.floor(s); }

function buildControls() {
  controlsEl.innerHTML = '';
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = 'M'; lab.textContent = 'perturber mass';
  const inp = document.createElement('input'); inp.id = 'M'; inp.type = 'range';
  inp.min = '0.5'; inp.max = '8'; inp.step = '0.1'; inp.value = String(state.M);
  inp.setAttribute('aria-label', 'Perturber mass (sets the inspiral rate)');
  const val = document.createElement('span'); val.className = 'value'; val.textContent = state.M.toFixed(1);
  inp.addEventListener('input', () => { state.M = parseFloat(inp.value); val.textContent = state.M.toFixed(1); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  const br = document.createElement('div'); br.className = 'row buttons';
  const rb = document.createElement('button'); rb.type = 'button'; rb.id = 'btn-reset'; rb.textContent = 'Reset';
  rb.addEventListener('click', () => { state.M = DEF_M; inp.value = String(DEF_M); val.textContent = DEF_M.toFixed(1); reset(); running = true; pb.textContent = 'Pause'; pb.setAttribute('aria-pressed', 'false'); startLoop(); render(); });
  const pb = document.createElement('button'); pb.type = 'button'; pb.id = 'btn-pause'; pb.textContent = 'Pause'; pb.setAttribute('aria-pressed', 'false');
  pb.addEventListener('click', () => { running = !running; pb.textContent = running ? 'Pause' : 'Play'; pb.setAttribute('aria-pressed', String(!running)); startLoop(); });
  br.appendChild(rb); br.appendChild(pb); controlsEl.appendChild(br);
}

let rafOn = false;
function tick() { if (running) step(); render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; requestAnimationFrame(tick); } }

buildControls();
if (DETERMINISTIC) {
  const steps = 20 + Math.round(CAPTURE_FRAC * 900);
  for (let i = 0; i < steps; i += 1) step();
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  startLoop();
}

window.__physicsCheck = async () => {
  const fHi = fOfX(3 / Math.SQRT2), fLo = fOfX(0.1 / Math.SQRT2);
  if (fHi <= 0.9) return { name: 'friction at V=3σ', pass: false, msg: `f=${fHi.toFixed(3)}` };
  if (fLo >= 0.05) return { name: 'friction at V=0.1σ', pass: false, msg: `f=${fLo.toFixed(3)}` };
  return { name: 'Chandrasekhar f(X) limits', pass: true, msg: `f(3σ)=${fHi.toFixed(3)}, f(0.1σ)=${fLo.toFixed(3)}` };
};


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [ { key: 'satellite-mass', label: 'Satellite mass', value: state.m_sat || 0.1, format: 'float' }, { key: 'time', label: 'Time (Gyr)', value: state.t || 0, format: 'float' }, { key: 'semi-major-axis', label: 'Semi-major axis', value: state.a || 100, format: 'float' }, { key: 'friction-force', label: 'Friction |F|', value: state.F_mag || 0, format: 'float' } ] }; };
window.playground.getInvariants = function () { return [ { key: 'orbit-decays', label: 'Semi-major axis decreases', value: 'pending', status: 'pending' } ]; };
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
