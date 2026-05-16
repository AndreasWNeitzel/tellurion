// sim.js
// Foucault pendulum: small-amplitude pendulum in the rotating Earth frame.
//
// In the horizontal (x, y) plane at latitude phi, with rotation rate
// Omega_z = Omega sin(phi) about the local vertical, the linearized
// equations of motion are
//
//   x'' = -omega_0^2 x + 2 Omega_z y'
//   y'' = -omega_0^2 y - 2 Omega_z x'
//
// where omega_0 = sqrt(g / L) is the pendulum frequency.
//
// Solution: the oscillation plane precesses at rate -Omega_z (clockwise in
// northern hemisphere) regardless of initial swing direction. A full
// rotation takes 24 hours / sin(phi).
//
// Time units: Earth's day = 86400 s. Pendulum L = 67 m (the original Paris
// Pantheon installation), so omega_0 = sqrt(9.81 / 67) approx 0.383 rad/s,
// period T_0 approx 16.4 s. For visualization speed we scale time so the
// rotation is visible quickly: Omega_z gives a 24-second precession at the
// pole instead of 24-hour.
//
// The swing-to-precession frequency ratio is the only thing that controls
// how the rosette looks. The real Pantheon pendulum makes ~5000 swings per
// precession. The earlier OMEGA_0 = 1 gave only ~5 swings per precession,
// so the plane visibly slewed within a single swing and the motion looked
// forced. OMEGA_0 = 7 gives ~40 swings per precession at 45 deg: a dense,
// physically faithful star rosette and a swing that reads as natural. This
// is a pure time-scaling choice; every precession relationship below is
// unchanged and the invariants test the relationships, not the magnitude.
//
// Reference: Marion and Thornton, Classical Dynamics 5e Ch. 10
// (`marion-thornton`).

export const OMEGA_0 = 7.0;
export const T_PRECESS_REFERENCE = 24.0;   // seconds for precession at latitude 90 deg

export function omegaZ(latitudeDeg) {
  // Full precession rate; positive in N hemisphere = clockwise when viewed
  // from above (so negative omega_z in the math sign convention).
  const phi = (latitudeDeg * Math.PI) / 180;
  return (2 * Math.PI / T_PRECESS_REFERENCE) * Math.sin(phi);
}

export function precessionPeriod(latitudeDeg) {
  const phi = (latitudeDeg * Math.PI) / 180;
  return T_PRECESS_REFERENCE / Math.sin(phi);
}

export function createFoucault({ latDeg = 45, x0 = 1.0, y0 = 0, vx0 = 0, vy0 = 0 } = {}) {
  return { x: x0, y: y0, vx: vx0, vy: vy0, lat: latDeg, t: 0, nSteps: 0 };
}

function deriv(s) {
  const Oz = omegaZ(s.lat);
  return {
    dx: s.vx,
    dy: s.vy,
    dvx: -OMEGA_0 * OMEGA_0 * s.x + 2 * Oz * s.vy,
    dvy: -OMEGA_0 * OMEGA_0 * s.y - 2 * Oz * s.vx,
  };
}

export function stepFoucault(s, dt = 0.01) {
  function combine(s0, k, fac) {
    return { x: s0.x + fac * k.dx, y: s0.y + fac * k.dy, vx: s0.vx + fac * k.dvx, vy: s0.vy + fac * k.dvy, lat: s0.lat };
  }
  const k1 = deriv(s);
  const k2 = deriv(combine(s, k1, dt / 2));
  const k3 = deriv(combine(s, k2, dt / 2));
  const k4 = deriv(combine(s, k3, dt));
  s.x += dt / 6 * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
  s.y += dt / 6 * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
  s.vx += dt / 6 * (k1.dvx + 2 * k2.dvx + 2 * k3.dvx + k4.dvx);
  s.vy += dt / 6 * (k1.dvy + 2 * k2.dvy + 2 * k3.dvy + k4.dvy);
  s.t += dt;
  s.nSteps += 1;
}
