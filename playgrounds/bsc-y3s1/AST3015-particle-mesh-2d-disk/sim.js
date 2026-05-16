// sim.js
// 2D particle-mesh (PM) self-gravitating disk simulation.
//
// N particles initially in a rotating Kuzmin-like disk; gravity solved on a
// uniform NGRID x NGRID grid via FFT-based Poisson. Cloud-in-cell (CIC)
// deposit and interpolation.
//
// Reference: Hockney and Eastwood 1988, Computer Simulation Using Particles,
// Chapters 5 - 7.

import { makeRng, gaussian } from '../../../shared/js/render/rng.js';

export const NGRID = 32;     // 32x32 grid (cheap)
export const L = 5.0;        // domain extent (smaller box -> disc spans more cells)
export const DX = L / NGRID;
export const NPARTICLES = 1500;
export const G_GRAV = 1.0;

function periodic(i) {
  if (i < 0) return i + NGRID;
  if (i >= NGRID) return i - NGRID;
  return i;
}

// Separable 1D DFT (row + column). O(NGRID^3) total; fine at NGRID = 32.
function dft1DRow(re, im, NX, NY, sign) {
  const Re = new Float64Array(NX * NY), Im = new Float64Array(NX * NY);
  for (let y = 0; y < NY; y += 1) {
    for (let kx = 0; kx < NX; kx += 1) {
      let r = 0, i = 0;
      for (let x = 0; x < NX; x += 1) {
        const phase = sign * 2 * Math.PI * kx * x / NX;
        const c = Math.cos(phase), s = Math.sin(phase);
        r += re[y * NX + x] * c - im[y * NX + x] * s;
        i += re[y * NX + x] * s + im[y * NX + x] * c;
      }
      Re[y * NX + kx] = r; Im[y * NX + kx] = i;
    }
  }
  return { Re, Im };
}
function dft1DCol(re, im, NX, NY, sign) {
  const Re = new Float64Array(NX * NY), Im = new Float64Array(NX * NY);
  for (let x = 0; x < NX; x += 1) {
    for (let ky = 0; ky < NY; ky += 1) {
      let r = 0, i = 0;
      for (let y = 0; y < NY; y += 1) {
        const phase = sign * 2 * Math.PI * ky * y / NY;
        const c = Math.cos(phase), s = Math.sin(phase);
        r += re[y * NX + x] * c - im[y * NX + x] * s;
        i += re[y * NX + x] * s + im[y * NX + x] * c;
      }
      Re[ky * NX + x] = r; Im[ky * NX + x] = i;
    }
  }
  return { Re, Im };
}
function dft2D(re, im, NX, NY, sign) {
  const r1 = dft1DRow(re, im, NX, NY, sign);
  return dft1DCol(r1.Re, r1.Im, NX, NY, sign);
}

function solvePoisson2D(rho) {
  const N = rho.length;
  const im0 = new Float64Array(N);
  const { Re: rhoR, Im: rhoI } = dft2D(rho, im0, NGRID, NGRID, -1);
  const phiR = new Float64Array(N), phiI = new Float64Array(N);
  for (let ky = 0; ky < NGRID; ky += 1) {
    for (let kx = 0; kx < NGRID; kx += 1) {
      const k = ky * NGRID + kx;
      if (kx === 0 && ky === 0) { phiR[k] = 0; phiI[k] = 0; continue; }
      const kkx = (kx <= NGRID / 2) ? kx : kx - NGRID;
      const kky = (ky <= NGRID / 2) ? ky : ky - NGRID;
      const fx = 2 * Math.PI * kkx / L;
      const fy = 2 * Math.PI * kky / L;
      const denom = fx * fx + fy * fy;
      phiR[k] = -4 * Math.PI * G_GRAV * rhoR[k] / denom;
      phiI[k] = -4 * Math.PI * G_GRAV * rhoI[k] / denom;
    }
  }
  const { Re: phi } = dft2D(phiR, phiI, NGRID, NGRID, +1);
  for (let i = 0; i < phi.length; i += 1) phi[i] /= NGRID * NGRID;
  return phi;
}

// CIC deposit
function depositCIC(positions, masses) {
  const rho = new Float64Array(NGRID * NGRID);
  const N = positions.length / 2;
  for (let p = 0; p < N; p += 1) {
    let px = positions[2 * p], py = positions[2 * p + 1];
    while (px < 0) px += L;
    while (px >= L) px -= L;
    while (py < 0) py += L;
    while (py >= L) py -= L;
    const fx = px / DX, fy = py / DX;
    const i0 = Math.floor(fx), j0 = Math.floor(fy);
    const sx = fx - i0, sy = fy - j0;
    const i1 = periodic(i0 + 1), j1 = periodic(j0 + 1);
    rho[j0 * NGRID + i0] += masses[p] * (1 - sx) * (1 - sy);
    rho[j0 * NGRID + i1] += masses[p] * sx * (1 - sy);
    rho[j1 * NGRID + i0] += masses[p] * (1 - sx) * sy;
    rho[j1 * NGRID + i1] += masses[p] * sx * sy;
  }
  // Subtract average so phi[k=0] = 0.
  let avg = 0;
  for (let i = 0; i < rho.length; i += 1) avg += rho[i];
  avg /= rho.length;
  for (let i = 0; i < rho.length; i += 1) rho[i] -= avg;
  return rho;
}

