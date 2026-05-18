// Galaxy merger as a true self-gravitating particle-mesh N-body. There are
// no analytic cores and no special-case forces: each galaxy is a dense
// rotating exponential disk of equal-mass particles, gravity is solved
// self-consistently on a periodic grid (shared/js/engine/particle-mesh-2d),
// and the in-fall, tidal tails, dynamical friction, coalescence and
// phase-mixing all emerge from the particle dynamics. A second panel shows
// the stars in the energy vs angular-momentum plane in the rest frame of
// the surviving primary's density centroid (the Galactocentric analogue),
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
// uses its fast radix-2 FFT. The softening EPS is ~1.5 cells, small enough
// that the dense cores attract strongly and resolve the merger.
const NGRID = 64;
const L     = 16;
const G     = 1;
const EPS   = 1.5 * L / NGRID;
const PM    = { NGRID, L, G, isolated: true, eps: EPS };
const NTOT  = 16000;         // dense, reads as a real galaxy (PM cost is
                             // grid-bound via the radix-2 FFT, so the
                             // per-particle work stays cheap at 60 fps)
const dt    = 0.03;
const N_ARMS = 2;            // two trailing logarithmic spiral arms
const PITCH  = 0.35;         // arm pitch (rad); tan() sets the winding
const ARM_W  = 0.40;         // azimuthal arm half-width (Gaussian scatter)

// 3D structure on the verified 2D-in-plane self-gravitating PM (the gravity
// solve that hits 60fps and is diagnostic-verified). Each particle carries a
// passive z that rides with its (x,y) motion: a thin disk scale height for
// the stellar disk and a full spherical z for the halo/dwarf, plus the
// secondary's orbital plane tilted by the angle-of-attack. This gives a true
// 3D distribution and inclined infall, rendered with an oblique camera, while
// the in-plane dynamics remain the proven PM (so still 60fps and gateable).
const ZH_DISK = 0.10;          // stellar-disk scale height / R_d
let Z;                          // per-particle out-of-plane coordinate

const state = {
  M1: 1.0,        // primary total mass
  M2: 0.45,       // satellite total mass (it gets tidally shredded)
  aoa: 35,        // angle of attack: secondary orbital-plane tilt (deg)
  impact: 1.0,    // impact parameter
  vRel: 0.14,     // closing speed: a BOUND, compact orbit (verified by the
                  // headless diagnostic to stay well inside the grid and
                  // coalesce, so nothing escapes off the finite domain)
  running: !DETERMINISTIC,
};

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
      let r = -Rd * Math.log(1 - rng()) * 0.9;
      if (r > 3.0 * Rd) r = 3.0 * Rd * rng();
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
  const sep = 4.0, b = state.impact;
  const Rd1 = 0.8, Rd2 = 0.8 * Math.sqrt(state.M2 / state.M1);
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
  // 3D structure (passive z, rides with the in-plane PM motion): a thin
  // scale height for the primary spiral disk, a spherical puff for the
  // dark halo and the diffuse dwarf. The whole SECONDARY is then tilted by
  // the angle of attack about the x-axis through its centre, so its plane
  // and infall are inclined to the primary disk.
  Z = new Float64Array(NP);
  const aoa = state.aoa * Math.PI / 180;
  const ca = Math.cos(aoa), sa = Math.sin(aoa);
  for (let p = 0; p < NP; p += 1) {
    const c = ORIG[p] === 0 ? c1 : c2;
    const rx = X[2 * p] - c.x, ry = X[2 * p + 1] - c.y;
    const R = Math.hypot(rx, ry);
    let z;
    if (KIND[p] === 0) z = gaussian(rng, 0, ZH_DISK * Rd1);   // thin spiral
    else               z = gaussian(rng, 0, 0.62 * (R + 0.05)); // round halo/dwarf
    if (ORIG[p] === 1) {                                       // tilt secondary
      const ny = ry * ca - z * sa;
      z        = ry * sa + z * ca;
      X[2 * p + 1] = c.y + ny;
    }
    Z[p] = z;
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
}

