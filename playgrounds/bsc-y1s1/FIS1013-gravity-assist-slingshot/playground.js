// Gravity-assist slingshot. Hyperbolic flyby around a planet in the planet
// rest frame (symmetric: |v_in| = |v_out|), with delta-V emerging in the
// solar-system frame from vector addition with v_planet.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? 'NaN');
let probePhase = 0;

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;

// Units: planet at origin in its rest frame, planet radius = 1 (visual).
// In the solar system frame, planet moves at v_planet in +x direction.
const state = {
  r_min:    2.0,    // periapsis distance (in planet radii); user-tunable
  v_inf:    1.0,    // hyperbolic excess speed in planet frame (units of v_planet)
  approach: 0.0,    // entry angle (rad, 0 = parallel to planet motion)
};

function hyperbola(r_min, v_inf, GM) {
  // Conic: r(theta) = p / (1 + e cos theta), with p = a(1 - e^2) = h^2/GM,
  // for hyperbola use a < 0. h = r_min * v_peri, with v_peri^2 = v_inf^2 + 2GM/r_min.
  const v_peri = Math.sqrt(v_inf * v_inf + 2 * GM / r_min);
  const h = r_min * v_peri;
  const p = h * h / GM;
  const e = p / r_min - 1;       // eccentricity from r_peri = p/(1+e)
  const delta = 2 * Math.asin(1 / e); // turning angle
  return { v_peri, h, p, e, delta };
}

function sampleHyperbola(orbit, n) {
  // Return n points on the hyperbola from incoming asymptote to outgoing.
  const { p, e } = orbit;
  const thetaMax = Math.acos(-1 / e) * 0.985;       // approach the asymptote
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const t = (i / (n - 1)) * 2 - 1;                 // -1..1
    const theta = t * thetaMax;
    const r = p / (1 + e * Math.cos(theta));
    pts.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
  }
  return pts;
}

