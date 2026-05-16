// playground.js
// Foucault pendulum as the museum sand table: a hand-projected 3D scene
// (Canvas2D, no WebGL) with a ceiling mount, suspension wire and shaded
// bob swinging over a circular sand bed. The bob carves a slowly
// precessing rosette into the sand and knocks over a ring of pins as
// the swing plane rotates at -Omega sin(latitude). sim.js carries the
// rotating-frame physics unchanged.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createFoucault, stepFoucault, omegaZ, precessionPeriod } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderLat    = document.getElementById('slider-lat');
const sliderSpeed  = document.getElementById('slider-speed');
const valueLat     = document.getElementById('value-lat');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  lat: 45,
  speed: 3,
  sim: null,
  trail: [],
  az: -0.7,            // camera azimuth (radians); slow live orbit
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  cool: cssVar('--accent-cool', '#7fb1d8'),
  warm: cssVar('--accent-warm', '#d68a69'),
};

// Scene scale (world units ~ pendulum amplitude 1).
const RW = 1.45;                 // sand-bed radius (world)
const HAP = 1.95;                // apex height (world); mount stays in frame
const S = 138;                   // pixels per world unit
const ELEV = 0.5;                // camera tilt (radians)
const CX = W / 2, CY = H * 0.52;
const NPINS = 20;

function project(x, y, z) {
  const ca = Math.cos(state.az), sa = Math.sin(state.az);
  const ex = x * ca - y * sa;
  const ey = x * sa + y * ca;
  return {
    sx: CX + ex * S,
    sy: CY - z * S * Math.cos(ELEV) + ey * S * Math.sin(ELEV),
    depth: ey,
  };
}

function rebuild() {
  state.sim = createFoucault({ latDeg: state.lat, x0: 1.0, y0: 0, vx0: 0, vy0: 0 });
  state.trail = [];
}

