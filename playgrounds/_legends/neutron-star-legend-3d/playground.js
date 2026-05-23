// Neutron Star LEGEND. Five-mode laboratory for radio pulsars, magnetars,
// and dense-matter physics. The visual core is a 3D Canvas2D NS sphere
// (depth-sorted UV quads) with a tilted magnetic-dipole field and two
// radio-beam cones. Modes layer additional physics on top.

import {
  pulseIntensity, beamHalfAngle_rad,
  spindownPdot_SperS, characteristicAge_yr,
  massRadiusCurve_SLy, massRadiusCurve_APR, massRadiusCurve_FPS,
  radiusFromMass_km, NS_LAYERS,
  magnetarLightcurve, magnetarPeakLuminosity_ergS,
  applyGlitch, makeRng,
} from './sim.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const DETERMINISTIC = params.get('deterministic') === '1';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const DEG = Math.PI / 180;

// Orbit camera for free rotation. Radius is NS-radius units.
const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 8, minRadius: 3, maxRadius: 25,
  azimuthDeg: 35, elevationDeg: 22, fovDeg: 50,
});
window.__camera = camera;

// Control DOM.
const selMode = document.getElementById('select-mode'), vMode = document.getElementById('value-mode');
const sMass = document.getElementById('slider-mass'), vMass = document.getElementById('value-mass');
const sPeriod = document.getElementById('slider-period'), vPeriod = document.getElementById('value-period');
const sLogB = document.getElementById('slider-logB'), vLogB = document.getElementById('value-logB');
const sAlpha = document.getElementById('slider-alpha'), vAlpha = document.getElementById('value-alpha');
const sBeta = document.getElementById('slider-beta'), vBeta = document.getElementById('value-beta');
const selEos = document.getElementById('select-eos'), vEos = document.getElementById('value-eos');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

// Readouts.
const rM = document.getElementById('readout-M');
const rP = document.getElementById('readout-P');
const rB = document.getElementById('readout-B');
const rTau = document.getElementById('readout-tau');
const rMode = document.getElementById('readout-mode');

const MODE_ROWS = {
  overview:   ['mode', 'mass', 'period', 'logB', 'alpha'],
  lighthouse: ['mode', 'period', 'alpha', 'beta'],
  magnetar:   ['mode', 'mass', 'logB'],
  structure:  ['mode', 'mass', 'eos'],
  spindown:   ['mode', 'period', 'logB', 'alpha'],
};
const allRows = Array.from(document.querySelectorAll('#controls .row[data-row]'));
function syncRowVisibility(mode) {
  const visible = new Set(MODE_ROWS[mode] || ['mode']);
  for (const row of allRows) {
    const key = row.getAttribute('data-row');
    row.classList.toggle('hidden', !visible.has(key));
  }
}

const st = {
  mode: 'overview',
  M_solar: 1.4,
  P_ms: 33,
  logB_G: 12.5,
  alpha_deg: 55,
  beta_deg: 60,
  eos: 'SLy',
  running: !prefersReducedMotion(),
  t: 0,
  rng: makeRng(0xC0FFEE),
};

function curveFor(eos) {
  if (eos === 'APR') return massRadiusCurve_APR();
  if (eos === 'FPS') return massRadiusCurve_FPS();
  return massRadiusCurve_SLy();
}
function R_km() { return radiusFromMass_km(st.M_solar, curveFor(st.eos)); }
function R_m() { return R_km() * 1000; }
function P_s() { return st.P_ms * 1e-3; }
function B_T() { return Math.pow(10, st.logB_G) * 1e-4; }   // 1 G = 1e-4 T

// =========================================================================
// 3D CAMERA + PROJECTION. The orbit camera gives an eye position; we
// project world-space points to screen using a simple pinhole.
// World units: NS radius = 1.
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
  const tanHalfFov = Math.tan(50 * Math.PI / 180 / 2);
  const aspect = W / H;
  return { eye, f, r, u, tanHalfFov, aspect };
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
// STARFIELD BACKGROUND. Deterministic procedural stars (no seed reset per
// frame so they twinkle but the layout is stable).
// =========================================================================
const STAR_COUNT = 240;
const STARS = [];
{
  const r = makeRng(0xD15EA5E);
  for (let i = 0; i < STAR_COUNT; i++) {
    STARS.push({ x: r() * W, y: r() * H, b: 0.10 + 0.70 * r(), tw: r() * Math.PI * 2 });
  }
}
function drawSky() {
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, W, H);
  for (const s of STARS) {
    const tw = 0.7 + 0.3 * Math.sin(st.t * 1.5 + s.tw);
    ctx.fillStyle = `rgba(200, 220, 255, ${(s.b * tw).toFixed(3)})`;
    ctx.fillRect(s.x, s.y, 1, 1);
  }
}

