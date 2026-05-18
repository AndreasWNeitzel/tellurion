// Spontaneous symmetry breaking: a complex scalar with the Mexican-hat
// potential V(rho) = -mu^2 rho^2 + lambda rho^4, rho = |phi|
// (Goldstone 1961; Higgs 1964; Peskin and Schroeder Ch. 11).
// Vacuum at v = sqrt(mu^2 / 2 lambda); the radial (Higgs) excitation
// has m_H = sqrt(2) mu and the angular (Goldstone) mode is massless.
// A thermal mass restores the symmetry above T_c.

export function V(rho, mu2, lam) { return -mu2 * rho * rho + lam * rho * rho * rho * rho; }

// Vacuum expectation value (the brim radius).
export function vev(mu2, lam) { return Math.sqrt(mu2 / (2 * lam)); }
// Potential depth at the minimum: V(v) = -mu^4 / (4 lambda).
export function depth(mu2, lam) { return -mu2 * mu2 / (4 * lam); }

// Radial curvature of V (d^2V/drho^2). Canonical Higgs mass uses the
// rho = v + h/sqrt(2) normalisation, giving m_H^2 = 2 mu^2.
export function radialCurvature(rho, mu2, lam) { return -2 * mu2 + 12 * lam * rho * rho; }
export function higgsMass(mu2) { return Math.sqrt(2 * mu2); }      // m_H = sqrt(2) mu
export const GOLDSTONE_MASS = 0;                                   // flat angular direction

// Finite-temperature effective potential: the rho^2 coefficient gets
// a thermal mass c T^2, so V_eff = (-mu^2 + c T^2) rho^2 + lam rho^4.
export function Vfinite(rho, mu2, lam, T, c = 1) {
  return (-mu2 + c * T * T) * rho * rho + lam * rho * rho * rho * rho;
}
export function Tc(mu2, c = 1) { return Math.sqrt(mu2 / c); }
// Temperature-dependent vev (second-order: continuous, zero above Tc).
export function vevT(mu2, lam, T, c = 1) {
  const eff = mu2 - c * T * T;
  return eff > 0 ? Math.sqrt(eff / (2 * lam)) : 0;
}

// V on the complex-phi plane (rho = sqrt(x^2+y^2)); axially symmetric.
export function Vxy(x, y, mu2, lam) { return V(Math.sqrt(x * x + y * y), mu2, lam); }

// Sampled radial slice V(rho) (or V_eff at temperature T).
export function radialProfile(rhoMax, steps, mu2, lam, T = 0, c = 1) {
  const r = new Float64Array(steps + 1), v = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const rho = rhoMax * i / steps;
    r[i] = rho; v[i] = Vfinite(rho, mu2, lam, T, c);
  }
  return { r, v };
}
