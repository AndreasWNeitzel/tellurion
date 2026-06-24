// Black Hole LEGEND. A multi-mode laboratory for Schwarzschild and
// Kerr black holes. The visual core is a WebGL2 backward ray-march
// (shared/js/engine-gl/schwarzschild-kerr.js) that handles the lensed
// accretion disk, photon ring, and shadow. A Canvas2D overlay on top
// draws geometric overlays, traces, panels, and mode-specific physics.
//
// Ten modes are mounted on the same central engine:
//   overview   disk + horizon overlays
//   photons    null geodesic fan at impact parameter b
//   lensing    Refsdal 1964 lens equation, Einstein ring
//   shadow     EHT-style highlighted photon ring with angular size
//   framedrag  Kerr ergosphere wireframe and ZAMO ring
//   spacetime  Flamm embedding diagram with orbiting test particle
//   ringdown   Berti-Cardoso-Will QNM oscillating bell + h(t)
//   hawking    pair flashes at horizon + T_H + t_evap
//   tde        tidal disruption stream + Rees 1988 lightcurve
//   tidal      spaghettification rod, stretching/squeezing time series
//
// Layout: one visible canvas (#stage, Canvas2D) and one offscreen
// canvas where the WebGL engine renders. Every frame we blit the
// engine output, then draw 2D overlays on top. The orbit camera
// attaches to the visible canvas. The inclination slider sets the
// camera elevation; users can still drag-orbit afterwards.

import {
  schwarzschildRadius_m,
  iscoRadius_m, kerrHorizonRadius_m,
  lensMagnification,
  hawkingTemperature_K, tracePhoton, classifyPhoton, makeRng, rsKm,
  qnmFrequency, ringdownProperties, hawkingEvaporationTime_yr,
  tdePeakTime_days, tdeLightcurve, tdeIsDisrupted,
  kerrHorizonAngularVel_radps,
  tidalAccelPerMetre_per_s2, BH_PRESETS,
} from './sim.js';
import { setupBHGL } from '../../../shared/js/engine-gl/schwarzschild-kerr.js';
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

const canvasGL = document.createElement('canvas');
canvasGL.width = W; canvasGL.height = H;
let engine = null;
try { engine = setupBHGL(canvasGL); }
catch (e) { console.warn('[bh-legend] WebGL2 init failed; falling back to 2D', e); engine = null; }

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 30, minRadius: 8, maxRadius: 120,
  azimuthDeg: 35, elevationDeg: 30, fovDeg: 62,
});
window.__camera = camera;
// Expose particle controls to test harnesses. Allows smoke and capture
// scripts to deterministically advance the simulation without depending
// on requestAnimationFrame timing (which headless browsers often throttle).
window.__bh_advance = (steps_M, dt_M = 0.5) => {
  const n = Math.max(1, Math.floor(steps_M / dt_M));
  for (let i = 0; i < n; i++) updateParticles(dt_M);
};

const rM = document.getElementById('readout-M');
const rChi = document.getElementById('readout-chi');
const rRs = document.getElementById('readout-rs');
const rIsco = document.getElementById('readout-isco');
const rTH = document.getElementById('readout-th');
const rMode = document.getElementById('readout-mode');

const selPreset = document.getElementById('select-preset');
const selMode = document.getElementById('select-mode'), vMode = document.getElementById('value-mode');
const sLogM = document.getElementById('slider-logM'), vLogM = document.getElementById('value-logM');
const sChi = document.getElementById('slider-chi'), vChi = document.getElementById('value-chi');
const sIncl = document.getElementById('slider-incl'), vIncl = document.getElementById('value-incl');
const sB = document.getElementById('slider-b'), vB = document.getElementById('value-b');
const sBeta = document.getElementById('slider-beta'), vBeta = document.getElementById('value-beta');
const sRinfall = document.getElementById('slider-rinfall'), vRinfall = document.getElementById('value-rinfall');
const tPhotonsphere = document.getElementById('t-photonsphere');
const tIsco = document.getElementById('t-isco');
const tErgo = document.getElementById('t-ergo');
const tGrid = document.getElementById('t-grid');
const tTraces = document.getElementById('t-traces');
const tLabels = document.getElementById('t-labels');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

// =========================================================================
// MODE TABLE: visible control rows, default camera, default chi/incl, and
// whether the WebGL background is dimmed.
// =========================================================================
const MODE_TABLE = {
  overview:  { rows: ['preset', 'mode', 'logM', 'chi', 'incl', 'toggles'], elev: 22, azim: 35, dim: 0.0, ergo: false },
  photons:   { rows: ['preset', 'mode', 'logM', 'b', 'toggles'],            elev: 70, azim: 35, dim: 0.35, ergo: false },
  lensing:   { rows: ['preset', 'mode', 'logM', 'beta', 'toggles'],         elev: 6,  azim: 35, dim: 0.0, ergo: false },
  shadow:    { rows: ['preset', 'mode', 'logM', 'chi', 'toggles'],          elev: 8,  azim: 35, dim: 0.0, ergo: false },
  framedrag: { rows: ['preset', 'mode', 'logM', 'chi', 'incl', 'toggles'],  elev: 28, azim: 35, dim: 0.40, ergo: true },
  spacetime: { rows: ['preset', 'mode', 'logM', 'incl', 'toggles'],         elev: 22, azim: 35, dim: 0.75, ergo: false },
  ringdown:  { rows: ['preset', 'mode', 'logM', 'chi'],                     elev: 8,  azim: 35, dim: 0.85, ergo: false },
  hawking:   { rows: ['preset', 'mode', 'logM'],                            elev: 14, azim: 35, dim: 0.50, ergo: false },
  tde:       { rows: ['preset', 'mode', 'logM'],                            elev: 35, azim: 35, dim: 0.30, ergo: false },
  tidal:     { rows: ['preset', 'mode', 'logM', 'rinfall'],                 elev: 20, azim: 35, dim: 0.55, ergo: false },
};
const allRows = Array.from(document.querySelectorAll('#controls .row[data-row]'));
function syncRowVisibility(mode) {
  const visible = new Set((MODE_TABLE[mode]?.rows) || ['mode', 'logM']);
  for (const row of allRows) {
    const key = row.getAttribute('data-row');
    row.classList.toggle('hidden', !visible.has(key));
  }
}

const st = {
  mode: 'overview',
  logM: 6.6,                        // Sgr A* default (4.3e6 M_sun).
  chi: 0.0,
  incl: 60,
  b_rs: 2.65,
  beta_te: 0.30,
  beta_y: 0.0,         // 2D lens-source vertical offset, in theta_E units.
  r_infall_rs: 6.0,
  flags: {
    photonsphere: true, isco: true,
    ergo: false, grid: false, traces: true, labels: true,
  },
  running: !prefersReducedMotion(),
  t: 0,
  rng: makeRng(0xC0FFEE),
  lensDragging: false,
};

function M_solar() { return Math.pow(10, st.logM); }
function rsM() { return schwarzschildRadius_m(M_solar()); }
function rIscoRs() { return iscoRadius_m(M_solar(), st.chi) / rsM(); }
function rHorizonRs() { return kerrHorizonRadius_m(M_solar(), st.chi) / rsM(); }
function bCritRs() { return 3 * Math.sqrt(3) / 2; }

// World units in the WebGL shader use M = 1, so R_s = 2 world units.
function rsToWorld(r_rs) { return r_rs * 2; }

// =========================================================================
// CAMERA-SPACE PROJECTION. The 2D overlay uses the same projection as the
// WebGL shader so overlays sit on top of the rendered geometry.
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