function gradPhi(phi) {
  const gx = new Float64Array(NGRID * NGRID);
  const gy = new Float64Array(NGRID * NGRID);
  for (let j = 0; j < NGRID; j += 1) for (let i = 0; i < NGRID; i += 1) {
    const ip1 = periodic(i + 1), im1 = periodic(i - 1);
    const jp1 = periodic(j + 1), jm1 = periodic(j - 1);
    gx[j * NGRID + i] = (phi[j * NGRID + ip1] - phi[j * NGRID + im1]) / (2 * DX);
    gy[j * NGRID + i] = (phi[jp1 * NGRID + i] - phi[jm1 * NGRID + i]) / (2 * DX);
  }
  return { gx, gy };
}

function interpolateCIC(positions, field) {
  const N = positions.length / 2;
  const out = new Float64Array(N);
  for (let p = 0; p < N; p += 1) {
    let px = positions[2 * p], py = positions[2 * p + 1];
    while (px < 0) px += L;
    while (px >= L) px -= L;
    while (py < 0) py += L;
    while (py >= L) py -= L;
    const fx = px / DX, fy = py / DX;
    const i0 = Math.floor(fx), j0 = Math.floor(fy);
    const sx = fx - i0, sy = fy - j0;
    const i1 = periodic(i0 + 1), j1 = periodic(j0 + 1);
    out[p] = field[j0 * NGRID + i0] * (1 - sx) * (1 - sy)
           + field[j0 * NGRID + i1] * sx * (1 - sy)
           + field[j1 * NGRID + i0] * (1 - sx) * sy
           + field[j1 * NGRID + i1] * sx * sy;
  }
  return out;
}

export function createDisk({ N = NPARTICLES, M = 1.0, R = 1.5, seed = 0xC0FFEE } = {}) {
  const rng = makeRng(seed);
  const x = new Float64Array(2 * N);
  const v = new Float64Array(2 * N);
  const m = new Float64Array(N);
  // Center of domain
  const cx = L / 2, cy = L / 2;
  // Exponential disc: r ~ -ln(1 - u) * R for surface density ~ exp(-r/R).
  // Truncate the long tail so the disc is compact in the periodic box.
  const rMaxKeep = 3.4 * R;
  for (let i = 0; i < N; i += 1) {
    let r = -Math.log(1 - rng()) * R;
    if (r > rMaxKeep) r = rMaxKeep * rng();
    const theta = 2 * Math.PI * rng();
    let xi = cx + r * Math.cos(theta);
    let yi = cy + r * Math.sin(theta);
    while (xi < 0) xi += L;
    while (xi >= L) xi -= L;
    while (yi < 0) yi += L;
    while (yi >= L) yi -= L;
    x[2 * i] = xi; x[2 * i + 1] = yi;
    m[i] = M / N;
  }
  // Balance the orbital speed against the ACTUAL particle-mesh force at
  // t = 0 (not an analytic point-mass guess, which never matched the
  // grid-softened periodic potential and made the disc fly apart). Then
  // add a small velocity dispersion so it settles into a warm disc with
  // transient spiral structure instead of a cold collapsing ring.
  const rho = depositCIC(x, m);
  const phi = solvePoisson2D(rho);
  const { gx, gy } = gradPhi(phi);
  const ax0 = interpolateCIC(x, gx);
  const ay0 = interpolateCIC(x, gy);
  for (let i = 0; i < N; i += 1) {
    const dx = x[2 * i] - cx, dy = x[2 * i + 1] - cy;
    const r = Math.hypot(dx, dy) + 1e-6;
    const ux = dx / r, uy = dy / r;
    // Inward radial acceleration is -grad(phi) . r_hat = (gx,gy).(ux,uy).
    const aR = ax0[i] * ux + ay0[i] * uy;
    const vC = aR > 0 ? Math.sqrt(aR * r) : 0;
    const sig = 0.09 * vC;
    v[2 * i] = -vC * uy + gaussian(rng, 0, sig);
    v[2 * i + 1] = +vC * ux + gaussian(rng, 0, sig);
  }
  return { x, v, m, N, t: 0, nSteps: 0 };
}

export function stepPM(state, dt = 0.02) {
  const rho = depositCIC(state.x, state.m);
  const phi = solvePoisson2D(rho);
  const { gx, gy } = gradPhi(phi);
  const ax = interpolateCIC(state.x, gx);
  const ay = interpolateCIC(state.x, gy);
  // Leapfrog: v += -dt grad(phi), x += dt v
  for (let p = 0; p < state.N; p += 1) {
    state.v[2 * p]     -= dt * ax[p];
    state.v[2 * p + 1] -= dt * ay[p];
    let nx = state.x[2 * p] + dt * state.v[2 * p];
    let ny = state.x[2 * p + 1] + dt * state.v[2 * p + 1];
    // Periodic box: wrap positions so particles never leave the domain
    // (the grid is periodic; unwrapped positions just drift off-screen).
    nx -= Math.floor(nx / L) * L;
    ny -= Math.floor(ny / L) * L;
    state.x[2 * p]     = nx;
    state.x[2 * p + 1] = ny;
  }
  state.t += dt;
  state.nSteps += 1;
}

export function totalAngularMomentum(state) {
  const cx = L / 2, cy = L / 2;
  let Lz = 0;
  for (let p = 0; p < state.N; p += 1) {
    const dx = state.x[2 * p] - cx;
    const dy = state.x[2 * p + 1] - cy;
    Lz += state.m[p] * (dx * state.v[2 * p + 1] - dy * state.v[2 * p]);
  }
  return Lz;
}

export function totalMass(state) {
  let M = 0;
  for (let p = 0; p < state.N; p += 1) M += state.m[p];
  return M;
}
