// Single-electron synchrotron emission peaked near nu_c = (3/2) gamma^2 (e B / 2 pi m_e c).
// For a power-law electron distribution N(gamma) ~ gamma^{-p}, the photon spectrum
// is also a power law: F(nu) ~ nu^{-(p-1)/2}.
// Reference: Rybicki-Lightman Ch. 6 (`rybickilightman1979`).
export const E = 1.602176634e-19, M_E = 9.1093837e-31, C = 299792458;
export function nu_c(gamma, B) {
  return 1.5 * gamma * gamma * (E * B) / (2 * Math.PI * M_E);
}
// F(x) approximation (x = nu / nu_c): well approximated by the empirical form
//  F(x) ~ 1.78 x^(1/3) exp(-x) for x <= 1; ~ 1.25 sqrt(x) exp(-x) for x > 1.
export function singleSpec(x) {
  if (x <= 0) return 0;
  if (x <= 1) return 1.78 * Math.pow(x, 1 / 3) * Math.exp(-x);
  return 1.25 * Math.sqrt(x) * Math.exp(-x);
}
// Power-law distribution: F_nu ~ nu^{-(p-1)/2}.
export function powerLawSpec(nu, nu_c_min, nu_c_max, p) {
  if (nu < nu_c_min || nu > nu_c_max) return 0;
  return Math.pow(nu, -(p - 1) / 2);
}
export function spectralIndex(p) { return (p - 1) / 2; }
