// Stellar habitable-zone core (no DOM), shared by playground.js and
// invariants.test.mjs. Planet equilibrium temperature from radiative
// energy balance (Stefan-Boltzmann), in solar-normalised units.
//
//   L_star = R_star^2 (T_eff / T_sun)^4                 (solar units)
//   T_eq(a) = 278 K * L_star^{1/4} (1 - A)^{1/4} / sqrt(a/AU)
//
// The habitable zone is the orbital band where T_eq lies between the
// runaway-greenhouse inner edge (T_inner = 273 K) and the maximum-
// greenhouse outer edge (T_outer = 200 K).
// Reference: Kasting, Whitmire and Reynolds, Icarus 101 (1993);
// Kopparapu et al., ApJ 765 (2013).

export const T_SUN_EFF = 5778;   // solar effective temperature, K
export const T_EQ0 = 278;        // T_eq prefactor (Earth, A=0, a=1 AU), K
export const T_INNER = 273;      // habitable-zone inner edge, K
export const T_OUTER = 200;      // habitable-zone outer edge, K

// Stellar luminosity in solar units.
export function luminosity(Teff, Rstar) {
  return Rstar * Rstar * Math.pow(Teff / T_SUN_EFF, 4);
}

// Planet equilibrium temperature (K) at semi-major axis a (AU).
export function Teq(a_AU, Teff, Rstar, A) {
  const L = luminosity(Teff, Rstar);
  return T_EQ0 * Math.pow(L, 0.25) * Math.pow(1 - A, 0.25) / Math.sqrt(a_AU);
}

// Orbital radius (AU) at which the equilibrium temperature equals T.
export function radiusAtT(T, Teff, Rstar, A) {
  const L = luminosity(Teff, Rstar);
  return Math.pow(T_EQ0 * Math.pow(L, 0.25) * Math.pow(1 - A, 0.25) / T, 2);
}

// Inner and outer habitable-zone radii (AU).
export function hzBounds(Teff, Rstar, A) {
  return {
    rIn: radiusAtT(T_INNER, Teff, Rstar, A),
    rOut: radiusAtT(T_OUTER, Teff, Rstar, A),
  };
}

// Is a planet at a_AU within the habitable zone?
export function inHZ(a_AU, Teff, Rstar, A) {
  const { rIn, rOut } = hzBounds(Teff, Rstar, A);
  return a_AU >= rIn && a_AU <= rOut;
}