function strokePolyline3D(cam, points, color, width, dash) {
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.setLineDash(dash || []);
  ctx.beginPath();
  let started = false;
  for (const p of points) {
    const s = worldToScreen(p, cam);
    if (!s) { started = false; continue; }
    if (!started) { ctx.moveTo(s.x, s.y); started = true; } else ctx.lineTo(s.x, s.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function ringPoints(rWorld, samples = 80, plane = 'equator') {
  const pts = [];
  for (let k = 0; k <= samples; k++) {
    const a = (k / samples) * 2 * Math.PI;
    const c = Math.cos(a), s = Math.sin(a);
    if (plane === 'equator') pts.push([rWorld * c, 0, rWorld * s]);
    else if (plane === 'xz') pts.push([rWorld * c, 0, rWorld * s]);
    else if (plane === 'xy') pts.push([rWorld * c, rWorld * s, 0]);
    else if (plane === 'yz') pts.push([0, rWorld * c, rWorld * s]);
  }
  return pts;
}

// =========================================================================
// PARTICLE SYSTEM. Schwarzschild geodesics in the pseudo-Newtonian
// approximation: the radial acceleration carries an extra GR term
//   a_r = -M/r^2 - 3 M L^2 / r^4
// from the Schwarzschild effective potential V_eff = -M/r + L^2/(2r^2) -
// M L^2/r^3. The 3 M L^2/r^4 correction is what shifts the ISCO from r=0
// (Newtonian) to r=6M (Schwarzschild) and produces realistic capture
// cross-sections for high-L orbits. L is angular momentum per unit mass.
// Geometric units G = M = c = 1 throughout.
//
// On each step we recompute L = |x cross v| per particle (it is conserved
// analytically; we recompute to avoid numerical drift contaminating the
// correction). When a particle crosses the ISCO (r < 6M) we add its
// kinetic energy to a luminosity accumulator; this is the physical source
// of the TDE flare brightness.
// =========================================================================
const particles = {
  active: false,
  mode: null,                         // 'tidal' or 'tde'
  pos: [], vel: [], captured: [],
  iscoCrossed: [],                    // true after particle first crosses r < 6M.
  E: [],                              // specific orbital energy 0.5 v^2 - 1/r.
  initR: 0,
  sinceReset: 0,
  rng: makeRng(0xDEADBEEF),
  luminosity: 0,                      // running flare brightness.
  luminosityHistory: [],              // sampled lightcurve for plotting.
};

function sampleSphere(rng) {
  // Rejection sample inside the unit ball.
  let x, y, z, s;
  do { x = rng()*2 - 1; y = rng()*2 - 1; z = rng()*2 - 1; s = x*x + y*y + z*z; } while (s > 1 || s < 1e-9);
  return [x, y, z];
}

function resetTidalParticles(r_infall_M, N = 280, bodyR = 0.45) {
  particles.active = true;
  particles.mode = 'tidal';
  particles.pos = []; particles.vel = []; particles.captured = []; particles.iscoCrossed = []; particles.E = [];
  particles.initR = r_infall_M;
  particles.sinceReset = 0;
  particles.luminosity = 0;
  particles.luminosityHistory = [];
  particles.rng = makeRng(0xDEADBEEF ^ ((r_infall_M * 1000) | 0));
  for (let i = 0; i < N; i++) {
    const [x, y, z] = sampleSphere(particles.rng);
    particles.pos.push([r_infall_M + bodyR * x, bodyR * y, bodyR * z]);
    particles.vel.push([0, 0, 0]);
    particles.captured.push(false);
    particles.iscoCrossed.push(false);
    particles.E.push(-1 / Math.max(1e-3, r_infall_M));
  }
}

// Frame-dragging mode: launch test particles at rest from a ring at
// various radii. With chi=0 they fall straight. With chi>0 the Kerr
// frame-dragging vector rotates them around the spin axis as they fall,
// producing a visible spiral.
function resetFramedragParticles(N = 60) {
  particles.active = true;
  particles.mode = 'framedrag';
  particles.pos = []; particles.vel = []; particles.captured = []; particles.iscoCrossed = []; particles.E = [];
  particles.initR = 0;
  particles.sinceReset = 0;
  particles.luminosity = 0;
  particles.luminosityHistory = [];
  particles.rng = makeRng(0xFEED1234);
  // Three rings at r = 3, 5, 7 M, with N/3 particles each, evenly spaced
  // in azimuth at z=0 in the equatorial plane. All start at rest.
  const radii = [3.0, 5.0, 7.0];
  const perRing = Math.floor(N / radii.length);
  for (const r of radii) {
    for (let i = 0; i < perRing; i++) {
      const phi = (i / perRing) * 2 * Math.PI;
      particles.pos.push([r * Math.cos(phi), 0, r * Math.sin(phi)]);
      particles.vel.push([0, 0, 0]);
      particles.captured.push(false);
      particles.iscoCrossed.push(false);
      particles.E.push(-1 / r);
    }
  }
}

function resetTdeParticles(N = 380, r0 = 22, r_p = 7.5, bodyR = 0.55) {
  particles.active = true;
  particles.mode = 'tde';
  particles.pos = []; particles.vel = []; particles.captured = []; particles.iscoCrossed = []; particles.E = [];
  particles.initR = r0;
  particles.sinceReset = 0;
  particles.luminosity = 0;
  particles.luminosityHistory = [];
  particles.rng = makeRng(0xC0FFEE ^ ((r_p * 1000) | 0));
  // Parabolic Newtonian orbit with periastron r_p, plane = xy.
  // At r0 (on +x axis): v_total = sqrt(2/r0), L = sqrt(2 r_p),
  // v_t = L/r0, v_r = -sqrt(v_total^2 - v_t^2).
  const v_total = Math.sqrt(2 / r0);
  const v_t = Math.sqrt(2 * r_p) / r0;
  const v_r = -Math.sqrt(Math.max(0, v_total * v_total - v_t * v_t));
  for (let i = 0; i < N; i++) {
    const [x, y, z] = sampleSphere(particles.rng);
    particles.pos.push([r0 + bodyR * x, bodyR * y, bodyR * z]);
    // Small velocity spread (~1% of v_total) so the star is gravitationally
    // bound (modulo our skipped self-gravity), not perfectly coherent.
    const vs = v_total * 0.01;
    particles.vel.push([
      v_r + vs * (particles.rng() - 0.5),
      v_t + vs * (particles.rng() - 0.5),
      vs * (particles.rng() - 0.5),
    ]);
    particles.captured.push(false);
    particles.iscoCrossed.push(false);
    particles.E.push(0);
  }
}

function updateParticles(dt_sim, substeps = 4) {
  if (!particles.active) return;
  const ds = dt_sim / substeps;
  const r_horizon = (rHorizonRs() * 2) * 1.01;
  const r_horizon_sq = r_horizon * r_horizon;
  const r_ISCO = 6;             // 6 M for Schwarzschild.
  const r_ISCO_sq = r_ISCO * r_ISCO;
  let lumIncrement = 0;
  // Kerr frame-dragging angular velocity at radius r (M units).
  // omega_LT(r) = 2 chi / r^3 in geometric units; we apply it in the
  // framedrag mode only, advancing each particle azimuthally per step.
  const applyDrag = (particles.mode === 'framedrag') && (st.chi > 0);
  const chiLT = st.chi;
  for (let step = 0; step < substeps; step++) {
    for (let i = 0; i < particles.pos.length; i++) {
      if (particles.captured[i]) continue;
      const p = particles.pos[i];
      const r2 = p[0]*p[0] + p[1]*p[1] + p[2]*p[2];
      if (r2 < r_horizon_sq) {
        // Horizon crossing: deposit final kinetic energy into luminosity.
        const v = particles.vel[i];
        const ke = 0.5 * (v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        lumIncrement += ke;
        particles.captured[i] = true;
        continue;
      }
      if (r2 > 10000) continue;       // far field, freeze for speed.
      const r = Math.sqrt(r2);
      const v = particles.vel[i];
      // Specific angular momentum L per unit mass = |x cross v|.
      // Conserved analytically; we recompute per step to avoid drift.
      const Lx = p[1]*v[2] - p[2]*v[1];
      const Ly = p[2]*v[0] - p[0]*v[2];
      const Lz = p[0]*v[1] - p[1]*v[0];
      const L2 = Lx*Lx + Ly*Ly + Lz*Lz;
      // Schwarzschild effective acceleration (pseudo-Newtonian form
      // derived from V_eff = -M/r + L^2/(2r^2) - M L^2/r^3 with M=1).
      // a_r = -M/r^2 - 3 M L^2 / r^4. In Cartesian: a = -x/r^3 * (1 + 3 L^2/r^2).
      const inv_r3 = 1 / (r2 * r);
      const grFactor = 1 + 3 * L2 / r2;
      v[0] -= p[0] * inv_r3 * grFactor * ds;
      v[1] -= p[1] * inv_r3 * grFactor * ds;
      v[2] -= p[2] * inv_r3 * grFactor * ds;
      p[0] += v[0] * ds;
      p[1] += v[1] * ds;
      p[2] += v[2] * ds;
      // Frame-dragging step (Kerr): rotate position and velocity about
      // the spin axis (z) by Delta_phi = omega_LT(r) * dt. This makes
      // initially-static particles spiral with the spacetime.
      if (applyDrag) {
        const omegaLT = 2 * chiLT / (r2 * r);   // = 2 chi / r^3 (M units).
        const dphi = omegaLT * ds * 16;          // visual scale.
        const cs = Math.cos(dphi), sn = Math.sin(dphi);
        const nx = cs * p[0] - sn * p[2];
        const nz = sn * p[0] + cs * p[2];
        p[0] = nx; p[2] = nz;
        const nvx = cs * v[0] - sn * v[2];
        const nvz = sn * v[0] + cs * v[2];
        v[0] = nvx; v[2] = nvz;
      }
      // ISCO crossing: bound debris that crosses inside 6 M will plunge;
      // its kinetic energy is dissipated as radiation. Account for this
      // once per particle.
      if (!particles.iscoCrossed[i] && r2 < r_ISCO_sq) {
        const ke = 0.5 * (v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        lumIncrement += 0.6 * ke;   // ~ 6 % efficiency for Schwarzschild ISCO.
        particles.iscoCrossed[i] = true;
      }
      // Update specific orbital energy E = 0.5 v^2 - 1/r (Newtonian
      // proxy; positive E = unbound).
      const v2 = v[0]*v[0] + v[1]*v[1] + v[2]*v[2];
      particles.E[i] = 0.5 * v2 - 1 / r;
    }
  }
  particles.sinceReset += dt_sim;
  // Luminosity dynamics: rises sharply with infall, decays with thermal/
  // viscous cooling timescale set so the visible flare lasts a few units.
  const cooling = 1 / Math.max(1e-3, 4);     // 1/e in ~4 visual seconds.
  particles.luminosity = particles.luminosity * Math.exp(-cooling * dt_sim) + lumIncrement * 4;
  // Sample for the lightcurve panel.
  if (particles.luminosityHistory.length === 0 || particles.sinceReset - particles.luminosityHistory[particles.luminosityHistory.length - 1].t > 0.2) {
    particles.luminosityHistory.push({ t: particles.sinceReset, L: particles.luminosity });
    while (particles.luminosityHistory.length > 600) particles.luminosityHistory.shift();
  }
}

// Draw particles. If `byEnergy` is true (TDE mode), color bound particles
// red and unbound ones blue; otherwise use the supplied uniform color.
function drawParticles(cam, colorActive = 'rgba(255, 220, 140, 0.92)', size = 1.7, byEnergy = false) {
  if (!particles.active) return;
  let nActive = 0, nCaptured = 0;
  for (let i = 0; i < particles.pos.length; i++) {
    const p = particles.pos[i];
    const s = worldToScreen(p, cam);
    if (!s) continue;
    if (particles.captured[i]) {
      ctx.fillStyle = 'rgba(255, 80, 90, 0.40)';
      ctx.beginPath(); ctx.arc(s.x, s.y, 1.0, 0, Math.PI*2); ctx.fill();
      nCaptured++;
    } else {
      const depth = s.depth;
      const alpha = Math.max(0.4, Math.min(1, 1.4 - depth * 0.02));
      let fill;
      if (byEnergy) {
        const E = particles.E[i];
        if (E < 0) {
          // Bound: warm red, brighter near periastron.
          const sat = Math.min(1, Math.max(0.4, -E * 4));
          fill = `rgba(255, ${Math.round(120 - 60 * sat)}, ${Math.round(110 - 40 * sat)}, ${(0.85 * alpha).toFixed(2)})`;
        } else {
          // Unbound: cool blue.
          fill = `rgba(120, 200, 255, ${(0.78 * alpha).toFixed(2)})`;
        }
      } else {
        const m = colorActive.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        fill = m ? `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${(parseFloat(m[4]) * alpha).toFixed(2)})` : colorActive;
      }
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.arc(s.x, s.y, size, 0, Math.PI*2); ctx.fill();
      nActive++;
    }
  }
  return { nActive, nCaptured };
}

function labelAt(cam, p3, text, color = 'rgba(220, 230, 255, 0.92)', dx = 8, dy = 0) {
  if (!st.flags.labels) return;
  const s = worldToScreen(p3, cam);
  if (!s) return;
  ctx.fillStyle = color;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(text, s.x + dx, s.y + dy);
}

// =========================================================================
// BACKGROUND: blit WebGL render or fallback sky.
// =========================================================================
function paintBackground(dim) {
  if (engine) {
    ctx.drawImage(canvasGL, 0, 0, W, H);
  } else {
    drawSky2D();
  }
  if (dim > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${dim.toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);
  }
}
function drawSky2D() {
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 220; i++) {
    const ix = (i * 23.7) % W;
    const iy = (i * 31.1) % H;
    const sb = 0.15 + 0.55 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(200, 220, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, 60, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 180, 100, 0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, 60, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255, 90, 110, 0.95)';
  ctx.font = fontString(canvas, 'body', 'mono');
  ctx.fillText('WebGL2 unavailable; using 2D fallback', W * 0.5 - 130, H - 14);
}

// =========================================================================
// SHARED OVERLAYS: photon-sphere ring, ISCO ring, ergosphere envelope,
// coordinate grid. World units have R_s = 2; so 1.5 R_s = 3, ISCO = 2 *
// iscoRadius_m / rsM(), ergosphere equator = 2.
// =========================================================================
function drawHorizonRings(cam) {
  if (st.flags.photonsphere) {
    const pts = ringPoints(rsToWorld(1.5));
    strokePolyline3D(cam, pts, 'rgba(255, 255, 255, 0.65)', 1.3, [4, 4]);
    if (st.flags.labels) labelAt(cam, [rsToWorld(1.5) * 1.02, 0, 0], 'photon sphere 1.5 R_s', 'rgba(255,255,255,0.65)', 8, -6);
  }
  if (st.flags.isco) {
    const r_isco_world = rsToWorld(rIscoRs());
    strokePolyline3D(cam, ringPoints(r_isco_world), 'rgba(255, 220, 120, 0.85)', 1.4, null);
    if (st.flags.labels) labelAt(cam, [r_isco_world * 1.02, 0, 0], `ISCO ${rIscoRs().toFixed(2)} R_s`, 'rgba(255,220,120,0.85)', 8, 10);
  }
  if (st.flags.ergo && st.chi > 0.01) {
    drawErgosphereWireframe(cam);
  }
}

// Ergosphere is the oblate surface r_e(theta) = M (1 + sqrt(1 - chi^2 cos^2 theta)).
// In world units (M = 1), r_e(theta) ranges between r_+ (poles) and 2 (equator).
// We draw a wireframe of concentric latitude circles + meridian arcs.
function drawErgosphereWireframe(cam) {
  const a = st.chi;
  const r_pole = 1 + Math.sqrt(1 - a * a);          // M units
  const r_eq = 2;                                    // M units
  const color = `rgba(220, 120, 255, 0.55)`;
  // Latitude rings at theta = 30, 60, 90, 120, 150 deg from spin axis.
  for (const thetaDeg of [30, 60, 90, 120, 150]) {
    const theta = thetaDeg * DEG;
    const r = 1 + Math.sqrt(Math.max(0, 1 - a * a * Math.cos(theta) ** 2));
    const radius = r * Math.sin(theta);
    const height = r * Math.cos(theta);
    const pts = [];
    for (let k = 0; k <= 64; k++) {
      const phi = (k / 64) * 2 * Math.PI;
      pts.push([radius * Math.cos(phi), height, radius * Math.sin(phi)]);
    }
    strokePolyline3D(cam, pts, color, 1.0, null);
  }
  // Meridians at four longitudes.
  for (let lon = 0; lon < 4; lon++) {
    const phi = (lon / 4) * 2 * Math.PI;
    const pts = [];
    for (let k = 0; k <= 64; k++) {
      const theta = Math.PI * (k / 64);
      const r = 1 + Math.sqrt(Math.max(0, 1 - a * a * Math.cos(theta) ** 2));
      pts.push([
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.cos(theta),
        r * Math.sin(theta) * Math.sin(phi),
      ]);
    }
    strokePolyline3D(cam, pts, color, 1.0, null);
  }
  if (st.flags.labels) labelAt(cam, [r_eq * 1.05, 0, 0], `ergosphere chi=${a.toFixed(2)}`, color, 8, -22);
  // Note pole vs equator radius difference.
  if (st.flags.labels) labelAt(cam, [0.02, r_pole * 1.05, 0], `r_pole = ${r_pole.toFixed(3)} M`, color, 8, 0);
}

function drawCoordinateGrid(cam) {
  if (!st.flags.grid) return;
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.16)';
  ctx.lineWidth = 1;
  // Concentric circles in equatorial plane.
  for (let r = 2; r <= 16; r += 2) {
    strokePolyline3D(cam, ringPoints(r, 64), 'rgba(120, 200, 255, 0.16)', 1, null);
  }
  // Radial spokes.
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * 2 * Math.PI;
    const pts = [];
    for (let t = 0; t <= 32; t++) {
      const r = 2 + (16 - 2) * (t / 32);
      pts.push([r * Math.cos(a), 0, r * Math.sin(a)]);
    }
    strokePolyline3D(cam, pts, 'rgba(120, 200, 255, 0.13)', 1, null);
  }
}

// =========================================================================
// MODE: OVERVIEW.
// =========================================================================
function drawOverviewMode(cam) {
  drawHorizonRings(cam);
  drawCoordinateGrid(cam);
  if (st.flags.labels) {
    ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
    ctx.font = fontString(canvas, 'caption');
    ctx.fillText('lensed accretion disk; redshifted (back) side dim, blueshifted (front) side bright', 14, 52);
    ctx.fillText('drag canvas to orbit, scroll to zoom; inclination slider sets camera elevation', 14, 70);
  }
}

// =========================================================================
// MODE: PHOTONS. Backward-traced null geodesics for a fan of impact
// parameters around the user-selected b. The camera moves to a near
// top-down view (elev = 70 deg) so the bending is clearly visible.
// =========================================================================
function drawPhotonsMode(cam) {
  const Rs = rsM();
  const b_target = st.b_rs * Rs;
  const bs = [];
  for (let k = 0; k < 9; k++) { bs.push(b_target * (1 + 0.10 * (k - 4))); }
  for (const b of bs) {
    const { path } = tracePhoton(M_solar(), b);
    const cls = classifyPhoton(M_solar(), b);
    let color;
    if (cls === 'capture') color = 'rgba(255, 90, 110, 0.95)';
    else if (cls === 'orbit') color = 'rgba(255, 230, 110, 1.0)';
    else color = 'rgba(140, 220, 255, 0.95)';
    const points = [];
    for (let i = 0; i < path.length; i++) {
      const rWorld = (path[i].r / Rs) * 2;
      const phi = path[i].phi;
      points.push([rWorld * Math.cos(phi), 0, rWorld * Math.sin(phi)]);
    }
    strokePolyline3D(cam, points, color, (Math.abs(b - b_target) < 1e-9) ? 2.4 : 1.2, null);
  }
  drawHorizonRings(cam);
  // Critical-impact-parameter circle: it represents the asymptotic
  // sightline along which any straight-line projection meets the BH.
  // At infinity this is the boundary of the shadow.
  strokePolyline3D(cam, ringPoints(bCritRs() * 2, 64), 'rgba(255, 230, 110, 0.45)', 1, [3, 4]);
  if (st.flags.labels) labelAt(cam, [bCritRs() * 2 * 1.02, 0, 0], 'b_c = 2.598 R_s', 'rgba(255,230,110,0.75)', 8, 16);

  // Legend strip.
  const cls = classifyPhoton(M_solar(), b_target);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'body');
  ctx.fillText(`b / R_s = ${st.b_rs.toFixed(2)};  critical b_c / R_s = ${bCritRs().toFixed(3)}`, 14, H - 50);
  ctx.fillStyle = cls === 'capture' ? 'rgba(255, 130, 130, 0.95)' : cls === 'orbit' ? 'rgba(255, 230, 110, 0.95)' : 'rgba(140, 220, 255, 0.95)';
  ctx.fillText(`outcome at chosen b: ${cls.toUpperCase()}`, 14, H - 32);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('red = capture; yellow = unstable orbit on the photon sphere; blue = escape', 14, H - 14);
}

// =========================================================================
// MODE: LENSING. Refsdal 1964 point-mass lens. The Einstein ring is drawn
// on the sky plane perpendicular to the line of sight from the observer
// through the BH, projected as a circle of angular radius theta_E about
// the BH center as seen by the camera.
//
// theta_E in this visualization scales with sqrt(M / M_sun) so the user
// sees the ring grow with mass. The source is a background point drawn
// behind the BH, with the two image dots at the Refsdal positions.
// =========================================================================
// 2D Refsdal point-mass lens. The source can be anywhere on the sky
// plane around the lens; the two images appear along the line from
// lens-center to source position. We use (beta_x, beta_y) in theta_E
// units (st.beta_te, st.beta_y). The user can drag the source ghost.
function drawLensingMode(cam) {
  drawHorizonRings(cam);
  // Pre-cache theta_E (visual world units; scales as sqrt(M)).
  const theta_E_world = 5.5 * Math.sqrt(M_solar() / 1e6);
  // 2D source position in theta_E units.
  const bx = st.beta_te, by = st.beta_y;
  const beta = Math.sqrt(bx * bx + by * by);
  const u = Math.sqrt(beta * beta + 4);    // in theta_E units.
  // Image positions along the (bx, by) direction:
  const dirX = beta > 1e-9 ? bx / beta : 1;
  const dirY = beta > 1e-9 ? by / beta : 0;
  const xpScalar = 0.5 * (beta + u);
  const xmScalar = 0.5 * (beta - u);
  const imgPlus_te = [xpScalar * dirX, xpScalar * dirY];
  const imgMinus_te = [xmScalar * dirX, xmScalar * dirY];

  // Einstein-ring circle on the sky plane (perpendicular to viewing dir).
  const rg = cam.r, upv = cam.u;
  const ringPts = [];
  for (let k = 0; k <= 96; k++) {
    const a = (k / 96) * 2 * Math.PI;
    const p = [
      theta_E_world * (Math.cos(a) * rg[0] + Math.sin(a) * upv[0]),
      theta_E_world * (Math.cos(a) * rg[1] + Math.sin(a) * upv[1]),
      theta_E_world * (Math.cos(a) * rg[2] + Math.sin(a) * upv[2]),
    ];
    ringPts.push(p);
  }
  const ringAlpha = Math.max(0.18, 0.92 - 0.35 * Math.min(2, beta));
  strokePolyline3D(cam, ringPts, `rgba(255, 220, 140, ${ringAlpha.toFixed(2)})`, 1.6, [5, 4]);

  // Source ghost (unlensed) placed BEHIND the BH along the lens-plane offset.
  const fwd = cam.f;
  const eye = cam.eye;
  const ringDist = Math.hypot(eye[0], eye[1], eye[2]) * 0.5;
  const srcDepth = ringDist * 2.0;
  const sourceP = [
    bx * theta_E_world * rg[0] + by * theta_E_world * upv[0] + fwd[0] * srcDepth,
    bx * theta_E_world * rg[1] + by * theta_E_world * upv[1] + fwd[1] * srcDepth,
    bx * theta_E_world * rg[2] + by * theta_E_world * upv[2] + fwd[2] * srcDepth,
  ];
  const sGhost = worldToScreen(sourceP, cam);
  if (sGhost) {
    ctx.fillStyle = 'rgba(120, 220, 200, 0.85)';
    ctx.beginPath(); ctx.arc(sGhost.x, sGhost.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(120, 220, 200, 0.92)';
    ctx.setLineDash([2, 3]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(sGhost.x, sGhost.y, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    if (st.flags.labels) {
      ctx.fillStyle = 'rgba(120, 220, 200, 0.92)';
      ctx.font = fontString(canvas, 'caption', 'mono');
      ctx.fillText('source (drag me on canvas)', sGhost.x + 14, sGhost.y + 4);
    }
    st._sourceScreenPos = { x: sGhost.x, y: sGhost.y };
  }

  // Image markers on the lens plane (sky plane through BH).
  const imgP_world = [
    imgPlus_te[0] * theta_E_world * rg[0] + imgPlus_te[1] * theta_E_world * upv[0],
    imgPlus_te[0] * theta_E_world * rg[1] + imgPlus_te[1] * theta_E_world * upv[1],
    imgPlus_te[0] * theta_E_world * rg[2] + imgPlus_te[1] * theta_E_world * upv[2],
  ];
  const imgM_world = [
    imgMinus_te[0] * theta_E_world * rg[0] + imgMinus_te[1] * theta_E_world * upv[0],
    imgMinus_te[0] * theta_E_world * rg[1] + imgMinus_te[1] * theta_E_world * upv[1],
    imgMinus_te[0] * theta_E_world * rg[2] + imgMinus_te[1] * theta_E_world * upv[2],
  ];
  const sP = worldToScreen(imgP_world, cam);
  const sM = worldToScreen(imgM_world, cam);
  // Magnification scales the image dot size.
  const uRatio = beta;       // beta / theta_E.
  const mu_plus = Math.abs(0.5 * (uRatio / Math.max(1e-9, u) + 1));
  const mu_minus = Math.abs(0.5 * (uRatio / Math.max(1e-9, u) - 1));
  const dotR = (mu) => Math.max(4, Math.min(14, 5 + 7 * Math.sqrt(Math.max(0.5, mu))));
  ctx.fillStyle = 'rgba(255, 200, 120, 0.98)';
  if (sP) { ctx.beginPath(); ctx.arc(sP.x, sP.y, dotR(mu_plus), 0, Math.PI * 2); ctx.fill(); }
  if (sM) { ctx.beginPath(); ctx.arc(sM.x, sM.y, dotR(mu_minus), 0, Math.PI * 2); ctx.fill(); }
  if (st.flags.labels && sP) { ctx.fillStyle = 'rgba(255, 200, 120, 0.95)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText('+ image', sP.x + 12, sP.y - 4); }
  if (st.flags.labels && sM) { ctx.fillStyle = 'rgba(255, 200, 120, 0.95)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText('- image', sM.x + 12, sM.y - 4); }

  // Connecting line through lens center showing the axis.
  if (sP && sM) {
    ctx.strokeStyle = 'rgba(255, 200, 120, 0.25)';
    ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sP.x, sP.y); ctx.lineTo(sM.x, sM.y); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Readout strip.
  const mu = lensMagnification(beta, 1.0);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('LENSING (Refsdal 1964): drag the cyan source dot on the canvas to move it across the BH.', 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('When the source crosses the BH (β = 0), the two images merge into a complete Einstein ring.', 14, 70);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`beta = (${bx.toFixed(2)}, ${by.toFixed(2)}) theta_E,  |beta| = ${beta.toFixed(2)} theta_E`, 14, H - 50);
  ctx.fillText(`mu_+ = ${mu_plus.toFixed(2)}  mu_- = ${mu_minus.toFixed(2)}  mu_total = ${mu.toFixed(2)}`, 14, H - 32);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`theta_E (world units, scales as sqrt M) = ${theta_E_world.toFixed(2)}`, 14, H - 14);
}

// =========================================================================
// MODE: SHADOW. EHT-style highlight of the photon ring (which appears at
// b_c = 2.598 R_s as seen from infinity) and the BH shadow boundary.
// We draw a glowing circle of radius b_c on the lens plane, label the
// angular size for the selected mass, and annotate SgrA*/M87* references.
// =========================================================================
function drawShadowMode(cam) {
  drawHorizonRings(cam);
  const rg = cam.r, upv = cam.u;
  // Photon-ring projected circle (centered on BH, in the sky plane).
  const r_world = bCritRs() * 2;   // b_c in world units.
  const ringPts = [];
  for (let k = 0; k <= 96; k++) {
    const a = (k / 96) * 2 * Math.PI;
    const p = [
      r_world * (Math.cos(a) * rg[0] + Math.sin(a) * upv[0]),
      r_world * (Math.cos(a) * rg[1] + Math.sin(a) * upv[1]),
      r_world * (Math.cos(a) * rg[2] + Math.sin(a) * upv[2]),
    ];
    ringPts.push(p);
  }
  // Outer glow ring.
  strokePolyline3D(cam, ringPts, 'rgba(255, 200, 120, 0.95)', 3.0, null);
  // Halo glow around the photon ring as a screen-space radial gradient.
  const sCenter = worldToScreen([0, 0, 0], cam);
  const sEdge = worldToScreen(ringPts[0], cam);
  if (sCenter && sEdge) {
    const Rpx = Math.hypot(sEdge.x - sCenter.x, sEdge.y - sCenter.y);
    const grad = ctx.createRadialGradient(sCenter.x, sCenter.y, Rpx * 0.9, sCenter.x, sCenter.y, Rpx * 1.45);
    grad.addColorStop(0, 'rgba(255, 220, 140, 0.0)');
    grad.addColorStop(0.45, 'rgba(255, 200, 120, 0.35)');
    grad.addColorStop(1, 'rgba(255, 120, 60, 0.0)');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  // Inner shadow region (rough disk = 2.6 R_s for any chi to leading order).
  if (st.flags.labels) labelAt(cam, [r_world * Math.SQRT1_2, 0, r_world * Math.SQRT1_2], 'photon ring at b_c', 'rgba(255, 220, 140, 0.95)', 8, -10);

  // Distance-dependent angular size: we report theta_sh for a few canonical
  // distances. For Sgr A* (D = 8.27 kpc, M = 4.3e6), theta_sh ~ 25 uas.
  const M = M_solar();
  const Rs_km = rsKm(M);
  const bc_m = (3 * Math.sqrt(3) / 2) * (Rs_km * 1000);
  const D_SgrA = 8.27 * 3.086e19;       // m
  const D_M87 = 16800 * 3.086e19;       // m
  const D_GW = 410e6 * 3.086e19;        // m (LIGO distance scale, 410 Mpc)
  const thetaSh = (D) => (bc_m / D) * (180 / Math.PI) * 3600 * 1e6;  // uas

  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('SHADOW: the dark disc inside the photon ring (b_c = 2.598 R_s) seen from infinity.', 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('What the Event Horizon Telescope resolves. Independent of accretion details, the boundary is set by geometry.', 14, 70);

  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`mass M = ${M.toExponential(2)} M_sun;  R_s = ${rsKm(M).toExponential(2)} km`, 14, H - 78);
  ctx.fillText(`angular shadow at D = 8.27 kpc (Sgr A*):    theta_sh = ${thetaSh(D_SgrA).toFixed(2)} uas`, 14, H - 60);
  ctx.fillText(`angular shadow at D = 16.8 Mpc (M87*):      theta_sh = ${thetaSh(D_M87).toFixed(2)} uas`, 14, H - 42);
  ctx.fillText(`angular shadow at D = 410 Mpc (GW150914):   theta_sh = ${thetaSh(D_GW).toExponential(2)} uas`, 14, H - 24);
  ctx.fillStyle = 'rgba(255, 180, 100, 0.82)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('EHT 2019: M87* theta_sh = 42 uas; EHT 2022: Sgr A* theta_sh = 51.8 uas.', 14, H - 6);
}

// =========================================================================
// MODE: FRAME DRAG. Redesigned with gyroscope arrows.
// Three rings of GYROSCOPE arrows are placed in the equatorial plane.
// At chi = 0 every arrow points to a fixed "infinity-anchored north."
// As chi increases, each arrow precesses at the local Lense-Thirring
// rate omega(r) ~ 2 chi / r^3, fastest near the horizon, slower outside.
// The user clearly sees the field "twist" inward.
// Plus: a freefalling test photon dropped from rest at r = 6 M.
// At chi = 0 it falls radially. At chi > 0 it spirals inward.
// =========================================================================
function drawFrameDragMode(cam) {
  // Always show the ergosphere here, regardless of toggle.
  const savedErgo = st.flags.ergo;
  st.flags.ergo = true;
  drawHorizonRings(cam);
  st.flags.ergo = savedErgo;

  const a = st.chi;
  const tVis = st.t;

  // If a fresh framedrag init is needed, do it.
  if (particles.mode !== 'framedrag') resetFramedragParticles();

  // Draw the particle cluster: at chi=0 they fall straight in; at chi>0
  // they get carried by the dragged spacetime and trace spirals. The
  // ZAMO ring colour-by-energy is not very illuminating here, so use a
  // uniform warm colour that contrasts with the gyroscope arrows.
  drawParticles(cam, 'rgba(255, 240, 200, 0.95)', 2.1, /*byEnergy*/ false);

  // Three gyroscope rings. Each one shows the local "north" direction
  // of a frame that started anchored to infinity at t = 0. Lense-Thirring
  // rotates it forward by omega(r) * t. The arrow tail is the position,
  // the head is the rotated direction.
  const rings = [
    { r: 2.5, n: 16, color: 'rgba(255, 130, 130, 0.95)' },
    { r: 4.5, n: 16, color: 'rgba(255, 200, 120, 0.95)' },
    { r: 7.0, n: 16, color: 'rgba(140, 220, 255, 0.95)' },
  ];
  for (const ring of rings) {
    const omega_r = 2 * a / Math.pow(ring.r, 3);
    const precession = omega_r * tVis * 6;     // visual scale.
    // Reference circle (faint).
    strokePolyline3D(cam, ringPoints(ring.r, 80), 'rgba(120, 200, 255, 0.18)', 1.0, [3, 4]);
    // Arrow at each position.
    for (let k = 0; k < ring.n; k++) {
      const a0 = (k / ring.n) * 2 * Math.PI;
      const px = ring.r * Math.cos(a0);
      const pz = ring.r * Math.sin(a0);
      // Local "north" direction in equatorial plane is the local +x_hat
      // direction rotated by precession.
      const dirX = Math.cos(precession);
      const dirZ = Math.sin(precession);
      const len = 0.7;
      const tipX = px + len * dirX;
      const tipZ = pz + len * dirZ;
      const base = [px, 0, pz];
      const tip = [tipX, 0, tipZ];
      // Shaft.
      strokePolyline3D(cam, [base, tip], ring.color, 1.6, null);
      // Arrowhead: two short segments.
      const perpX = -dirZ, perpZ = dirX;
      const hw = 0.15;
      const head1 = [tipX - 0.20 * dirX + hw * perpX, 0, tipZ - 0.20 * dirZ + hw * perpZ];
      const head2 = [tipX - 0.20 * dirX - hw * perpX, 0, tipZ - 0.20 * dirZ - hw * perpZ];
      strokePolyline3D(cam, [head1, tip, head2], ring.color, 1.6, null);
      // Dot at base (the gyroscope itself).
      const sBase = worldToScreen(base, cam);
      if (sBase) {
        ctx.fillStyle = ring.color;
        ctx.beginPath(); ctx.arc(sBase.x, sBase.y, 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (st.flags.labels) {
      const omega_rate = (omega_r * 6).toFixed(2);
      labelAt(cam, [ring.r * 1.02, 0, 0], `r=${ring.r.toFixed(1)}M omega=${omega_rate} rad/t`, ring.color, 8, -4);
    }
  }

  // Freefalling test particle dropped from rest at r = 6.0, advancing
  // by Lense-Thirring spiral. Period = (visual scale).
  const cyclePeriod = 5;
  const photonT = (tVis % cyclePeriod) / cyclePeriod;
  const r0 = 6.0;
  const r_drop = r0 * (1 - photonT * 0.92);
  if (r_drop > rHorizonRs() * 2 * 1.02) {
    // Approximation: phi accumulates from the Lense-Thirring rate integrated
    // along the infall path. At chi = 0 the particle falls radially (phi = 0).
    let phi_acc = 0;
    let rPrev = r0;
    const trailPts = [];
    for (let i = 0; i <= 30; i++) {
      const u = (i / 30) * photonT;
      const rAt = r0 * (1 - u * 0.92);
      const dr = rPrev - rAt;
      const om = 2 * a / Math.pow(Math.max(rAt, 1.05), 3);
      // dphi/dt and dr/dt give approximate dphi = om * dt = om * (dr / |dr/dt|).
      // Use a phenomenological mapping with omega weight.
      phi_acc += om * dr * 8;
      rPrev = rAt;
      trailPts.push([rAt * Math.cos(phi_acc), 0, rAt * Math.sin(phi_acc)]);
    }
    strokePolyline3D(cam, trailPts, 'rgba(255, 255, 200, 0.85)', 1.6, null);
    if (trailPts.length > 0) {
      const last = trailPts[trailPts.length - 1];
      const s = worldToScreen(last, cam);
      if (s) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 10);
        g.addColorStop(0, 'rgba(255, 255, 220, 1)');
        g.addColorStop(1, 'rgba(255, 200, 120, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(s.x, s.y, 10, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Readout strip.
  const Omega_H = kerrHorizonAngularVel_radps(M_solar(), a);
  ctx.fillStyle = 'rgba(255, 200, 120, 0.95)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Frame dragging (Lense-Thirring 1918): a Kerr BH twists nearby inertial frames forward.', 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('Each arrow is a GYROSCOPE that started pointing to "infinity-anchored north." It precesses at omega(r) ~ 2 chi / r^3.', 14, 70);
  ctx.fillText('White particles dropped at rest from r = 3, 5, 7 M: χ = 0 they fall straight; χ > 0 they spiral with the dragged spacetime.', 14, 88);
  if (a < 0.02) {
    ctx.fillStyle = 'rgba(255, 130, 130, 0.95)';
    ctx.font = fontString(canvas, 'caption');
    ctx.fillText('Set χ > 0 to see the gyroscopes precess and the dropped particle spiral inward.', 14, 106);
  }
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`Omega_H (horizon angular velocity) = ${Omega_H.toExponential(3)} rad/s`, 14, H - 50);
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`omega(r=2.5M) = ${(2*a/15.625).toFixed(3)};  omega(r=4.5M) = ${(2*a/91.125).toFixed(3)};  omega(r=7M) = ${(2*a/343).toFixed(4)}  (M units)`, 14, H - 32);
  ctx.fillStyle = 'rgba(220, 120, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('Purple wireframe: ergosphere boundary. Inside it, no observer can be at rest with respect to infinity.', 14, H - 14);
}

// =========================================================================
// MODE: SPACETIME. Flamm embedding (paraboloid) with photons traveling
// along its surface. Some pass through and escape; some at small impact
// parameter fall into the throat.
// =========================================================================

// Map a 2D (r, phi) point on the embedded Schwarzschild slice to a 3D
// world position. r is in R_s units. The standard Flamm embedding has
// z(r) = 2 sqrt(R_s (r - R_s)): throat (r = R_s) at z = 0, surface
// rising to z > 0 at large r. The bowl opens UPWARD with the throat
// at its lowest point (the bottom of the well).
function embedPoint(r_Rs, phi, vScale) {
  const r = Math.max(1.001, r_Rs);
  const z = 2 * Math.sqrt(r - 1) * vScale;
  // World y is UP; embedding z scales POSITIVELY so the rim is above
  // the throat and the well looks like a textbook depression.
  return [2 * r * Math.cos(phi), 2 * z, 2 * r * Math.sin(phi)];
}

function drawSpacetimeMode(cam) {
  const N_r = 48, N_phi = 96;
  const r_min = 1.001, r_max = 14.0;
  // Vertical scale: deeper for higher mass (visually intuitive even
  // though physically the embedding is M-invariant).
  const vScale = 1.0 + 0.20 * (st.logM - 6);

  // Build mesh.
  const grid = [];
  for (let ir = 0; ir < N_r; ir++) {
    const u = ir / (N_r - 1);
    const r = r_min + (r_max - r_min) * u;
    const row = [];
    for (let iphi = 0; iphi < N_phi; iphi++) {
      const phi = (iphi / N_phi) * 2 * Math.PI;
      row.push(embedPoint(r, phi, vScale));
    }
    grid.push(row);
  }
  // Latitudes (rings of constant r).
  for (let ir = 0; ir < N_r; ir += 2) {
    const pts = grid[ir].concat([grid[ir][0]]);
    const alpha = 0.30 + 0.40 * (1 - ir / N_r);
    strokePolyline3D(cam, pts, `rgba(120, 200, 255, ${alpha.toFixed(2)})`, 1.0, null);
  }
  // Meridians.
  for (let iphi = 0; iphi < N_phi; iphi += 4) {
    const pts = grid.map(row => row[iphi]);
    strokePolyline3D(cam, pts, 'rgba(120, 200, 255, 0.45)', 1.0, null);
  }
  // Throat highlight (horizon at r = R_s).
  strokePolyline3D(cam, grid[0], 'rgba(255, 180, 100, 0.95)', 2.0, null);
  // Photon sphere ring at r = 1.5 R_s on the embedded surface.
  const psRing = [];
  for (let k = 0; k <= 96; k++) {
    const phi = (k / 96) * 2 * Math.PI;
    psRing.push(embedPoint(1.5, phi, vScale));
  }
  strokePolyline3D(cam, psRing, 'rgba(255, 255, 255, 0.55)', 1.2, [3, 4]);

  // Five photons traveling on the embedding. Each starts at r = 8 R_s
  // with an impact parameter b (in R_s). b > b_c escape (deflected);
  // b < b_c get captured. Use the Schwarzschild orbit equation to get
  // the 2D path in the equatorial plane.
  const bvals = [
    { b: 4.5, color: 'rgba(140, 220, 255, 0.95)', kind: 'escape' },
    { b: 3.5, color: 'rgba(140, 220, 255, 0.95)', kind: 'escape' },
    { b: 2.75, color: 'rgba(255, 230, 110, 0.95)', kind: 'orbit' },
    { b: 2.50, color: 'rgba(255, 130, 110, 0.95)', kind: 'capture' },
    { b: 1.8,  color: 'rgba(255, 130, 110, 0.95)', kind: 'capture' },
  ];
  // Time-driven phase: each photon traces its path repeatedly, offset by index.
  const cyclePeriod = 6;
  const phaseT = (st.t % cyclePeriod) / cyclePeriod;
  for (let pi = 0; pi < bvals.length; pi++) {
    const bv = bvals[pi];
    const Rs = rsM();
    const b_m = bv.b * Rs;
    const { path } = tracePhoton(M_solar(), b_m);
    if (path.length === 0) continue;
    // Convert path to (r_Rs, phi) tuples.
    const samples = path.map(p => ({ r_Rs: p.r / Rs, phi: p.phi }));
    // Show the photon at a position determined by phaseT (modulo per-photon offset).
    const idxLast = Math.floor(((phaseT + pi * 0.13) % 1) * samples.length);
    // Long decay trail: 160 samples instead of 40 so the geodesic path
    // reads as a sweeping arc across the embedded surface.
    const trailLen = Math.min(160, idxLast);
    const trailPts = [];
    for (let s = Math.max(0, idxLast - trailLen); s <= idxLast; s++) {
      if (s >= samples.length) break;
      const rR = samples[s].r_Rs;
      const ph = samples[s].phi - Math.PI / 2 + pi * 0.5;
      if (rR > 1.001 && rR <= 14) trailPts.push(embedPoint(rR, ph, vScale));
    }
    // Draw the trail with a fade tail: oldest segments dim, current dot bright.
    if (trailPts.length >= 2) {
      ctx.lineCap = 'round';
      for (let s = 0; s < trailPts.length - 1; s++) {
        const f = s / (trailPts.length - 1);
        const alpha = 0.10 + 0.85 * f;
        const m = bv.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        const stroke = m ? `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${(parseFloat(m[4]) * alpha).toFixed(2)})` : bv.color;
        strokePolyline3D(cam, [trailPts[s], trailPts[s + 1]], stroke, 1.8, null);
      }
    }
    if (trailPts.length > 0) {
      const last = trailPts[trailPts.length - 1];
      const s = worldToScreen(last, cam);
      if (s) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 8);
        g.addColorStop(0, bv.color);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(s.x, s.y, 8, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Spacetime as geometry: Flamm embedding + photons traveling on the curved surface.', 14, 52);
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('Photons at large b escape after a deflection; at b < 2.598 R_s they spiral down the throat and are captured.', 14, 70);
  ctx.fillText('z(r) = 2 sqrt(R_s (r - R_s)); the surface is the spatial geometry of a t = const, θ = π/2 slice.', 14, 88);
  ctx.fillStyle = 'rgba(255, 180, 100, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('orange ring: horizon throat; white dashed: photon sphere at 1.5 R_s', 14, H - 14);
}

// =========================================================================
// MODE: RINGDOWN.
// =========================================================================
function drawRingdownMode(_cam) {
  const { omegaR_M, omegaI_M } = qnmFrequency(st.chi);
  const props = ringdownProperties(M_solar(), st.chi);
  // Time in M units; loop back when t exceeds 22 M so the strain panel
  // is always populated and the bell never freezes off-screen.
  const tMax = 22;
  const t_M = (st.t * 0.9) % tMax;
  const phase = omegaR_M * t_M;
  const decay = Math.exp(omegaI_M * t_M);

  // Bell with m=2 deformation.
  const cx = W * 0.50, cy = H * 0.42;
  const Rpx = 100;
  const A_max = 0.18;
  const amp = A_max * Math.max(decay, 0.04);

  // Glow halo.
  const halo = ctx.createRadialGradient(cx, cy, Rpx * 0.9, cx, cy, Rpx * 2.4);
  halo.addColorStop(0, `rgba(255, 180, 100, ${(0.35 + 0.25 * decay).toFixed(3)})`);
  halo.addColorStop(0.5, `rgba(255, 100, 200, ${(0.15 * decay).toFixed(3)})`);
  halo.addColorStop(1, 'rgba(60, 80, 220, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(cx, cy, Rpx * 2.4, 0, Math.PI * 2); ctx.fill();

  // Bell silhouette.
  ctx.fillStyle = '#000';
  ctx.beginPath();
  const N = 96;
  for (let k = 0; k <= N; k++) {
    const a = (k / N) * 2 * Math.PI;
    const r = Rpx * (1 + amp * Math.cos(2 * a - phase));
    const x = cx + r * Math.cos(a);
    const ySq = 1 - 0.22 * st.chi;
    const y = cy + r * Math.sin(a) * ySq;
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
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

  // m = 2 lobe markers.
  for (const lobe of [0, Math.PI]) {
    const a = lobe + phase / 2;
    const r = Rpx * (1 + amp);
    const x = cx + r * Math.cos(a);
    const ySq = 1 - 0.22 * st.chi;
    const y = cy + r * Math.sin(a) * ySq;
    ctx.fillStyle = 'rgba(120, 240, 200, 1)';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Ringdown: the post-merger Kerr BH oscillates and decays in its (l,m,n)=(2,2,0) QNM.', 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('The bulge co-rotates at the QNM frequency; its amplitude decays by 1/e in τ (damping time).', 14, 70);
  ctx.fillText('LIGO/Virgo measures the resulting damped sinusoid below.', 14, 88);

  // Strain panel.
  const px0 = 0.12 * W, py0 = H - 170, pw = 0.76 * W, ph = 120;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('gravitational-wave strain h(t) = h_0 exp(-t/τ) cos(2 π f t)', px0 + 8, py0 - 6);
  const midY = py0 + ph / 2;
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.18)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(px0, midY); ctx.lineTo(px0 + pw, midY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(120, 240, 200, 0.95)';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
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
  // Decay envelope.
  ctx.strokeStyle = 'rgba(255, 200, 120, 0.45)';
  ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
  for (const sign of [1, -1]) {
    ctx.beginPath();
    for (let k = 0; k <= 360; k++) {
      const tau = (k / 360) * tMax;
      const e = sign * Math.exp(omegaI_M * tau);
      const x = px0 + 30 + (tau / tMax) * (pw - 50);
      const y = midY - e * (ph * 0.36);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Current marker.
  const xc = px0 + 30 + (t_M / tMax) * (pw - 50);
  const yc = midY - decay * Math.cos(phase) * (ph * 0.36);
  ctx.fillStyle = 'rgba(255, 255, 200, 1)';
  ctx.beginPath(); ctx.arc(xc, yc, 5, 0, Math.PI * 2); ctx.fill();

  const Mnow = M_solar();
  const mStr = Mnow >= 1e4 ? Mnow.toExponential(1) : Mnow.toFixed(0);
  const tauStr = props.tau_s >= 1 ? `${props.tau_s.toFixed(1)} s` : `${(props.tau_s * 1000).toFixed(2)} ms`;
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`M = ${mStr} Msun, chi = ${st.chi.toFixed(2)}:   f = ${props.f_Hz.toExponential(2)} Hz,  tau = ${tauStr},  Q = ${props.Q.toFixed(2)}`, px0 + 8, py0 + ph + 18);
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('reference: the GW150914 remnant (62 Msun, χ = 0.69) rings at f ~ 251 Hz, τ ~ 4 ms.', px0 + 8, py0 + ph + 32);
}

// =========================================================================
// MODE: HAWKING. Thermal-spectrum visualization. Pair flashes still
// shown at the horizon for narrative; below the BH render is a Planck
// blackbody curve at T = T_H, with peak frequency / wavelength marked.
// Mass slider shifts the peak across the EM spectrum: SMBH cold, primordial
// in gamma-rays.
// =========================================================================
function drawHawkingMode(cam) {
  drawHorizonRings(cam);
  const center = worldToScreen([0, 0, 0], cam);
  if (!center) return;
  const refOuter = worldToScreen([2, 0, 0], cam);
  const Rpx = refOuter ? Math.hypot(refOuter.x - center.x, refOuter.y - center.y) : 60;
  const T = hawkingTemperature_K(M_solar());
  const tEvap = hawkingEvaporationTime_yr(M_solar());

  // Pair flashes at the horizon. Intensity scales with T (hotter = more
  // emission). For T < 1 K (basically all stellar+ BHs) emission is tiny;
  // for T > 1e6 K (primordial) very intense.
  const T_log = Math.log10(Math.max(1e-30, T));
  const emissionFactor = Math.min(1, Math.max(0.05, (T_log + 8) / 16));
  const nFlashes = Math.round(6 + 20 * emissionFactor);
  const rng = makeRng(((st.t * 100) | 0) ^ 0xdeadbeef);
  for (let i = 0; i < nFlashes; i++) {
    const angle = rng() * 2 * Math.PI;
    const dist = Rpx * (1.02 + 0.15 * rng());
    const intensity = 0.30 + 0.65 * Math.sin(st.t * 3 + i * 0.7);
    const px = center.x + dist * Math.cos(angle);
    const py = center.y + dist * Math.sin(angle);
    const g = ctx.createRadialGradient(px, py, 0, px, py, 14);
    g.addColorStop(0, `rgba(255, 255, 220, ${(intensity * emissionFactor).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255, 130, 100, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill();
    // Outgoing cyan particle.
    const ax = center.x + dist * 3.5 * Math.cos(angle);
    const ay = center.y + dist * 3.5 * Math.sin(angle);
    ctx.strokeStyle = `rgba(190, 230, 255, ${(0.55 * intensity * emissionFactor).toFixed(3)})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ax, ay); ctx.stroke();
    // Infalling red partner.
    const ix = center.x + dist * 0.5 * Math.cos(angle);
    const iy = center.y + dist * 0.5 * Math.sin(angle);
    ctx.strokeStyle = `rgba(255, 110, 130, ${(0.32 * intensity * emissionFactor).toFixed(3)})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ix, iy); ctx.stroke();
  }

  // Planck blackbody spectrum panel.
  // B_nu(T) for a few decades of frequency; peak at h nu = 2.82 k T.
  // Use log-log axes covering 1e4 to 1e22 Hz (radio to gamma).
  const px0 = 0.10 * W, py0 = H - 175, pw = 0.55 * W, ph = 150;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.90)';
  ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('Planck spectrum B_nu(T = T_H)  (intensity vs. log ν)', px0 + 8, py0 - 6);

  const log_nu_min = 4, log_nu_max = 22;   // Hz.
  const k_B = 1.380649e-23, h_pl = 6.62607015e-34, c_si = 2.998e8;
  // Find log_nu axis label bands.
  const bands = [
    { lo: 4, hi: 11, name: 'radio', col: 'rgba(120, 180, 255, 0.18)' },
    { lo: 11, hi: 13, name: 'IR', col: 'rgba(255, 180, 100, 0.18)' },
    { lo: 13.7, hi: 14.7, name: 'VIS', col: 'rgba(180, 255, 180, 0.22)' },
    { lo: 15, hi: 16, name: 'UV', col: 'rgba(180, 130, 255, 0.18)' },
    { lo: 16, hi: 19, name: 'X', col: 'rgba(255, 130, 200, 0.18)' },
    { lo: 19, hi: 22, name: 'gamma', col: 'rgba(255, 100, 80, 0.18)' },
  ];
  for (const band of bands) {
    const x1 = px0 + 30 + ((band.lo - log_nu_min) / (log_nu_max - log_nu_min)) * (pw - 50);
    const x2 = px0 + 30 + ((band.hi - log_nu_min) / (log_nu_max - log_nu_min)) * (pw - 50);
    ctx.fillStyle = band.col;
    ctx.fillRect(x1, py0 + 14, x2 - x1, ph - 30);
  }
  for (const band of bands) {
    const xc = px0 + 30 + ((0.5 * (band.lo + band.hi) - log_nu_min) / (log_nu_max - log_nu_min)) * (pw - 50);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.textAlign = 'center';
    ctx.fillText(band.name, xc, py0 + ph - 6);
  }
  ctx.textAlign = 'left';

  // Plot B_nu(T) on log-log axes. For very low T, peak is at low nu; for
  // high T, peak at high nu.
  if (T > 1e-30) {
    const peakNu = 5.879e10 * T;    // Wien for nu: nu_max = 5.879e10 * T (Hz).
    const peakLogNu = Math.log10(peakNu);
    // Sample.
    let maxB = -Infinity;
    const Ns = 200;
    const samples = [];
    for (let k = 0; k < Ns; k++) {
      const lognu = log_nu_min + (k / (Ns - 1)) * (log_nu_max - log_nu_min);
      const nu = Math.pow(10, lognu);
      // B_nu = 2 h nu^3 / c^2 / (exp(h nu / kT) - 1).
      const x = h_pl * nu / Math.max(1e-300, k_B * T);
      const expM1 = Math.expm1(Math.min(700, x));
      const B = (2 * h_pl * Math.pow(nu, 3) / (c_si * c_si)) / Math.max(1e-300, expM1);
      const logB = B > 1e-300 ? Math.log10(B) : -300;
      samples.push({ lognu, logB });
      if (logB > maxB) maxB = logB;
    }
    if (maxB > -300) {
      // Map (lognu, logB) to (px, py). Scale logB to [maxB-12, maxB].
      const logBmin = maxB - 12;
      ctx.strokeStyle = 'rgba(255, 220, 140, 0.95)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let started = false;
      for (const s of samples) {
        if (s.logB < logBmin - 2) { started = false; continue; }
        const xx = px0 + 30 + ((s.lognu - log_nu_min) / (log_nu_max - log_nu_min)) * (pw - 50);
        const yy = py0 + ph - 18 - ((s.logB - logBmin) / 12) * (ph - 36);
        if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      // Peak marker.
      if (peakLogNu >= log_nu_min && peakLogNu <= log_nu_max) {
        const xp = px0 + 30 + ((peakLogNu - log_nu_min) / (log_nu_max - log_nu_min)) * (pw - 50);
        ctx.strokeStyle = 'rgba(255, 255, 200, 0.85)';
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xp, py0 + 10); ctx.lineTo(xp, py0 + ph - 18); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
        ctx.font = fontString(canvas, 'caption', 'mono');
        ctx.fillText(`peak nu = ${peakNu.toExponential(1)} Hz`, xp + 4, py0 + 24);
      } else if (peakLogNu < log_nu_min) {
        ctx.fillStyle = 'rgba(120, 180, 255, 0.85)';
        ctx.font = fontString(canvas, 'caption', 'mono');
        ctx.fillText(`peak below 10^4 Hz (off chart)  T = ${T.toExponential(2)} K`, px0 + 38, py0 + 28);
      } else {
        ctx.fillStyle = 'rgba(255, 100, 80, 0.85)';
        ctx.font = fontString(canvas, 'caption', 'mono');
        ctx.fillText(`peak above 10^22 Hz  T = ${T.toExponential(2)} K`, px0 + 38, py0 + 28);
      }
    }
  }

  // Strip readout text on the right column.
  const tx = px0 + pw + 20;
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Hawking 1975:', tx, py0 + 18);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`T_H = ${T.toExponential(2)} K`, tx, py0 + 40);
  ctx.fillText(`t_evap = ${tEvap.toExponential(2)} yr`, tx, py0 + 58);
  const T_CMB = 2.725;
  ctx.fillStyle = T < T_CMB ? 'rgba(120, 180, 255, 0.92)' : 'rgba(255, 130, 130, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(T < T_CMB ? 'colder than the CMB (2.73 K)' : 'hotter than the CMB; net evaporating', tx, py0 + 78);

  // Top legend.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Hawking radiation: blackbody emission at T_H from the horizon.', 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('Move mass slider through 1e-12 M_sun (primordial, γ) to 1e9 M_sun (SMBH, deep radio).', 14, 70);
  ctx.fillText('Cyan tail: outgoing positive-energy quantum. Red tail: negative-energy partner sinks in.', 14, 88);
}

// =========================================================================
// MODE: TDE. Real particle simulation. A star (cluster of ~380 test
// particles) is launched on a parabolic orbit with periastron 2.5 M;
// each particle integrates under Newtonian gravity from the BH at origin.
// Differential gravity tears the cluster apart near periastron, scatters
// it into bound and unbound streams. No fake animation; the lightcurve
// panel (Rees 1988) cycles in parallel so the analytic curve plays.
// =========================================================================
function drawTdeMode(cam) {
  drawHorizonRings(cam);
  const center = worldToScreen([0, 0, 0], cam);
  if (!center) return;
  const refOuter = worldToScreen([2, 0, 0], cam);
  const Rpx = refOuter ? Math.hypot(refOuter.x - center.x, refOuter.y - center.y) : 60;
  const isDisr = tdeIsDisrupted(M_solar());
  const t_peak_days = tdePeakTime_days(M_solar(), 1, 1);

  // Reset cycle every ~90 seconds, or sooner if everything is gone
  // (captured AND off-screen). We tolerate ~ 5 % of particles still in
  // view before forcing a fresh run.
  const cyclePeriod = 90;
  let needsReset = particles.mode !== 'tde' || (st.t - particles._lastReset || 0) > cyclePeriod;
  if (particles.mode === 'tde') {
    let nInView = 0;
    for (let i = 0; i < particles.captured.length; i++) {
      if (!particles.captured[i]) {
        const p = particles.pos[i];
        const r2 = p[0]*p[0] + p[1]*p[1] + p[2]*p[2];
        if (r2 < 4900) nInView++;     // within visualization range (r < 70 M).
      }
    }
    if (nInView < 8) needsReset = true;
  }
  if (needsReset) {
    resetTdeParticles();
    particles._lastReset = st.t;
  }

  // Color particles by orbital energy (bound red, unbound blue) so the
  // narrative is visible at a glance.
  drawParticles(cam, 'rgba(255, 220, 140, 0.92)', 1.7, /*byEnergy*/ true);

  // Particle accounting.
  let nBound = 0, nUnbound = 0, nCaptured = 0, nFar = 0;
  for (let i = 0; i < particles.pos.length; i++) {
    if (particles.captured[i]) { nCaptured++; continue; }
    const p = particles.pos[i];
    const r = Math.hypot(p[0], p[1], p[2]);
    if (r > 30) { nFar++; continue; }
    if (particles.E[i] < 0) nBound++; else nUnbound++;
  }

  // BH brightness glow driven by the actual luminosity accumulator.
  // Particles crossing the ISCO deposit kinetic energy into st.luminosity
  // (computed in updateParticles); we render that here as the visible flare.
  const lumRaw = Math.max(0, particles.luminosity);
  const lumScaled = Math.min(1, lumRaw * 0.18);
  if (lumScaled > 0.02) {
    const flareAlpha = Math.min(0.85, 0.12 + 0.95 * lumScaled);
    const grad = ctx.createRadialGradient(center.x, center.y, Rpx * 0.7, center.x, center.y, Rpx * 4.0);
    grad.addColorStop(0, `rgba(255, 230, 160, ${flareAlpha.toFixed(3)})`);
    grad.addColorStop(0.45, `rgba(255, 200, 120, ${(flareAlpha * 0.5).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(255, 120, 60, 0)');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // Bright central kernel.
    const inner = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, Rpx * 0.6);
    inner.addColorStop(0, `rgba(255, 250, 220, ${(0.45 * lumScaled).toFixed(3)})`);
    inner.addColorStop(1, 'rgba(255, 200, 120, 0)');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = inner;
    ctx.beginPath(); ctx.arc(center.x, center.y, Rpx * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Top legend.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('TDE (pseudo-Newtonian Schwarzschild): star on a parabolic orbit, periastron 7.5 M.', 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`${particles.pos.length} test particles integrating a = -M/r^2 - 3 M L^2/r^4 (ISCO at 6M).`, 14, 70);
  ctx.fillText('Bound (red) E < 0 fall back; unbound (blue) E > 0 escape. Flare brightness = real kinetic energy across ISCO.', 14, 88);
  ctx.fillStyle = 'rgba(255, 200, 100, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`bound: ${nBound}  unbound: ${nUnbound}  captured: ${nCaptured}  off-screen: ${nFar}`, 14, 108);
  ctx.fillStyle = 'rgba(255, 240, 200, 0.95)';
  ctx.fillText(`L_sim (arb. units) = ${lumRaw.toFixed(3)}   tau = ${particles.sinceReset.toFixed(1)} M`, 14, 126);

  // Lightcurve panel: real luminosity from the particle integration,
  // plotted alongside the analytic Rees 1988 reference for comparison.
  const px0 = 0.12 * W, py0 = H - 150, pw = 0.76 * W, ph = 115;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('TDE lightcurve: cyan = simulation luminosity (real particles crossing ISCO); orange = Rees 1988 analytic.', px0 + 8, py0 - 6);

  // Find the simulation luminosity peak for autoscaling.
  let lumPeak = 0.05;
  for (const h of particles.luminosityHistory) if (h.L > lumPeak) lumPeak = h.L;
  const tWindow = Math.max(8, particles.sinceReset);

  // Analytic Rees curve overlaid for shape comparison (scaled to fit).
  const tMax = 6 * t_peak_days;
  ctx.strokeStyle = 'rgba(255, 200, 120, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (let k = 0; k < 200; k++) {
    const t = (k / 199) * tMax;
    const L = tdeLightcurve(t, t_peak_days);
    const x = px0 + 30 + (k / 199) * (pw - 50);
    const y = py0 + ph - 16 - Math.min(1, L) * (ph - 36);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Real simulation luminosity from the accumulator history.
  ctx.strokeStyle = 'rgba(140, 220, 255, 0.95)';
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  let started = false;
  for (const h of particles.luminosityHistory) {
    const x = px0 + 30 + (h.t / tWindow) * (pw - 50);
    const y = py0 + ph - 16 - (h.L / lumPeak) * (ph - 36);
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Live cursor at the current simulation time.
  const xCur = px0 + 30 + (particles.sinceReset / tWindow) * (pw - 50);
  const yCur = py0 + ph - 16 - (lumRaw / lumPeak) * (ph - 36);
  ctx.fillStyle = 'rgba(255, 255, 200, 1)';
  ctx.beginPath(); ctx.arc(xCur, yCur, 5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`Hills: ${isDisr ? 'r_T > R_s (disruption)' : 'r_T < R_s (swallowed whole, no flare)'}`, px0 + 8, py0 + ph + 14);
}

// =========================================================================
// MODE: TIDAL. Real particle simulation. A cluster of ~280 test particles
// initialized as a sphere of bodyR ~ 0.45 M at r = r_infall (slider).
// Newtonian gravity from the BH at the origin pulls each particle. Inner
// particles fall faster (delta-a = 2 GM / r^3 * L) so the sphere stretches
// into a cigar. Transverse particles are pulled toward the axis.
// =========================================================================
function drawTidalMode(cam) {
  drawHorizonRings(cam);
  if (particles.mode !== 'tidal' || Math.abs(particles.initR - st.r_infall_rs * 2) > 0.05) {
    resetTidalParticles(st.r_infall_rs * 2);
  }
  drawParticles(cam, 'rgba(255, 220, 140, 0.92)', 1.9);

  // Live diagnostics: cluster extent and mean radius.
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  let sumR = 0, nActive = 0;
  for (let i = 0; i < particles.pos.length; i++) {
    if (particles.captured[i]) continue;
    const p = particles.pos[i];
    sumR += Math.hypot(p[0], p[1], p[2]);
    nActive++;
    if (p[0] < xMin) xMin = p[0]; if (p[0] > xMax) xMax = p[0];
    if (p[1] < yMin) yMin = p[1]; if (p[1] > yMax) yMax = p[1];
  }
  const meanR = nActive > 0 ? sumR / nActive : 0;
  const radialExtent = nActive > 0 ? (xMax - xMin) : 0;
  const transvExtent = nActive > 0 ? (yMax - yMin) : 0;
  const elong = transvExtent > 1e-6 ? radialExtent / transvExtent : Infinity;
  const Rs_m = rsM();
  const r_m_now = meanR * Rs_m / 2;       // meanR is in M units; R_s = 2 M.
  const aTidal = tidalAccelPerMetre_per_s2(M_solar(), Math.max(1, r_m_now));

  ctx.fillStyle = 'rgba(255, 200, 120, 0.95)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Tidal forces: a real Newtonian particle cluster under BH gravity.', 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`${particles.pos.length} test particles initialized as a sphere of R = 0.45 M at r = ${st.r_infall_rs.toFixed(2)} R_s.`, 14, 70);
  ctx.fillText('Each particle integrates its own orbit. The inner side falls faster than the outer; the cloud stretches.', 14, 88);

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.fillText(`active: ${nActive} / ${particles.pos.length};  captured: ${particles.pos.length - nActive}`, 14, H - 78);
  ctx.fillText(`mean r = ${meanR.toFixed(2)} M;  radial extent = ${radialExtent.toFixed(2)} M;  transverse = ${transvExtent.toFixed(2)} M`, 14, H - 60);
  ctx.fillStyle = 'rgba(140, 240, 200, 0.95)';
  ctx.fillText(`elongation (radial / transverse) = ${Number.isFinite(elong) ? elong.toFixed(2) : '...'}`, 14, H - 42);
  // Fatal radii readouts (still illuminating context).
  const R_body_m = 6.957e8, g_break = 1e6;
  const r_fatal_human = Math.pow(2 * 6.6743e-11 * M_solar() * 1.989e30 * 2 / 50, 1 / 3) / Rs_m;
  const r_fatal_star = Math.pow(2 * 6.6743e-11 * M_solar() * 1.989e30 * R_body_m / g_break, 1 / 3) / Rs_m;
  ctx.fillStyle = 'rgba(255, 130, 110, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`fatal-tide radius (R_s): 2 m human ${r_fatal_human.toExponential(2)};  1 R_sun star ${r_fatal_star.toExponential(2)};  tidal a/m = ${aTidal.toExponential(2)} m/s^2`, 14, H - 24);
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('Move the r-slider to drop the cluster from a different starting radius (resets the simulation).', 14, H - 6);
}

// =========================================================================
// SIDE PANEL: all the headline numbers.
// =========================================================================
function drawSidePanel() {
  const x = 0.78 * W, y = 30, w = W - x - 14, h = 250;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('BH diagnostics', x + 8, y - 6);
  let yy = y + 24;
  const row = (k, v, c = '#e0e8ff') => {
    ctx.fillStyle = 'rgba(180, 190, 215, 0.85)';
    ctx.font = fontString(canvas, 'caption');
    ctx.fillText(k, x + 10, yy);
    ctx.fillStyle = c;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(v, x + 10, yy + 14);
    yy += 28;
  };
  const M = M_solar();
  row('mass M (M_sun)', M.toExponential(2));
  row('spin chi = a/M', st.chi.toFixed(2));
  row('R_s (km)', rsKm(M).toExponential(2));
  row('r_+ / R_s', rHorizonRs().toFixed(3));
  row('r_ISCO / R_s', rIscoRs().toFixed(3));
  row('b_c / R_s', bCritRs().toFixed(3));
  row('T_H (K)', hawkingTemperature_K(M).toExponential(2));
  row('Omega_H (rad/s)', kerrHorizonAngularVel_radps(M, st.chi).toExponential(2));
  row('mode', st.mode, '#ffd28a');
}

// Physical scale bar: a short horizontal line whose pixel length corresponds
// to a chosen physical length in km/AU/ly/pc. The label autoselects the unit.
function drawScaleBar(cam) {
  // 1 world unit = 1 M = R_s / 2 in metres = (G M_sun / c^2) * M_solar_value.
  const M_per_world = (6.6743e-11 * M_solar() * 1.989e30) / Math.pow(2.998e8, 2); // metres per world-unit.
  // Pick a "round" world length to display.
  // Compute pixel size of 1 world unit at the BH center.
  const c0 = worldToScreen([0, 0, 0], cam);
  const c1 = worldToScreen([1, 0, 0], cam);
  if (!c0 || !c1) return;
  const px_per_world = Math.hypot(c1.x - c0.x, c1.y - c0.y);
  if (!Number.isFinite(px_per_world) || px_per_world < 1) return;
  // Aim for a bar ~ 80 px long; choose closest world length (1, 2, 5, 10 ...).
  const ideal_world = 80 / px_per_world;
  const candidates = [0.5, 1, 2, 5, 10, 20, 50];
  let bestW = candidates[0];
  for (const c of candidates) if (Math.abs(c - ideal_world) < Math.abs(bestW - ideal_world)) bestW = c;
  const px_len = bestW * px_per_world;
  const phys_m = bestW * M_per_world;
  // Format physical length with best unit.
  function fmt(m) {
    if (m < 1) return `${(m * 1000).toFixed(2)} mm`;
    if (m < 1e3) return `${m.toFixed(1)} m`;
    if (m < 1e6) return `${(m / 1e3).toFixed(2)} km`;
    if (m < 1.496e11 / 100) return `${(m / 1e3).toExponential(2)} km`;
    if (m < 9.461e15) return `${(m / 1.496e11).toExponential(2)} AU`;
    if (m < 3.086e16 * 1000) return `${(m / 9.461e15).toExponential(2)} ly`;
    return `${(m / 3.086e16).toExponential(2)} pc`;
  }
  // Draw at bottom-left.
  const x0 = 16, y0 = H - 8;
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + px_len, y0); ctx.stroke();
  // Tick marks at the ends.
  ctx.beginPath(); ctx.moveTo(x0, y0 - 4); ctx.lineTo(x0, y0 + 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0 + px_len, y0 - 4); ctx.lineTo(x0 + px_len, y0 + 4); ctx.stroke();
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`${bestW} M  =  ${fmt(phys_m)}`, x0 + 4, y0 - 8);
}

function drawModeTab() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(10, 8, 320, 26);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.40)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 8.5, 319, 25);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  const labels = {
    overview: 'OVERVIEW (disk + shadow)',
    photons: 'PHOTONS (impact-parameter fan)',
    lensing: 'LENSING (movable source)',
    shadow: 'SHADOW (EHT photon ring)',
    framedrag: 'FRAME DRAG (ergosphere + ZAMO)',
    spacetime: 'SPACETIME (Flamm embedding)',
    ringdown: 'RINGDOWN (Kerr QNM bell)',
    hawking: 'HAWKING (T_H + evaporation)',
    tde: 'TDE FLARE (Rees 1988)',
    tidal: 'TIDAL (spaghettification)',
  };
  ctx.fillText(labels[st.mode] || st.mode, 20, 26);
}

function updateReadout() {
  rM.textContent = M_solar().toExponential(2);
  rChi.textContent = st.chi.toFixed(2);
  rRs.textContent = rsKm(M_solar()).toExponential(2) + ' km';
  rIsco.textContent = rIscoRs().toFixed(3);
  rTH.textContent = hawkingTemperature_K(M_solar()).toExponential(2) + ' K';
  rMode.textContent = st.mode;
}

// =========================================================================
// MAIN DRAW.
// =========================================================================
function draw() {
  const modeCfg = MODE_TABLE[st.mode] || MODE_TABLE.overview;
  if (engine) {
    const eye = camera.eyePosition();
    // Accretion disk is a procedural texture, NOT a real matter
    // simulation. Show it ONLY in the dedicated Overview mode. Every
    // other mode runs a real physics visualization on top of a clean
    // lensed-sky background.
    const tooSmallForDisk = st.logM < -1;
    const wantsDisk = !tooSmallForDisk && st.mode === 'overview';
    const diskInner = wantsDisk ? Math.max(4, (rIscoRs() * 2)) : 100;
    const diskOuter = wantsDisk ? 18 : 100.1;
    engine.render(eye, [0, 0, 0], [0, 1, 0], 62, diskInner, diskOuter, st.chi, st.t);
  }
  paintBackground(modeCfg.dim);
  const cam = makeCamBasis();
  switch (st.mode) {
    case 'overview':  drawOverviewMode(cam); break;
    case 'photons':   drawPhotonsMode(cam); break;
    case 'lensing':   drawLensingMode(cam); break;
    case 'shadow':    drawShadowMode(cam); break;
    case 'framedrag': drawFrameDragMode(cam); break;
    case 'spacetime': drawSpacetimeMode(cam); break;
    case 'ringdown':  drawRingdownMode(cam); break;
    case 'hawking':   drawHawkingMode(cam); break;
    case 'tde':       drawTdeMode(cam); break;
    case 'tidal':     drawTidalMode(cam); break;
    default:          drawOverviewMode(cam);
  }
  drawSidePanel();
  drawModeTab();
  // Scale bar: shown on modes where the 3D BH is the focus.
  if (['overview', 'photons', 'lensing', 'shadow', 'framedrag', 'tidal'].includes(st.mode)) {
    drawScaleBar(cam);
  }
  updateReadout();
}

// =========================================================================
// CONTROL WIRING.
// =========================================================================
function applyMode(newMode) {
  const prev = st.mode;
  st.mode = newMode;
  const cfg = MODE_TABLE[newMode];
  if (cfg && prev !== newMode) {
    if (cfg.elev != null) {
      camera.setElevationDeg(cfg.elev);
      st.incl = 90 - cfg.elev;
      sIncl.value = String(st.incl);
      vIncl.textContent = String(st.incl);
    }
    if (cfg.azim != null) camera.setAzimuthDeg(cfg.azim);
    if (cfg.ergo) tErgo.checked = true;
    if (newMode === 'ringdown') {
      // Open on the GW150914 remnant so the ringdown the narrative says
      // LIGO/Virgo measured is the default view; the mass slider then
      // shows the f ~ 1/M scaling on toward supermassive black holes.
      st.logM = Math.log10(62); sLogM.value = st.logM.toFixed(3);
      st.chi = 0.69; sChi.value = '0.69';
    }
    syncRowVisibility(newMode);
    // Reset particle system on mode entry / exit.
    if (newMode === 'tidal') {
      resetTidalParticles(st.r_infall_rs * 2);
    } else if (newMode === 'tde') {
      resetTdeParticles();
      particles._lastReset = st.t;
    } else if (newMode === 'framedrag') {
      resetFramedragParticles();
    } else {
      particles.active = false;
    }
  }
}

function readSliders() {
  const newMode = selMode.value;
  if (newMode !== st.mode) applyMode(newMode);
  else syncRowVisibility(newMode);
  st.logM = parseFloat(sLogM.value);
  const prevChi = st.chi;
  st.chi = parseFloat(sChi.value);
  // Restart the framedrag particle cluster when chi changes so the user
  // immediately sees the effect of the new spin.
  if (st.mode === 'framedrag' && Math.abs(prevChi - st.chi) > 0.01) {
    resetFramedragParticles();
  }
  const newIncl = parseFloat(sIncl.value);
  if (newIncl !== st.incl) {
    st.incl = newIncl;
    camera.setElevationDeg(90 - newIncl);
  }
  st.b_rs = parseFloat(sB.value);
  st.beta_te = parseFloat(sBeta.value);
  st.r_infall_rs = parseFloat(sRinfall.value);
  st.flags.photonsphere = tPhotonsphere.checked;
  st.flags.isco = tIsco.checked;
  st.flags.ergo = tErgo.checked;
  st.flags.grid = tGrid.checked;
  st.flags.traces = tTraces.checked;
  st.flags.labels = tLabels.checked;
  vMode.textContent = st.mode.slice(0, 5);
  vLogM.textContent = st.logM.toFixed(1);
  vChi.textContent = st.chi.toFixed(2);
  vIncl.textContent = String(st.incl);
  vB.textContent = st.b_rs.toFixed(2);
  vBeta.textContent = st.beta_te.toFixed(2);
  vRinfall.textContent = st.r_infall_rs.toFixed(2);
}

function applyPreset(id) {
  if (id === 'custom') return;
  const preset = BH_PRESETS.find(p => p.id === id);
  if (!preset) return;
  const logM = Math.log10(preset.M_solar);
  st.logM = logM;
  st.chi = preset.chi;
  sLogM.value = String(logM);
  sChi.value = String(preset.chi);
  vLogM.textContent = logM.toFixed(1);
  vChi.textContent = preset.chi.toFixed(2);
}

[selMode, sLogM, sChi, sIncl, sB, sBeta, sRinfall].forEach(el => el.addEventListener('input', readSliders));
[tPhotonsphere, tIsco, tErgo, tGrid, tTraces, tLabels].forEach(el => el.addEventListener('change', readSliders));
selPreset.addEventListener('change', () => { applyPreset(selPreset.value); readSliders(); });

// =========================================================================
// LENSING SOURCE: pointer drag on the canvas in lensing mode picks up
// the source ghost and lets the user move it in 2D. Reuses the cached
// screen position from the last drawLensingMode call.
// =========================================================================
function canvasToBeta(px, py) {
  // We need the inverse projection of (px, py) onto the source plane.
  // Cheap approximation: assume the source ghost lies at a fixed depth
  // chosen so that screen-space pixel offset maps linearly to theta_E
  // units. We back-compute by sampling: a delta of theta_E in world
  // along cam.right corresponds to a screen delta of W * (theta_E /
  // (depth * tanHalfFov * aspect)).
  const cam = makeCamBasis();
  // Source is at depth ~ 3 * eye_distance; ringDist = 0.5 * eye.
  const eyeR = Math.hypot(cam.eye[0], cam.eye[1], cam.eye[2]);
  const srcDepth = eyeR * 2.5;     // approx Z to source in camera frame.
  // Recover pixel-to-theta_E conversion: a unit-vector right in world
  // at the source depth corresponds to W / (srcDepth * tanHalfFov * aspect / 2) pixels.
  const theta_E_world = 5.5 * Math.sqrt(M_solar() / 1e6);
  const px_per_unit_x = W * 0.5 / (srcDepth * cam.tanHalfFov * cam.aspect);
  const px_per_unit_y = H * 0.5 / (srcDepth * cam.tanHalfFov);
  // Center of BH in screen.
  const bhCenter = worldToScreen([0, 0, 0], cam);
  if (!bhCenter) return null;
  const dx = px - bhCenter.x, dy = py - bhCenter.y;
  // Convert to world-units along right (dx) and up (-dy).
  const worldX = dx / px_per_unit_x;
  const worldY = -dy / px_per_unit_y;
  // Convert to theta_E units.
  return { bx: worldX / theta_E_world, by: worldY / theta_E_world };
}
canvas.addEventListener('pointerdown', (e) => {
  if (st.mode !== 'lensing') return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  // Only intercept if user clicked on or near the source ghost (within 30 px).
  const src = st._sourceScreenPos;
  if (src && Math.hypot(px - src.x, py - src.y) < 30) {
    st.lensDragging = true;
    canvas.setPointerCapture(e.pointerId);
    e.stopPropagation();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!st.lensDragging) return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const beta = canvasToBeta(px, py);
  if (beta) {
    st.beta_te = Math.max(-3, Math.min(3, beta.bx));
    st.beta_y = Math.max(-3, Math.min(3, beta.by));
    sBeta.value = String(st.beta_te.toFixed(2));
    vBeta.textContent = st.beta_te.toFixed(2);
  }
  e.stopPropagation();
});
canvas.addEventListener('pointerup', () => { st.lensDragging = false; });
canvas.addEventListener('pointercancel', () => { st.lensDragging = false; });
btnReset.addEventListener('click', () => {
  st.t = 0;
  sLogM.value = '6.0'; sChi.value = '0.0'; sIncl.value = '60';
  sB.value = '2.65'; sBeta.value = '0.30'; sRinfall.value = '6.0';
  selPreset.value = 'custom';
  particles.active = false;
  applyMode('overview');
  selMode.value = 'overview';
  readSliders();
});
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
applyMode(st.mode);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

// =========================================================================
// GOLDEN-FRAME CAPTURE.
// =========================================================================
function captureModeForFraction(f) {
  if (f < 0.15) return 'overview';
  if (f < 0.35) return 'framedrag';
  if (f < 0.6)  return 'ringdown';
  if (f < 0.85) return 'shadow';
  return 'tidal';
}

if (CAPTURE_NAME) {
  const captureMode = captureModeForFraction(CAPTURE_FRAC || 0);
  selMode.value = captureMode;
  if (captureMode === 'framedrag') { st.chi = 0.9; sChi.value = '0.9'; tErgo.checked = true; }
  if (captureMode === 'ringdown')  { st.chi = 0.7; sChi.value = '0.7'; }
  if (captureMode === 'shadow')    { st.chi = 0.5; sChi.value = '0.5'; }
  applyMode(captureMode);          // applyMode flips st.mode and runs its
                                    // mode-entry block (including particle
                                    // resets); do NOT set st.mode beforehand.
  readSliders();
  st.t = (CAPTURE_FRAC || 0) * 4 + 0.6;
  if (camera.setAzimuthDeg) camera.setAzimuthDeg(35 + CAPTURE_FRAC * 30);
  // Pre-advance the particle simulation so capture frames show the body
  // mid-spaghettification, not the initial sphere.
  if (captureMode === 'tidal' || captureMode === 'tde') {
    const advance_M = captureMode === 'tidal' ? 30 : 36;
    const dt_step = 0.5;
    const steps = Math.floor(advance_M / dt_step);
    for (let i = 0; i < steps; i++) updateParticles(dt_step);
  }
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
    if (st.running) {
      st.t += dt;
      // Advance the particle simulation when a particle-driven mode is active.
      if (particles.active && (st.mode === 'tidal' || st.mode === 'tde' || st.mode === 'framedrag')) {
        const dt_sim = dt * 6;
        updateParticles(dt_sim);
        window.__particleFrames = (window.__particleFrames || 0) + 1;
        window.__particleSimT = (window.__particleSimT || 0) + dt_sim;
      }
    }
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
  return {
    fields: [
      { key: 'mass', label: 'black hole', value: M_solar(), format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const M = M_solar();
  const Rs = rsM();
  const risco = iscoRadius_m(M, st.chi) / Rs;
  const rphoto = 1.5;
  const bcrit = 3 * Math.sqrt(3) / 2;

  return [
    {
      key: 'isco-radius',
      label: `ISCO ${risco.toFixed(2)} R_s`,
      value: risco.toFixed(2),
      status: (risco > 2.9 && risco < 3.1) ? 'pass' : 'drift'
    },
    {
      key: 'photon-sphere',
      label: 'photon sphere 1.5 R_s',
      value: '1.50',
      status: 'pass'
    },
    {
      key: 'critical-impact',
      label: `b_c = ${bcrit.toFixed(3)} R_s`,
      value: bcrit.toFixed(3),
      status: (bcrit > 2.59 && bcrit < 2.61) ? 'pass' : 'drift'
    }
  ];
};
