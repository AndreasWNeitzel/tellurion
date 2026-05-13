// sim.js
// 1D Smoothed Particle Hydrodynamics (SPH) Sod shock-tube test.
//
// Initial condition (Sod 1978):
//   left  half:  rho = 1.0,  v = 0,  P = 1.0
//   right half:  rho = 0.125, v = 0, P = 0.1
// Ideal gas with gamma = 1.4. The exact solution is a left-moving
// rarefaction fan, a contact discontinuity, and a right-moving shock.
//
// SPH variables for each particle: position x_i, velocity v_i, mass m_i
// (constant), internal energy u_i. Density rho_i = sum_j m_j W(x_i - x_j, h)
// where W is the smoothing kernel (cubic spline). Equation of state: P = (gamma - 1) rho u.
//
// Reference: Monaghan 1992 ARAA review; Price 2012 J. Comp. Phys.; LeVeque
// FV 2002 Ch. 14 (`leveque2002`).

import { makeRng } from '../../../shared/js/render/rng.js';

const GAMMA = 1.4;
const SMOOTH_H = 0.04;       // smoothing length
const ALPHA_VISC = 1.0;      // artificial viscosity
const BETA_VISC = 2.0;

export const NLEFT = 320, NRIGHT = 40;
export const N = NLEFT + NRIGHT;
const X_MIN = 0, X_MAX = 1, X_INTERFACE = 0.5;

// Cubic spline kernel W(r, h) in 1D
function W(r, h) {
  const q = Math.abs(r) / h;
  const sigma = 2 / (3 * h);
  if (q <= 1) return sigma * (1 - 1.5 * q * q + 0.75 * q * q * q);
  if (q <= 2) return sigma * 0.25 * Math.pow(2 - q, 3);
  return 0;
}
function dW(r, h) {
  const q = Math.abs(r) / h;
  const sign = r >= 0 ? 1 : -1;
  const sigma = 2 / (3 * h);
  if (q <= 1) return sigma * sign * (-3 * q + 2.25 * q * q) / h;
  if (q <= 2) return sigma * sign * -0.75 * (2 - q) * (2 - q) / h;
  return 0;
}

export function createSod() {
  const x = new Float64Array(N);
  const v = new Float64Array(N);
  const u = new Float64Array(N);
  const m = new Float64Array(N);
  // Place particles uniformly in each half. Mass per particle = rho_half * dx_half.
  const dxL = (X_INTERFACE - X_MIN) / NLEFT;
  const dxR = (X_MAX - X_INTERFACE) / NRIGHT;
  for (let i = 0; i < NLEFT; i += 1) {
    x[i] = X_MIN + (i + 0.5) * dxL;
    m[i] = 1.0 * dxL;       // rho_L = 1
    // u_L = P / ((gamma - 1) rho) = 1.0 / (0.4 * 1.0) = 2.5
    u[i] = 1.0 / ((GAMMA - 1) * 1.0);
  }
  for (let i = NLEFT; i < N; i += 1) {
    x[i] = X_INTERFACE + (i - NLEFT + 0.5) * dxR;
    m[i] = 0.125 * dxR;
    u[i] = 0.1 / ((GAMMA - 1) * 0.125);
  }
  return { x, v, u, m, t: 0, nSteps: 0 };
}

function computeRho(state) {
  const rho = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    let s = 0;
    for (let j = 0; j < N; j += 1) {
      const r = state.x[i] - state.x[j];
      if (Math.abs(r) < 2 * SMOOTH_H) s += state.m[j] * W(r, SMOOTH_H);
    }
    rho[i] = Math.max(1e-6, s);
  }
  return rho;
}

export function stepSPH(state, dt = 0.001) {
  const rho = computeRho(state);
  const P = new Float64Array(N);
  for (let i = 0; i < N; i += 1) P[i] = (GAMMA - 1) * rho[i] * state.u[i];
  const cs = new Float64Array(N);
  for (let i = 0; i < N; i += 1) cs[i] = Math.sqrt(GAMMA * Math.max(0, P[i]) / rho[i]);
  const dvdt = new Float64Array(N);
  const dudt = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    for (let j = 0; j < N; j += 1) {
      if (i === j) continue;
      const dx = state.x[i] - state.x[j];
      if (Math.abs(dx) >= 2 * SMOOTH_H) continue;
      const dv = state.v[i] - state.v[j];
      const dwdx = dW(dx, SMOOTH_H);
      // Pressure term (symmetric form): -m_j (P_i/rho_i^2 + P_j/rho_j^2) dW/dx
      const presTerm = -state.m[j] * (P[i] / (rho[i] * rho[i]) + P[j] / (rho[j] * rho[j])) * dwdx;
      // Artificial viscosity (Monaghan 1992) for shocks
      let Pi_ij = 0;
      const vdotr = dv * dx;
      if (vdotr < 0) {
        const cMean = 0.5 * (cs[i] + cs[j]);
        const rhoMean = 0.5 * (rho[i] + rho[j]);
        const mu = SMOOTH_H * vdotr / (dx * dx + 0.01 * SMOOTH_H * SMOOTH_H);
        Pi_ij = (-ALPHA_VISC * cMean * mu + BETA_VISC * mu * mu) / rhoMean;
      }
      dvdt[i] += presTerm + state.m[j] * (-Pi_ij) * dwdx;
      // Energy equation: du/dt = (P/rho^2) (m_j (v_i - v_j) dW)
      dudt[i] += 0.5 * state.m[j] * (P[i] / (rho[i] * rho[i]) + P[j] / (rho[j] * rho[j])) * dv * dwdx
              + 0.5 * state.m[j] * Pi_ij * dv * dwdx;
    }
  }
  for (let i = 0; i < N; i += 1) {
    state.v[i] += dt * dvdt[i];
    state.x[i] += dt * state.v[i];
    state.u[i] += dt * dudt[i];
    if (state.u[i] < 1e-6) state.u[i] = 1e-6;
    // Reflective boundaries
    if (state.x[i] < X_MIN) { state.x[i] = X_MIN; state.v[i] = -state.v[i]; }
    if (state.x[i] > X_MAX) { state.x[i] = X_MAX; state.v[i] = -state.v[i]; }
  }
  state.t += dt;
  state.nSteps += 1;
}

export function diagnostics(state) {
  const rho = computeRho(state);
  return {
    rho,
    P: rho.map((r, i) => (GAMMA - 1) * r * state.u[i]),
    v: state.v,
    x: state.x,
    u: state.u,
  };
}

export function totalEnergy(state) {
  const rho = computeRho(state);
  let E = 0;
  for (let i = 0; i < N; i += 1) {
    E += state.m[i] * (0.5 * state.v[i] * state.v[i] + state.u[i]);
  }
  return E;
}

export function totalMass(state) {
  let M = 0;
  for (let i = 0; i < N; i += 1) M += state.m[i];
  return M;
}

export const X_DOMAIN = { min: X_MIN, max: X_MAX };
