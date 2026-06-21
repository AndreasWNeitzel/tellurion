// sim.js
// Tautochrone (isochrone): a cycloid bowl on which a frictionless bead's
// descent time to the bottom is independent of release height.
//
// Parametric upper half of an inverted cycloid:
//   x(theta) = R (theta - sin theta)
//   y(theta) = R (1 - cos theta)        (positive y upward; bowl bottom at theta = pi)
// We shift so that the bottom (theta = pi) is at origin, and the cycloid
// opens downward in y when used as a bowl; here it is easier to model the
// motion in s, the arc length from the bottom.
//
// Theorem (Huygens 1673): the period of a bead sliding on a cycloid bowl is
// T = 2 pi sqrt(R / g), independent of amplitude. Quarter-period
// descent time t_q = (pi / 2) sqrt(R / g).
//
// We solve the small motion in s using its Hamiltonian:
//   For a cycloid, s = 4 R sin(theta / 2), so theta = 2 arcsin(s / (4R)).
//   The energy E = m g y = m g R (1 - cos theta) = m g R (1 - (1 - s^2/(8R^2))) ...
// Actually for the cycloid, s satisfies s'' + (g / (4 R)) s = 0
// (simple harmonic) so any amplitude has period T = 2 pi sqrt(4 R / g) =
// 4 pi sqrt(R / g). Wait, let me redo.
//
// From Huygens / Lagrangian on the cycloid: choose arc length s measured
// from bottom. The equation of motion is s'' = -(g / (4 R)) s ... no,
// actually for a cycloid the constraint gives s'' = -(g / (4 R)) sin(s /
// (...) )  -- this is wrong. Let me redo properly.
//
// Standard result: on a cycloid bowl of cusp radius R, the motion is
// EXACTLY simple harmonic in arc-length s, with angular frequency
//   omega = sqrt(g / (4 R))
// so the FULL period is T = 2 pi sqrt(4 R / g) = 4 pi sqrt(R / g), and
// quarter-period (time from release to bottom) is t_q = pi sqrt(R / g).
//
// Reference: Huygens 1673, Horologium Oscillatorium (`huygens1673`).

export const R = 1.0;
export const G = 9.81;
export const OMEGA = Math.sqrt(G / (4 * R));
export const QUARTER_PERIOD = (Math.PI / 2) / OMEGA;
export const FULL_PERIOD = 2 * Math.PI / OMEGA;

// Position on cycloid at parameter theta (theta = 0 at top, pi at bottom).
// We use coordinates where bottom = (0, 0) and cycloid opens upward.
// Standard inverted cycloid through the bottom point:
//   x(theta) = R (theta - sin theta) - R pi   (shift so bottom at x = 0)
//   y(theta) = R (1 - cos theta)              (so bottom has y = 0 at theta = pi)
// But we need to be careful. Let me re-parametrize.
//
// For a bowl-shaped cycloid with bottom at origin and cusps at top, the
// parametric form is
//   x(theta) = R (theta - sin theta) - R pi
//   y(theta) = -R cos theta + R           (bottom at theta = pi has y = 0)
// Wait: y(theta = pi) = -R * (-1) + R = 2R. So bottom is at top? Let me
// flip. Use
//   x(theta) = R (theta - sin theta)
//   y(theta) = R (1 - cos theta)
// theta = 0: (0, 0). theta = pi: (R pi, 2R). theta = 2pi: (2 R pi, 0).
// So bottom of bowl is at theta = 0 or 2 pi; the curve from 0 to 2 pi is a
// "cup" with cusps at (0, 0) and (2 R pi, 0), max at (R pi, 2R).
// That's wrong for a bowl. The bowl is inverted:
//   x(theta) = R (theta - sin theta)
//   y(theta) = -R (1 - cos theta) + 2 R = R (1 + cos theta)
// Then theta = 0: (0, 2R). theta = pi: (R pi, 0). theta = 2 pi: (2 R pi, 2R).
// So bowl with bottom at theta = pi, point (R pi, 0). Cusps at (0, 2R) and
// (2 R pi, 2R). This is the inverted (upside-down) cycloid bowl. Good.

