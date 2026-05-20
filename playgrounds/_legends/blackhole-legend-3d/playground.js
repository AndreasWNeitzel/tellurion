// Black Hole LEGEND. A multi-mode laboratory for Schwarzschild and
// Kerr black holes. The visual core is the same WebGL2 ray-marched
// Schwarzschild + first-order-Kerr lensing engine used by the
// blackhole-geodesics-3d hero, so the lensed accretion disk is the
// reference quality. Eight modes layer extra physics on top:
//   Overview, Photons, Lensing, Frame drag, Spacetime, Ringdown,
//   Hawking, TDE.
//
// Layout: two stacked canvases. The lower #stage-gl runs the WebGL
// ray-trace (disk, shadow, lensing). The upper #stage is a Canvas2D
// overlay (text, panels, geodesic traces, twisted frame-drag grid,
// strain h(t), lightcurves, particle pair flashes). The 2D overlay
// has pointer-events: none so the orbit camera on #stage-gl handles
// drag-to-rotate and scroll-to-zoom.
//
// Mode-aware controls: each mode shows only the sliders / toggles
// that affect what it renders; irrelevant rows are hidden via CSS.

import {
  schwarzschildRadius_m, criticalImpactParameter_m,
  iscoRadius_m, kerrHorizonRadius_m,
  lensImagePositions_rad, lensMagnification,
  hawkingTemperature_K, tracePhoton, classifyPhoton, makeRng, rsKm,
  qnmFrequency, ringdownProperties, hawkingEvaporationTime_yr,
  tdeTidalRadius_m, tdePeakTime_days, tdeLightcurve, tdeIsDisrupted,
} from './sim.js';
import { setupBHGL } from '../../../shared/js/engine-gl/schwarzschild-kerr.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const DETERMINISTIC = params.get('deterministic') === '1';

// Single visible canvas (the 2D overlay). The WebGL2 ray-tracer
// runs on an OFFSCREEN canvas; each frame we blit its output into
// the visible 2D canvas via drawImage, then draw 2D overlays on
// top. This way the visual test (which screenshots #stage) sees
// the full composite, and the orbit camera attaches naturally to
// the visible canvas's pointer events.
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const DEG = Math.PI / 180;

const canvasGL = document.createElement('canvas');
canvasGL.width = W; canvasGL.height = H;
let engine = null;
try { engine = setupBHGL(canvasGL); }
catch (e) { console.warn('[bh-legend] WebGL2 init failed; falling back to 2D', e); engine = null; }

// Orbit camera attaches to the visible canvas.
const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 30, minRadius: 9, maxRadius: 90,
  azimuthDeg: 35, elevationDeg: 18, fovDeg: 62,
});
window.__camera = camera;

// Readout DOM.
const rM = document.getElementById('readout-M');
const rChi = document.getElementById('readout-chi');
const rRs = document.getElementById('readout-rs');
const rIsco = document.getElementById('readout-isco');
const rMode = document.getElementById('readout-mode');

// Control DOM.
const selMode = document.getElementById('select-mode'), vMode = document.getElementById('value-mode');
const sLogM = document.getElementById('slider-logM'), vLogM = document.getElementById('value-logM');
const sChi = document.getElementById('slider-chi'), vChi = document.getElementById('value-chi');
const sIncl = document.getElementById('slider-incl'), vIncl = document.getElementById('value-incl');
const sB = document.getElementById('slider-b'), vB = document.getElementById('value-b');
const sBeta = document.getElementById('slider-beta'), vBeta = document.getElementById('value-beta');
const tHorizon = document.getElementById('t-horizon');
const tPhotonsphere = document.getElementById('t-photonsphere');
const tIsco = document.getElementById('t-isco');
const tErgo = document.getElementById('t-ergo');
const tGrid = document.getElementById('t-grid');
const tTraces = document.getElementById('t-traces');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

// Map mode -> visible control rows. Mode-aware control surface so
// only the relevant knobs are exposed per mode.
const MODE_ROWS = {
  overview:  ['mode', 'logM', 'chi', 'incl', 'toggles'],
  photons:   ['mode', 'logM', 'b', 'toggles'],
  lensing:   ['mode', 'logM', 'beta', 'toggles'],
  framedrag: ['mode', 'logM', 'chi', 'incl', 'toggles'],
  spacetime: ['mode', 'logM', 'incl', 'toggles'],
  ringdown:  ['mode', 'logM', 'chi'],
  hawking:   ['mode', 'logM'],
  tde:       ['mode', 'logM'],
};
const allRows = Array.from(document.querySelectorAll('#controls .row[data-row]'));
function syncRowVisibility(mode) {
  const visible = new Set(MODE_ROWS[mode] || ['mode', 'logM']);
  for (const row of allRows) {
    const key = row.getAttribute('data-row');
    row.classList.toggle('hidden', !visible.has(key));
  }
}

const st = {
  mode: 'overview',
  logM: 6.0,
  chi: 0.0,
  incl: 60,
  b_rs: 2.65,
  beta_te: 0.30,
  flags: {
    horizon: true, photonsphere: true, isco: true,
    ergo: false, grid: false, traces: true,
  },
  running: !prefersReducedMotion(),
  t: 0,
  rng: makeRng(0xC0FFEE),
};

