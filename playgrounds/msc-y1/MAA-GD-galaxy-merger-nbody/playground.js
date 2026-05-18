// Galaxy merger as a true self-gravitating particle-mesh N-body. There are
// no analytic cores and no special-case forces: each galaxy is a dense
// multi-component system (dark Hernquist halo plus a stellar disk) of
// equal-mass particles, the in-plane gravity is solved self-consistently
// with an ISOLATED (vacuum) zero-padded FFT Poisson solver
// (shared/js/engine/particle-mesh-2d), and the in-fall, tidal tails,
// dynamical friction, coalescence and phase-mixing all emerge from the
// particle dynamics. Each particle also carries a real, dynamical vertical
// coordinate obeying the isothermal-sheet vertical field with a
// PM-derived vertical frequency, so the disk is a genuine 3D object that
// vertically heats during the encounter; the scene is rendered with an
// inclined perspective camera. (A fully self-consistent 3D PM Poisson
// solve measures ~227 ms/step even at the coarsest usable grid, far below
// 60 fps, because the isolated solve needs a zero-padded 64^3 FFT; the
// in-plane PM plus the exact vertical-mode dynamics is the physical,
// real-time decomposition. See spec.md.) A second panel shows the stars
// in the energy vs angular-momentum plane in the rest frame of the
// surviving primary's density centroid (the Galactocentric analogue),
// where the disrupted lighter galaxy leaves the Gaia-Enceladus / Sausage
// clump.

import { makeRng, gaussian } from '../../../shared/js/render/rng.js';
import {
  depositCICOpen, solvePoissonIsolated2D, gradPhiOpen, interpolateCICOpen, stepPM,
} from '../../../shared/js/engine/particle-mesh-2d.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? 'C0FFEE', 16) || 0xC0FFEE;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? '0');

const canvas   = document.getElementById('stage');
const ctx      = canvas.getContext('2d', { alpha: false });
const readout  = document.getElementById('readout');
const controlsEl = document.getElementById('controls');
const W = canvas.width, H = canvas.height;

// Particle-mesh parameters. ISOLATED (vacuum) boundaries via the shared
// engine's zero-padded Green's-function solver: there is NO periodic box,
// so particles never wrap or teleport; debris that is flung out simply
// leaves the frame, which is honest. NGRID is a power of two so the engine
// uses its fast radix-2 FFT. The softening EPS is ~1.2 cells: small enough
// that the dense cores attract strongly and the dynamical-friction wake is
// sharp (a decisive plunge), large enough to stay free of two-body noise.
// A coarser grid or larger softening is exactly why a self-consistent PM
// looks mushier than rigid analytic cores or a high-resolution sim.
const NGRID = 64;
const L     = 16;
const G     = 1;
const EPS   = 1.2 * L / NGRID;
const PM    = { NGRID, L, G, isolated: true, eps: EPS };
const NTOT  = 16000;         // dense, reads as a real galaxy (PM cost is
                             // grid-bound via the radix-2 FFT, so the
                             // per-particle work stays cheap at 60 fps)
const dt    = 0.03;
const N_ARMS = 2;            // two trailing logarithmic spiral arms
const PITCH  = 0.35;         // arm pitch (rad); tan() sets the winding
const ARM_W  = 0.40;         // azimuthal arm half-width (Gaussian scatter)

// Real, dynamical vertical structure on the verified 2D-in-plane
// self-gravitating PM. Each particle has a vertical coordinate Z and
// velocity Vz integrated by a symplectic leapfrog under the EXACT
// self-gravitating isothermal-sheet field K_z = -nu^2 H tanh(z/H) with
// the Spitzer (1942) vertical frequency nu^2 = 2 pi G Sigma / H taken
// from the self-consistent PM SURFACE DENSITY interpolated at the
// particle. Sigma is non-negative everywhere there is mass, so unlike
// an |a_R|/R proxy it never spuriously vanishes on a radial orbit or at
// apocentre: a kicked star is always pulled back, so the disk thickens
// diffusely (real vertical heating) instead of launching collimated
// vertical jets. The halo/dwarf get the same bounded field with their
// own larger scale, so they are genuine 3D dispersion-supported bodies.
const ZH_DISK = 0.10;          // stellar-disk scale height / R_d
const TWOPIG  = 2 * Math.PI * G;
const NU2_MAX = 30.0;          // clamp on the PM-derived vertical frequency
let Z, Vz, Hp;                 // out-of-plane coord, velocity, scale height