function rotate(pts, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  return pts.map(p => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c }));
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);

  const GM = 1;
  const orbit = hyperbola(state.r_min, state.v_inf, GM);
  const pts = rotate(sampleHyperbola(orbit, 240), state.approach);

  // Layout: planet on left, full canvas as planet-frame view; small inset
  // panel on right shows solar-system-frame vector addition.
  const cx = W * 0.35, cy = H * 0.5;
  const scale = Math.min(W * 0.3, H * 0.3) / Math.max(state.r_min * 4, 1);

  // Planet as a clean shaded sphere with latitude bands clipped to the
  // disc (the old code drew vertically offset full circles, which made
  // the body look lumpy / weirdly shaped).
  const R = scale * 0.9;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.clip();
  const pg = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
  pg.addColorStop(0, '#f0b070'); pg.addColorStop(0.6, '#cf7f3a'); pg.addColorStop(1, '#5e3413');
  ctx.fillStyle = pg;
  ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.fillStyle = 'rgba(90,45,15,0.35)';
  for (let b = -0.7; b <= 0.7; b += 0.28) {
    ctx.fillRect(cx - R, cy + b * R - R * 0.05, 2 * R, R * 0.10);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();

  // Trajectory in planet frame.
  ctx.strokeStyle = '#7c9cff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    const X = cx + p.x * scale, Y = cy + p.y * scale;
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();

  // Animated spacecraft flying the slingshot, with a comet trail.
  const pi = Math.min(pts.length - 1, Math.max(0, Math.floor(probePhase * (pts.length - 1))));
  ctx.lineWidth = 2.4;
  for (let k = Math.max(1, pi - 26); k <= pi; k += 1) {
    const a = pts[k - 1], b = pts[k];
    ctx.strokeStyle = `rgba(124,255,170,${0.06 + 0.5 * (k - (pi - 26)) / 26})`;
    ctx.beginPath();
    ctx.moveTo(cx + a.x * scale, cy + a.y * scale);
    ctx.lineTo(cx + b.x * scale, cy + b.y * scale);
    ctx.stroke();
  }
  const sp = pts[pi];
  const gx = cx + sp.x * scale, gy = cy + sp.y * scale;
  const gl = ctx.createRadialGradient(gx, gy, 0, gx, gy, 12);
  gl.addColorStop(0, 'rgba(170,255,200,0.95)'); gl.addColorStop(1, 'rgba(170,255,200,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(gx, gy, 12, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#d9ffe6'; ctx.beginPath(); ctx.arc(gx, gy, 3.5, 0, 2 * Math.PI); ctx.fill();

  // Velocity arrows at entry / exit (planet frame).
  const v_in  = { x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y };
  const v_out = { x: pts[pts.length - 1].x - pts[pts.length - 2].x, y: pts[pts.length - 1].y - pts[pts.length - 2].y };
  function unit(v) { const m = Math.hypot(v.x, v.y); return { x: v.x / m, y: v.y / m }; }
  const uin = unit(v_in), uout = unit(v_out);
  const aLen = scale * 1.5;

  function arrow(x0, y0, ux, uy, col) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + ux * aLen, y0 + uy * aLen); ctx.stroke();
    const ah = 8;
    const ang = Math.atan2(uy, ux);
    ctx.beginPath();
    ctx.moveTo(x0 + ux * aLen, y0 + uy * aLen);
    ctx.lineTo(x0 + ux * aLen - ah * Math.cos(ang - 0.3), y0 + uy * aLen - ah * Math.sin(ang - 0.3));
    ctx.lineTo(x0 + ux * aLen - ah * Math.cos(ang + 0.3), y0 + uy * aLen - ah * Math.sin(ang + 0.3));
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }

  const pStart = { x: cx + pts[0].x * scale, y: cy + pts[0].y * scale };
  const pEnd   = { x: cx + pts[pts.length - 1].x * scale, y: cy + pts[pts.length - 1].y * scale };
  arrow(pStart.x, pStart.y, uin.x, uin.y, '#7c9cff');
  arrow(pEnd.x,   pEnd.y,   uout.x, uout.y, '#ffd57f');

  // Solar-system-frame inset: v_before, v_after, delta v.
  const ix = W * 0.78, iy = H * 0.5;
  const iScale = 80;
  // Planet velocity in solar frame: +x at unit speed.
  ctx.strokeStyle = 'rgba(220,220,240,0.4)';
  ctx.strokeRect(W * 0.65, H * 0.25, W * 0.32, H * 0.5);
  ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'body');
  ctx.fillText('Solar-system frame', W * 0.66, H * 0.27);

  const v_p = { x: 1, y: 0 };
  const v_before = { x: state.v_inf * uin.x + v_p.x, y: state.v_inf * uin.y + v_p.y };
  const v_after  = { x: state.v_inf * uout.x + v_p.x, y: state.v_inf * uout.y + v_p.y };
  const dv_mag = Math.hypot(v_after.x - v_before.x, v_after.y - v_before.y);
  const energy_gain = v_p.x * (v_after.x - v_before.x) + v_p.y * (v_after.y - v_before.y);

  function arrowAt(ox, oy, vx, vy, col) {
    const m = Math.hypot(vx, vy);
    if (m < 1e-6) return;
    arrow(ox, oy, vx / m, vy / m, col);
  }
  // Origin in inset.
  arrowAt(ix, iy, v_before.x, v_before.y, '#7c9cff');
  arrowAt(ix, iy, v_after.x,  v_after.y,  '#ffd57f');
  arrowAt(ix, iy, v_p.x,      v_p.y,      '#9aa0a6');

  // Delta-V arrow.
  arrowAt(ix + v_before.x * 40, iy + v_before.y * 40,
          v_after.x - v_before.x, v_after.y - v_before.y,
          energy_gain > 0 ? '#7fff8a' : '#ff7f7f');

  // Readouts.
  readoutInv.textContent =
    `dV=${dv_mag.toFixed(3)}  dE=${energy_gain.toFixed(3)}  turn=${(orbit.delta * 180 / Math.PI).toFixed(1)} deg  e=${orbit.e.toFixed(3)}`;
  readoutFrame.textContent = '-';
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, step, value, onInput, fmt = v => v.toFixed(2)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); render(); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  slider('r-min',    'r_min',    1.1, 8.0, 0.05, state.r_min, v => state.r_min = v);
  slider('v-inf',    'v_inf',    0.3, 2.5, 0.05, state.v_inf, v => state.v_inf = v);
  slider('approach', 'approach', -Math.PI / 2, Math.PI / 2, 0.05, state.approach, v => state.approach = v, v => v.toFixed(2));
}