function M_solar() { return Math.pow(10, st.logM); }
function rsM() { return schwarzschildRadius_m(M_solar()); }
function rIscoRs() { return iscoRadius_m(M_solar(), st.chi) / rsM(); }
function rHorizonRs() { return kerrHorizonRadius_m(M_solar(), st.chi) / rsM(); }
function bCritRs() { return 3 * Math.sqrt(3) / 2; }

// =========================================================================
// CAMERA-SPACE PROJECTION for 2D overlays. We render the 2D overlay
// in the same coordinate frame as the WebGL canvas, projecting
// world-space points through the same camera. This lets us draw
// the photon-sphere ring, ISCO ellipse, twisted polar grid, and
// geodesic traces over the WebGL background.
//
// World units: the shader uses M = 1; the disk extends r in [6, 18]
// in those units. We define a worldToScreen(p) that mirrors the
// pinhole projection inside basis() in the shader.
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
  const u = [ux, uy, uz];
  const tanHalfFov = Math.tan(62 * Math.PI / 180 / 2);
  const aspect = W / H;
  return { eye, f, r, u, tanHalfFov, aspect };
}
function worldToScreen(p, cam) {
  const dx = p[0] - cam.eye[0], dy = p[1] - cam.eye[1], dz = p[2] - cam.eye[2];
  const zf = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
  if (zf <= 0) return null;
  const xr = dx * cam.r[0] + dy * cam.r[1] + dz * cam.r[2];
  const yu = dx * cam.u[0] + dy * cam.u[1] + dz * cam.u[2];
  const xn = xr / (zf * cam.tanHalfFov * cam.aspect);
  const yn = yu / (zf * cam.tanHalfFov);
  return { x: (xn * 0.5 + 0.5) * W, y: (1.0 - (yn * 0.5 + 0.5)) * H, depth: zf };
}

// =========================================================================
// MODE DRIVERS. Each mode controls (a) what the WebGL engine renders
// (always the lensed BH + disk), (b) the 2D overlay content, and
// (c) whether the WebGL background is dimmed.
// =========================================================================

// Blit the offscreen WebGL canvas into the visible 2D canvas as the
// background. If WebGL failed to init, paint a starry fallback.
function paintBackground() {
  if (engine) {
    ctx.drawImage(canvasGL, 0, 0, W, H);
  } else {
    drawSky2D();
  }
}

function drawSky2D() {
  // Used only when WebGL is unavailable (fallback).
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 220; i++) {
    const ix = (i * 23.7) % W;
    const iy = (i * 31.1) % H;
    const sb = 0.15 + 0.55 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(200, 220, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
  // Coarse BH disc.
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, 60, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 180, 100, 0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, 60, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255, 90, 110, 0.95)';
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText('WebGL2 unavailable; using 2D fallback', W * 0.5 - 130, H - 14);
}