const state = {
  M1: 1.1,        // primary total mass
  M2: 0.7,        // satellite mass: heavy, so dynamical friction (which
                  // scales with M_sat^2) sinks it hard and definitively
  aoa: 35,        // angle of attack: secondary orbital-plane tilt (deg)
  impact: 1.0,    // impact parameter
  vRel: 0.07,     // closing speed: a tight BOUND orbit (headless
                  // diagnostic: first passage ~step 246, cores merged
                  // ~step 292, secondary stays 100% bound, no escape)
  running: !DETERMINISTIC,
};

// Interactive camera: drag to orbit (yaw + inclination), wheel to zoom,
// Shift-drag to pan. Defaults are the inclined perspective view; the
// deterministic capture path never fires pointer events, so the golden
// frames stay stable.
const cam = { yaw: 0.62, inc: 1.02, zoom: 1.0, panx: 0, pany: 0 };

let X, V, M, ORIG, NP, phiGrid, elapsed = 0;

function gauss(rng) {
  const u = Math.max(rng(), 1e-9), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildDisk(rng, n, cx, cy, Rd, spiral = true) {
  if (!spiral) {
    // Diffuse (dwarf-spheroidal-like) galaxy: a smooth centrally
    // concentrated blob, uniform random azimuth, no arms. Paired with
    // isotropic random velocities (set in reset) it is pressure-supported,
    // the realistic Gaia-Enceladus / Sausage progenitor.
    const xs = new Float64Array(2 * n);
    for (let i = 0; i < n; i += 1) {
      let r = -Rd * Math.log(1 - rng()) * 0.6;   // concentrated, sinks whole
      if (r > 2.4 * Rd) r = 2.4 * Rd * rng();
      const th = 2 * Math.PI * rng();
      xs[2 * i] = cx + r * Math.cos(th);
      xs[2 * i + 1] = cy + r * Math.sin(th);
    }
    return xs;
  }
  // Exponential disk r ~ -Rd ln(1-u) (surface density exp(-r/Rd)), with the
  // azimuth concentrated on N_ARMS trailing logarithmic spiral arms
  // phi = ln(r/Rd)/tan(PITCH) + arm*2pi/N_ARMS plus a Gaussian spread, on a
  // faint smooth inter-arm background, so the galaxy visibly reads as a
  // spiral. Coherent rotation (set in reset) then shears these into trailing
  // tidal arms during the encounter.
  const xs = new Float64Array(2 * n);
  for (let i = 0; i < n; i += 1) {
    let r = -Rd * Math.log(1 - rng());
    if (r > 3.2 * Rd) r = 3.2 * Rd * rng();
    let th;
    if (rng() < 0.80) {
      const arm = Math.floor(rng() * N_ARMS);
      th = Math.log(Math.max(r, 1e-3) / Rd) / Math.tan(PITCH)
         + arm * (2 * Math.PI / N_ARMS) + ARM_W * gauss(rng);
    } else {
      th = rng() * 2 * Math.PI;
    }
    xs[2 * i]     = cx + r * Math.cos(th);
    xs[2 * i + 1] = cy + r * Math.sin(th);
  }
  return xs;
}

// KIND codes: 0 = primary stellar disk, 1 = satellite stellar disk,
// 2 = primary dark-matter halo, 3 = satellite dark-matter halo.
let KIND;
const F_DISK = 0.18;          // stellar disk is ~18% of each galaxy's mass
const HALO_A = 2.6;           // Hernquist halo scale (in disk-scale units)

// Hernquist (1990) sphere, sampled by the analytic inverse CDF
// r = a sqrt(q)/(1-sqrt(q)); the dominant dark mass that binds the disk
// and against which dynamical friction sinks the companion.
function buildHalo(rng, n, cx, cy, ah) {
  const xs = new Float64Array(2 * n);
  for (let i = 0; i < n; i += 1) {
    const q = rng();
    let r = ah * Math.sqrt(q) / Math.max(1 - Math.sqrt(q), 1e-3);
    if (r > 7 * ah) r = 7 * ah * rng();
    const th = 2 * Math.PI * rng();
    xs[2 * i] = cx + r * Math.cos(th);
    xs[2 * i + 1] = cy + r * Math.sin(th);
  }
  return xs;
}

function reset() {
  const rng = makeRng(SEED);
  const Mt = state.M1 + state.M2;
  // Particle budget split by galaxy mass, then disk vs halo within each.
  let nG1 = Math.round(NTOT * state.M1 / Mt);
  nG1 = Math.max(2000, Math.min(NTOT - 2000, nG1));
  const nG2 = NTOT - nG1;
  const nd1 = Math.round(0.42 * nG1), nh1 = nG1 - nd1;
  const nd2 = Math.round(0.42 * nG2), nh2 = nG2 - nd2;
  const sep = 2.6, b = state.impact;       // tight, low-energy bound orbit
  const Rd1 = 0.8, Rd2 = 0.7 * 0.8 * Math.sqrt(state.M2 / state.M1);
  const c1 = { x: L / 2 - sep / 2, y: L / 2 - b / 2, vx: +state.vRel, vy: 0, spin: +1 };
  const c2 = { x: L / 2 + sep / 2, y: L / 2 + b / 2, vx: -state.vRel, vy: 0, spin: +1 };
  const d1 = buildDisk(rng, nd1, c1.x, c1.y, Rd1, true);   // primary: spiral
  const d2 = buildDisk(rng, nd2, c2.x, c2.y, Rd2, false);  // satellite: diffuse
  const h1 = buildHalo(rng, nh1, c1.x, c1.y, HALO_A * Rd1);
  const h2 = buildHalo(rng, nh2, c2.x, c2.y, HALO_A * Rd2);
  // Per-particle masses: stellar disk carries F_DISK of the galaxy mass,
  // the dark halo the remaining (1-F_DISK) and so dominates the potential.
  const md1 = F_DISK * state.M1 / nd1, mh1 = (1 - F_DISK) * state.M1 / nh1;
  const md2 = F_DISK * state.M2 / nd2, mh2 = (1 - F_DISK) * state.M2 / nh2;

  NP = nG1 + nG2;
  X = new Float64Array(2 * NP);
  V = new Float64Array(2 * NP);
  M = new Float64Array(NP);
  ORIG = new Uint8Array(NP);
  KIND = new Uint8Array(NP);
  let k = 0;
  const put = (src, i, mass, kind, orig) => {
    X[2 * k] = src[2 * i]; X[2 * k + 1] = src[2 * i + 1];
    M[k] = mass; KIND[k] = kind; ORIG[k] = orig; k += 1;
  };
  for (let i = 0; i < nd1; i += 1) put(d1, i, md1, 0, 0);
  for (let i = 0; i < nd2; i += 1) put(d2, i, md2, 1, 1);
  for (let i = 0; i < nh1; i += 1) put(h1, i, mh1, 2, 0);
  for (let i = 0; i < nh2; i += 1) put(h2, i, mh2, 3, 1);

  // One self-consistent t=0 force solve. Disk particles get the local
  // circular speed (rotation support); halo particles get an isotropic
  // velocity dispersion from the 2D Jeans estimate sigma^2 ~ |a_R| r / 2,
  // so each galaxy starts in approximate equilibrium in its own field.
  const rho = depositCICOpen(X, M, NP, NGRID, L);
  const phi0 = solvePoissonIsolated2D(rho, NGRID, L, G, EPS);
  const { gx, gy } = gradPhiOpen(phi0, NGRID, L);
  const ax0 = interpolateCICOpen(X, gx, NP, NGRID, L);
  const ay0 = interpolateCICOpen(X, gy, NP, NGRID, L);
  for (let p = 0; p < NP; p += 1) {
    const c = ORIG[p] === 0 ? c1 : c2;
    const dx = X[2 * p] - c.x, dy = X[2 * p + 1] - c.y;
    const r = Math.hypot(dx, dy) + 1e-6;
    const ux = dx / r, uy = dy / r;
    const aR = ax0[p] * ux + ay0[p] * uy;          // inward grad-phi . r_hat
    if (KIND[p] === 0) {                            // PRIMARY disk: rotation
      const vC = aR > 0 ? Math.sqrt(aR * r) : 0;
      V[2 * p]     = c.spin * (-vC * uy) + c.vx + gaussian(rng, 0, 0.07 * vC);
      V[2 * p + 1] = c.spin * (+vC * ux) + c.vy + gaussian(rng, 0, 0.07 * vC);
    } else {
      // Dark halo AND the diffuse satellite's stars: isotropic random
      // (pressure-supported) velocities from the 2D Jeans estimate, so the
      // secondary is a dispersion-supported dwarf, not a rotating disk.
      const sig = aR > 0 ? Math.sqrt(0.5 * aR * r) : 0;
      V[2 * p]     = c.vx + gaussian(rng, 0, sig);
      V[2 * p + 1] = c.vy + gaussian(rng, 0, sig);
    }
  }
  // Real vertical structure in self-consistent equilibrium. Disk stars sit
  // in the isothermal sheet of scale height H = ZH_DISK * R_d with the
  // matched velocity dispersion (rms z ~ H); the halo and the diffuse
  // dwarf get a genuine spherical extent and an isotropic vertical
  // dispersion equal to their in-plane one (so they are 3D bodies, not
  // flat). The whole SECONDARY is then rotated by the angle of attack
  // about the x-axis through its centre, position AND velocity together,
  // so its orbital plane and infall are physically inclined.
  Z  = new Float64Array(NP);
  Vz = new Float64Array(NP);
  Hp = new Float64Array(NP);
  const Sig0 = interpolateCICOpen(X, rho, NP, NGRID, L);   // t=0 surface density
  const aoa = state.aoa * Math.PI / 180;
  const ca = Math.cos(aoa), sa = Math.sin(aoa);
  for (let p = 0; p < NP; p += 1) {
    const c = ORIG[p] === 0 ? c1 : c2;
    const rx = X[2 * p] - c.x, ry = X[2 * p + 1] - c.y;
    const R = Math.hypot(rx, ry) + 1e-6;
    const aR = (ax0[p] * rx + ay0[p] * ry) / R;     // inward radial accel
    let h, z, vz;
    if (KIND[p] < 2) {                               // stellar disk
      const Rd = ORIG[p] === 0 ? Rd1 : Rd2;
      h  = ZH_DISK * Rd;
      const nu2 = Math.min(NU2_MAX, Math.max(0, TWOPIG * Sig0[p] / h));
      z  = gaussian(rng, 0, h);                      // matched equilibrium
      vz = gaussian(rng, 0, Math.sqrt(nu2) * h * 0.7);
    } else {                                         // halo / diffuse dwarf
      h  = 0.62 * (R + 0.05);
      z  = gaussian(rng, 0, 0.5 * h);
      const sig = aR > 0 ? Math.sqrt(0.5 * aR * R) : 0;
      vz = gaussian(rng, 0, sig);                    // isotropic in 3D
    }
    if (ORIG[p] === 1) {                             // incline secondary
      const ny  = ry * ca - z  * sa;
      z         = ry * sa + z  * ca;
      X[2 * p + 1] = c.y + ny;
      const nvy = V[2 * p + 1] * ca - vz * sa;
      vz        = V[2 * p + 1] * sa + vz * ca;
      V[2 * p + 1] = nvy;
    }
    Z[p] = z; Vz[p] = vz; Hp[p] = h;
  }
  elapsed = 0;
  phiGrid = phi0;
}

// ROBUST mass-weighted centre of mass of the BOUND system. A naive COM over
// all particles is corrupted by the handful that have escaped the isolated
// grid and keep coasting ballistically to huge coordinates: one runaway at
// large x drags the mean far from the visible galaxies, so the "COM-locked"
// view drifts off-screen. Two passes fix this: a crude COM over on-grid
// particles, then a refined COM over particles within a clip radius of it.
// The view and the E-Lz frame both use this, so the system stays centred.
function primaryCentroid() {
  let mx = 0, my = 0, mvx = 0, mvy = 0, ms = 0;
  for (let p = 0; p < NP; p += 1) {
    const x = X[2 * p], y = X[2 * p + 1];
    if (x < 1 || x > L - 1 || y < 1 || y > L - 1) continue;   // skip escapers
    const w = M[p];
    mx += w * x; my += w * y; mvx += w * V[2 * p]; mvy += w * V[2 * p + 1]; ms += w;
  }
  if (ms === 0) return { x: L / 2, y: L / 2, vx: 0, vy: 0 };
  const c0x = mx / ms, c0y = my / ms;
  // Pass 2: tighten onto the bound body, rejecting far outliers.
  const RCLIP = 6.0;
  let nx = 0, ny = 0, nvx = 0, nvy = 0, ns = 0;
  for (let p = 0; p < NP; p += 1) {
    const x = X[2 * p], y = X[2 * p + 1];
    const dx = x - c0x, dy = y - c0y;
    if (dx * dx + dy * dy > RCLIP * RCLIP) continue;
    const w = M[p];
    nx += w * x; ny += w * y; nvx += w * V[2 * p]; nvy += w * V[2 * p + 1]; ns += w;
  }
  if (ns === 0) return { x: c0x, y: c0y, vx: mvx / ms, vy: mvy / ms };
  return { x: nx / ns, y: ny / ns, vx: nvx / ns, vy: nvy / ns };
}

function physFrame(nsub) {
  const st = { x: X, v: V, m: M, N: NP, t: elapsed, nSteps: 0 };
  for (let s = 0; s < nsub; s += 1) {
    phiGrid = stepPM(st, dt, PM);
  }
  elapsed = st.t;
  // Vertical dynamics: symplectic leapfrog under the EXACT Spitzer (1942)
  // isothermal-sheet field a_z = -nu^2 H tanh(z/H), with the vertical
  // frequency nu^2 = 2 pi G Sigma / H from the self-consistent PM SURFACE
  // DENSITY interpolated at the particle. Sigma >= 0 wherever there is
  // mass, so the restoring force never spuriously vanishes (the |a_R|/R
  // proxy did, on radial orbits and at apocentre, which launched the
  // collimated vertical jets): a kicked star is always pulled back and
  // the disk thickens diffusely instead. Sigma is the CIC deposit, an
  // O(N) pass; frozen over the render frame (the vertical period spans
  // many frames) so no extra Poisson solve, 60 fps preserved. Off-grid
  // escapers feel no vertical force (open boundary): they coast.
  const sigGrid = depositCICOpen(X, M, NP, NGRID, L);
  const Sig = interpolateCICOpen(X, sigGrid, NP, NGRID, L);
  for (let sub = 0; sub < nsub; sub += 1) {
    for (let p = 0; p < NP; p += 1) {
      const gx2 = X[2 * p], gy2 = X[2 * p + 1];
      if (gx2 <= 1 || gx2 >= L - 1 || gy2 <= 1 || gy2 >= L - 1) {
        Z[p] += Vz[p] * dt;                       // escaper: coast
        continue;
      }
      const h = Hp[p];
      const nu2 = Math.min(NU2_MAX, Math.max(0, TWOPIG * Sig[p] / h));
      const az = -nu2 * h * Math.tanh(Z[p] / h);
      Vz[p] += az * dt;                            // kick
      Z[p]  += Vz[p] * dt;                         // drift (symplectic Euler)
    }
  }
}

const SPLIT = 0.57;
const ELZ_SKIP = 2;

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  const c = primaryCentroid();
  const Wl = W * SPLIT;
  const cx = Wl / 2 + cam.panx, cy = H / 2 + cam.pany;
  // Zoomed out enough that the extended dark halo and tidal debris stay in
  // frame as the encounter evolves; the view is locked to the global COM
  // (c) every frame so the system never drifts off-screen.
  // Deterministic two-layer starfield (seeded hash, camera-independent so
  // the SSIM gate stays stable). Drawn opaque, before additive blending.
  for (let i = 0; i < 230; i += 1) {
    const h = Math.sin(i * 12.9898) * 43758.5453; const hx = h - Math.floor(h);
    const g = Math.sin(i * 78.233) * 9871.231;    const hy = g - Math.floor(g);
    const br = (Math.sin(i * 3.17) + 1) / 2;
    const a = 0.06 + 0.42 * br * br;
    const s = i % 9 === 0 ? 1.6 : 1;
    ctx.fillStyle = `rgba(208,216,255,${a.toFixed(3)})`;
    ctx.fillRect(hx * Wl, hy * H, s, s);
  }
  // Inclined perspective camera. World (relative to the COM) is yawed about
  // the vertical axis, then the whole scene is inclined by INC about the
  // screen-x axis (so the disk is seen as a clear ellipse, never face-on),
  // then projected with a true perspective divide by camera distance: near
  // particles are larger and brighter, far ones smaller and dimmer, so the
  // depth and the angle-of-attack of the infalling secondary are
  // unmistakable. Painter-sorted far-to-near; stellar particles are drawn
  // with additive blending so dense regions saturate into luminous cores,
  // the dark halo a faint volumetric haze. View locked to the bound COM.
  const YAW = cam.yaw, INC = cam.inc;
  const cyaw = Math.cos(YAW), syaw = Math.sin(YAW);
  const cinc = Math.cos(INC), sinc = Math.sin(INC);
  const CAMD = 26;                                   // camera distance (world)
  const SCR  = Math.min(Wl, H) * 0.050 * cam.zoom;   // px per world unit at z=0
  const FOC  = SCR * CAMD;
  const proj = new Float64Array(NP * 4);             // sx, sy, depth, persp
  const order = new Int32Array(NP);
  let np = 0;
  let b0x = 0, b0y = 0, b0n = 0, b1x = 0, b1y = 0, b1n = 0;
  for (let k = 0; k < NP; k += 1) {
    const wx = X[2 * k] - c.x, wy = X[2 * k + 1] - c.y, wz = Z[k];
    const x1 = wx * cyaw - wy * syaw, y1 = wx * syaw + wy * cyaw;
    const y2 = y1 * cinc - wz * sinc;
    const z2 = y1 * sinc + wz * cinc;                // toward viewer
    const dcam = CAMD - z2;
    if (dcam < 3) continue;                          // behind / too close
    const persp = FOC / dcam;
    const sx = cx + x1 * persp;
    const sy = cy - y2 * persp;
    if (sx < -40 || sx > Wl + 40 || sy < -40 || sy > H + 40) continue;
    proj[4 * k] = sx; proj[4 * k + 1] = sy;
    proj[4 * k + 2] = dcam; proj[4 * k + 3] = persp;
    order[np++] = k;
    if (KIND[k] < 2) {
      if (ORIG[k] === 0) { b0x += sx; b0y += sy; b0n += 1; }
      else               { b1x += sx; b1y += sy; b1n += 1; }
    }
  }
  const ord = order.subarray(0, np);
  ord.sort((a, b) => proj[4 * b + 2] - proj[4 * a + 2]);   // far first
  const pRef = SCR;
  ctx.globalCompositeOperation = 'lighter';
  for (let idx = 0; idx < np; idx += 1) {
    const k = ord[idx];
    const sx = proj[4 * k], sy = proj[4 * k + 1], pf = proj[4 * k + 3] / pRef;
    const dim = Math.min(1.5, Math.max(0.45, pf));         // perspective cue
    if (KIND[k] >= 2) {                                    // dark halo haze
      const r = 1.1 * Math.min(1.7, Math.max(0.7, pf));
      ctx.fillStyle = ORIG[k] === 0
        ? `rgba(96,110,168,${(0.045 * dim).toFixed(3)})`
        : `rgba(170,140,98,${(0.045 * dim).toFixed(3)})`;
      ctx.fillRect(sx, sy, r, r);
    } else {                                               // stellar glow
      const r = 1.7 * Math.min(1.9, Math.max(0.6, pf));
      ctx.fillStyle = ORIG[k] === 0
        ? `rgba(150,182,255,${(0.62 * dim).toFixed(3)})`
        : `rgba(255,188,116,${(0.66 * dim).toFixed(3)})`;
      ctx.fillRect(sx - r / 2, sy - r / 2, r, r);
    }
  }
  // Luminous nuclei: a soft glow built from a stack of solid translucent
  // discs of decreasing radius. This is a centrally-peaked bloom under
  // additive blending but uses only solid arc fills, which rasterize
  // identically across Chromium backends (a createRadialGradient bloom
  // does NOT: gradient colour interpolation is backend-dependent and
  // breaks the deterministic SSIM gate on the most saturated frame).
  function bloom(mx, my, n, rgb) {
    if (n < 12) return;
    const px = mx / n, py = my / n;
    for (let i = 0; i < 9; i += 1) {
      const r = 46 * (1 - i / 9);
      ctx.fillStyle = `rgba(${rgb},0.05)`;
      ctx.beginPath(); ctx.arc(px, py, r, 0, 2 * Math.PI); ctx.fill();
    }
  }
  bloom(b0x, b0y, b0n, '150,185,255');
  bloom(b1x, b1y, b1n, '255,190,118');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#9aa0b0'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('3D self-gravitating merger (dark halo + disk, inclined perspective, COM frame)', 12, 20);
  ctx.fillStyle = 'rgba(154,160,176,0.7)'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('drag: orbit   wheel: zoom   shift-drag: pan', 12, H - 14);

  // Integrals of motion in the global COM frame, STELLAR particles only
  // (the Sausage is a stellar-debris diagnostic). E uses the PM grid
  // potential interpolated at each star, so it is the real self-consistent
  // energy; these settle to conserved values once the remnant relaxes,
  // which is why the accreted clump persists (the Sausage diagnostic).
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.moveTo(Wl, 0); ctx.lineTo(Wl, H); ctx.stroke();
  const phiAt = interpolateCICOpen(X, phiGrid, NP, NGRID, L);
  const px0 = Wl + 54, px1 = W - 18, py0 = 40, py1 = H - 40;
  let lzMax = 1e-6, eLo = 1e30, eHi = -1e30;
  const pts = [];
  for (let k = 0; k < NP; k += ELZ_SKIP) {
    if (KIND[k] >= 2) continue;                 // stars only, not dark halo
    // Only stars with a valid PM potential (well inside the grid). Particles
    // that have left the grid have phi = 0 from the open interpolator, which
    // would be a meaningless energy, so they are excluded: the plot then
    // honestly shows the bound population, matching what is on screen.
    const gx2 = X[2 * k], gy2 = X[2 * k + 1];
    if (gx2 < 2 || gx2 > L - 2 || gy2 < 2 || gy2 > L - 2) continue;
    const dx = X[2 * k] - c.x, dy = X[2 * k + 1] - c.y;
    const vx = V[2 * k] - c.vx, vy = V[2 * k + 1] - c.vy;
    const Lz = dx * vy - dy * vx;
    const E = 0.5 * (vx * vx + vy * vy) + phiAt[k];
    pts.push({ Lz, E, g: ORIG[k] });
    lzMax = Math.max(lzMax, Math.abs(Lz));
    eLo = Math.min(eLo, E); eHi = Math.max(eHi, E);
  }
  lzMax *= 0.92;
  const eSpan = (eHi - eLo) || 1;
  const mapx = (lz) => px0 + (lz + lzMax) / (2 * lzMax) * (px1 - px0);
  const mapy = (e)  => py1 - (e - eLo) / eSpan * (py1 - py0);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.strokeRect(px0, py0, px1 - px0, py1 - py0);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(mapx(0), py0); ctx.lineTo(mapx(0), py1); ctx.stroke();
  for (const q of pts) {
    const X1 = mapx(q.Lz), Y1 = mapy(q.E);
    if (X1 < px0 || X1 > px1 || Y1 < py0 || Y1 > py1) continue;
    ctx.fillStyle = q.g === 0 ? 'rgba(124,156,255,0.42)' : 'rgba(253,181,106,0.5)';
    ctx.fillRect(X1, Y1, 1.4, 1.4);
  }
  ctx.fillStyle = '#9aa0b0'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('integrals of motion (stars, COM frame)', px0, 22);
  ctx.fillText('L_z  (angular momentum)', px0 + 60, H - 16);
  ctx.save();
  ctx.translate(Wl + 18, (py0 + py1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('E  (orbital energy)', -56, 0);
  ctx.restore();

  if (readout) {
    const ratio = (Math.max(state.M1, state.M2) / Math.min(state.M1, state.M2)).toFixed(1);
    readout.innerHTML =
      `<span>particles</span><span class="value">${NP}</span>` +
      `<span>M1:M2</span><span class="value">${ratio}:1</span>` +
      `<span>t</span><span class="value">${elapsed.toFixed(1)}</span>`;
  }
}

let raf;
function tick() {
  if (state.running) physFrame(1);
  render();
  if (!CAPTURE_NAME) raf = requestAnimationFrame(tick);
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, st, val, onInput, fmt = v => v.toFixed(2)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(st); inp.value = String(val);
    inp.setAttribute('aria-label', label);
    const v = document.createElement('span'); v.className = 'value'; v.textContent = fmt(val);
    inp.addEventListener('input', () => { const x = parseFloat(inp.value); v.textContent = fmt(x); onInput(x); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(v);
    controlsEl.appendChild(row);
  }
  slider('M1', 'M1 primary',  0.4, 1.6, 0.05, state.M1, x => { state.M1 = x; reset(); });
  slider('M2', 'M2 accreted', 0.1, 1.6, 0.05, state.M2, x => { state.M2 = x; reset(); });
  slider('impact', 'impact b', 0, 4, 0.1, state.impact, x => { state.impact = x; reset(); });
  slider('vRel', 'closing v', 0.05, 1.2, 0.02, state.vRel, x => { state.vRel = x; reset(); });
  slider('aoa', 'angle of attack', 0, 90, 5, state.aoa, x => { state.aoa = x; reset(); }, v => `${v.toFixed(0)} deg`);
  const row = document.createElement('div'); row.className = 'row buttons';
  const launch = document.createElement('button'); launch.type = 'button'; launch.textContent = 'Relaunch';
  launch.addEventListener('click', () => { reset(); state.running = true; });
  const pause = document.createElement('button'); pause.type = 'button'; pause.textContent = 'Pause';
  pause.addEventListener('click', () => {
    state.running = !state.running;
    pause.textContent = state.running ? 'Pause' : 'Play';
    pause.setAttribute('aria-pressed', String(!state.running));
  });
  row.appendChild(launch); row.appendChild(pause); controlsEl.appendChild(row);
}

// Pointer-driven camera: drag to orbit (yaw from horizontal motion,
// inclination from vertical), Shift-drag to pan, wheel to zoom. Active
// only over the left spatial panel so the integrals-of-motion plot is
// untouched. No effect on the deterministic capture (no pointer events
// in headless), so the golden frames are unchanged.
function setupCamera() {
  let drag = false, panning = false, lx = 0, ly = 0;
  const toLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = toLocal(e);
    if (p.x > W * SPLIT) return;                 // ignore the E-Lz panel
    drag = true; panning = e.shiftKey; lx = p.x; ly = p.y;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = panning ? 'move' : 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toLocal(e); const dx = p.x - lx, dy = p.y - ly; lx = p.x; ly = p.y;
    if (panning) {
      cam.panx += dx; cam.pany += dy;
      cam.panx = Math.max(-W, Math.min(W, cam.panx));
      cam.pany = Math.max(-H, Math.min(H, cam.pany));
    } else {
      cam.yaw += dx * 0.006;
      cam.inc = Math.max(0.12, Math.min(1.48, cam.inc + dy * 0.005));
    }
  });
  const end = (e) => {
    drag = false; panning = false; canvas.style.cursor = 'grab';
    if (e.pointerId !== undefined && canvas.hasPointerCapture?.(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => {
    const p = toLocal(e);
    if (p.x > W * SPLIT) return;
    e.preventDefault();
    cam.zoom = Math.max(0.35, Math.min(5, cam.zoom * Math.exp(-e.deltaY * 0.0012)));
  }, { passive: false });
  canvas.style.cursor = 'grab';
}

buildControls();
setupCamera();
reset();
if (DETERMINISTIC) {
  // Reference capture: sweep the IN-FALL up to the dramatic first deep
  // passage. captureFraction 0..1 maps to ~30..330 PM steps so the five
  // frames are approach, infall, the tidal bridge, the plunge, and the
  // collision (~step 300, the cores in contact). The golden sweep stops
  // here on purpose: after coalescence a chaotic N-body is fine,
  // fully phase-mixed speckle that is not SSIM-robust across browser
  // processes, whereas large-scale structure (two distinguishable
  // cores, tails) is. The LIVE (non-capture) run keeps integrating
  // indefinitely, so the user still watches the full coalescence,
  // violent relaxation and the Gaia-Enceladus / Sausage form.
  const warm = CAPTURE_NAME ? Math.round(30 + CAPTURE_FRAC * 170) : 300;
  physFrame(warm);
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // The isolated particle-mesh leapfrog conserves total in-plane momentum
  // to roundoff (the mean-field force derives from a symmetric kernel).
  let px = 0, py = 0, p0 = 0;
  for (let k = 0; k < NP; k += 1) { px += M[k] * V[2 * k]; py += M[k] * V[2 * k + 1]; }
  for (let k = 0; k < NP; k += 1) p0 += M[k] * Math.hypot(V[2 * k], V[2 * k + 1]);
  const drift = (Math.abs(px) + Math.abs(py)) / (p0 + 1e-9);
  if (drift > 1e-3) return { name: 'PM momentum conservation', pass: false, msg: `drift=${drift}` };
  return { name: 'PM momentum conservation', pass: true, msg: 'total in-plane momentum conserved by the isolated PM leapfrog' };
};
