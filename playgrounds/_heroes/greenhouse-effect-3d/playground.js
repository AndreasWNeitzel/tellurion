// Greenhouse Effect hero. A 3D Earth + Sun radiative-balance scene
// with photon paths (visible IN, IR OUT, IR trapped in the atmosphere
// layer). The surface temperature is computed by the single-layer
// grey-atmosphere model; sliders for CO2, albedo, photon density.

import {
  S_SOLAR_WM2, emissionTemperature_K, surfaceTemperature_K,
  multilayerSurfaceTemperature_K, tauFromCO2, GHE_PRESETS, makeRng,
} from './sim.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const DETERMINISTIC = params.get('deterministic') === '1';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 6, minRadius: 2.5, maxRadius: 18,
  azimuthDeg: 30, elevationDeg: 15, fovDeg: 50,
});

// Readouts.
const rCo2 = document.getElementById('readout-co2');
const rA = document.getElementById('readout-A');
const rTau = document.getElementById('readout-tau');
const rTeff = document.getElementById('readout-Teff');
const rTsurf = document.getElementById('readout-Tsurf');

// Controls.
const selPreset = document.getElementById('select-preset'), vPreset = document.getElementById('value-preset');
const sCo2 = document.getElementById('slider-co2'), vCo2 = document.getElementById('value-co2');
const sA = document.getElementById('slider-A'), vAv = document.getElementById('value-A');
const sRho = document.getElementById('slider-rho'), vRho = document.getElementById('value-rho');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  preset: 'current',
  co2_ppm: 420,
  A: 0.30,
  n_layers: 1,
  rho: 80,        // photons per frame
  running: !prefersReducedMotion(),
  t: 0,
};

function applyPreset(name) {
  const p = GHE_PRESETS[name];
  if (!p) return;
  st.preset = name;
  st.co2_ppm = p.co2_ppm;
  st.A = p.A;
  st.n_layers = p.n_layers;
  sCo2.value = String(Math.min(1e6, p.co2_ppm));
  sA.value = String(p.A);
}

// =========================================================================
// 3D PROJECTION (same pattern as other heroes).
// =========================================================================
function makeCamBasis() {
  const eye = camera.eyePosition();
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const fx = target[0] - eye[0], fy = target[1] - eye[1], fz = target[2] - eye[2];
  const fl = Math.hypot(fx, fy, fz);
  const f = [fx / fl, fy / fl, fz / fl];
  const rx = f[1] * up[2] - f[2] * up[1];
  const ry = f[2] * up[0] - f[0] * up[2];
  const rz = f[0] * up[1] - f[1] * up[0];
  const rl = Math.hypot(rx, ry, rz);
  const r = [rx / rl, ry / rl, rz / rl];
  const ux = r[1] * f[2] - r[2] * f[1];
  const uy = r[2] * f[0] - r[0] * f[2];
  const uz = r[0] * f[1] - r[1] * f[0];
  return { eye, f, r, u: [ux, uy, uz], tanHalfFov: Math.tan(50 * Math.PI / 180 / 2), aspect: W / H };
}
function w2s(p, cam) {
  const dx = p[0] - cam.eye[0], dy = p[1] - cam.eye[1], dz = p[2] - cam.eye[2];
  const zf = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
  if (zf <= 0.01) return null;
  const xr = dx * cam.r[0] + dy * cam.r[1] + dz * cam.r[2];
  const yu = dx * cam.u[0] + dy * cam.u[1] + dz * cam.u[2];
  const xn = xr / (zf * cam.tanHalfFov * cam.aspect);
  const yn = yu / (zf * cam.tanHalfFov);
  return { x: (xn * 0.5 + 0.5) * W, y: (1.0 - (yn * 0.5 + 0.5)) * H, depth: zf };
}

// =========================================================================
// STARFIELD background.
// =========================================================================
const STARS = [];
{
  const r = makeRng(0xD15EA5E);
  for (let i = 0; i < 200; i++) {
    STARS.push({ x: r() * W, y: r() * H, b: 0.10 + 0.55 * r() });
  }
}
function drawSky() {
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, W, H);
  for (const s of STARS) {
    ctx.fillStyle = `rgba(200, 220, 255, ${s.b.toFixed(3)})`;
    ctx.fillRect(s.x, s.y, 1, 1);
  }
}