export function cycloidXY(theta) {
  return {
    x: R * (theta - Math.sin(theta)),
    y: R * (1 + Math.cos(theta)),
  };
}

// Arc-length from theta = pi (bottom) to theta:
//   s(theta) = 4 R sin((theta - pi) / 2)    (with sign indicating direction)
// We measure s so that s > 0 corresponds to theta > pi (right side of bowl).
export function arclengthFromBottom(theta) {
  return 4 * R * Math.sin((theta - Math.PI) / 2);
}

// Inverse: given s, find theta.
export function thetaFromS(s) {
  const arg = Math.max(-1, Math.min(1, s / (4 * R)));
  return Math.PI + 2 * Math.asin(arg);
}

// Bead position as a function of time, released from rest at initial
// arc-length s0. Equation: s'' = -omega^2 s, so s(t) = s0 cos(omega t).
export function beadPosition(s0, t) {
  const s = s0 * Math.cos(OMEGA * t);
  const theta = thetaFromS(s);
  return cycloidXY(theta);
}

// Sample the cycloid curve for rendering.
export function sampleCycloid(N = 200) {
  const pts = [];
  for (let i = 0; i <= N; i += 1) {
    const theta = 2 * Math.PI * i / N;
    pts.push(cycloidXY(theta));
  }
  return pts;
}

// Height above the bottom for a cycloid bead released at arc length s0.
export function cycloidHeight(s0) {
  return cycloidXY(thetaFromS(s0)).y;
}

// === Comparison bowl: a circular arc (the classic pendulum) ===
// Radius chosen so that, for tiny swings, the circle's period equals the
// cycloid's exactly (R_C = 4R gives omega_circle = sqrt(g/R_C) = OMEGA). For
// larger releases the circle is NOT isochronous: the descent time grows with
// amplitude (the finite-amplitude pendulum), so beads dropped from different
// heights arrive at different times, unlike the cycloid.
export const R_CIRCLE = 4 * R;

// Circle bowl point at swing angle phi from the bottom (bottom at origin,
// matching the cycloid bottom; opens upward).
export function circleXY(phi) {
  return { x: R_CIRCLE * Math.sin(phi), y: R_CIRCLE * (1 - Math.cos(phi)) };
}
// Release angle for a bead dropped from height h on the circle bowl.
export function circlePhi0FromHeight(h) {
  return Math.acos(Math.max(-1, Math.min(1, 1 - h / R_CIRCLE)));
}
// Complete elliptic integral of the first kind via the arithmetic-geometric
// mean (modulus k).
function ellipticK(k) {
  let a = 1, b = Math.sqrt(Math.max(0, 1 - k * k));
  for (let i = 0; i < 16; i += 1) { const a1 = 0.5 * (a + b); b = Math.sqrt(a * b); a = a1; }
  return Math.PI / (2 * a);
}
// Exact quarter-period (release-to-bottom time) of the circular pendulum at
// release angle phi0: t = sqrt(R_C/g) * K(sin(phi0/2)). Reduces to the cycloid
// quarter-period as phi0 -> 0.
export function circleQuarter(phi0) {
  return Math.sqrt(R_CIRCLE / G) * ellipticK(Math.sin(phi0 / 2));
}
// Pendulum acceleration phi'' = -(g/R_C) sin(phi). One RK4 step in place.
export function stepCircleBead(b, dt) {
  if (b.arrived) return;
  const k = (phi) => -(G / R_CIRCLE) * Math.sin(phi);
  const a1 = k(b.phi);
  const a2 = k(b.phi + 0.5 * dt * b.w);
  const a3 = k(b.phi + 0.5 * dt * b.w);
  const a4 = k(b.phi + dt * b.w);
  const prevPhi = b.phi;
  b.phi += dt * (b.w + (dt / 6) * (a1 + a2 + a3));
  b.w += (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
  // First crossing of the bottom (phi = 0): park it there.
  if ((prevPhi < 0 && b.phi >= 0) || (prevPhi > 0 && b.phi <= 0)) { b.phi = 0; b.arrived = true; }
}
