// sim.js
// Kuramoto model: N coupled phase oscillators.
//
//   theta_i' = omega_i + (K / N) sum_j sin(theta_j - theta_i)
//
// where omega_i are intrinsic frequencies drawn from a distribution g(omega),
// K is the coupling strength. The order parameter
//
//   r e^{i psi} = (1 / N) sum_j e^{i theta_j}
//
// quantifies synchronization: r = 0 incoherent, r -> 1 fully synchronized.
// For symmetric unimodal g, there is a critical coupling K_c above which
// r > 0 in the thermodynamic limit. For Lorentzian g, K_c = 2 / (pi g(0))
// (for Lorentz with HWHM gamma: K_c = 2 gamma).
//
// Reference: Kuramoto 1984 (`kuramoto1984`); Strogatz, Nonlinear Dynamics
// Ch. 8.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

export const N = 128;

// Draw natural frequencies from a Lorentzian distribution with HWHM = gamma.
// Use inverse-CDF sampling: omega = gamma tan(pi (u - 0.5)).
function drawLorentzian(rng, gamma) {
  return gamma * Math.tan(Math.PI * (rng() - 0.5));
}

export function createKuramoto({ K = 1.5, gamma = 0.5, seed = DEFAULT_SEED } = {}) {
  const rng = makeRng(seed);
  const theta = new Float64Array(N);
  const omega = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    theta[i] = 2 * Math.PI * rng();
    omega[i] = drawLorentzian(rng, gamma);
  }
  return { theta, omega, K, gamma, t: 0, nSteps: 0 };
}

export function stepKuramoto(s, dt = 0.01) {
  // Compute order parameter r, psi.
  let sx = 0, sy = 0;
  for (let i = 0; i < N; i += 1) {
    sx += Math.cos(s.theta[i]);
    sy += Math.sin(s.theta[i]);
  }
  sx /= N; sy /= N;
  const r = Math.sqrt(sx * sx + sy * sy);
  const psi = Math.atan2(sy, sx);
  // Update each oscillator: theta_i' = omega_i + K r sin(psi - theta_i).
  for (let i = 0; i < N; i += 1) {
    const dtheta = s.omega[i] + s.K * r * Math.sin(psi - s.theta[i]);
    s.theta[i] += dtheta * dt;
  }
  s.t += dt;
  s.nSteps += 1;
}

export function orderParameter(s) {
  let sx = 0, sy = 0;
  for (let i = 0; i < N; i += 1) {
    sx += Math.cos(s.theta[i]);
    sy += Math.sin(s.theta[i]);
  }
  return Math.sqrt((sx * sx + sy * sy)) / N;
}

// Theoretical critical coupling for Lorentzian g with HWHM gamma:
// K_c = 2 gamma.
export function criticalCoupling(gamma) { return 2 * gamma; }