// Draw the equatorial disk landmarks (ISCO + photon sphere + horizon
// outline) projected through the live camera. These give viewers the
// physical reference frame on top of the WebGL render.
function drawHorizonRings(cam) {
  const N = 64;
  function ring(rWorld, color, dash, width, plane) {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash); else ctx.setLineDash([]);
    ctx.beginPath();
    let started = false;
    for (let k = 0; k <= N; k++) {
      const a = (k / N) * 2 * Math.PI;
      const x = rWorld * Math.cos(a);
      const z = rWorld * Math.sin(a);
      const p = plane === 'equator' ? [x, 0, z] : [x, z * 0.0, z];
      const s = worldToScreen(p, cam);
      if (!s) { started = false; continue; }
      if (!started) { ctx.moveTo(s.x, s.y); started = true; } else ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (st.flags.photonsphere) {
    ring(3.0, 'rgba(255, 255, 255, 0.65)', [4, 4], 1.2, 'equator');
  }
  if (st.flags.isco) {
    // ISCO in M units: 6 for Schwarzschild, decreasing with chi.
    const rIscoM = iscoRadius_m(M_solar(), st.chi) / (rsM() / 2);
    ring(rIscoM, 'rgba(255, 220, 120, 0.85)', null, 1.4, 'equator');
  }
  if (st.flags.ergo && st.chi > 0.01) {
    ring(2.0, 'rgba(220, 120, 255, 0.85)', null, 1.4, 'equator');
  }
}

function drawCoordinateGrid(cam) {
  if (!st.flags.grid) return;
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.16)';
  ctx.lineWidth = 1;
  for (let r = 2; r <= 16; r += 2) {
    ctx.beginPath();
    let started = false;
    for (let k = 0; k <= 64; k++) {
      const a = (k / 64) * 2 * Math.PI;
      const s = worldToScreen([r * Math.cos(a), 0, r * Math.sin(a)], cam);
      if (!s) { started = false; continue; }
      if (!started) { ctx.moveTo(s.x, s.y); started = true; } else ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * 2 * Math.PI;
    ctx.beginPath();
    let started = false;
    for (let t = 0; t <= 32; t++) {
      const r = 2 + (16 - 2) * (t / 32);
      const s = worldToScreen([r * Math.cos(a), 0, r * Math.sin(a)], cam);
      if (!s) { started = false; continue; }
      if (!started) { ctx.moveTo(s.x, s.y); started = true; } else ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();
  }
}

// =========================================================================
// MODE: OVERVIEW. Just the WebGL disk + lensing render, with optional
// ISCO / photon-sphere / horizon overlays.
// =========================================================================
function drawOverviewMode(cam) {
  drawHorizonRings(cam);
  drawCoordinateGrid(cam);
}

// =========================================================================
// MODE: PHOTONS. Trace null geodesics in the equatorial plane for a
// fan of impact parameters around the user-selected b. Capture / orbit
// / escape are color-coded. The traces are drawn ON TOP of the WebGL
// disk render at the equatorial plane.
// =========================================================================
function drawPhotonsMode(cam) {
  const Rs = rsM();
  const b_target = st.b_rs * Rs;
  const bs = [];
  for (let k = 0; k < 7; k++) { bs.push(b_target * (1 + 0.12 * (k - 3))); }
  for (const b of bs) {
    const { path } = tracePhoton(M_solar(), b);
    const cls = classifyPhoton(M_solar(), b);
    let color;
    if (cls === 'capture') color = 'rgba(255, 90, 110, 0.9)';
    else if (cls === 'orbit') color = 'rgba(255, 230, 110, 1.0)';
    else color = 'rgba(120, 220, 255, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = (Math.abs(b - b_target) < 1e-9) ? 2.4 : 1.3;
    ctx.beginPath();
    let started = false;
    // Convert (r [m], phi) -> world coords in M units. World M unit
    // in the shader corresponds to Rs/2 in metres.
    for (let i = 0; i < path.length; i++) {
      const rWorld = (path[i].r / Rs) * 2;  // R_s = 2 M.
      const phi = path[i].phi;
      const x = rWorld * Math.cos(phi), z = rWorld * Math.sin(phi);
      const s = worldToScreen([x, 0, z], cam);
      if (!s) { started = false; continue; }
      if (!started) { ctx.moveTo(s.x, s.y); started = true; } else ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();
  }
  // Photon ring & ISCO landmarks remain visible.
  drawHorizonRings(cam);
  // Critical impact parameter dashed circle in the equatorial plane.
  ctx.strokeStyle = 'rgba(255, 230, 110, 0.45)';
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  let started = false;
  const bcWorld = bCritRs() * 2;
  for (let k = 0; k <= 64; k++) {
    const a = (k / 64) * 2 * Math.PI;
    const s = worldToScreen([bcWorld * Math.cos(a), 0, bcWorld * Math.sin(a)], cam);
    if (!s) { started = false; continue; }
    if (!started) { ctx.moveTo(s.x, s.y); started = true; } else ctx.lineTo(s.x, s.y);
  }
  ctx.stroke(); ctx.setLineDash([]);

  // Readout strip.
  const cls = classifyPhoton(M_solar(), b_target);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`impact parameter b / R_s = ${st.b_rs.toFixed(2)}; critical b_c / R_s = ${bCritRs().toFixed(3)}`, 14, H - 32);
  ctx.fillText(`outcome at chosen b: ${cls.toUpperCase()} (red = capture, yellow = orbit, cyan = escape)`, 14, H - 14);
}

// =========================================================================
// MODE: LENSING. A background point source at angular offset beta from
// the lens (BH). The Refsdal 1964 lens equation produces two images;
// at beta = 0 a full Einstein ring forms.
//
// Visual: the WebGL render shows the lensed disk; a moving 2D source
// marker at angular offset beta produces image markers at the two
// roots. As beta -> 0, the two image markers wrap into the full ring
// (handled by drawing an arc segment at theta_E on top).
// =========================================================================
function drawLensingMode(cam) {
  drawHorizonRings(cam);
  const theta_E_world = 5.5;       // M units. Scales like sqrt(M).
  const beta_world = st.beta_te * theta_E_world;
  const u = Math.sqrt(beta_world * beta_world + 4 * theta_E_world * theta_E_world);
  const xp = 0.5 * (beta_world + u);
  const xm = 0.5 * (beta_world - u);

  // Einstein ring (dashed, only when source is near-aligned).
  const ringAlpha = Math.max(0.15, 0.85 - 0.6 * Math.abs(st.beta_te));
  ctx.strokeStyle = `rgba(255, 220, 140, ${ringAlpha.toFixed(2)})`;
  ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
  ctx.beginPath();
  let started = false;
  for (let k = 0; k <= 64; k++) {
    const a = (k / 64) * 2 * Math.PI;
    const s = worldToScreen([theta_E_world * Math.cos(a), 0.0, theta_E_world * Math.sin(a)], cam);
    if (!s) { started = false; continue; }
    if (!started) { ctx.moveTo(s.x, s.y); started = true; } else ctx.lineTo(s.x, s.y);
  }
  ctx.stroke(); ctx.setLineDash([]);

  // Source ghost (true unlensed position).
  const sGhost = worldToScreen([beta_world, 1.5, theta_E_world * 2.0], cam);
  if (sGhost) {
    ctx.fillStyle = 'rgba(120, 220, 200, 0.85)';
    ctx.beginPath(); ctx.arc(sGhost.x, sGhost.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(120, 220, 200, 0.92)';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText('source (no lens)', sGhost.x + 10, sGhost.y + 4);
  }
  // Image markers in the equatorial plane.
  const sP = worldToScreen([xp, 0, 0.4], cam);
  const sM = worldToScreen([xm, 0, -0.4], cam);
  ctx.fillStyle = 'rgba(255, 200, 120, 0.95)';
  if (sP) { ctx.beginPath(); ctx.arc(sP.x, sP.y, 7, 0, Math.PI * 2); ctx.fill(); }
  if (sM) { ctx.beginPath(); ctx.arc(sM.x, sM.y, 7, 0, Math.PI * 2); ctx.fill(); }

  // Readout.
  const mu = lensMagnification(st.beta_te, 1.0);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`source beta / theta_E = ${st.beta_te.toFixed(2)} (drag slider to move source through alignment)`, 14, H - 50);
  ctx.fillText(`image positions x_+/_- = ${(xp / theta_E_world).toFixed(2)}, ${(xm / theta_E_world).toFixed(2)} theta_E`, 14, H - 32);
  ctx.fillText(`total magnification mu = ${mu.toFixed(2)} (diverges as beta -> 0; Einstein ring)`, 14, H - 14);
}

// =========================================================================
// MODE: FRAME DRAG. The KEY new visual. A polar spacetime grid in the
// equatorial plane gets twisted by Lense-Thirring frame dragging:
//   omega_LT(r) = 2 G J / (c^2 r^3) = 2 chi M^2 / r^3 (in G = c = 1).
// Integrated phase that an inertial frame is dragged over a unit
// coordinate-time interval at radius r equals omega_LT(r) * 1.
// At chi = 0 the grid is straight radial lines. At chi = 0.99 the
// lines twist into tight spirals near the horizon. Two concentric
// orbits (prograde and retrograde) ride the grid, showing how the
// dragging slows / speeds different rotation senses.
// =========================================================================
function drawFrameDragMode(cam) {
  drawHorizonRings(cam);

  // Visual twist amplitude: integrate omega_LT(r) from r_inf to r,
  // scaled to be visible. We use a phenomenological winding profile
  // proportional to chi / r^2 so the twist is small at the disk edge
  // and tight near the horizon.
  const chi = st.chi;
  const twistProfile = (r) => chi * 2.0 * (1 / Math.pow(Math.max(r, 1.5), 2));

  // Twisted polar grid. Radial lines start at constant phi at r = 18
  // and wind by integrating the twist as we step inward. We compute
  // the cumulative twist by quadrature.
  ctx.strokeStyle = chi > 0.01
    ? `rgba(255, 200, 120, ${(0.45 + 0.4 * chi).toFixed(2)})`
    : 'rgba(180, 200, 240, 0.45)';
  ctx.lineWidth = 1.2;
  const N_RADIAL = 18;
  const N_STEPS = 80;
  const r_outer = 18;
  const r_inner = Math.max(rIscoRs() * 2, 4.5);    // M units; R_s = 2 M.
  for (let k = 0; k < N_RADIAL; k++) {
    const phi0 = (k / N_RADIAL) * 2 * Math.PI;
    ctx.beginPath();
    let started = false;
    let cumTwist = 0;
    let rPrev = r_outer;
    for (let j = 0; j <= N_STEPS; j++) {
      const t = j / N_STEPS;
      const r = r_outer * Math.pow(r_inner / r_outer, t);
      const dr = rPrev - r;
      cumTwist += twistProfile(r) * dr;
      rPrev = r;
      const phi = phi0 + cumTwist + st.t * 0.15;
      const p = worldToScreen([r * Math.cos(phi), 0, r * Math.sin(phi)], cam);
      if (!p) { started = false; continue; }
      if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  // Azimuthal circles (r = const) as faint reference rings.
  ctx.strokeStyle = 'rgba(120, 180, 240, 0.20)';
  ctx.lineWidth = 1;
  for (const r of [r_inner, 6, 9, 12, 15]) {
    ctx.beginPath();
    let started = false;
    for (let k = 0; k <= 64; k++) {
      const a = (k / 64) * 2 * Math.PI;
      const s = worldToScreen([r * Math.cos(a), 0, r * Math.sin(a)], cam);
      if (!s) { started = false; continue; }
      if (!started) { ctx.moveTo(s.x, s.y); started = true; } else ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();
  }

  // Prograde and retrograde test orbits at r = r_inner.
  const phaseP =  st.t * 1.2 + twistProfile(r_inner) * (r_outer - r_inner) * 0.5;
  const phaseR = -st.t * 1.2 + twistProfile(r_inner) * (r_outer - r_inner) * 0.5;
  const pP = worldToScreen([r_inner * Math.cos(phaseP), 0, r_inner * Math.sin(phaseP)], cam);
  const pR = worldToScreen([r_inner * Math.cos(phaseR), 0, r_inner * Math.sin(phaseR)], cam);
  if (pP) {
    ctx.fillStyle = 'rgba(140, 240, 200, 1)';
    ctx.beginPath(); ctx.arc(pP.x, pP.y, 7, 0, Math.PI * 2); ctx.fill();
  }
  if (pR) {
    ctx.fillStyle = 'rgba(255, 130, 110, 1)';
    ctx.beginPath(); ctx.arc(pR.x, pR.y, 7, 0, Math.PI * 2); ctx.fill();
  }

  // Readout strip.
  const omega_LT_horizon = chi * 2.0 / Math.pow(Math.max(rHorizonRs() * 2, 1.5), 2);
  ctx.fillStyle = 'rgba(255, 200, 120, 0.95)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Frame dragging (Lense-Thirring): spacetime is being dragged around the spinning BH.', 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`chi = ${chi.toFixed(2)}: grid lines twist by Omega_LT(r) ~ 2 chi / r^2 (geometric units).`, 14, 70);
  ctx.fillText('Higher chi = tighter twist near the horizon. chi = 0 gives straight radial lines.', 14, 88);
  ctx.fillStyle = 'rgba(140, 240, 200, 0.95)';
  ctx.fillText('green dot = prograde test orbit (co-rotating with BH)', 14, H - 50);
  ctx.fillStyle = 'rgba(255, 130, 110, 0.95)';
  ctx.fillText('red dot = retrograde test orbit (counter-rotating; dragged forward by spin)', 14, H - 32);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`Omega_LT at r_+ = ${omega_LT_horizon.toFixed(2)} (M^-1)`, 14, H - 14);
}

// =========================================================================
// MODE: SPACETIME (Flamm embedding). The 2D paraboloid drawn on top
// of a DIMMED WebGL view. z(r) = 2 sqrt(R_s (r - R_s)) for r > R_s.
// The WebGL background is dimmed (overdraw with semi-opaque black)
// so the wireframe reads clearly.
// =========================================================================
function drawSpacetimeMode(cam) {
  // Dim the background so the embedded surface is the focus.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, W, H);

  const N_r = 30, N_phi = 60;
  const r_min = 1.001, r_max = 6.0;       // R_s units.
  const tilt = (90 - st.incl) * DEG;
  const cT = Math.cos(tilt), sT = Math.sin(tilt);
  const cx = W * 0.5, cy = H * 0.55;
  const SC = 60;
  // Vertex grid.
  const grid = [];
  for (let ir = 0; ir < N_r; ir++) {
    const u = ir / (N_r - 1);
    const r = r_min + (r_max - r_min) * u;
    const z = 2 * Math.sqrt(Math.max(0, r - 1));
    const row = [];
    for (let iphi = 0; iphi < N_phi; iphi++) {
      const phi = (iphi / N_phi) * 2 * Math.PI;
      const x = r * Math.cos(phi);
      const y = r * Math.sin(phi);
      const yRot = y * cT + z * sT;
      const depth = -y * sT + z * cT;
      row.push({ x, y: yRot, depth });
    }
    grid.push(row);
  }
  const proj = grid.map(row => row.map(p => {
    const k = 1 / (1 + p.depth / 12);
    return { x: cx + p.x * SC * k, y: cy - p.y * SC * k };
  }));
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.65)';
  ctx.lineWidth = 1.0;
  for (let ir = 0; ir < N_r; ir++) {
    ctx.beginPath();
    for (let iphi = 0; iphi < N_phi; iphi++) {
      const p = proj[ir][iphi];
      if (iphi === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  for (let iphi = 0; iphi < N_phi; iphi += 4) {
    ctx.beginPath();
    for (let ir = 0; ir < N_r; ir++) {
      const p = proj[ir][iphi];
      if (ir === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.beginPath(); ctx.arc(cx, cy, SC * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 180, 100, 0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(cx, cy, SC * 0.5, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('Flamm embedding of a spatial slice', 14, 52);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('z(r) = 2 sqrt(R_s (r - R_s)) for r > R_s.', 14, 72);
  ctx.fillText('The well is the geometry of space, not a potential energy. Geodesics roll around its inner lip.', 14, H - 14);
}

// =========================================================================
// MODE: RINGDOWN. Total rewrite for clarity.
// The remnant Kerr BH rings like a bell at the dominant (l, m, n) =
// (2, 2, 0) quasinormal mode. We DIM the WebGL render to ~0.25 alpha
// and draw a LARGE oblate-spheroid horizon (centred) whose long axis
// oscillates sinusoidally with the QNM frequency and the amplitude
// decays exponentially. The strain h(t) panel underneath shows the
// damped sinusoid LIGO/Virgo actually detect, with a moving cursor.
// Numbers update live: f (Hz), tau (ms), Q-factor.
// =========================================================================
function drawRingdownMode(_cam) {
  // Dim the background so the ringing bell is the obvious focus.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.70)';
  ctx.fillRect(0, 0, W, H);

  const { omegaR_M, omegaI_M } = qnmFrequency(st.chi);
  const props = ringdownProperties(M_solar(), st.chi);
  const t_M = st.t * 0.9;             // time in units of M
  const phase = omegaR_M * t_M;
  const decay = Math.exp(omegaI_M * t_M);

  // Central ringing horizon. The m = 2 mode deforms the equatorial
  // cross-section into a slowly-rotating ellipse: r(phi) = r0 (1 +
  // A * decay * cos(2 phi - omegaR t)). We draw the silhouette and
  // an outer arc that lights up at the maxima.
  const cx = W * 0.50, cy = H * 0.42;
  const Rpx = 100;
  const A_max = 0.18;                  // peak fractional amplitude.
  const amp = A_max * Math.max(decay, 0.04);

  // Glow halo first.
  const halo = ctx.createRadialGradient(cx, cy, Rpx * 0.9, cx, cy, Rpx * 2.4);
  halo.addColorStop(0, `rgba(255, 180, 100, ${(0.35 + 0.25 * decay).toFixed(3)})`);
  halo.addColorStop(0.5, `rgba(255, 100, 200, ${(0.15 * decay).toFixed(3)})`);
  halo.addColorStop(1, 'rgba(60, 80, 220, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(cx, cy, Rpx * 2.4, 0, Math.PI * 2); ctx.fill();

  // Horizon silhouette (the bell).
  ctx.fillStyle = '#000';
  ctx.beginPath();
  const N = 96;
  for (let k = 0; k <= N; k++) {
    const a = (k / N) * 2 * Math.PI;
    const r = Rpx * (1 + amp * Math.cos(2 * a - phase));
    const x = cx + r * Math.cos(a);
    // Vertical squash by spin (oblate; chi -> 1 -> ~ 0.65 flattening).
    const ySq = 1 - 0.22 * st.chi;
    const y = cy + r * Math.sin(a) * ySq;
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  // Rim that glows where the bulge points (m = 2 lobes).
  ctx.strokeStyle = `rgba(255, 220, 140, ${(0.4 + 0.5 * decay).toFixed(2)})`;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  for (let k = 0; k <= N; k++) {
    const a = (k / N) * 2 * Math.PI;
    const r = Rpx * (1 + amp * Math.cos(2 * a - phase));
    const x = cx + r * Math.cos(a);
    const ySq = 1 - 0.22 * st.chi;
    const y = cy + r * Math.sin(a) * ySq;
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.stroke();

  // m = 2 lobe markers (arrows pointing where the bulge is right now).
  for (const lobe of [0, Math.PI]) {
    const a = lobe + phase / 2;
    const r = Rpx * (1 + amp);
    const x = cx + r * Math.cos(a);
    const ySq = 1 - 0.22 * st.chi;
    const y = cy + r * Math.sin(a) * ySq;
    ctx.fillStyle = 'rgba(120, 240, 200, 1)';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  }

  // Titles.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('Ringdown of the merger remnant: a Kerr BH oscillates and decays in its (l,m,n)=(2,2,0) quasinormal mode.', 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('The bulge rotates at the QNM frequency; its amplitude decays by 1/e in tau (damping time).', 14, 70);
  ctx.fillText('The wave emitted is a damped sinusoid (h(t) panel below) measured by LIGO/Virgo.', 14, 88);

  // STRAIN h(t) PANEL.
  const px0 = 0.12 * W, py0 = H - 170, pw = 0.76 * W, ph = 120;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('gravitational-wave strain h(t) = h_0 exp(-t/tau) cos(2 pi f t)', px0 + 8, py0 - 6);
  const midY = py0 + ph / 2;
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.18)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(px0, midY); ctx.lineTo(px0 + pw, midY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(120, 240, 200, 0.95)';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  const tMax = 22;
  for (let k = 0; k <= 360; k++) {
    const tau = (k / 360) * tMax;
    const e = Math.exp(omegaI_M * tau);
    const ph_t = omegaR_M * tau;
    const hv = e * Math.cos(ph_t);
    const x = px0 + 30 + (tau / tMax) * (pw - 50);
    const y = midY - hv * (ph * 0.36);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Decay envelope (dashed orange).
  ctx.strokeStyle = 'rgba(255, 200, 120, 0.45)';
  ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = 0; k <= 360; k++) {
    const tau = (k / 360) * tMax;
    const e = Math.exp(omegaI_M * tau);
    const x = px0 + 30 + (tau / tMax) * (pw - 50);
    const y = midY - e * (ph * 0.36);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let k = 0; k <= 360; k++) {
    const tau = (k / 360) * tMax;
    const e = Math.exp(omegaI_M * tau);
    const x = px0 + 30 + (tau / tMax) * (pw - 50);
    const y = midY + e * (ph * 0.36);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke(); ctx.setLineDash([]);
  // Current marker.
  const xc = px0 + 30 + (t_M / tMax) * (pw - 50);
  const yc = midY - decay * Math.cos(phase) * (ph * 0.36);
  ctx.fillStyle = 'rgba(255, 255, 200, 1)';
  ctx.beginPath(); ctx.arc(xc, yc, 5, 0, Math.PI * 2); ctx.fill();
  // Numbers strip.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`f = ${props.f_Hz.toExponential(2)} Hz  tau = ${(props.tau_s * 1000).toFixed(2)} ms  Q = ${props.Q.toFixed(2)}`, px0 + 8, py0 + ph + 18);
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('GW150914 fit: f ~ 265 Hz, tau ~ 4 ms (M = 62 Msun, chi = 0.69).', px0 + 8, py0 + ph + 32);
}

// =========================================================================
// MODE: HAWKING. Particle pair flashes at horizon + diagnostic strip.
// =========================================================================
function drawHawkingMode(cam) {
  drawHorizonRings(cam);
  // Find the horizon screen position (the origin in world space).
  const center = worldToScreen([0, 0, 0], cam);
  if (!center) return;
  // Pair flashes orbiting the horizon (use the projected horizon
  // radius in screen px). We approximate by projecting two points
  // and measuring the screen distance.
  const refOuter = worldToScreen([2, 0, 0], cam);
  const Rpx = refOuter ? Math.hypot(refOuter.x - center.x, refOuter.y - center.y) : 60;
  const rng = makeRng(((st.t * 100) | 0) ^ 0xdeadbeef);
  for (let i = 0; i < 8; i++) {
    const angle = rng() * 2 * Math.PI + i * (Math.PI / 4);
    const dist = Rpx * (1.05 + 0.18 * rng());
    const intensity = 0.55 + 0.45 * Math.sin(st.t * 4 + i);
    const px = center.x + dist * Math.cos(angle);
    const py = center.y + dist * Math.sin(angle);
    const g = ctx.createRadialGradient(px, py, 0, px, py, 18);
    g.addColorStop(0, `rgba(255, 255, 220, ${intensity.toFixed(3)})`);
    g.addColorStop(1, 'rgba(255, 130, 100, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fill();
    // Outgoing quantum.
    const ax = center.x + dist * 2.5 * Math.cos(angle);
    const ay = center.y + dist * 2.5 * Math.sin(angle);
    ctx.strokeStyle = `rgba(190, 230, 255, ${(0.45 * intensity).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ax, ay); ctx.stroke();
    // In-falling quantum (dimmer trail toward center).
    const ix = center.x + dist * 0.55 * Math.cos(angle);
    const iy = center.y + dist * 0.55 * Math.sin(angle);
    ctx.strokeStyle = `rgba(255, 110, 130, ${(0.30 * intensity).toFixed(3)})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ix, iy); ctx.stroke();
  }
  // Diagnostic strip.
  const T = hawkingTemperature_K(M_solar());
  const tEvap = hawkingEvaporationTime_yr(M_solar());
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('Hawking radiation: virtual pairs split at the horizon.', 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Cyan = positive-energy quantum escaping to infinity; red = negative-energy mode falling in.', 14, 70);
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText(`T_H = ${T.toExponential(2)} K`, 14, H - 50);
  ctx.fillText(`t_evap = ${tEvap.toExponential(2)} yr`, 14, H - 32);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('Solar-mass BH is colder than the CMB; primordial 10^11 kg BHs are exploding now.', 14, H - 14);
}

// =========================================================================
// MODE: TDE. Star approaches, disrupts, debris stream returns.
// =========================================================================
function drawTdeMode(cam) {
  drawHorizonRings(cam);
  const center = worldToScreen([0, 0, 0], cam);
  if (!center) return;
  const refOuter = worldToScreen([2, 0, 0], cam);
  const Rpx = refOuter ? Math.hypot(refOuter.x - center.x, refOuter.y - center.y) : 60;
  const isDisr = tdeIsDisrupted(M_solar());
  const t_peak_days = tdePeakTime_days(M_solar(), 1, 1);
  // Tidal stream: rotating spiral.
  const phase = st.t * 0.4;
  for (let i = 0; i < 240; i++) {
    const u = i / 240;
    const r_rs = 1.5 + 5 * u;
    const ang = phase - u * 4 * Math.PI;
    const px = center.x + r_rs * Rpx * 0.5 * Math.cos(ang);
    const py = center.y + r_rs * Rpx * 0.5 * Math.sin(ang);
    const alpha = 0.45 + 0.45 * (1 - u);
    ctx.fillStyle = `rgba(255, 200, 120, ${alpha.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(px, py, 1.6 + 1.4 * (1 - u), 0, Math.PI * 2); ctx.fill();
  }
  // Approaching star.
  const star_phase = Math.min(1, st.t * 0.15);
  if (star_phase < 0.95) {
    const sx = center.x + (1 - star_phase) * 0.35 * W - 30;
    const sy = center.y - (1 - star_phase) * 0.20 * H + 30;
    const sg = ctx.createRadialGradient(sx, sy, 1, sx, sy, 14);
    sg.addColorStop(0, 'rgba(255, 255, 220, 1)');
    sg.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI * 2); ctx.fill();
  }
  // Lightcurve panel.
  const px0 = 0.12 * W, py0 = H - 150, pw = 0.76 * W, ph = 110;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.90)';
  ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('TDE lightcurve L(t) ~ t^(-5/3) fallback (Rees 1988)', px0 + 8, py0 - 6);
  const tMax = 6 * t_peak_days;
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let k = 0; k < 200; k++) {
    const t = (k / 199) * tMax;
    const L = tdeLightcurve(t, t_peak_days);
    const x = px0 + 30 + (k / 199) * (pw - 50);
    const y = py0 + ph - 16 - Math.min(1, L) * (ph - 30);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  const xPk = px0 + 30 + (t_peak_days / tMax) * (pw - 50);
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.7)';
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xPk, py0 + 8); ctx.lineTo(xPk, py0 + ph - 16); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(120, 200, 255, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`t_peak = ${t_peak_days.toFixed(0)} d`, xPk + 4, py0 + 22);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText(isDisr ? 'disrupted (flaring)' : 'swallowed whole (no flare)', 14, py0 - 18);
}

// =========================================================================
// PANELS shared by all modes.
// =========================================================================
function drawSidePanel() {
  const x = 0.78 * W, y = 30, w = W - x - 14, h = 220;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('BH diagnostics', x + 8, y - 6);
  let yy = y + 24;
  const row = (k, v, c = '#e0e8ff') => {
    ctx.fillStyle = 'rgba(180, 190, 215, 0.85)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(k, x + 10, yy);
    ctx.fillStyle = c;
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(v, x + 10, yy + 14);
    yy += 30;
  };
  const M = M_solar();
  row('mass M (M_sun)', M.toExponential(2));
  row('spin chi = a/M', st.chi.toFixed(2));
  row('R_s (km)', rsKm(M).toExponential(2));
  row('r_+ / R_s', rHorizonRs().toFixed(3));
  row('r_ISCO / R_s', rIscoRs().toFixed(3));
  row('b_c / R_s', bCritRs().toFixed(3));
  row('mode', st.mode, '#ffd28a');
}

function drawModeTab() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(10, 8, 290, 26);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.40)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 8.5, 289, 25);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  const labels = {
    overview: 'OVERVIEW (disk + lensing)',
    photons: 'PHOTONS (impact-parameter fan)',
    lensing: 'LENSING (movable source)',
    framedrag: 'FRAME DRAG (twisting grid)',
    spacetime: 'SPACETIME (Flamm embedding)',
    ringdown: 'RINGDOWN (Kerr QNM bell)',
    hawking: 'HAWKING (T_H + evaporation)',
    tde: 'TDE FLARE (tidal disruption)',
  };
  ctx.fillText(labels[st.mode] || st.mode, 20, 26);
}

function updateReadout() {
  rM.textContent = `1e${st.logM.toFixed(1)}`;
  rChi.textContent = st.chi.toFixed(2);
  rRs.textContent = rsKm(M_solar()).toExponential(2) + ' km';
  rIsco.textContent = rIscoRs().toFixed(3);
  rMode.textContent = st.mode;
}

// =========================================================================
// MAIN DRAW.
// =========================================================================
function draw() {
  // 1. Offscreen WebGL render (the lensed disk + photon ring + shadow).
  // Modes that prefer a clean canvas (ringdown, spacetime) push the
  // disk inner edge out so only the shadow + lensed sky shows.
  if (engine) {
    const eye = camera.eyePosition();
    const wantsDisk = st.mode !== 'ringdown' && st.mode !== 'spacetime';
    const diskInner = wantsDisk ? Math.max(4, (rIscoRs() * 2)) : 100;
    const diskOuter = wantsDisk ? 18 : 100.1;
    engine.render(eye, [0, 0, 0], [0, 1, 0], 62, diskInner, diskOuter, st.chi, st.t);
  }

  // 2. Blit WebGL into visible 2D canvas, then draw overlays.
  paintBackground();
  const cam = makeCamBasis();
  if (st.mode === 'overview') drawOverviewMode(cam);
  else if (st.mode === 'photons') drawPhotonsMode(cam);
  else if (st.mode === 'lensing') drawLensingMode(cam);
  else if (st.mode === 'framedrag') drawFrameDragMode(cam);
  else if (st.mode === 'spacetime') drawSpacetimeMode(cam);
  else if (st.mode === 'ringdown') drawRingdownMode(cam);
  else if (st.mode === 'hawking') drawHawkingMode(cam);
  else if (st.mode === 'tde') drawTdeMode(cam);
  drawSidePanel();
  drawModeTab();
  updateReadout();
}

function readSliders() {
  st.mode = selMode.value;
  st.logM = parseFloat(sLogM.value);
  st.chi = parseFloat(sChi.value);
  st.incl = parseFloat(sIncl.value);
  st.b_rs = parseFloat(sB.value);
  st.beta_te = parseFloat(sBeta.value);
  st.flags.horizon = tHorizon.checked;
  st.flags.photonsphere = tPhotonsphere.checked;
  st.flags.isco = tIsco.checked;
  st.flags.ergo = tErgo.checked;
  st.flags.grid = tGrid.checked;
  st.flags.traces = tTraces.checked;
  vMode.textContent = st.mode.slice(0, 5);
  vLogM.textContent = st.logM.toFixed(1);
  vChi.textContent = st.chi.toFixed(2);
  vIncl.textContent = String(st.incl);
  vB.textContent = st.b_rs.toFixed(2);
  vBeta.textContent = st.beta_te.toFixed(2);
  syncRowVisibility(st.mode);
}

[selMode, sLogM, sChi, sIncl, sB, sBeta].forEach(el => el.addEventListener('input', readSliders));
[tHorizon, tPhotonsphere, tIsco, tErgo, tGrid, tTraces].forEach(el => el.addEventListener('change', readSliders));
btnReset.addEventListener('click', () => { st.t = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  mass_solar: { get: () => st.logM, set: v => { st.logM = parseFloat(v); sLogM.value = v; }, parse: parseFloat },
  spin_chi: { get: () => st.chi, set: v => { st.chi = parseFloat(v); sChi.value = v; }, parse: parseFloat },
  mode: { get: () => st.mode, set: v => { st.mode = v; selMode.value = v; }, parse: x => x },
  inclination_deg: { get: () => st.incl, set: v => { st.incl = parseFloat(v); sIncl.value = v; }, parse: parseFloat },
  impact_b_rs: { get: () => st.b_rs, set: v => { st.b_rs = parseFloat(v); sB.value = v; }, parse: parseFloat },
  source_beta_arcsec: { get: () => st.beta_te, set: v => { st.beta_te = parseFloat(v); sBeta.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

// =========================================================================
// 5-frame golden capture: each frame samples a different mode so the
// gate visually verifies every major rendering path.
// =========================================================================
function captureModeForFraction(f) {
  if (f < 0.15) return 'overview';
  if (f < 0.35) return 'framedrag';
  if (f < 0.6)  return 'ringdown';
  if (f < 0.85) return 'hawking';
  return 'tde';
}

if (CAPTURE_NAME) {
  st.mode = captureModeForFraction(CAPTURE_FRAC || 0);
  selMode.value = st.mode;
  if (st.mode === 'framedrag') { st.chi = 0.9; sChi.value = '0.9'; }
  if (st.mode === 'ringdown') { st.chi = 0.7; sChi.value = '0.7'; }
  readSliders();
  st.t = (CAPTURE_FRAC || 0) * 4 + 0.6;
  // Set camera for a consistent golden view.
  if (camera.setAzimuthDeg) camera.setAzimuthDeg(35 + CAPTURE_FRAC * 30);
  draw();
  // Wait two extra rAF for the WebGL TAA to settle before declaring ready.
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
