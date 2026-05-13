// sim.js
// Photoelectric effect: KE_max of ejected electron vs incident photon
// frequency for several metals. Einstein 1905:
//
//   KE_max = h nu - phi
//
// for nu > nu_0 = phi / h. Below nu_0 no electrons are ejected, regardless
// of light intensity. Above nu_0 the slope is h (Planck constant) and
// the y-intercept at nu_0 is zero.
//
// Reference: Eisberg and Resnick, Quantum Physics 2e Ch. 2 (`eisberg-resnick`).

export const H_EV_PHZ  = 4.135667696e-15; // eV s, here we keep nu in PHz (1e15 Hz)
export const H_EV_S    = 4.135667696e-15; // same numeric value (eV s)

// Tabulated work functions (CODATA / standard tables).
export const METALS = [
  { name: 'Cesium',    phi: 2.14, color: '#a78bfa' },
  { name: 'Potassium', phi: 2.30, color: '#5bc0eb' },
  { name: 'Sodium',    phi: 2.36, color: '#06d6a0' },
  { name: 'Calcium',   phi: 2.87, color: '#ffd166' },
  { name: 'Zinc',      phi: 4.33, color: '#f4a261' },
  { name: 'Silver',    phi: 4.26, color: '#ef476f' },
  { name: 'Tungsten',  phi: 4.55, color: '#9aa0a6' },
  { name: 'Platinum',  phi: 6.35, color: '#fbbf24' },
];

// Threshold frequency in PHz (= 1e15 Hz) for a metal with work function phi (eV).
export function thresholdFreqPhz(phiEv) {
  // nu_0 = phi / h. In SI: phi [J] / h [J s] -> Hz.
  // Using eV and "eV*s" cancels, and we want PHz: divide by 1e15.
  return phiEv / (H_EV_S * 1e15);
}

export function thresholdWavelengthNm(phiEv) {
  // lambda_0 = c / nu_0 = h c / phi. h c = 1239.841984 eV nm.
  return 1239.841984 / phiEv;
}

// Maximum kinetic energy (eV) for incident frequency nu (PHz) and work function phi (eV).
export function keMaxEv(nuPhz, phiEv) {
  const E = H_EV_S * 1e15 * nuPhz; // photon energy in eV
  const k = E - phiEv;
  return k > 0 ? k : 0;
}

// Maximum kinetic energy (eV) for incident wavelength (nm) and work function phi (eV).
export function keMaxFromLambda(lambdaNm, phiEv) {
  const E = 1239.841984 / lambdaNm;
  const k = E - phiEv;
  return k > 0 ? k : 0;
}
