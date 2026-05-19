// Single point-mass gravitational microlensing core (no DOM), shared by
// playground.js and invariants.test.mjs. Angles in Einstein-radius units.
//
//   A(u) = (u^2 + 2) / (u sqrt(u^2 + 4))            (point-lens magnification)
//   u(t) = sqrt(u_min^2 + ((t - t0)/t_E)^2)         (Paczynski trajectory)
//   theta_pm = (u +/- sqrt(u^2 + 4)) / 2            (the two images)
//
// Reference: Paczynski, ApJ 304, 1 (1986); Gaudi, ARA&A 50, 411 (2012).

// Total magnification of the unresolved image pair at impact u (>0).
export function magnification(u) {
  const uu = Math.max(u, 1e-9);
  return (uu * uu + 2) / (uu * Math.sqrt(uu * uu + 4));
}

// The two image positions (theta_E units): a major (+) and minor (-) image.
export function imagePositions(u) {
  const d = Math.sqrt(u * u + 4);
  return [0.5 * (u + d), 0.5 * (u - d)];
}

// Source-lens separation at time t for impact parameter u_min and
// Einstein crossing time t_E, with the peak at t0.
export function uOfT(uMin, tE, t, t0 = 0) {
  return Math.sqrt(uMin * uMin + ((t - t0) / tE) ** 2);
}

// Paczynski light curve A(t) sampled over tArr.
export function lightCurve(uMin, tE, tArr, t0 = 0) {
  return tArr.map((t) => magnification(uOfT(uMin, tE, t, t0)));
}

// Peak magnification of an event (closest approach, u = u_min).
export function peakMagnification(uMin) {
  return magnification(uMin);
}
