// Parker (1958) isothermal solar wind, shown as the wind itself: plasma
// parcels stream radially from the Sun, accelerating from subsonic near
// the surface, through the sonic surface r_c, to a supersonic asymptote,
// with dr/dt = u(r) taken from the exact transonic Parker solution. A
// compact u(r) strip keeps the quantitative curve. sim.js is unchanged.

import { criticalRadius, parkerSpeed, R_SUN } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas = document.getElementById('stage');
const ctx    = canvas.getContext('2d', { alpha: false });
const rU     = document.getElementById('readout-u');
const sT     = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const btnR   = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const W = canvas.width, H = canvas.height;
const rng = makeRng(SEED);

const R_MAX   = 220 * R_SUN;
const K_MP    = 1.38e-23 / 1.66e-27;
const TIME_ACCEL = 7.0e4;             // physical seconds per animation second-ish

let st = { T: 1.4, t: 0 };
let running = !prefersReducedMotion();

function csOf(Tmk) { return Math.sqrt(2 * K_MP * Tmk * 1e6); }

// Scene geometry: Sun centred, radial outflow. Logarithmic radial map so
// the subsonic-to-sonic region (a few R_sun) is not crushed to a dot.
const cx = W * 0.5, cy = H * 0.36;
const SCENE_R = Math.min(W, H * 0.72) * 0.46;
const R0_PX = 16;
const lnSpan = Math.log(R_MAX / R_SUN);
function rToScreen(r) {
  const f = Math.log(Math.max(r, R_SUN) / R_SUN) / lnSpan;
  return R0_PX + (SCENE_R - R0_PX) * Math.min(1, f);
}

const NP = 620;
const parcels = [];
function spawn(p, seeded) {
  p.th = 2 * Math.PI * rng();
  p.jit = (rng() - 0.5) * 0.05;                    // slight angular spread
  if (seeded) {
    // Uniform in log-r (matches the radial screen map) so the stream fills
    // the whole domain smoothly instead of forming a shell.
    p.r = R_SUN * Math.exp(lnSpan * rng());
  } else {
    p.r = R_SUN * (1.01 + 0.05 * rng());           // re-emitted from the surface
  }
}
for (let i = 0; i < NP; i += 1) { const p = {}; spawn(p, true); parcels.push(p); }

function advance(dtSim, cs) {
  const dtPhys = dtSim * TIME_ACCEL;
  for (const p of parcels) {
    const u = parkerSpeed(p.r, cs);
    p.r += u * dtPhys;
    if (p.r > R_MAX) spawn(p, false);
  }
}

