// sim.js
// Habitable zone of a star, defined by the effective stellar flux
// incident on a planet's top of atmosphere:
//
//   S = L_star / (4 pi d^2)
//   L_star = 4 pi R_star^2 sigma T_eff^4
//
// The continuous habitable zone (Kasting et al. 1993, recent estimate)
// spans flux 1.37 S_sun (inner edge, runaway greenhouse) to 0.354
// S_sun (outer edge, maximum greenhouse). We use these as the band.
//
// Reference: Carroll-Ostlie, An Introduction to Modern Astrophysics 2e
// Ch. 7 (`carroll-ostlie`).

export const SIGMA = 5.670374419e-8; // W / m^2 / K^4
export const L_SUN = 3.828e26;        // W
export const R_SUN = 6.957e8;          // m
export const AU = 1.496e11;            // m
export const T_SUN = 5778;             // K
export const S_SUN_W_PER_M2 = 1361;   // W / m^2

// Stellar luminosity (W) from R_star (m) and T_eff (K).
export function stellarLuminosity(R_star, T_eff) {
  return 4 * Math.PI * R_star * R_star * SIGMA * T_eff * T_eff * T_eff * T_eff;
}

// Incident flux (W/m^2) at distance d (m) from a star.
export function fluxAt(L_star, d) {
  return L_star / (4 * Math.PI * d * d);
}

// Convert flux to S_eff (units of S_sun).
export function asSEff(flux_w_m2) {
  return flux_w_m2 / S_SUN_W_PER_M2;
}

// Habitable zone bounds in AU for a star of luminosity L (W).
// Inner edge: S = 1.37 S_sun (runaway greenhouse); outer: S = 0.354.
export function habitableInnerAu(L_star) {
  const flux = 1.37 * S_SUN_W_PER_M2;
  return Math.sqrt(L_star / (4 * Math.PI * flux)) / AU;
}
export function habitableOuterAu(L_star) {
  const flux = 0.354 * S_SUN_W_PER_M2;
  return Math.sqrt(L_star / (4 * Math.PI * flux)) / AU;
}

// Whether a planet at distance d (AU) is in the HZ.
export function inHabitableZone(L_star, dAu) {
  return dAu >= habitableInnerAu(L_star) && dAu <= habitableOuterAu(L_star);
}