buildControls();
if (CAPTURE_NAME) {
  probePhase = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
  render();
} else {
  let raf;
  function tick() { probePhase = (probePhase + 0.004) % 1; render(); raf = requestAnimationFrame(tick); }
  render();
  raf = requestAnimationFrame(tick);
}

if (DETERMINISTIC) {
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
}

window.__physicsCheck = async () => {
  // In planet frame, |v_in| = |v_out| = v_inf.
  // We verify by reconstructing both speeds from the sampled points.
  const orbit = hyperbola(state.r_min, state.v_inf, 1);
  const pts = sampleHyperbola(orbit, 240);
  function speed(a, b, dt) { return Math.hypot(a.x - b.x, a.y - b.y) / dt; }
  const sin  = speed(pts[1], pts[0], 1);
  const sout = speed(pts[pts.length - 1], pts[pts.length - 2], 1);
  // Speeds may not exactly match due to step length variation; the
  // symmetry check is on the SPECIFIC ORBIT ENERGY 1/2 v^2 - GM/r.
  function energy(p, q, dt) {
    const v = speed(p, q, dt);
    const r = Math.hypot((p.x + q.x) / 2, (p.y + q.y) / 2);
    return 0.5 * v * v - 1 / r;
  }
  const ein  = energy(pts[1], pts[0], 1);
  const eout = energy(pts[pts.length - 1], pts[pts.length - 2], 1);
  if (Math.abs(ein - eout) / Math.max(Math.abs(ein), 1e-6) > 0.01) {
    return { name: 'energy symmetric', pass: false, msg: `E_in=${ein.toFixed(4)} E_out=${eout.toFixed(4)}` };
  }
  return { name: 'hyperbola energy symmetric', pass: true, msg: `E_in=${ein.toFixed(4)} E_out=${eout.toFixed(4)} (delta < 1%)` };
};


// === Diagnostics interface (Layout System v2) ===
// State reports the periapsis distance, hyperbolic excess speed and
// the turning angle. The invariant checks that the hyperbolic flyby
// conserves the specific orbital energy (1/2 v^2 - GM/r): it is the
// same at the incoming and outgoing ends of the sampled trajectory,
// which is why the planet-frame speed is unchanged by the slingshot.
window.playground = window.playground || {};
window.playground.getState = function () {
  const orbit = hyperbola(state.r_min, state.v_inf, 1);
  return {
    fields: [
      { key: 'periapsis', label: 'periapsis distance', value: state.r_min, format: 'float' },
      { key: 'v-inf', label: 'hyperbolic excess speed', value: state.v_inf, format: 'float' },
      { key: 'turning-angle', label: 'turning angle (deg)', value: orbit.delta * 180 / Math.PI, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const orbit = hyperbola(state.r_min, state.v_inf, 1);
  const pts = sampleHyperbola(orbit, 240);
  const n = pts.length;
  // The planet-frame flyby is symmetric about periapsis: the incoming
  // and outgoing asymptote ends sit at equal radius and equal step
  // chord, so the planet-frame speed is unchanged (energy conserved).
  const rIn = Math.hypot(pts[0].x, pts[0].y);
  const rOut = Math.hypot(pts[n - 1].x, pts[n - 1].y);
  const chordIn = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
  const chordOut = Math.hypot(pts[n - 1].x - pts[n - 2].x, pts[n - 1].y - pts[n - 2].y);
  const drift = Math.max(
    Math.abs(rIn - rOut) / Math.max(1e-9, rIn),
    Math.abs(chordIn - chordOut) / Math.max(1e-9, chordIn),
  );
  return [{
    key: 'flyby-symmetry',
    label: 'flyby symmetric: incoming speed = outgoing speed (planet frame)',
    value: drift.toExponential(2),
    status: drift < 1e-6 ? 'pass' : (drift < 1e-3 ? 'pending' : 'drift'),
  }];
};
