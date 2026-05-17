// sim.js
// 1D-1V Particle-in-Cell (PIC) simulation of the two-stream instability.
//
// Two cold electron beams of equal density, moving in opposite directions
// at +/- v_0, against a uniform neutralizing ion background. The
// configuration is unstable: any small perturbation grows exponentially
// at the linear rate omega_p / (2 sqrt(2)) (Krall & Trivelpiece 1973).
//
// We use the standard NGP (nearest-grid-point) PIC scheme:
//   1. Deposit particle charge onto a periodic 1D grid.
//   2. Solve Poisson's equation for the electrostatic potential.
//   3. Differentiate to get the electric field on the grid.
//   4. Interpolate E to each particle position and advance with leapfrog.
//
// Reference: Hockney and Eastwood 1988, Computer Simulation Using
// Particles, Chapter 5 - 8.

import { makeRng, gaussian } from '../../../shared/js/render/rng.js';

export const NGRID = 64;
export const L = 2 * Math.PI;        // domain length
export const DX = L / NGRID;
export const NPARTICLES = 10000;

// Solve d^2 phi / dx^2 = -rho on a periodic grid via direct FFT-style
// inversion. For NGRID modes, the k-th wave number contributes
//   phi_hat[k] = rho_hat[k] / k^2 (for k != 0; phi_hat[0] = 0).
// We use a manual O(N^2) DFT which is fine at N = 64.
function fft1D(re, im) {
  const N = re.length;
  const Re = new Float64Array(N), Im = new Float64Array(N);
  for (let k = 0; k < N; k += 1) {
    let r = 0, i = 0;
    for (let n = 0; n < N; n += 1) {
      const phase = -2 * Math.PI * k * n / N;
      const c = Math.cos(phase), s = Math.sin(phase);
      r += re[n] * c - im[n] * s;
      i += re[n] * s + im[n] * c;
    }
    Re[k] = r; Im[k] = i;
  }
  return { Re, Im };
}
function ifft1D(Re, Im) {
  const N = Re.length;
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let n = 0; n < N; n += 1) {
    let r = 0, i = 0;
    for (let k = 0; k < N; k += 1) {
      const phase = 2 * Math.PI * k * n / N;
      const c = Math.cos(phase), s = Math.sin(phase);
      r += Re[k] * c - Im[k] * s;
      i += Re[k] * s + Im[k] * c;
    }
    re[n] = r / N; im[n] = i / N;
  }
  return { re, im };
}

function solvePoissonPeriodic(rho) {
  const N = rho.length;
  const rhoIm = new Float64Array(N);
  const { Re: rhoR, Im: rhoI } = fft1D(rho, rhoIm);
  const phiR = new Float64Array(N), phiI = new Float64Array(N);
  for (let k = 0; k < N; k += 1) {
    if (k === 0) { phiR[k] = 0; phiI[k] = 0; continue; }
    const kk = (k <= N / 2) ? k : k - N;
    const kx = 2 * Math.PI * kk / L;
    const denom = kx * kx;
    phiR[k] = rhoR[k] / denom;
    phiI[k] = rhoI[k] / denom;
  }
  const { re: phi } = ifft1D(phiR, phiI);
  return phi;
}

function differentiate(phi) {
  const N = phi.length;
  const E = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const ip1 = (i + 1) % N;
    const im1 = (i - 1 + N) % N;
    E[i] = -(phi[ip1] - phi[im1]) / (2 * DX);
  }
  return E;
}

// NGP deposit
function depositCharge(positions, weights) {
  const rho = new Float64Array(NGRID);
  const N = positions.length;
  for (let p = 0; p < N; p += 1) {
    let x = positions[p];
    while (x < 0) x += L;
    while (x >= L) x -= L;
    const i = Math.floor(x / DX);
    rho[i] += weights[p];
  }
  // Subtract average so phi at k = 0 is zero (already enforced).
  let avg = 0;
  for (let i = 0; i < NGRID; i += 1) avg += rho[i];
  avg /= NGRID;
  for (let i = 0; i < NGRID; i += 1) rho[i] -= avg;
  return rho;
}

function interpolateE(positions, E) {
  const N = positions.length;
  const out = new Float64Array(N);
  for (let p = 0; p < N; p += 1) {
    let x = positions[p];
    while (x < 0) x += L;
    while (x >= L) x -= L;
    const i = Math.floor(x / DX);
    out[p] = E[i];
  }
  return out;
}

export function createTwoStream({ v0 = 1.0, T = 0.01, seed = 0xC0FFEE } = {}) {
  const rng = makeRng(seed);
  const x = new Float64Array(NPARTICLES);
  const v = new Float64Array(NPARTICLES);
  const w = new Float64Array(NPARTICLES);
  // Normalize so the average charge density is ~ 1 (units where omega_p = 1).
  const chargePerParticle = NGRID / NPARTICLES;
  for (let p = 0; p < NPARTICLES; p += 1) {
    x[p] = (rng() * L);
    const sign = p < NPARTICLES / 2 ? 1 : -1;
    v[p] = sign * v0 + Math.sqrt(T) * gaussian(rng, 0, 1);
    w[p] = chargePerParticle;
  }
  // Add a small perturbation in x to seed the instability.
  for (let p = 0; p < NPARTICLES; p += 1) {
    x[p] += 0.01 * Math.cos(x[p]);   // mode k = 1 seed
  }
  return { x, v, w, t: 0, nSteps: 0 };
}