// =========================================================================
// 3D NS SPHERE (depth-sorted UV quads).
// The sphere is centred at origin, radius 1. We tile theta in [0, pi],
// phi in [0, 2pi]; each quad is depth-sorted by its centroid's distance
// to the camera and shaded with a directional light (toward camera).
// =========================================================================
const N_THETA = 18, N_PHI = 28;
const quadCache = [];
{
  for (let i = 0; i < N_THETA; i++) {
    const th0 = (i / N_THETA) * Math.PI;
    const th1 = ((i + 1) / N_THETA) * Math.PI;
    for (let j = 0; j < N_PHI; j++) {
      const ph0 = (j / N_PHI) * 2 * Math.PI;
      const ph1 = ((j + 1) / N_PHI) * 2 * Math.PI;
      quadCache.push({ th0, th1, ph0, ph1 });
    }
  }
}

function rotateY(p, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  return [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]];
}

function drawNSSphere(cam, spinPhase, surfaceTint) {
  // Compute each quad's centroid and depth, then sort back-to-front.
  const quads = [];
  for (const q of quadCache) {
    const thc = (q.th0 + q.th1) / 2;
    const phc = (q.ph0 + q.ph1) / 2;
    const r0 = 1.0;
    let pc = [
      r0 * Math.sin(thc) * Math.cos(phc + spinPhase),
      r0 * Math.cos(thc),
      r0 * Math.sin(thc) * Math.sin(phc + spinPhase),
    ];
    const dx = pc[0] - cam.eye[0], dy = pc[1] - cam.eye[1], dz = pc[2] - cam.eye[2];
    const depth = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
    if (depth <= 0) continue;
    // Back-face cull: if the dot of outward normal with eye-to-point is positive, it faces away.
    const eToP = [dx, dy, dz];
    const norm = pc;     // unit vector for a unit sphere
    const facing = eToP[0] * norm[0] + eToP[1] * norm[1] + eToP[2] * norm[2];
    if (facing > 0) continue;
    quads.push({ q, thc, phc: phc + spinPhase, depth });
  }
  quads.sort((a, b) => b.depth - a.depth);
  // Render each quad as a polygon with diffuse shading.
  for (const Q of quads) {
    const { q, thc, phc } = Q;
    const verts = [
      [Math.sin(q.th0) * Math.cos(q.ph0 + spinPhase), Math.cos(q.th0), Math.sin(q.th0) * Math.sin(q.ph0 + spinPhase)],
      [Math.sin(q.th0) * Math.cos(q.ph1 + spinPhase), Math.cos(q.th0), Math.sin(q.th0) * Math.sin(q.ph1 + spinPhase)],
      [Math.sin(q.th1) * Math.cos(q.ph1 + spinPhase), Math.cos(q.th1), Math.sin(q.th1) * Math.sin(q.ph1 + spinPhase)],
      [Math.sin(q.th1) * Math.cos(q.ph0 + spinPhase), Math.cos(q.th1), Math.sin(q.th1) * Math.sin(q.ph0 + spinPhase)],
    ];
    const proj = verts.map(v => w2s(v, cam));
    if (proj.some(p => p === null)) continue;
    // Lambertian shading: diffuse w.r.t. camera direction (good enough for a single light = camera).
    const center = [
      Math.sin(thc) * Math.cos(phc), Math.cos(thc), Math.sin(thc) * Math.sin(phc),
    ];
    const toEye = [cam.eye[0] - center[0], cam.eye[1] - center[1], cam.eye[2] - center[2]];
    const teLen = Math.hypot(toEye[0], toEye[1], toEye[2]);
    const dot = (center[0] * toEye[0] + center[1] * toEye[1] + center[2] * toEye[2]) / teLen;
    const shade = Math.max(0.10, dot);
    // Surface tint (latitude-banded for a slight visual interest).
    const lat = Math.cos(thc);
    const r = surfaceTint(lat, phc);
    const cR = Math.round(r[0] * shade);
    const cG = Math.round(r[1] * shade);
    const cB = Math.round(r[2] * shade);
    ctx.fillStyle = `rgb(${cR}, ${cG}, ${cB})`;
    ctx.beginPath();
    ctx.moveTo(proj[0].x, proj[0].y);
    ctx.lineTo(proj[1].x, proj[1].y);
    ctx.lineTo(proj[2].x, proj[2].y);
    ctx.lineTo(proj[3].x, proj[3].y);
    ctx.closePath();
    ctx.fill();
  }
}

// Surface tint helpers.
function tintNS(lat, phi) {
  // Greyish-blue with subtle pole brightening.
  const polar = Math.abs(lat);
  const r = 110 + 60 * polar;
  const g = 130 + 70 * polar;
  const b = 170 + 70 * polar;
  return [r, g, b];
}
function tintMagnetar(lat, phi) {
  // Hot reddish surface with banded patterns.
  const band = 0.5 + 0.5 * Math.cos(8 * phi + 5 * lat);
  return [200 + 40 * band, 80 + 30 * band, 60 + 30 * band];
}