// =========================================================================
// EARTH (depth-sorted UV sphere with blue/green/white tint based on
// latitude, plus a polar tilt).
// =========================================================================
const N_TH = 18, N_PH = 28;
const earthQuads = [];
{
  for (let i = 0; i < N_TH; i++) {
    const th0 = (i / N_TH) * Math.PI;
    const th1 = ((i + 1) / N_TH) * Math.PI;
    for (let j = 0; j < N_PH; j++) {
      const ph0 = (j / N_PH) * 2 * Math.PI;
      const ph1 = ((j + 1) / N_PH) * 2 * Math.PI;
      earthQuads.push({ th0, th1, ph0, ph1 });
    }
  }
}

function earthTint(thc, phc, isVenus) {
  if (isVenus) {
    // Yellow-orange Venusian clouds.
    return [220 + 30 * Math.cos(3 * phc), 180 + 30 * Math.sin(2 * thc), 80];
  }
  const lat = Math.cos(thc);    // 1 at pole, -1 at south pole
  const polar = Math.abs(lat);
  // Land/ocean mix by longitude.
  const isLand = Math.cos(4 * phc + 1.7) > 0.1 && polar < 0.85;
  if (polar > 0.85) {
    return [220, 235, 250];     // ice cap
  }
  if (isLand) {
    return [60 + 40 * Math.cos(3 * phc), 110 + 40 * Math.sin(2 * thc + phc), 50];
  }
  return [40, 80, 160];           // ocean
}

const R_EARTH = 1.0;

