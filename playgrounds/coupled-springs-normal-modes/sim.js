// sim.js
// Two equal masses on a frictionless track, coupled by three identical
// springs to two fixed walls: wall-(k)-m-(k)-m-(k)-wall. The equations of
// motion in terms of displacements x1 (left mass), x2 (right mass) are
//
//   m d2 x1 / dt2 = -k x1 + k (x2 - x1) = -2 k x1 + k x2
//   m d2 x2 / dt2 = -k (x2 - x1) - k x2 = +k x1 - 2 k x2
//
// Eigenmodes:
//   omega_+ = sqrt(k / m),  in-phase  ((x1, x2) ~ (1, 1))
//   omega_- = sqrt(3 k / m),  out-of-phase ((x1, x2) ~ (1, -1))
//
// Reference: Goldstein Classical Mechanics Ch. 6 (`goldstein2001`). Closed
// form for arbitrary initial conditions:
//   x1(t) = (A_+ cos(omega_+ t + phi_+) + A_- cos(omega_- t + phi_-))
//   x2(t) = (A_+ cos(omega_+ t + phi_+) - A_- cos(omega_- t + phi_-))
//
// This file gives both the symplectic Euler integrator (for energy bookkeeping)
// and the analytic solution (for invariants tests).

export const K = 1.0;
export const M = 1.0;
export const OMEGA_PLUS  = Math.sqrt(K / M);
export const OMEGA_MINUS = Math.sqrt(3 * K / M);

export function createSprings({ x1_0 = 0.6, x2_0 = 0.0, v1_0 = 0, v2_0 = 0 } = {}) {
  return { x1: x1_0, x2: x2_0, v1: v1_0, v2: v2_0, t: 0, nSteps: 0 };
}

// Symplectic (velocity-Verlet) step. Forces:
//   F1 = -2 k x1 + k x2
//   F2 = +k x1 - 2 k x2
function forces(x1, x2) {
  return [-2 * K * x1 + K * x2, K * x1 - 2 * K * x2];
}

export function stepVerlet(s, dt = 0.005) {
  const [a1_0, a2_0] = forces(s.x1, s.x2);
  s.x1 += s.v1 * dt + 0.5 * a1_0 / M * dt * dt;
  s.x2 += s.v2 * dt + 0.5 * a2_0 / M * dt * dt;
  const [a1_1, a2_1] = forces(s.x1, s.x2);
  s.v1 += 0.5 * (a1_0 + a1_1) / M * dt;
  s.v2 += 0.5 * (a2_0 + a2_1) / M * dt;
  s.t += dt;
  s.nSteps += 1;
}

// Analytic decomposition: project initial state onto eigenmodes.
// Given (x1, x2, v1, v2), the eigenmode amplitudes are
//   A_+ = (x1 + x2) / 2   (symmetric mode)
//   A_- = (x1 - x2) / 2   (antisymmetric mode)
export function modeAmplitudes(state) {
  return {
    Aplus:  (state.x1 + state.x2) / 2,
    Aminus: (state.x1 - state.x2) / 2,
  };
}

export function analyticState(s0, t) {
  // Decompose initial conditions onto modes.
  const q_plus_0  = (s0.x1 + s0.x2) / 2;
  const p_plus_0  = (s0.v1 + s0.v2) / 2;
  const q_minus_0 = (s0.x1 - s0.x2) / 2;
  const p_minus_0 = (s0.v1 - s0.v2) / 2;
  const q_plus  = q_plus_0  * Math.cos(OMEGA_PLUS  * t) + (p_plus_0  / OMEGA_PLUS)  * Math.sin(OMEGA_PLUS  * t);
  const q_minus = q_minus_0 * Math.cos(OMEGA_MINUS * t) + (p_minus_0 / OMEGA_MINUS) * Math.sin(OMEGA_MINUS * t);
  return {
    x1: q_plus + q_minus,
    x2: q_plus - q_minus,
  };
}

export function totalEnergy(s) {
  const KE = 0.5 * M * (s.v1 * s.v1 + s.v2 * s.v2);
  const PE = 0.5 * K * (s.x1 * s.x1 + (s.x2 - s.x1) * (s.x2 - s.x1) + s.x2 * s.x2);
  return KE + PE;
}

// Modes:
//   pure in-phase: x1_0 = x2_0 = a, v1 = v2 = 0
//   pure out-of-phase: x1_0 = a, x2_0 = -a, v1 = v2 = 0
export function purePlusMode(amp = 0.5)  { return createSprings({ x1_0:  amp, x2_0:  amp }); }
export function pureMinusMode(amp = 0.5) { return createSprings({ x1_0:  amp, x2_0: -amp }); }
