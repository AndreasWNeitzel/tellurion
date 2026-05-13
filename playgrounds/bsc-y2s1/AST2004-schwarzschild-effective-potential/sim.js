// sim.js
// Effective radial potential for geodesics in Schwarzschild spacetime.
//
// Massive test particle (timelike geodesic):
//   V_eff(r) = (1/2)(1 - 2 M/r)(1 + L^2 / r^2) - 1/2
// (so V_eff -> 0 at infinity for a particle at rest at infinity, E^2 = 1.)
//
// Equivalent radial equation: (dr/dtau)^2 + 2 V_eff = E^2 - 1.
//
// Massless (null geodesic, photon):
//   V_eff_photon(r) = (1/2)(L^2 / r^2)(1 - 2 M / r)
//
// Photon sphere: maximum of V_eff_photon at r = 3M, b_crit = 3 sqrt(3) M.
// Massive ISCO: smallest stable circular orbit at r = 6M (for L > 0 and
// finite). For L = 2 sqrt(3) M = critical L, V_eff has inflection at 6M.
//
// Reference: Carroll, Spacetime and Geometry Ch. 5; Hartle Ch. 9
// (`schutz-firstcourse`).

export const M = 1.0;

export function veffMassive(r, L) {
  if (r <= 0) return Infinity;
  return 0.5 * (1 - 2 * M / r) * (1 + L * L / (r * r)) - 0.5;
}

export function veffPhoton(r, L) {
  if (r <= 0) return Infinity;
  return 0.5 * (L * L / (r * r)) * (1 - 2 * M / r);
}

// Photon-sphere radius: r = 3M, V_eff_photon peak = L^2 / (54 M^2).
export const PHOTON_SPHERE = 3 * M;
// ISCO: r = 6M for L = 2 sqrt(3) M.
export const ISCO = 6 * M;
export const L_ISCO = 2 * Math.sqrt(3) * M;

// Find extrema of V_eff_massive for given L by solving dV/dr = 0.
// Analytic: turning-point radii at L > L_ISCO satisfy
//   r = (L^2 +/- L sqrt(L^2 - 12 M^2)) / (2 M)
// (max inner, min outer).
export function turningPoints(L) {
  const disc = L * L - 12 * M * M;
  // Allow small numerical slack near the critical L = 2 sqrt(3) M case.
  const discClamped = Math.max(0, disc);
  if (disc < -1e-9) return [];
  const sd = Math.sqrt(discClamped);
  const rMax = (L * L - L * sd) / (2 * M);
  const rMin = (L * L + L * sd) / (2 * M);
  return [rMax, rMin];
}