function drawEarth(cam, rotPhase) {
  const isVenus = st.preset === 'venus_runaway';
  const items = [];
  for (const q of earthQuads) {
    const thc = (q.th0 + q.th1) / 2;
    const phc = (q.ph0 + q.ph1) / 2 + rotPhase;
    const center = [
      R_EARTH * Math.sin(thc) * Math.cos(phc),
      R_EARTH * Math.cos(thc),
      R_EARTH * Math.sin(thc) * Math.sin(phc),
    ];
    const dx = center[0] - cam.eye[0], dy = center[1] - cam.eye[1], dz = center[2] - cam.eye[2];
    const depth = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
    if (depth <= 0) continue;
    const norm = [center[0] / R_EARTH, center[1] / R_EARTH, center[2] / R_EARTH];
    const facing = (dx * norm[0] + dy * norm[1] + dz * norm[2]);
    if (facing > 0) continue;
    items.push({ q, thc, phc, center, depth, norm });
  }
  items.sort((a, b) => b.depth - a.depth);
  // Sun direction (for shading): we put Sun far on +x.
  const sunDir = [1, 0.2, 0]; const sLen = Math.hypot(sunDir[0], sunDir[1], sunDir[2]);
  const sun = [sunDir[0] / sLen, sunDir[1] / sLen, sunDir[2] / sLen];
  for (const it of items) {
    const { q, thc, phc, norm } = it;
    const verts = [
      [R_EARTH * Math.sin(q.th0) * Math.cos(q.ph0 + rotPhase), R_EARTH * Math.cos(q.th0), R_EARTH * Math.sin(q.th0) * Math.sin(q.ph0 + rotPhase)],
      [R_EARTH * Math.sin(q.th0) * Math.cos(q.ph1 + rotPhase), R_EARTH * Math.cos(q.th0), R_EARTH * Math.sin(q.th0) * Math.sin(q.ph1 + rotPhase)],
      [R_EARTH * Math.sin(q.th1) * Math.cos(q.ph1 + rotPhase), R_EARTH * Math.cos(q.th1), R_EARTH * Math.sin(q.th1) * Math.sin(q.ph1 + rotPhase)],
      [R_EARTH * Math.sin(q.th1) * Math.cos(q.ph0 + rotPhase), R_EARTH * Math.cos(q.th1), R_EARTH * Math.sin(q.th1) * Math.sin(q.ph0 + rotPhase)],
    ];
    const proj = verts.map(v => w2s(v, cam));
    if (proj.some(p => p === null)) continue;
    const tint = earthTint(thc, phc, isVenus);
    const lambert = Math.max(0.10, sun[0] * norm[0] + sun[1] * norm[1] + sun[2] * norm[2]);
    const r = Math.round(tint[0] * lambert);
    const g = Math.round(tint[1] * lambert);
    const b = Math.round(tint[2] * lambert);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.moveTo(proj[0].x, proj[0].y);
    ctx.lineTo(proj[1].x, proj[1].y);
    ctx.lineTo(proj[2].x, proj[2].y);
    ctx.lineTo(proj[3].x, proj[3].y);
    ctx.closePath();
    ctx.fill();
  }
  // Atmospheric layer: thin translucent sphere outside Earth.
  const tau = tauFromCO2(st.co2_ppm);
  const atmAlpha = (1 - tau) * 0.35;       // more opaque -> visible layer.
  const center2D = w2s([0, 0, 0], cam);
  const refR = w2s([R_EARTH * 1.10, 0, 0], cam);
  if (center2D && refR) {
    const Rpx = Math.hypot(refR.x - center2D.x, refR.y - center2D.y);
    const glow = ctx.createRadialGradient(center2D.x, center2D.y, Rpx * 0.95, center2D.x, center2D.y, Rpx * 1.20);
    glow.addColorStop(0, `rgba(120, 220, 255, ${atmAlpha.toFixed(3)})`);
    glow.addColorStop(1, 'rgba(120, 220, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(center2D.x, center2D.y, Rpx * 1.20, 0, 2 * Math.PI); ctx.fill();
  }
}

function drawSun(cam) {
  // Sun is "behind" the camera direction. We draw it as a bright disk
  // off-screen-ish; for the photon paths we treat it as at (5.5, 1.1, 0).
  const sunPos = [5.5, 1.1, 0];
  const s = w2s(sunPos, cam);
  if (!s) return;
  const glow = ctx.createRadialGradient(s.x, s.y, 5, s.x, s.y, 50);
  glow.addColorStop(0, 'rgba(255, 240, 200, 1)');
  glow.addColorStop(0.4, 'rgba(255, 200, 100, 0.55)');
  glow.addColorStop(1, 'rgba(255, 100, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(s.x, s.y, 50, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255, 245, 220, 1)';
  ctx.beginPath(); ctx.arc(s.x, s.y, 14, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255, 220, 140, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Sun', s.x + 18, s.y + 4);
}

// =========================================================================
// PHOTON PATHS. Deterministic-seed RNG; we draw N visible-IN photons
// streaming from the Sun toward Earth (with a few reflected by albedo)
// and N IR-OUT photons emitted from Earth's day side (with a fraction
// captured in the atmosphere layer and re-emitted back down).
// =========================================================================
function drawPhotons(cam, rng, tau) {
  const N = st.rho;
  // Visible IN: from sun position toward Earth. We sample target points
  // on Earth's "day side" (facing the Sun) and trace cyan lines.
  const sunPos = [5.5, 1.1, 0];
  for (let i = 0; i < N; i++) {
    // Random target on Earth's day-facing hemisphere.
    const theta = rng() * Math.PI;
    const phi = -Math.PI / 2 + rng() * Math.PI;
    const target = [
      R_EARTH * Math.sin(theta) * Math.cos(phi),
      R_EARTH * Math.cos(theta),
      R_EARTH * Math.sin(theta) * Math.sin(phi),
    ];
    // Approximate "incoming" point near the sun.
    const start = [
      sunPos[0] + (rng() - 0.5) * 0.4,
      sunPos[1] + (rng() - 0.5) * 0.4,
      sunPos[2] + (rng() - 0.5) * 0.4,
    ];
    const ps = w2s(start, cam);
    const pt = w2s(target, cam);
    if (!ps || !pt) continue;
    const reflected = rng() < st.A;
    if (reflected) {
      // Reflected: bounce off surface (line goes from Earth back to space).
      ctx.strokeStyle = 'rgba(180, 220, 255, 0.40)';
      ctx.lineWidth = 0.8;
      const refl = [target[0] * 2.5, target[1] * 2.5, target[2] * 2.5];
      const pr = w2s(refl, cam);
      if (pr) {
        ctx.beginPath(); ctx.moveTo(ps.x, ps.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pr.x, pr.y); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = 'rgba(120, 220, 255, 0.65)';
      ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(ps.x, ps.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
    }
  }
  // IR OUT: from Earth surface (random point on full sphere) outward.
  // Probability of escape = tau (transmissivity). Otherwise the photon
  // is re-absorbed at the atmosphere and re-emitted down (i.e., the
  // "trapped IR").
  for (let i = 0; i < N; i++) {
    const theta = rng() * Math.PI;
    const phi = rng() * 2 * Math.PI;
    const source = [
      R_EARTH * Math.sin(theta) * Math.cos(phi),
      R_EARTH * Math.cos(theta),
      R_EARTH * Math.sin(theta) * Math.sin(phi),
    ];
    const ps = w2s(source, cam);
    if (!ps) continue;
    if (rng() < tau) {
      // Escapes to space.
      const dir = [source[0], source[1], source[2]];
      const dl = Math.hypot(dir[0], dir[1], dir[2]);
      const end = [dir[0] / dl * 4.0, dir[1] / dl * 4.0, dir[2] / dl * 4.0];
      const pe = w2s(end, cam);
      if (!pe) continue;
      ctx.strokeStyle = 'rgba(255, 130, 110, 0.40)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(ps.x, ps.y); ctx.lineTo(pe.x, pe.y); ctx.stroke();
    } else {
      // Trapped: short outgoing segment then re-emitted toward surface (closer in).
      const dir = [source[0], source[1], source[2]];
      const dl = Math.hypot(dir[0], dir[1], dir[2]);
      const atm = [dir[0] / dl * 1.18, dir[1] / dl * 1.18, dir[2] / dl * 1.18];
      const back = [dir[0] / dl * 0.5, dir[1] / dl * 0.5, dir[2] / dl * 0.5];
      const pa = w2s(atm, cam);
      const pb = w2s(back, cam);
      if (!pa || !pb) continue;
      ctx.strokeStyle = 'rgba(255, 200, 130, 0.65)';
      ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(ps.x, ps.y); ctx.lineTo(pa.x, pa.y); ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 150, 100, 0.55)';
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    }
  }
}

// =========================================================================
// TEMPERATURE PANEL.
// =========================================================================
function drawTemperaturePanel(T_eff, T_surf) {
  const px = 12, py = 50, pw = 250, ph = 230;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('T_surf vs tau_LW (single-layer model)', px + 8, py - 6);
  // Plot T_surf as a function of tau_LW in [0, 1].
  const N = 200;
  const xs = [], ys = [];
  let yMin = Infinity, yMax = -Infinity;
  for (let k = 0; k < N; k++) {
    const tau = k / (N - 1);
    const T = surfaceTemperature_K(S_SOLAR_WM2, st.A, tau);
    xs.push(tau); ys.push(T);
    if (T < yMin) yMin = T; if (T > yMax) yMax = T;
  }
  function xForTau(tau) { return px + 36 + tau * (pw - 56); }
  function yForT(T) { return py + ph - 30 - (T - yMin) / Math.max(1e-6, yMax - yMin) * (ph - 50); }
  // Grid.
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.10)';
  for (let tau = 0; tau <= 1; tau += 0.25) {
    ctx.beginPath(); ctx.moveTo(xForTau(tau), py + 16); ctx.lineTo(xForTau(tau), py + ph - 30); ctx.stroke();
  }
  // Curve.
  ctx.strokeStyle = 'rgba(255, 130, 110, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    const x = xForTau(xs[k]); const y = yForT(ys[k]);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current tau marker.
  const tau_now = tauFromCO2(st.co2_ppm);
  const xc = xForTau(tau_now);
  // For Venus: use multi-layer formula.
  const T_surf_now = (st.n_layers > 1)
    ? multilayerSurfaceTemperature_K(S_SOLAR_WM2, st.A, tauFromCO2(st.co2_ppm), st.n_layers)
    : T_surf;
  const yc = yForT(Math.min(yMax, T_surf_now));
  ctx.fillStyle = 'rgba(255, 255, 200, 1)';
  ctx.beginPath(); ctx.arc(xc, yc, 6, 0, 2 * Math.PI); ctx.fill();
  // Axes.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('tau_LW', px + pw - 32, py + ph - 12);
  ctx.fillText('T (K)', px + 4, py + 18);
  ctx.fillText('0', xForTau(0) - 4, py + ph - 14);
  ctx.fillText('0.5', xForTau(0.5) - 6, py + ph - 14);
  ctx.fillText('1', xForTau(1) - 4, py + ph - 14);
  ctx.fillText(yMin.toFixed(0), px + 4, py + ph - 30);
  ctx.fillText(yMax.toFixed(0), px + 4, py + 30);
  // Readout strip.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`T_eff = ${T_eff.toFixed(1)} K`, px + 8, py + ph + 18);
  ctx.fillText(`T_surf = ${T_surf_now.toFixed(1)} K (${(T_surf_now - 273.15).toFixed(1)} C)`, px + 8, py + ph + 34);
}

// =========================================================================
// LEGEND PANEL (color key).
// =========================================================================
function drawLegend() {
  const px = W - 270, py = H - 110, pw = 256, ph = 90;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('photon legend', px + 8, py + 16);
  const rows = [
    { c: 'rgba(120, 220, 255, 0.85)', t: 'visible IN (solar shortwave)' },
    { c: 'rgba(180, 220, 255, 0.55)', t: 'reflected IN (albedo)' },
    { c: 'rgba(255, 130, 110, 0.85)', t: 'IR OUT to space (tau_LW)' },
    { c: 'rgba(255, 200, 130, 0.85)', t: 'IR trapped in atmosphere' },
  ];
  let yy = py + 30;
  for (const r of rows) {
    ctx.fillStyle = r.c;
    ctx.fillRect(px + 10, yy - 6, 12, 3);
    ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(r.t, px + 28, yy - 3);
    yy += 14;
  }
}

// =========================================================================
// MAIN DRAW.
// =========================================================================
function draw() {
  drawSky();
  const cam = makeCamBasis();
  // Compute T_eff, T_surf.
  const tau = tauFromCO2(st.co2_ppm);
  const T_eff = emissionTemperature_K(S_SOLAR_WM2, st.A);
  const T_surf = (st.n_layers > 1)
    ? multilayerSurfaceTemperature_K(S_SOLAR_WM2, st.A, tau, st.n_layers)
    : surfaceTemperature_K(S_SOLAR_WM2, st.A, tau);
  // Earth.
  const rotPhase = st.t * 0.2;
  drawEarth(cam, rotPhase);
  drawSun(cam);
  // Photons. Use a fresh RNG each frame (deterministic when paused).
  const rng = makeRng((((st.t * 60) | 0) * 1234) ^ 0xBEEF);
  drawPhotons(cam, rng, tau);
  drawTemperaturePanel(T_eff, T_surf);
  drawLegend();
  // Title strip.
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(10, 8, 300, 26);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.40)';
  ctx.strokeRect(10.5, 8.5, 299, 25);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`GREENHOUSE: ${GHE_PRESETS[st.preset].label}`, 20, 26);
  // Readouts.
  rCo2.textContent = st.co2_ppm < 1e4 ? st.co2_ppm.toFixed(0) : st.co2_ppm.toExponential(2);
  rA.textContent = st.A.toFixed(2);
  rTau.textContent = tau.toFixed(3);
  rTeff.textContent = T_eff.toFixed(1);
  rTsurf.textContent = T_surf.toFixed(1);
}

function readSliders() {
  if (selPreset.value !== st.preset) applyPreset(selPreset.value);
  else {
    st.co2_ppm = parseFloat(sCo2.value);
    st.A = parseFloat(sA.value);
  }
  st.rho = parseFloat(sRho.value);
  vPreset.textContent = selPreset.value;
  vCo2.textContent = st.co2_ppm < 1e4 ? st.co2_ppm.toFixed(0) : st.co2_ppm.toExponential(2);
  vAv.textContent = st.A.toFixed(2);
  vRho.textContent = String(st.rho);
}

[selPreset, sCo2, sA, sRho].forEach(el => el.addEventListener('input', readSliders));
selPreset.addEventListener('change', readSliders);
btnReset.addEventListener('click', () => { st.t = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  preset: { get: () => st.preset, set: v => { st.preset = v; selPreset.value = v; }, parse: x => x },
  co2_ppm: { get: () => st.co2_ppm, set: v => { st.co2_ppm = parseFloat(v); sCo2.value = v; }, parse: parseFloat },
  albedo: { get: () => st.A, set: v => { st.A = parseFloat(v); sA.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
applyPreset(st.preset);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

const captureMap = ['preindustrial', 'current', 'doubled_co2', 'snowball', 'venus_runaway'];

if (CAPTURE_NAME) {
  const idx = Math.min(4, Math.max(0, Math.floor((CAPTURE_FRAC || 0) * 5)));
  selPreset.value = captureMap[idx];
  applyPreset(captureMap[idx]);
  readSliders();
  st.t = (CAPTURE_FRAC || 0) * 4 + 0.5;
  if (camera.setAzimuthDeg) camera.setAzimuthDeg(30 + CAPTURE_FRAC * 30);
  draw();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
  } else {
    window.__simulationReady = true;
  }
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) st.t += dt;
    if (camera.tickIdle) camera.tickIdle(now);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}
