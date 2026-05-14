// Earth axial precession + nutation toy model.
// Lunisolar precession in longitude: psi(t) = psi_0 + p t (general precession 50.29 arcsec/yr).
// Obliquity epsilon = epsilon_0 + nutation terms.
// 18.6-yr lunar-node nutation: delta_psi = -17.2" sin(Omega), delta_eps = +9.2" cos(Omega).
// 9.3-yr term: delta_psi = +1.3" sin(2 Omega), delta_eps = -0.6" cos(2 Omega).
// Semiannual term: delta_psi = +1.3" sin(2 L_sun), delta_eps = +0.55" cos(2 L_sun).
// Reference: Smart, Celestial Mechanics; Seidelmann, Explanatory Supplement.

export const EPS0_DEG = 23.4393;
export const PREC_RATE_ARCSEC_YR = 50.29;

export function precessionLongitude(years) {
  return PREC_RATE_ARCSEC_YR * years;
}
export function nutation(years) {
  const Omega = -2 * Math.PI * years / 18.6;       // mean longitude of lunar node.
  const Lsun = 2 * Math.PI * years;
  const dPsi = -17.2 * Math.sin(Omega) + 1.3 * Math.sin(2 * Omega) + 1.3 * Math.sin(2 * Lsun);
  const dEps = 9.2 * Math.cos(Omega) - 0.6 * Math.cos(2 * Omega) + 0.55 * Math.cos(2 * Lsun);
  return { dPsi, dEps };
}
export function obliquity(years) {
  return EPS0_DEG + nutation(years).dEps / 3600;
}
