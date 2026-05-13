// sim.js
// Jeans gravitational instability. For a uniform self-gravitating medium
// of mass density rho and sound speed c_s, plane-wave perturbations
// exp(i k x - i omega t) satisfy the dispersion relation
//
//   omega^2 = c_s^2 k^2 - 4 pi G rho.
//
// Modes with omega^2 < 0 grow exponentially (Jeans-unstable); modes
// with omega^2 > 0 oscillate as sound waves. The crossover wavelength
// is the Jeans length
//
//   lambda_J = sqrt(pi c_s^2 / (G rho)).
//
// All length-mass-time units chosen so G = 6.6743e-11 m^3 / (kg s^2).
//
// Reference: Carroll-Ostlie, An Introduction to Modern Astrophysics 2e
// Ch. 12 (`carroll-ostlie`).

export const G_SI = 6.6743e-11;          // m^3 / (kg s^2)
export const PC_M = 3.0857e16;            // 1 parsec in meters
export const M_SUN = 1.989e30;            // solar mass in kg
export const PROTON_KG = 1.67262192e-27;  // proton mass

// Jeans wavelength (m) from sound speed (m/s) and mass density (kg/m^3).
export function jeansLengthM(csMpS, rhoSi) {
  return Math.sqrt(Math.PI * csMpS * csMpS / (G_SI * rhoSi));
}

// Jeans mass (kg): contents of a sphere of radius lambda_J / 2.
export function jeansMassKg(csMpS, rhoSi) {
  const lam = jeansLengthM(csMpS, rhoSi);
  const r = lam / 2;
  return (4 / 3) * Math.PI * r * r * r * rhoSi;
}

// Dispersion relation omega^2 (1 / s^2) at wave number k (1 / m).
export function omegaSquared(k, csMpS, rhoSi) {
  return csMpS * csMpS * k * k - 4 * Math.PI * G_SI * rhoSi;
}

// Number density (1/m^3) -> mass density (kg/m^3) assuming pure hydrogen.
export function nToRho(nPerCm3) {
  return nPerCm3 * 1e6 * PROTON_KG; // 1 cm^-3 = 1e6 m^-3
}

// Isothermal sound speed (m/s) for hydrogen at temperature T (K):
// c_s = sqrt(k_B T / m_p).
export function isothermalCs(tempK) {
  const KB_SI = 1.380649e-23;
  return Math.sqrt(KB_SI * tempK / PROTON_KG);
}