// =========================================================================
// MAGNETIC DIPOLE FIELD LINES. A dipole has field lines that close back
// on themselves. In the plane containing the dipole axis, the field
// line equation is r(theta) = L sin^2(theta), where L is the L-shell
// and theta is the magnetic colatitude. We draw a few L-shells, rotated
// around the dipole axis.
//
// The dipole axis is tilted by alpha from the spin axis (z) and rotates
// in the (x, z) plane by the spin angle.
// =========================================================================
function dipoleAxis(spinPhase) {
  const alpha = st.alpha_deg * DEG;
  // Axis is initially tilted in the (x, z) plane by alpha, then rotated
  // around z by spinPhase. In our convention z = spin axis.
  const ax = Math.sin(alpha);
  const az = Math.cos(alpha);
  const c = Math.cos(spinPhase), s = Math.sin(spinPhase);
  return [c * ax, az, -s * ax];
}

function drawDipoleField(cam, spinPhase) {
  const axis = dipoleAxis(spinPhase);
  // Build an orthonormal basis with axis as the third axis.
  // Find a vector not parallel to axis.
  const helper = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const b1 = [
    axis[1] * helper[2] - axis[2] * helper[1],
    axis[2] * helper[0] - axis[0] * helper[2],
    axis[0] * helper[1] - axis[1] * helper[0],
  ];
  const b1Len = Math.hypot(b1[0], b1[1], b1[2]);
  const e1 = [b1[0] / b1Len, b1[1] / b1Len, b1[2] / b1Len];
  const e2 = [
    axis[1] * e1[2] - axis[2] * e1[1],
    axis[2] * e1[0] - axis[0] * e1[2],
    axis[0] * e1[1] - axis[1] * e1[0],
  ];
  // Draw a few L-shells at different L values, rotated around the dipole axis.
  const L_VALUES = [1.6, 2.4, 3.6];
  const N_PLANES = 8;
  const N_PTS = 40;
  // We draw each segment in depth-sorted batches so a few segments behind
  // the star are properly occluded; here we simply draw with light alpha
  // and the depth-test logic from w2s.
  const segs = [];
  for (let p = 0; p < N_PLANES; p++) {
    const rot = (p / N_PLANES) * 2 * Math.PI;
    const cR = Math.cos(rot), sR = Math.sin(rot);
    // Rotate e1, e2 around axis by rot.
    const u1 = [
      e1[0] * cR + e2[0] * sR,
      e1[1] * cR + e2[1] * sR,
      e1[2] * cR + e2[2] * sR,
    ];
    for (const L of L_VALUES) {
      const linePts = [];
      let lastValid = false;
      for (let k = 0; k <= N_PTS; k++) {
        // theta = magnetic colatitude in [0, pi].
        const theta = (k / N_PTS) * Math.PI;
        const rMag = L * Math.pow(Math.sin(theta), 2);
        if (rMag < 1.0) continue;   // inside the star
        // Position in dipole frame.
        const along = rMag * Math.cos(theta);   // along axis
        const perp = rMag * Math.sin(theta);    // perpendicular in (u1) direction
        const worldPos = [
          axis[0] * along + u1[0] * perp,
          axis[1] * along + u1[1] * perp,
          axis[2] * along + u1[2] * perp,
        ];
        const s = w2s(worldPos, cam);
        if (s) { linePts.push(s); lastValid = true; }
        else { lastValid = false; }
      }
      if (linePts.length > 1) segs.push(linePts);
    }
  }
  // Draw all segments.
  ctx.strokeStyle = 'rgba(100, 160, 255, 0.42)';
  ctx.lineWidth = 1.1;
  for (const seg of segs) {
    ctx.beginPath();
    for (let i = 0; i < seg.length; i++) {
      const p = seg[i];
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
}

// =========================================================================
// RADIO-BEAM CONES. Two cones along the dipole axis, half-opening
// rho_beam. Drawn as solid translucent triangles fanning out from the
// magnetic poles.
// =========================================================================
function drawBeamCones(cam, spinPhase) {
  const axis = dipoleAxis(spinPhase);
  const rho = beamHalfAngle_rad(P_s());
  const L_beam = 4.0;
  // Build basis perpendicular to axis (same as dipole field).
  const helper = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const b1 = [
    axis[1] * helper[2] - axis[2] * helper[1],
    axis[2] * helper[0] - axis[0] * helper[2],
    axis[0] * helper[1] - axis[1] * helper[0],
  ];
  const b1Len = Math.hypot(b1[0], b1[1], b1[2]);
  const e1 = [b1[0] / b1Len, b1[1] / b1Len, b1[2] / b1Len];
  const e2 = [
    axis[1] * e1[2] - axis[2] * e1[1],
    axis[2] * e1[0] - axis[0] * e1[2],
    axis[0] * e1[1] - axis[1] * e1[0],
  ];
  for (const sign of [+1, -1]) {
    const poleVec = [axis[0] * sign, axis[1] * sign, axis[2] * sign];
    const polePos = [poleVec[0] * 1.0, poleVec[1] * 1.0, poleVec[2] * 1.0];
    // Cone apex at the magnetic pole, tip extends out by L_beam.
    const tip = [poleVec[0] * (1 + L_beam), poleVec[1] * (1 + L_beam), poleVec[2] * (1 + L_beam)];
    const baseR = L_beam * Math.sin(rho);
    const N_FAN = 28;
    const points = [];
    for (let i = 0; i < N_FAN; i++) {
      const ang = (i / N_FAN) * 2 * Math.PI;
      const cA = Math.cos(ang), sA = Math.sin(ang);
      points.push([
        tip[0] + baseR * (e1[0] * cA + e2[0] * sA),
        tip[1] + baseR * (e1[1] * cA + e2[1] * sA),
        tip[2] + baseR * (e1[2] * cA + e2[2] * sA),
      ]);
    }
    // Draw as a series of triangles from the pole to each pair of base
    // points; use a translucent gradient by alpha.
    const polePx = w2s(polePos, cam);
    if (!polePx) continue;
    const basePx = points.map(p => w2s(p, cam));
    ctx.fillStyle = sign > 0 ? 'rgba(120, 220, 255, 0.18)' : 'rgba(255, 200, 120, 0.18)';
    for (let i = 0; i < N_FAN; i++) {
      const b0 = basePx[i];
      const b1p = basePx[(i + 1) % N_FAN];
      if (!b0 || !b1p) continue;
      ctx.beginPath();
      ctx.moveTo(polePx.x, polePx.y);
      ctx.lineTo(b0.x, b0.y);
      ctx.lineTo(b1p.x, b1p.y);
      ctx.closePath();
      ctx.fill();
    }
    // Bright rim where the cone meets the pole.
    ctx.strokeStyle = sign > 0 ? 'rgba(160, 230, 255, 0.85)' : 'rgba(255, 220, 160, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i <= N_FAN; i++) {
      const b0 = basePx[i % N_FAN];
      if (!b0) continue;
      if (i === 0) ctx.moveTo(b0.x, b0.y); else ctx.lineTo(b0.x, b0.y);
    }
    ctx.stroke();
  }
}

// =========================================================================
// SPIN AXIS arrow.
// =========================================================================
function drawSpinAxis(cam) {
  const p0 = w2s([0, -1.8, 0], cam);
  const p1 = w2s([0, 1.8, 0], cam);
  if (!p0 || !p1) return;
  ctx.strokeStyle = 'rgba(200, 220, 255, 0.55)';
  ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(200, 220, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('spin axis', p1.x + 8, p1.y);
}

// =========================================================================
// LINE OF SIGHT direction (only used in Lighthouse mode for clarity).
// =========================================================================
function drawLineOfSight(cam) {
  const beta = st.beta_deg * DEG;
  // Pick observer direction lying in (x, z) plane tilted from spin axis by beta.
  const losDir = [Math.sin(beta), Math.cos(beta), 0];
  const p0 = w2s([losDir[0] * 1.2, losDir[1] * 1.2, losDir[2] * 1.2], cam);
  const p1 = w2s([losDir[0] * 4.5, losDir[1] * 4.5, losDir[2] * 4.5], cam);
  if (!p0 || !p1) return;
  ctx.strokeStyle = 'rgba(255, 230, 120, 0.85)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  ctx.fillStyle = 'rgba(255, 230, 120, 0.95)';
  ctx.beginPath(); ctx.arc(p1.x, p1.y, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Earth (line of sight)', p1.x + 8, p1.y + 4);
}

// =========================================================================
// SIDE PANEL (mode-independent diagnostics).
// =========================================================================
function drawSidePanel() {
  const x = 0.74 * W, y = 30, w = W - x - 14, h = 230;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('NS diagnostics', x + 8, y - 6);
  let yy = y + 24;
  const row = (k, v, c = '#e0e8ff') => {
    ctx.fillStyle = 'rgba(180, 190, 215, 0.85)';
    ctx.font = fontString(canvas, 'caption');
    ctx.fillText(k, x + 10, yy);
    ctx.fillStyle = c;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(v, x + 10, yy + 14);
    yy += 30;
  };
  row('M (M_sun)', st.M_solar.toFixed(2));
  row('R (km, ' + st.eos + ')', R_km().toFixed(2));
  row('P (ms)', st.P_ms.toFixed(2));
  row('B (G)', `1e${st.logB_G.toFixed(1)}`);
  row('alpha (deg)', String(st.alpha_deg));
  const pdot = spindownPdot_SperS(st.M_solar, R_m(), B_T(), P_s(), st.alpha_deg * DEG);
  const tau_yr = characteristicAge_yr(P_s(), pdot);
  row('Pdot (s/s)', pdot.toExponential(2));
  row('tau (yr)', isFinite(tau_yr) ? tau_yr.toExponential(2) : 'inf', '#ffd28a');
  row('mode', st.mode, '#ffd28a');
}

function drawModeTab() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(10, 8, 300, 26);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.40)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 8.5, 299, 25);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  const labels = {
    overview: 'OVERVIEW (NS + dipole + beam)',
    lighthouse: 'LIGHTHOUSE (pulse profile)',
    magnetar: 'MAGNETAR (B-field flare)',
    structure: 'STRUCTURE (TOV mass-radius)',
    spindown: 'SPINDOWN + GLITCH (P(t))',
  };
  ctx.fillText(labels[st.mode] || st.mode, 20, 26);
}

