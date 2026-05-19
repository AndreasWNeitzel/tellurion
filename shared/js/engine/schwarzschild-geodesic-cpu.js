// Schwarzschild geodesics (DOM-free engine). Units G = c = 1, mass M.
//
// Null and timelike geodesics in the equatorial plane, integrated in
// the orbit form with u = 1/r as a function of azimuth phi:
//
//   null:      d2u/dphi2 + u = 3 M u^2
//   timelike:  d2u/dphi2 + u = M / L^2 + 3 M u^2
//
// A photon with impact parameter b is captured if b < b_crit and
// scattered if b > b_crit, where
//
//   b_crit = 3 sqrt(3) M  ( the photon sphere is r = 3 M ).
//
// For massive particles the innermost stable circular orbit is
// r_isco = 6 M (Schwarzschild). These exact values are the invariant
// gate: a faked integrator cannot reproduce the sharp capture
// threshold and the conserved orbit quantity simultaneously.
//
// References: Misner, Thorne & Wheeler, Gravitation, Freeman 1973,
// Ch. 25; Hartle, Gravity, Addison-Wesley 2003, Ch. 9.

export function schwarzschildRadius(M = 1) { return 2 * M; }
export function photonSphere(M = 1) { return 3 * M; }
export function bCrit(M = 1) { return 3 * Math.sqrt(3) * M; }
export function iscoSchwarzschild(M = 1) { return 6 * M; }

// Effective potentials (per unit mass / per L^2), for the V(r) plot.
// Timelike: (E^2-1)/2 = (1/2)(dr/dtau)^2 + Veff,
//   Veff(r) = -M/r + L^2/(2 r^2) - M L^2 / r^3.
export function vTimelike(r, L, M = 1) {
  return -M / r + (L * L) / (2 * r * r) - (M * L * L) / (r * r * r);
}
// Null: 1/b^2 = (1/L^2)(dr/dlambda)^2 + Wnull,
//   Wnull(r) = (1/r^2)(1 - 2M/r).
export function wNull(r, M = 1) {
  return (1 / (r * r)) * (1 - 2 * M / r);
}

// The conserved orbit quantity for a null geodesic:
//   (du/dphi)^2 + u^2 - 2 M u^3 = 1 / b^2 = const.
export function nullInvariant(u, dudphi, M = 1) {
  return dudphi * dudphi + u * u - 2 * M * u * u * u;
}

// Integrate one geodesic in phi with RK4. Start far away (r0) moving
// inward with impact parameter b (null) or angular momentum L
// (timelike). Returns the (x,y) path, the outcome, the periapsis, and
// the max drift of the conserved quantity (null) for the invariant.
//   opts: { type:'null'|'timelike', M, r0, b, L, E, dphi, maxPhi }
export function integrateGeodesic(opts) {
  const M = opts.M ?? 1;
  const type = opts.type ?? 'null';
  const r0 = opts.r0 ?? 60 * M;
  const horizon = 2 * M;
  const dphi = opts.dphi ?? 0.004;
  const maxPhi = opts.maxPhi ?? 60;

  // Initial u and du/dphi from a ray incoming from r0 with impact
  // parameter b: far away dr/dphi = -r^2 / b (approx straight line),
  // so du/dphi = +1/b at u0 = 1/r0.
  const u0 = 1 / r0;
  let u = u0;
  let du;
  let invConst;
  // Incoming ray: as phi advances r decreases, so u increases and
  // du/dphi is POSITIVE on the approach (it passes through zero at
  // periapsis, then goes negative on the way back out).
  if (type === 'null') {
    const b = opts.b;
    du = Math.sqrt(Math.max(0, 1 / (b * b) - u0 * u0 + 2 * M * u0 * u0 * u0));
    invConst = 1 / (b * b);
  } else {
    const L = opts.L;
    const E = opts.E ?? 0.97;
    // (du/dphi)^2 = (E^2-1)/L^2 + 2M/L^2 u - u^2 + 2 M u^3
    const rhs = (E * E - 1) / (L * L) + (2 * M / (L * L)) * u0 - u0 * u0 + 2 * M * u0 * u0 * u0;
    du = Math.sqrt(Math.max(0, rhs));
    invConst = (E * E - 1) / (L * L);
  }

  const accel = (uu) => (type === 'null')
    ? (-uu + 3 * M * uu * uu)
    : (-uu + M / (opts.L * opts.L) + 3 * M * uu * uu);

  const xs = [], ys = [];
  let phi = 0, outcome = 'escape', peri = r0, maxDrift = 0;
  for (let n = 0; n < maxPhi / dphi; n += 1) {
    const r = 1 / u;
    if (r > 0) { xs.push(r * Math.cos(phi)); ys.push(r * Math.sin(phi)); peri = Math.min(peri, r); }
    if (r <= horizon * 1.001) { outcome = 'capture'; break; }
    // Back out past the start and still receding (u decreasing): gone.
    if (r > r0 * 1.2 && du < 0) { outcome = 'escape'; break; }
    // RK4 on (u, du)
    const k1u = du, k1d = accel(u);
    const k2u = du + 0.5 * dphi * k1d, k2d = accel(u + 0.5 * dphi * k1u);
    const k3u = du + 0.5 * dphi * k2d, k3d = accel(u + 0.5 * dphi * k2u);
    const k4u = du + dphi * k3d, k4d = accel(u + dphi * k3u);
    u += (dphi / 6) * (k1u + 2 * k2u + 2 * k3u + k4u);
    du += (dphi / 6) * (k1d + 2 * k2d + 2 * k3d + k4d);
    phi += dphi;
    if (u <= 0) { outcome = 'escape'; break; }
    if (type === 'null') {
      maxDrift = Math.max(maxDrift, Math.abs(nullInvariant(u, du, M) - invConst));
    }
    if (phi > maxPhi - dphi) outcome = (1 / u < 12 * M) ? 'bound' : 'escape';
  }
  return { xs, ys, outcome, periapsis: peri, maxDrift };
}
