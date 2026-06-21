// sim.js
// Kapitza pendulum: a rigid pendulum of length l whose pivot is driven
// vertically by y_p(t) = a cos(omega t). The pendulum can be stabilized
// upside-down (theta = 0 is "up") when the drive parameter satisfies
//   a^2 omega^2 / (2 g l) > 1   (Kapitza criterion).
//
// Equation of motion in the inertial frame with pivot acceleration
// a_p(t) = -a omega^2 cos(omega t) acting like an effective gravity:
//   theta'' = -(g - a omega^2 cos(omega t)) / l * sin(theta)
//
// Here theta is measured from straight up (theta = 0 is upside-down rest).
//
// Reference: Landau and Lifshitz I Sec. 30 (`landau-lifshitz-mechanics`);
// Kapitza 1951.

export const G_GRAV = 9.81;
export const L_PEN = 1.0;

export function createKapitza({ theta = 0.05, thetadot = 0, a = 0.1, omega = 30 } = {}) {
  return { theta, thetadot, a, omega, t: 0, nSteps: 0 };
}

function deriv(s) {
  // For inverted pendulum (theta = 0 is straight up), gravity is destabilizing:
  // theta'' = +(g_eff / l) * sin(theta) where g_eff is the effective downward
  // pull. With pivot driven at y_p(t) = a cos(omega t), the inertial-frame
  // effective gravity is g - a omega^2 cos(omega t).
  const eff = G_GRAV - s.a * s.omega * s.omega * Math.cos(s.omega * s.t);
  return {
    dth: s.thetadot,
    dthd: (eff / L_PEN) * Math.sin(s.theta),
  };
}

export function stepKapitza(s, dt = 0.0005) {
  function combine(s0, k, fac) {
    return { theta: s0.theta + dt * fac * k.dth, thetadot: s0.thetadot + dt * fac * k.dthd,
             a: s0.a, omega: s0.omega, t: s0.t + dt * fac };
  }
  const k1 = deriv(s);
  const k2 = deriv(combine(s, k1, 0.5));
  const k3 = deriv(combine(s, k2, 0.5));
  const k4 = deriv(combine(s, k3, 1.0));
  s.theta    += dt / 6 * (k1.dth  + 2 * k2.dth  + 2 * k3.dth  + k4.dth);
  s.thetadot += dt / 6 * (k1.dthd + 2 * k2.dthd + 2 * k3.dthd + k4.dthd);
  s.t += dt;
  s.nSteps += 1;
}

// Stability criterion (Kapitza): a^2 omega^2 > 2 g l.
export function isStable(a, omega) {
  return a * a * omega * omega > 2 * G_GRAV * L_PEN;
}
export function stabilityRatio(a, omega) {
  return (a * a * omega * omega) / (2 * G_GRAV * L_PEN);
}

// Effective slow-time potential (Landau-Lifshitz), with theta measured from
// straight up so the bob is highest (largest gravitational PE) at theta = 0:
//   U_eff(theta) = m g l cos(theta) + (1/4) m (a omega)^2 sin^2(theta)
// With m = 1, l = 1, theta = 0 (up) is a local minimum iff a^2 omega^2 > 2 g l;
// below threshold it is a maximum and the bob rolls down to theta = pi.
export function effectivePotential(theta, a, omega) {
  return G_GRAV * Math.cos(theta) + 0.25 * (a * omega) ** 2 * Math.sin(theta) * Math.sin(theta);
}