function drawScene(cs, rc) {
  // Space backdrop with a faint radial glow.
  ctx.fillStyle = '#04050a';
  ctx.fillRect(0, 0, W, H * 0.70);
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, SCENE_R * 1.15);
  halo.addColorStop(0, 'rgba(255,210,140,0.10)');
  halo.addColorStop(1, 'rgba(255,210,140,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(cx, cy, SCENE_R * 1.15, 0, 2 * Math.PI); ctx.fill();

  // Sonic surface r_c (dashed circle) where u = c_s, M = 1.
  const rcPx = rToScreen(rc);
  ctx.strokeStyle = 'rgba(91,192,235,0.7)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy, rcPx, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`sonic surface  r_c = ${(rc / R_SUN).toFixed(1)} R_sun`, cx + rcPx + 6, cy - 4);

  // Plasma parcels, coloured by Mach number u/c_s.
  for (const p of parcels) {
    const u = parkerSpeed(p.r, cs);
    const M = u / cs;
    const rs = rToScreen(p.r);
    const ang = p.th + p.jit;
    const x = cx + rs * Math.cos(ang);
    const y = cy + rs * Math.sin(ang);
    // Map Mach to colour so the subsonic core is cool (viridis low) and the
    // supersonic wind is bright; M = 1 (sonic surface) sits mid-scale.
    const c = viridis(Math.max(0, Math.min(1, 0.12 + 0.40 * M)));
    const rs2 = rToScreen(Math.max(R_SUN, p.r - u * 1.4e4));
    const x2 = cx + rs2 * Math.cos(ang), y2 = cy + rs2 * Math.sin(ang);
    ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${0.30 + 0.45 * Math.min(1, M / 2.5)})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
    ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 2 * Math.PI); ctx.fill();
  }

  // The Sun.
  const sun = ctx.createRadialGradient(cx, cy, 0, cx, cy, R0_PX + 6);
  sun.addColorStop(0, '#fff3c4'); sun.addColorStop(0.6, '#ffb347'); sun.addColorStop(1, 'rgba(255,140,60,0)');
  ctx.fillStyle = sun;
  ctx.beginPath(); ctx.arc(cx, cy, R0_PX + 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#fff6dc';
  ctx.beginPath(); ctx.arc(cx, cy, R0_PX * 0.55, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('solar wind: parcels accelerate through the sonic surface (color = Mach)', 12, 16);
}

function drawProfile(cs, rc) {
  const top = H * 0.70;
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, top, W, H - top);
  const pad = { l: 56, r: 24, t: 14, b: 30 };
  const x0 = pad.l, x1 = W - pad.r, y0 = top + pad.t, y1 = H - pad.b;
  const u_max = 700e3;
  // Same log-r axis as the scene so the two views line up conceptually.
  const rToX = (r) => x0 + (x1 - x0) * Math.log(Math.max(r, R_SUN) / R_SUN) / lnSpan;
  const uToY = (u) => y1 - (u / u_max) * (y1 - y0);

  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('u(r) (km/s)', 10, y0 + 8);
  ctx.textAlign = 'center';
  ctx.fillText('r (log, R_sun)', (x0 + x1) / 2, H - 8);

  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 400; i += 1) {
    const r = R_SUN * Math.exp(lnSpan * i / 400);
    const px = rToX(r), py = uToY(parkerSpeed(r, cs));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(rToX(rc), y0); ctx.lineTo(rToX(rc), y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, uToY(cs)); ctx.lineTo(x1, uToY(cs)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.textAlign = 'left';
  ctx.fillText(`c_s = ${(cs / 1000).toFixed(0)} km/s`, x1 - 110, uToY(cs) - 4);

  const r_AU = 1.496e11;
  const u_1AU = parkerSpeed(r_AU, cs);
  ctx.fillStyle = '#06d6a0';
  ctx.beginPath(); ctx.arc(rToX(r_AU), uToY(u_1AU), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`u(1 AU) = ${(u_1AU / 1000).toFixed(0)} km/s, T = ${st.T.toFixed(2)} MK`, 12, H - 8);
  rU.textContent = `${(u_1AU / 1000).toFixed(0)} km/s`;
}

function render() {
  const cs = csOf(st.T);
  const rc = criticalRadius(cs);
  drawScene(cs, rc);
  drawProfile(cs, rc);
}

sT.addEventListener('input', () => { st.T = parseFloat(sT.value); vT.textContent = st.T.toFixed(2); });
btnR.addEventListener('click', () => {
  st.t = 0; for (const p of parcels) spawn(p, true);
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false');
});
btnP.addEventListener('click', () => {
  running = !running; btnP.textContent = running ? 'Pause' : 'Play';
  btnP.setAttribute('aria-pressed', String(!running));
});

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (running) { st.t += dt; advance(dt, csOf(st.T)); }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    // Deterministic: settle parcels to a frame-dependent elapsed time so
    // the streaming pattern is stable and each frame differs.
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const cs = csOf(st.T);
    for (const p of parcels) spawn(p, true);
    const steps = Math.round(40 + frac * 90);
    for (let s = 0; s < steps; s += 1) advance(1 / 60, cs);
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
      }));
    }
    return;
  }
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
