// sim.js
// Damped, driven simple harmonic oscillator:
//
//   x'' + 2 gamma x' + omega_0^2 x = F_0 cos(omega t)
//
// where omega_0 is the natural frequency, gamma is the damping, and
// omega is the drive frequency. The steady-state amplitude is
//
//   A(omega) = F_0 / sqrt((omega_0^2 - omega^2)^2 + (2 gamma omega)^2)
//
// and the resonance peak sits at omega_r = omega_0 sqrt(1 - 2 (gamma / omega_0)^2)
// for an underdamped oscillator. The quality factor is Q = omega_0 / (2 gamma).
//
// Reference: Strogatz, Nonlinear Dynamics Ch. 7 (`marion-thornton` for the
// canonical treatment).

export const OMEGA0 = 1.0;
export const F0 = 1.0;

export function steadyAmplitude(omega, gamma) {
  return F0 / Math.sqrt(
    (OMEGA0 * OMEGA0 - omega * omega) ** 2 + (2 * gamma * omega) ** 2
  );
}
export function steadyPhase(omega, gamma) {
  // phase lag of x relative to drive: phi = atan2(2 gamma omega, omega_0^2 - omega^2)
  return Math.atan2(2 * gamma * omega, OMEGA0 * OMEGA0 - omega * omega);
}
export function qualityFactor(gamma) { return OMEGA0 / (2 * gamma); }
export function resonancePeak(gamma) {
  const inside = 1 - 2 * (gamma / OMEGA0) ** 2;
  return inside > 0 ? OMEGA0 * Math.sqrt(inside) : 0;
}

// Numerical integration (RK4) so the user can see transient + steady state.
export function createDriven({ omega = 1.0, gamma = 0.1, x0 = 0, v0 = 0 } = {}) {
  return { omega, gamma, x: x0, v: v0, t: 0, nSteps: 0 };
}
function deriv(s) {
  const dvdt = -2 * s.gamma * s.v - OMEGA0 * OMEGA0 * s.x + F0 * Math.cos(s.omega * s.t);
  return { dx: s.v, dv: dvdt };
}
export function stepDriven(s, dt = 0.01) {
  // RK4. The intermediate states need x += dt*fac*v, not fac*v, etc.
  function combine(s0, k, fac) {
    return { omega: s0.omega, gamma: s0.gamma, x: s0.x + dt * fac * k.dx, v: s0.v + dt * fac * k.dv, t: s0.t + dt * fac };
  }
  const k1 = deriv(s);
  const k2 = deriv(combine(s, k1, 0.5));
  const k3 = deriv(combine(s, k2, 0.5));
  const k4 = deriv(combine(s, k3, 1.0));
  s.x += dt / 6 * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
  s.v += dt / 6 * (k1.dv + 2 * k2.dv + 2 * k3.dv + k4.dv);
  s.t += dt;
  s.nSteps += 1;
}
