// sim.js
// de Broglie wavelength lambda = h / p for several particle species over
// a wide kinetic-energy range. Non-relativistic form for slow particles,
// relativistic form for fast ones.
//
//   Non-relativistic: p = sqrt(2 m T), lambda = h / sqrt(2 m T)
//   Relativistic:     E_total = T + m c^2; p c = sqrt(E_total^2 - (m c^2)^2)
//                     lambda = h c / (p c)
//
// All energies in eV, masses in kg, lambdas in nm. Constants chosen so
// products work out without unit gymnastics: hc = 1239.841984 eV nm.
//
// Reference: Eisberg and Resnick, Quantum Physics 2e Ch. 3 (`eisberg-resnick`).

export const HC_EV_NM   = 1239.841984;   // h c in eV nm
export const M_E_EV     = 0.5109989461e6;  // electron rest energy in eV
export const M_P_EV     = 938.27208816e6;  // proton rest energy in eV
export const M_N_EV     = 939.5654133e6;   // neutron rest energy in eV
export const M_C12_EV   = 11.17793e9;      // C-12 atom rest energy (~12 u)
export const C_M_PER_S  = 299792458;

export const PARTICLES = [
  { name: 'photon',   mEv: 0,         color: '#a78bfa' },
  { name: 'electron', mEv: M_E_EV,    color: '#5bc0eb' },
  { name: 'proton',   mEv: M_P_EV,    color: '#06d6a0' },
  { name: 'neutron',  mEv: M_N_EV,    color: '#ffd166' },
  { name: 'C-12',     mEv: M_C12_EV,  color: '#f4a261' },
];

// Wavelength (nm) for kinetic energy T (eV) and rest mass m (eV).
// Uses relativistic kinematics so the formula is correct in both limits.
// For photons (m = 0), lambda = h c / T.
export function deBroglieNm(tEv, mEv) {
  if (mEv === 0) {
    return HC_EV_NM / tEv;
  }
  const E = tEv + mEv;
  const pc = Math.sqrt(E * E - mEv * mEv);
  return HC_EV_NM / pc;
}

// Non-relativistic approximation lambda = h / sqrt(2 m T) for the limit
// T << m c^2.
export function deBroglieNonRelNm(tEv, mEv) {
  if (mEv === 0) return HC_EV_NM / tEv;
  const pc = Math.sqrt(2 * mEv * tEv);
  return HC_EV_NM / pc;
}

// Convenience: thermal de Broglie at temperature T (K), using
// T_kin = (3/2) k_B T per particle. k_B = 8.617333262e-5 eV/K.
export function thermalDeBroglieNm(tempK, mEv) {
  const KB_EV_PER_K = 8.617333262e-5;
  const tKin = 1.5 * KB_EV_PER_K * tempK;
  return deBroglieNm(tKin, mEv);
}