function drawSandBed() {
  // Filled ellipse from the projected rim, plus concentric grooves.
  const rim = [];
  for (let i = 0; i <= 64; i += 1) {
    const a = (i / 64) * 2 * Math.PI;
    rim.push(project(RW * Math.cos(a), RW * Math.sin(a), 0));
  }
  const g = ctx.createLinearGradient(0, CY - RW * S * 0.6, 0, CY + RW * S * 0.6);
  g.addColorStop(0, '#171a1f'); g.addColorStop(1, '#0c0d11');
  ctx.fillStyle = g;
  ctx.beginPath();
  rim.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1.2; ctx.stroke();
  for (const rr of [0.33, 0.66]) {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath();
    for (let i = 0; i <= 64; i += 1) {
      const a = (i / 64) * 2 * Math.PI;
      const p = project(RW * rr * Math.cos(a), RW * rr * Math.sin(a), 0);
      if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
  }
}

// Decorative marker pegs around the rim; the one nearest the current
// swing-plane azimuth is highlighted so the precession reads on the rim.
function drawPins(planeAngle) {
  for (let i = 0; i < NPINS; i += 1) {
    const a = (i / NPINS) * 2 * Math.PI;
    const d = Math.abs(((a - planeAngle) % Math.PI + Math.PI + Math.PI / 2) % Math.PI - Math.PI / 2);
    const lit = d < Math.PI / NPINS;
    const bx = RW * 0.99 * Math.cos(a), by = RW * 0.99 * Math.sin(a);
    const base = project(bx, by, 0);
    const top = project(bx, by, lit ? 0.20 : 0.12);
    ctx.strokeStyle = lit ? tok.warm : 'rgba(150,156,168,0.45)';
    ctx.lineWidth = lit ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(base.sx, base.sy); ctx.lineTo(top.sx, top.sy); ctx.stroke();
  }
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;
  const s = state.sim;
  const Oz = omegaZ(state.lat);
  const Tp = state.lat === 0 ? Infinity : precessionPeriod(state.lat);
  const planeAngle = -Oz * s.t;                 // swing-plane orientation

  drawSandBed();

  // Initial swing axis (dashed) on the sand.
  ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
  let p1 = project(-RW, 0, 0.001), p2 = project(RW, 0, 0.001);
  ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
  ctx.setLineDash([]);

  // Carved rosette trail (older = fainter).
  const tr = state.trail, n = tr.length;
  for (let i = 1; i < n; i += 1) {
    const a = project(tr[i - 1][0], tr[i - 1][1], 0.002);
    const b = project(tr[i][0], tr[i][1], 0.002);
    ctx.strokeStyle = `rgba(127,177,216,${0.10 + 0.55 * i / n})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
  }

  drawPins(planeAngle);

  // Pendulum: bob at horizontal (x, y); small-angle height above the
  // sand rho^2 / (2 L) so it skims the bottom and rises at the turns.
  const rho2 = s.x * s.x + s.y * s.y;
  const zb = 0.06 + rho2 / (2 * 2.6);
  const apex = project(0, 0, HAP);
  const bob = project(s.x, s.y, zb);

  // Ceiling mount.
  const m1 = project(-0.28, 0, HAP), m2 = project(0.28, 0, HAP);
  ctx.strokeStyle = 'rgba(200,205,215,0.6)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(m1.sx, m1.sy); ctx.lineTo(m2.sx, m2.sy); ctx.stroke();
  ctx.fillStyle = '#9aa6b8'; ctx.beginPath(); ctx.arc(apex.sx, apex.sy, 4, 0, 2 * Math.PI); ctx.fill();

  // Stylus drop line to the sand at the bob's ground point.
  const gp = project(s.x, s.y, 0.002);
  ctx.strokeStyle = 'rgba(214,138,105,0.35)'; ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(bob.sx, bob.sy); ctx.lineTo(gp.sx, gp.sy); ctx.stroke();
  ctx.setLineDash([]);

  // Suspension wire + shaded bob.
  ctx.strokeStyle = 'rgba(220,225,235,0.75)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(apex.sx, apex.sy); ctx.lineTo(bob.sx, bob.sy); ctx.stroke();
  const rr = 13;
  const rg = ctx.createRadialGradient(bob.sx - 4, bob.sy - 5, 2, bob.sx, bob.sy, rr);
  rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.3, tok.warm); rg.addColorStop(1, '#241008');
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(bob.sx, bob.sy, rr, 0, 2 * Math.PI); ctx.fill();

  // Readout (monospace).
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.textAlign = 'left';
  ctx.fillText(`latitude = ${state.lat} deg    t = ${s.t.toFixed(1)} s`, 24, 26);
  const TpStr = Number.isFinite(Tp) ? `${Tp.toFixed(1)} s` : 'no precession';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`omega_z = ${Oz.toFixed(3)} rad/s   T_precess = ${TpStr}   plane rotated = ${(planeAngle * 180 / Math.PI).toFixed(0)} deg`, 24, 44);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'left';
  ctx.fillText('dashed = initial swing axis    lit rim pegs mark the current swing plane', 24, H - 18);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepFoucault(state.sim, 0.02);
    state.trail.push([state.sim.x, state.sim.y]);
    if (state.trail.length > 7000) state.trail.shift();
  }
}

sliderLat.addEventListener('change', () => { state.lat = parseInt(sliderLat.value, 10); valueLat.textContent = `${state.lat} deg`; rebuild(); drawAll(); });
sliderLat.addEventListener('input', () => { valueLat.textContent = `${parseInt(sliderLat.value, 10)} deg`; });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  valueLat.textContent = `${state.lat} deg`;
  valueSpeed.textContent = String(state.speed);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.az = -0.7;                              // fixed camera for determinism
    tickN(Math.round(frac * 2600));
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
      }));
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    tickN(state.speed);
    state.az += 0.0016;                           // slow live orbit
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
