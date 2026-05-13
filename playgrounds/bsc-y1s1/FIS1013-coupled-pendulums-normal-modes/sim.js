// sim.js
// Two identical pendulums of length L and mass m coupled by a spring
// of constant k attached at distance d from the pivot. Small-angle
// (linearized) equations of motion:
//
//   m L^2 theta_1_ddot + m g L theta_1 + k d^2 (theta_1 - theta_2) = 0
//   m L^2 theta_2_ddot + m g L theta_2 + k d^2 (theta_2 - theta_1) = 0
//
// Normal modes:
//   symmetric  (theta_1 = theta_2): omega_+ = sqrt(g / L)
//   anti-symm  (theta_1 = -theta_2): omega_- = sqrt(g / L + 2 k d^2 / (m L^2))
//
// Beating period for the asymmetric initial condition
// (theta_1 = A, theta_2 = 0): T_beat = 2 pi / (omega_- - omega_+).
//
// Reference: French, Vibrations and Waves Ch. 5 (`french-waves`).

export const G = 9.81;

export function createCoupled({
  L = 1.0, m = 1.0, k = 4.0, d = 0.5,
  theta1 = 0.2, theta2 = 0.0,
  omega1 = 0, omega2 = 0,
} = {}) {
  return {
    L, m, k, d,
    theta1, theta2,
    omega1, omega2,
    t: 0,
    nSteps: 0,
  };
}

// Normal-mode angular frequencies.
export function omegaSym(L)      { return Math.sqrt(G / L); }
export function omegaAnti(L, m, k, d) {
  return Math.sqrt(G / L + 2 * k * d * d / (m * L * L));
}
export function beatPeriod(L, m, k, d) {
  const wm = omegaSym(L);
  const wp = omegaAnti(L, m, k, d);
  if (Math.abs(wp - wm) < 1e-12) return Infinity;
  return 2 * Math.PI / (wp - wm);
}

function accel(s, theta1, theta2) {
  // Linearized: ddtheta = -(g/L) theta - (k d^2 / m L^2) (theta - other)
  const a1 = -(G / s.L) * theta1 - (s.k * s.d * s.d / (s.m * s.L * s.L)) * (theta1 - theta2);
  const a2 = -(G / s.L) * theta2 - (s.k * s.d * s.d / (s.m * s.L * s.L)) * (theta2 - theta1);
  return [a1, a2];
}

// RK4.
export function stepCoupled(s, dt = 0.005) {
  const [k1a1, k1a2] = accel(s, s.theta1, s.theta2);
  const k1v1 = s.omega1, k1v2 = s.omega2;

  const t2_1 = s.theta1 + 0.5 * dt * k1v1;
  const t2_2 = s.theta2 + 0.5 * dt * k1v2;
  const o2_1 = s.omega1 + 0.5 * dt * k1a1;
  const o2_2 = s.omega2 + 0.5 * dt * k1a2;
  const [k2a1, k2a2] = accel(s, t2_1, t2_2);
  const k2v1 = o2_1, k2v2 = o2_2;

  const t3_1 = s.theta1 + 0.5 * dt * k2v1;
  const t3_2 = s.theta2 + 0.5 * dt * k2v2;
  const o3_1 = s.omega1 + 0.5 * dt * k2a1;
  const o3_2 = s.omega2 + 0.5 * dt * k2a2;
  const [k3a1, k3a2] = accel(s, t3_1, t3_2);
  const k3v1 = o3_1, k3v2 = o3_2;

  const t4_1 = s.theta1 + dt * k3v1;
  const t4_2 = s.theta2 + dt * k3v2;
  const o4_1 = s.omega1 + dt * k3a1;
  const o4_2 = s.omega2 + dt * k3a2;
  const [k4a1, k4a2] = accel(s, t4_1, t4_2);
  const k4v1 = o4_1, k4v2 = o4_2;

  s.theta1 += dt / 6 * (k1v1 + 2 * k2v1 + 2 * k3v1 + k4v1);
  s.theta2 += dt / 6 * (k1v2 + 2 * k2v2 + 2 * k3v2 + k4v2);
  s.omega1 += dt / 6 * (k1a1 + 2 * k2a1 + 2 * k3a1 + k4a1);
  s.omega2 += dt / 6 * (k1a2 + 2 * k2a2 + 2 * k3a2 + k4a2);
  s.t += dt;
  s.nSteps += 1;
}

// Total small-angle energy (kinetic + gravitational + spring).
export function energy(s) {
  const ke = 0.5 * s.m * s.L * s.L * (s.omega1 * s.omega1 + s.omega2 * s.omega2);
  const pe = 0.5 * s.m * G * s.L * (s.theta1 * s.theta1 + s.theta2 * s.theta2);
  const dx = s.d * (s.theta1 - s.theta2);
  const spr = 0.5 * s.k * dx * dx;
  return { ke, pe, spr, total: ke + pe + spr };
}