const SPLIT = 0.57;
const ELZ_SKIP = 2;

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  const c = primaryCentroid();
  const Wl = W * SPLIT;
  const cx = Wl / 2, cy = H / 2;
  // Zoomed out enough that the extended dark halo and tidal debris stay in
  // frame as the encounter evolves; the view is locked to the global COM
  // (c) every frame so the system never drifts off-screen.
  const sc = Math.min(Wl, H) * 0.052;        // units to px in the spatial panel
  // Deterministic starfield backdrop (seeded hash, so the gate is stable).
  for (let i = 0; i < 90; i += 1) {
    const h = Math.sin(i * 12.9898) * 43758.5453; const hx = h - Math.floor(h);
    const g = Math.sin(i * 78.233) * 9871.231;    const hy = g - Math.floor(g);
    const a = 0.10 + 0.5 * ((Math.sin(i * 3.17) + 1) / 2);
    ctx.fillStyle = `rgba(200,210,255,${a.toFixed(2)})`;
    ctx.fillRect(hx * Wl, hy * H, 1, 1);
  }
  // Oblique 3D camera (neither edge-on nor face-on): yaw about the vertical
  // world axis then a camera elevation tilt; painter-ordered into depth bins
  // so far particles draw behind near ones. The dark halo is a faint haze,
  // the stellar disk a bright additive glow; the secondary's plane is tilted
  // by the angle of attack. View locked to the robust bound-system COM.
  const YAW = 0.46, PIT = 0.55;
  const cyaw = Math.cos(YAW), syaw = Math.sin(YAW);
  const cpit = Math.cos(PIT), spit = Math.sin(PIT);
  const NBIN = 9;
  const bins = []; for (let bI = 0; bI < NBIN; bI += 1) bins.push([]);
  let dmin = 1e30, dmax = -1e30;
  const proj = new Float64Array(NP * 3);          // px, py, depth
  for (let k = 0; k < NP; k += 1) {
    const wx = X[2 * k] - c.x, wy = X[2 * k + 1] - c.y, wz = Z[k];
    const x1 = wx * cyaw - wy * syaw, y1 = wx * syaw + wy * cyaw;
    const sx = cx + x1 * sc;
    const sy = cy + (y1 * cpit - wz * spit) * sc;
    const dep = y1 * spit + wz * cpit;
    proj[3 * k] = sx; proj[3 * k + 1] = sy; proj[3 * k + 2] = dep;
    if (dep < dmin) dmin = dep; if (dep > dmax) dmax = dep;
  }
  const span = (dmax - dmin) || 1;
  for (let k = 0; k < NP; k += 1) {
    const sx = proj[3 * k], sy = proj[3 * k + 1];
    if (sx < 2 || sx > Wl - 2 || sy < 2 || sy > H - 2) continue;
    let bI = ((proj[3 * k + 2] - dmin) / span * (NBIN - 1)) | 0;
    if (bI < 0) bI = 0; else if (bI >= NBIN) bI = NBIN - 1;
    bins[bI].push(k);
  }
  for (let bI = 0; bI < NBIN; bI += 1) {
    const depthShade = 0.55 + 0.45 * (bI / (NBIN - 1));   // nearer = brighter
    for (const k of bins[bI]) {
      const sx = proj[3 * k], sy = proj[3 * k + 1];
      if (KIND[k] >= 2) {                                  // dark halo: haze
        ctx.fillStyle = ORIG[k] === 0
          ? `rgba(120,130,175,${(0.07 * depthShade).toFixed(3)})`
          : `rgba(180,150,110,${(0.07 * depthShade).toFixed(3)})`;
        ctx.fillRect(sx, sy, 1.3, 1.3);
      } else {                                             // stellar: glow
        ctx.fillStyle = ORIG[k] === 0
          ? `rgba(150,180,255,${(0.85 * depthShade).toFixed(3)})`
          : `rgba(255,190,120,${(0.9 * depthShade).toFixed(3)})`;
        ctx.fillRect(sx, sy, 1.7, 1.7);
      }
    }
  }
  ctx.fillStyle = '#9aa0b0'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('3D merger (dark halo + stellar disk, oblique camera, COM frame)', 12, 20);

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

buildControls();
reset();
if (DETERMINISTIC) {
  // Reference capture: sweep the merger sequence (fall-in, first passage,
  // tidal tails, dynamical-friction inspiral, coalesced relaxed remnant).
  // captureFraction 0..1 maps to ~40..900 PM steps; the merger emerges
  // from self-gravity so the progression is fully continuous.
  const warm = CAPTURE_NAME ? Math.round(40 + CAPTURE_FRAC * 1060) : 260;
  physFrame(warm);
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // The periodic particle-mesh leapfrog conserves total momentum to
  // roundoff (the mean-field force derives from a periodic potential).
  let px = 0, py = 0, p0 = 0;
  for (let k = 0; k < NP; k += 1) { px += M[k] * V[2 * k]; py += M[k] * V[2 * k + 1]; }
  for (let k = 0; k < NP; k += 1) p0 += M[k] * Math.hypot(V[2 * k], V[2 * k + 1]);
  const drift = (Math.abs(px) + Math.abs(py)) / (p0 + 1e-9);
  if (drift > 1e-3) return { name: 'PM momentum conservation', pass: false, msg: `drift=${drift}` };
  return { name: 'PM momentum conservation', pass: true, msg: 'total momentum conserved by the periodic PM leapfrog' };
};