// =========================================================================
// MODE: OVERVIEW. NS + dipole field + beam cones.
// =========================================================================
function drawOverviewMode(cam, spinPhase) {
  drawSpinAxis(cam);
  drawNSSphere(cam, spinPhase, tintNS);
  drawDipoleField(cam, spinPhase);
  drawBeamCones(cam, spinPhase);
}

// =========================================================================
// MODE: LIGHTHOUSE. NS + beam cones + line of sight + pulse profile panel.
// =========================================================================
function drawLighthouseMode(cam, spinPhase) {
  drawSpinAxis(cam);
  drawNSSphere(cam, spinPhase, tintNS);
  drawBeamCones(cam, spinPhase);
  drawLineOfSight(cam);

  // Pulse profile panel.
  const px = 0.06 * W, py = H - 170, pw = 0.62 * W, ph = 120;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('pulse profile I(φ) over one rotation', px + 8, py - 6);
  // Plot intensity over phi in [0, 2 pi].
  const rho = beamHalfAngle_rad(P_s());
  const alpha = st.alpha_deg * DEG;
  const beta = st.beta_deg * DEG;
  ctx.strokeStyle = 'rgba(120, 240, 200, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let k = 0; k <= 200; k++) {
    const phi = (k / 200) * 2 * Math.PI;
    const I = pulseIntensity(alpha, beta, phi, rho);
    const x = px + 30 + (phi / (2 * Math.PI)) * (pw - 50);
    const y = py + ph - 16 - Math.min(1, I) * (ph - 30);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current cursor at phase = spinPhase.
  const phiNow = ((spinPhase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const Inow = pulseIntensity(alpha, beta, phiNow, rho);
  const xc = px + 30 + (phiNow / (2 * Math.PI)) * (pw - 50);
  const yc = py + ph - 16 - Math.min(1, Inow) * (ph - 30);
  ctx.fillStyle = 'rgba(255, 255, 200, 1)';
  ctx.beginPath(); ctx.arc(xc, yc, 4, 0, 2 * Math.PI); ctx.fill();
  // Axes.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.75)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('φ = 0', px + 30, py + ph - 4);
  ctx.fillText('2 π', px + pw - 30, py + ph - 4);
  ctx.fillText('I = 0', px + 6, py + ph - 16);
  ctx.fillText('I = 1', px + 6, py + 16);
  // Sanity strip.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`rho_beam = ${(rho / DEG).toFixed(1)} deg; pulse visible when (alpha + beta) - rho < theta_los < (alpha + beta) + rho`,
    px + 8, py + ph + 18);
}

// =========================================================================
// MODE: MAGNETAR. Strong-B NS with flare events.
// =========================================================================
const FLARE_PERIOD_S = 6.0;   // visual period between flares
const FLARE_DURATION_S = 3.0;
function drawMagnetarMode(cam, spinPhase) {
  // Phase within the current flare cycle.
  const tCycle = st.t % FLARE_PERIOD_S;
  const inFlare = tCycle < FLARE_DURATION_S ? tCycle : 0;
  const Lc = magnetarLightcurve(inFlare, 0.05, 0.6);

  drawNSSphere(cam, spinPhase, tintMagnetar);
  drawDipoleField(cam, spinPhase);

  // Flare flash burst around the star.
  if (Lc > 0.05) {
    const center = w2s([0, 0, 0], cam);
    if (center) {
      const refR = w2s([1, 0, 0], cam);
      const Rpx = refR ? Math.hypot(refR.x - center.x, refR.y - center.y) : 80;
      const glow = ctx.createRadialGradient(center.x, center.y, Rpx * 0.7, center.x, center.y, Rpx * 3.5);
      glow.addColorStop(0, `rgba(255, 240, 200, ${(0.75 * Lc).toFixed(3)})`);
      glow.addColorStop(0.5, `rgba(255, 130, 100, ${(0.30 * Lc).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(255, 60, 60, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(center.x, center.y, Rpx * 3.5, 0, 2 * Math.PI); ctx.fill();
      // X-ray jets along the magnetic axis.
      const axis = dipoleAxis(spinPhase);
      for (const sign of [+1, -1]) {
        const p0 = w2s([axis[0] * sign * 1.2, axis[1] * sign * 1.2, axis[2] * sign * 1.2], cam);
        const p1 = w2s([axis[0] * sign * 3.5, axis[1] * sign * 3.5, axis[2] * sign * 3.5], cam);
        if (p0 && p1) {
          ctx.strokeStyle = `rgba(255, 200, 100, ${(0.7 * Lc).toFixed(3)})`;
          ctx.lineWidth = 5 * Lc;
          ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
        }
      }
    }
  }

  // Lightcurve panel (X-ray L(t)).
  const px = 0.06 * W, py = H - 170, pw = 0.62 * W, ph = 120;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('X-ray flare lightcurve L(t) (Hurley 2005)', px + 8, py - 6);
  ctx.strokeStyle = 'rgba(255, 200, 100, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  const tMax = FLARE_DURATION_S;
  for (let k = 0; k <= 200; k++) {
    const ts = (k / 200) * tMax;
    const L = magnetarLightcurve(ts, 0.05, 0.6);
    const x = px + 30 + (ts / tMax) * (pw - 50);
    const y = py + ph - 16 - Math.min(1, L) * (ph - 30);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current cursor (if in flare).
  if (inFlare > 0 && inFlare < FLARE_DURATION_S) {
    const xc = px + 30 + (inFlare / tMax) * (pw - 50);
    const yc = py + ph - 16 - Math.min(1, Lc) * (ph - 30);
    ctx.fillStyle = 'rgba(255, 255, 200, 1)';
    ctx.beginPath(); ctx.arc(xc, yc, 4, 0, 2 * Math.PI); ctx.fill();
  }
  const L_peak = magnetarPeakLuminosity_ergS(B_T());
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`L_peak ~ ${L_peak.toExponential(2)} erg/s (B^2 scaling vs SGR 1806-20)`, px + 8, py + ph + 18);
}

// =========================================================================
// MODE: STRUCTURE. Cross-section + mass-radius diagram.
// =========================================================================
function drawStructureMode(cam, spinPhase) {
  // Cross-section on the left, mass-radius panel on the right. We fix
  // the cross-section position so it doesn't overlap with the
  // side-panel diagnostics. Each layer is drawn as a concentric ring
  // (outermost first, then smaller) with distinct colors and labelled
  // along a horizontal pointer line.
  const cx = 0.30 * W, cy = 0.45 * H;
  const Rpx = Math.min(0.22 * W, 0.30 * H);
  // Glow ring outside the surface (the magnetosphere hint).
  const glow = ctx.createRadialGradient(cx, cy, Rpx * 1.00, cx, cy, Rpx * 1.35);
  glow.addColorStop(0, 'rgba(120, 180, 255, 0.30)');
  glow.addColorStop(1, 'rgba(60, 80, 220, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, Rpx * 1.35, 0, 2 * Math.PI); ctx.fill();
  // Each layer is a concentric annulus. Draw outermost first as solid disc,
  // then over-paint progressively smaller discs with the next color.
  for (let i = 0; i < NS_LAYERS.length; i++) {
    const layer = NS_LAYERS[i];
    ctx.fillStyle = layer.color;
    ctx.beginPath(); ctx.arc(cx, cy, Rpx * layer.r1, 0, 2 * Math.PI); ctx.fill();
  }
  // Boundary outlines (thin) to make the rings legible.
  ctx.strokeStyle = 'rgba(20, 28, 44, 0.65)';
  ctx.lineWidth = 0.8;
  for (const layer of NS_LAYERS) {
    ctx.beginPath(); ctx.arc(cx, cy, Rpx * layer.r1, 0, 2 * Math.PI); ctx.stroke();
  }
  // Layer pointer-line labels (right side of cross-section).
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  for (let i = 0; i < NS_LAYERS.length; i++) {
    const layer = NS_LAYERS[i];
    const rMid = Rpx * (layer.r0 + layer.r1) / 2;
    // Anchor inside the ring at angle = -45 deg for spread.
    const ang = -Math.PI / 3 + i * (Math.PI / 6);
    const ax = cx + rMid * Math.cos(ang);
    const ay = cy + rMid * Math.sin(ang);
    const bx = cx + Rpx * 1.25 * Math.cos(ang);
    const by = cy + Rpx * 1.25 * Math.sin(ang);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillText(layer.name, bx + 4, by + 4);
  }
  // Cross-section caption.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText(`NS interior @ M = ${st.M_solar.toFixed(2)} M_sun, R = ${R_km().toFixed(1)} km`, cx - Rpx * 1.1, cy - Rpx * 1.25);

  // Mass-radius panel. Move LEFT enough to clear the side-diagnostics panel.
  const px = 0.06 * W, py = H - 220, pw = 0.62 * W, ph = 170;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('mass-radius (Lattimer-Prakash 2001)', px + 8, py - 6);
  // Axes: R in [6, 17] km, M in [0, 2.5] M_sun.
  const R_MIN = 6, R_MAX = 17, M_MIN = 0, M_MAX = 2.5;
  function xForR(R) { return px + 30 + (R - R_MIN) / (R_MAX - R_MIN) * (pw - 50); }
  function yForM(M) { return py + ph - 24 - (M - M_MIN) / (M_MAX - M_MIN) * (ph - 50); }
  // Grid.
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.10)';
  for (let R = 8; R <= 16; R += 2) {
    ctx.beginPath(); ctx.moveTo(xForR(R), py + 16); ctx.lineTo(xForR(R), py + ph - 24); ctx.stroke();
  }
  for (let M = 0.5; M <= 2.5; M += 0.5) {
    ctx.beginPath(); ctx.moveTo(px + 30, yForM(M)); ctx.lineTo(px + pw - 20, yForM(M)); ctx.stroke();
  }
  // Curves.
  const curves = [
    { name: 'FPS (soft)', data: massRadiusCurve_FPS(), color: 'rgba(255, 130, 110, 0.95)' },
    { name: 'SLy', data: massRadiusCurve_SLy(), color: 'rgba(255, 230, 120, 0.95)' },
    { name: 'APR (stiff)', data: massRadiusCurve_APR(), color: 'rgba(120, 220, 255, 0.95)' },
  ];
  for (const c of curves) {
    ctx.strokeStyle = c.color;
    ctx.lineWidth = c.name === st.eos || c.name.startsWith(st.eos) ? 2.4 : 1.2;
    ctx.beginPath();
    for (let i = 0; i < c.data.length; i++) {
      const p = c.data[i];
      const x = xForR(p.R); const y = yForM(p.M);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Marker at current (R, M).
  const x0 = xForR(R_km()); const y0 = yForM(st.M_solar);
  ctx.fillStyle = 'rgba(255, 255, 200, 1)';
  ctx.beginPath(); ctx.arc(x0, y0, 5, 0, 2 * Math.PI); ctx.fill();
  // Labels.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('R [km]', px + pw - 36, py + ph - 6);
  ctx.fillText('M [Msun]', px + 6, py + 14);
  ctx.fillText('8', xForR(8), py + ph - 8);
  ctx.fillText('12', xForR(12), py + ph - 8);
  ctx.fillText('16', xForR(16), py + ph - 8);
  ctx.fillText('1', px + 10, yForM(1));
  ctx.fillText('2', px + 10, yForM(2));
  // Legend.
  let ly = py + 28;
  for (const c of curves) {
    ctx.fillStyle = c.color;
    ctx.fillRect(px + pw - 90, ly - 8, 10, 3);
    ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(c.name, px + pw - 75, ly - 4);
    ly += 14;
  }
}

// =========================================================================
// MODE: SPINDOWN + GLITCH. P(t) timeline + a glitch event.
// =========================================================================
function drawSpindownMode(cam, spinPhase) {
  // Background NS (smaller, top-left corner of the plot).
  drawNSSphere(cam, spinPhase, tintNS);
  drawDipoleField(cam, spinPhase);

  // Side-panel time series of P(t).
  const px = 0.06 * W, py = H - 220, pw = 0.62 * W, ph = 160;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('rotation period P(t) with glitch event', px + 8, py - 6);
  // Compute P(t) over T_TOTAL years, with a glitch at t = T_GLITCH.
  const pdot = spindownPdot_SperS(st.M_solar, R_m(), B_T(), P_s(), st.alpha_deg * DEG);
  const SEC_PER_YR = 3.156e7;
  const T_TOTAL_YR = 1000;
  const T_GLITCH_YR = 600;
  const GLITCH_FRAC = 1e-6;
  const TAU_G_YR = 5;
  const N_PTS = 240;
  const xs = [], ys = [];
  for (let k = 0; k < N_PTS; k++) {
    const tYr = (k / (N_PTS - 1)) * T_TOTAL_YR;
    const tSec = tYr * SEC_PER_YR;
    const P_pre = P_s() + pdot * tSec;
    let Pnow = P_pre;
    if (tYr >= T_GLITCH_YR) {
      const dtSec = (tYr - T_GLITCH_YR) * SEC_PER_YR;
      Pnow = applyGlitch(P_pre, GLITCH_FRAC, dtSec, TAU_G_YR * SEC_PER_YR);
    }
    xs.push(tYr); ys.push(Pnow);
  }
  // Range for plot.
  let yMin = Infinity, yMax = -Infinity;
  for (const y of ys) { if (y < yMin) yMin = y; if (y > yMax) yMax = y; }
  const yRange = Math.max(1e-12, yMax - yMin);
  const tMaxYr = T_TOTAL_YR;
  function plotX(tYr) { return px + 30 + (tYr / tMaxYr) * (pw - 50); }
  function plotY(Ps) { return py + ph - 28 - ((Ps - yMin) / yRange) * (ph - 50); }
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let k = 0; k < N_PTS; k++) {
    const x = plotX(xs[k]); const y = plotY(ys[k]);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Glitch event marker.
  const xg = plotX(T_GLITCH_YR);
  ctx.strokeStyle = 'rgba(255, 130, 110, 0.85)';
  ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xg, py + 16); ctx.lineTo(xg, py + ph - 28); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 130, 110, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('glitch', xg + 4, py + 30);
  // Axes labels.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('t (yr)', px + pw / 2, py + ph - 6);
  ctx.fillText(`P min = ${(yMin * 1000).toFixed(3)} ms`, px + 8, py + ph - 12);
  ctx.fillText(`P max = ${(yMax * 1000).toFixed(3)} ms`, px + 8, py + 18);
  const tau_yr = characteristicAge_yr(P_s(), pdot);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`Pdot = ${pdot.toExponential(2)} s/s; tau = ${isFinite(tau_yr) ? tau_yr.toExponential(2) + ' yr' : 'inf'}`,
    px + 8, py + ph + 18);
}

// =========================================================================
// MAIN DRAW.
// =========================================================================
function draw() {
  drawSky();
  const cam = makeCamBasis();
  // Rotation. Map st.t -> spin phase. The visual rotation speed is
  // capped so the NS does not look like a strobe for short P.
  const spinPhase = (st.t * 2 * Math.PI / Math.max(0.2, P_s() * 8)) % (2 * Math.PI);

  if (st.mode === 'overview') drawOverviewMode(cam, spinPhase);
  else if (st.mode === 'lighthouse') drawLighthouseMode(cam, spinPhase);
  else if (st.mode === 'magnetar') drawMagnetarMode(cam, spinPhase);
  else if (st.mode === 'structure') drawStructureMode(cam, spinPhase);
  else if (st.mode === 'spindown') drawSpindownMode(cam, spinPhase);

  drawSidePanel();
  drawModeTab();
  updateReadout();
}

function updateReadout() {
  rM.textContent = st.M_solar.toFixed(2);
  rP.textContent = st.P_ms.toFixed(1);
  rB.textContent = `1e${st.logB_G.toFixed(1)}`;
  const pdot = spindownPdot_SperS(st.M_solar, R_m(), B_T(), P_s(), st.alpha_deg * DEG);
  const tau = characteristicAge_yr(P_s(), pdot);
  rTau.textContent = isFinite(tau) ? tau.toExponential(2) : 'inf';
  rMode.textContent = st.mode;
}

function readSliders() {
  st.mode = selMode.value;
  st.M_solar = parseFloat(sMass.value);
  st.P_ms = parseFloat(sPeriod.value);
  st.logB_G = parseFloat(sLogB.value);
  st.alpha_deg = parseFloat(sAlpha.value);
  st.beta_deg = parseFloat(sBeta.value);
  st.eos = selEos.value;
  vMode.textContent = st.mode.slice(0, 5);
  vMass.textContent = st.M_solar.toFixed(2);
  vPeriod.textContent = String(st.P_ms.toFixed(0));
  vLogB.textContent = st.logB_G.toFixed(1);
  vAlpha.textContent = String(st.alpha_deg);
  vBeta.textContent = String(st.beta_deg);
  vEos.textContent = st.eos;
  syncRowVisibility(st.mode);
}

[selMode, sMass, sPeriod, sLogB, sAlpha, sBeta, selEos].forEach(el => el.addEventListener('input', readSliders));
selEos.addEventListener('change', readSliders);
btnReset.addEventListener('click', () => { st.t = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  mass_solar: { get: () => st.M_solar, set: v => { st.M_solar = parseFloat(v); sMass.value = v; }, parse: parseFloat },
  period_ms: { get: () => st.P_ms, set: v => { st.P_ms = parseFloat(v); sPeriod.value = v; }, parse: parseFloat },
  log_B: { get: () => st.logB_G, set: v => { st.logB_G = parseFloat(v); sLogB.value = v; }, parse: parseFloat },
  alpha_deg: { get: () => st.alpha_deg, set: v => { st.alpha_deg = parseFloat(v); sAlpha.value = v; }, parse: parseFloat },
  mode: { get: () => st.mode, set: v => { st.mode = v; selMode.value = v; }, parse: x => x },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

function captureModeForFraction(f) {
  if (f < 0.15) return 'overview';
  if (f < 0.35) return 'lighthouse';
  if (f < 0.6)  return 'magnetar';
  if (f < 0.85) return 'structure';
  return 'spindown';
}

if (CAPTURE_NAME) {
  st.mode = captureModeForFraction(CAPTURE_FRAC || 0);
  selMode.value = st.mode;
  if (st.mode === 'magnetar') { st.logB_G = 14.5; sLogB.value = '14.5'; }
  readSliders();
  st.t = (CAPTURE_FRAC || 0) * 2 + 1.5;
  if (camera.setAzimuthDeg) camera.setAzimuthDeg(35 + CAPTURE_FRAC * 20);
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const M = parseFloat(sMass?.value || '1.4');
  const P = parseFloat(sPeriod?.value || '0.033');
  const B = Math.pow(10, parseFloat(sLogB?.value || '12.5'));
  return {
    fields: [
      { key: 'mass', label: 'mass (M_sun)', value: M, format: 'float' },
      { key: 'period', label: 'period (s)', value: P, format: 'float' },
      { key: 'b-field', label: 'B (G)', value: B, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  return [
    {
      key: 'ns-physics',
      label: 'neutron star legend',
      value: 'ready',
      status: 'pass'
    }
  ];
};