export function stepPIC(state, dt = 0.05) {
  const rho = depositCharge(state.x, state.w);
  const phi = solvePoissonPeriodic(rho);
  const E = differentiate(phi);
  const Ep = interpolateE(state.x, E);
  for (let p = 0; p < NPARTICLES; p += 1) {
    // Leapfrog: v_{n+1/2} = v_{n-1/2} + dt * a; x_{n+1} = x_n + dt v_{n+1/2}.
    // a = -E (charge -1 for electrons); we use a = E since the sign falls out
    // of the deposit + Poisson normalization in this minimal model.
    state.v[p] -= dt * Ep[p];
    state.x[p] += dt * state.v[p];
    // Periodic BC
    while (state.x[p] < 0) state.x[p] += L;
    while (state.x[p] >= L) state.x[p] -= L;
  }
  state.t += dt;
  state.nSteps += 1;
}

// Diagnostic: total kinetic energy in particles and field energy.
export function kineticEnergy(state) {
  let K = 0;
  for (let p = 0; p < NPARTICLES; p += 1) K += 0.5 * state.v[p] ** 2;
  return K;
}

export function fieldEnergy(state) {
  const rho = depositCharge(state.x, state.w);
  const phi = solvePoissonPeriodic(rho);
  const E = differentiate(phi);
  let W = 0;
  for (let i = 0; i < NGRID; i += 1) W += 0.5 * E[i] ** 2 * DX;
  return W;
}

// Cold two-stream dispersion (two equal beams at +/- v0, plasma
// frequency wp). With a = k v0 the unstable root is
//   omega^2 = [ (2 a^2 + wp^2) - wp sqrt(8 a^2 + wp^2) ] / 2 ,
// and the growth rate is gamma = sqrt(-omega^2) when that is
// negative (unstable for a < wp). Maximised over a at a^2 = 3 wp^2/8
// where gamma = wp / (2 sqrt 2) (Krall and Trivelpiece 1973).
export function twoStreamGrowth(k, v0, wp = 1) {
  const a2 = (k * v0) ** 2;
  const X = (2 * a2 + wp * wp - wp * Math.sqrt(8 * a2 + wp * wp)) / 2;
  return X < 0 ? Math.sqrt(-X) : 0;
}
export function twoStreamMaxGrowth(wp = 1) { return wp / (2 * Math.SQRT2); }

// |rho_hat[k]| for k = 1..K (the spectrogram input).
export function modeAmplitudes(state, K = 8) {
  const rho = depositCharge(state.x, state.w);
  const out = new Float64Array(K);
  for (let k = 1; k <= K; k += 1) {
    let re = 0, im = 0;
    for (let n = 0; n < NGRID; n += 1) {
      const phase = -2 * Math.PI * k * n / NGRID;
      re += rho[n] * Math.cos(phase);
      im += rho[n] * Math.sin(phase);
    }
    out[k - 1] = Math.sqrt(re * re + im * im);
  }
  return out;
}

// Least-squares growth rate of mode 1 over a fixed linear window.
export function measuredGrowthRate(v0, { dt = 0.05, t0 = 3, t1 = 6, seed = 7 } = {}) {
  const s = createTwoStream({ v0, T: 0.01, seed });
  const ts = [], ls = [];
  const nMax = Math.round(t1 / dt);
  for (let n = 0; n <= nMax; n += 1) {
    if (n > 0) stepPIC(s, dt);
    const t = n * dt;
    if (t >= t0 && t <= t1) { ts.push(t); ls.push(Math.log(Math.max(1e-9, modeOneAmplitude(s)))); }
  }
  const m = ts.length;
  let mt = 0, ml = 0;
  for (let i = 0; i < m; i += 1) { mt += ts[i]; ml += ls[i]; }
  mt /= m; ml /= m;
  let num = 0, den = 0;
  for (let i = 0; i < m; i += 1) { num += (ts[i] - mt) * (ls[i] - ml); den += (ts[i] - mt) ** 2; }
  return num / den;
}

// Mode 1 amplitude: log|rho_hat[1]| for tracking growth rate.
export function modeOneAmplitude(state) {
  const rho = depositCharge(state.x, state.w);
  let re = 0, im = 0;
  for (let n = 0; n < NGRID; n += 1) {
    const phase = -2 * Math.PI * 1 * n / NGRID;
    re += rho[n] * Math.cos(phase);
    im += rho[n] * Math.sin(phase);
  }
  return Math.sqrt(re * re + im * im);
}
