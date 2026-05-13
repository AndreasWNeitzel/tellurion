// sim.js
// Saha equation for hydrogen ionization. Charge balance (n_e = n_+) plus
// total nucleon count n_tot = n_+ + n_0 gives an implicit equation for
// the ionization fraction x = n_+ / n_tot:
//
//   x^2 / (1 - x) = (Saha factor) / n_tot
//
// with
//
//   Saha = (2 pi m_e k_B T / h^2)^(3/2) * exp(-chi / k_B T) * 2 Z_+ / Z_0.
//
// For hydrogen Z_0 = 2 (electron ground state degeneracy), Z_+ = 1.
//
// Reference: Carroll-Ostlie, An Introduction to Modern Astrophysics 2e
// Ch. 8 (`carroll-ostlie`).

export const CHI_H_EV  = 13.605693;
export const KB_EV_K   = 8.617333262e-5;
export const M_E_KG    = 9.1093837015e-31;
export const H_JS      = 6.62607015e-34;
export const KB_J_K    = 1.380649e-23;

// Thermal de Broglie wavelength cubed for an electron (m^3).
function lambdaTh3(tempK) {
  const lt = H_JS / Math.sqrt(2 * Math.PI * M_E_KG * KB_J_K * tempK);
  return lt * lt * lt;
}

// Saha factor x^2 / (1 - x) = sahaRatio(T) / n_tot.
// Units: T in K, returns factor in 1/m^3.
export function sahaRatioPerM3(tempK) {
  const chi_J = CHI_H_EV * 1.602176634e-19;
  // 2 Z_+/Z_0 = 2 * 1 / 2 = 1 for hydrogen.
  const stat = 1.0;
  return stat * (1 / lambdaTh3(tempK)) * Math.exp(-chi_J / (KB_J_K * tempK));
}

// Solve x^2 / (1 - x) = R for x in (0, 1). Closed-form (quadratic):
//   x^2 + R x - R = 0   ->   x = (-R + sqrt(R^2 + 4 R)) / 2.
export function ionizationFraction(tempK, nTotPerM3) {
  const R = sahaRatioPerM3(tempK) / nTotPerM3;
  if (!Number.isFinite(R) || R < 0) return 0;
  // For R large, x -> 1 (fully ionized). For R small, x -> sqrt(R).
  return (-R + Math.sqrt(R * R + 4 * R)) / 2;
}

// Temperature at which x = 0.5 for a given n_tot. Approximately the
// "ionization temperature" of the medium. Solve numerically by bisection.
export function ionizationTemp(nTotPerM3, tLow = 1e3, tHigh = 1e6, tol = 1) {
  let lo = tLow, hi = tHigh;
  for (let i = 0; i < 80; i += 1) {
    const mid = 0.5 * (lo + hi);
    const x = ionizationFraction(mid, nTotPerM3);
    if (x < 0.5) lo = mid;
    else         hi = mid;
    if (hi - lo < tol) break;
  }
  return 0.5 * (lo + hi);
}
