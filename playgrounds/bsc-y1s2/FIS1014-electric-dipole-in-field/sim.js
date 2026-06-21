// sim.js
// An electric dipole p in a uniform field E. The field pulls the two charges in
// opposite directions, a couple with no net force but a torque
//   tau = p x E,  |tau| = p E sin(theta),
// that rotates the dipole toward alignment. The orientation energy is
//   U(theta) = -p . E = -p E cos(theta),
// minimum when aligned (theta = 0), maximum when anti-aligned (theta = pi). With
// no damping the dipole librates about the field direction like a pendulum, small
// oscillations of period T = 2 pi sqrt(I / (p E)); damping lets it settle into
// alignment.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Sec. 4.1.3
// (torque and energy of a dipole in a field); the libration is the rigid-pendulum
// equation, e.g. Taylor, Classical Mechanics, Sec. 4.4.

export function torque(p, E, theta) { return -p * E * Math.sin(theta); }
export function energyU(p, E, theta) { return -p * E * Math.cos(theta); }
export function totalEnergy(I, omega, p, E, theta) { return 0.5 * I * omega * omega + energyU(p, E, theta); }
export function smallAnglePeriod(I, p, E) { return 2 * Math.PI * Math.sqrt(I / (p * E)); }

// one symplectic (velocity-Verlet) step of the pendulum equation
//   I theta'' = -p E sin(theta) - gamma theta'.
export function step(s, dt, params) {
  const { I, p, E, gamma } = params;
  const accel = (th, om) => (torque(p, E, th) - gamma * om) / I;
  const a0 = accel(s.theta, s.omega);
  const thetaNew = s.theta + s.omega * dt + 0.5 * a0 * dt * dt;
  // semi-implicit correction for the velocity-dependent damping term.
  const aHalf = (torque(p, E, thetaNew)) / I;
  const omegaNew = (s.omega + 0.5 * (a0 + aHalf) * dt) / (1 + 0.5 * gamma / I * dt);
  return { theta: thetaNew, omega: omegaNew };
}
