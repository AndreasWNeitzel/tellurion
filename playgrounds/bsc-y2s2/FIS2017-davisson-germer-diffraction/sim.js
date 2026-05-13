// sim.js
// Davisson-Germer electron diffraction. Electrons accelerated through
// voltage V hit a nickel (111) crystal surface. The original 1927
// experiment used surface-atomic-row scattering rather than 3D Bragg
// reflection: the row spacing D ~ 0.215 nm on the (111) face produces
// constructive interference at angle theta from the surface normal
// satisfying
//
//   D sin theta = n lambda
//
// (this is the planar grating condition, not the bulk Bragg condition
// 2 d sin theta = n lambda which applies to reflection from parallel
// atomic planes). For V = 54 V the de Broglie wavelength is 0.167 nm,
// giving the first-order peak at theta = arcsin(0.167/0.215) ~ 51 deg,
// matching the canonical Davisson-Germer result.
//
//   lambda = h c / pc, pc = sqrt(T^2 + 2 T m_e c^2)
//
// Reference: Eisberg and Resnick, Quantum Physics 2e Ch. 3
// (`eisberg-resnick`).

export const HC_EV_NM   = 1239.841984;
export const M_E_EV     = 0.5109989461e6;
export const D_NI_NM    = 0.215;             // nickel (111) atomic spacing

export function electronWavelengthNm(voltageV) {
  const T = voltageV; // kinetic energy in eV
  const pc = Math.sqrt(T * T + 2 * T * M_E_EV);
  return HC_EV_NM / pc;
}

// Non-relativistic approximation: lambda = h / sqrt(2 m T) = h c / sqrt(2 m c^2 T).
export function electronWavelengthNRNm(voltageV) {
  const T = voltageV;
  return HC_EV_NM / Math.sqrt(2 * M_E_EV * T);
}

// Surface-grating diffraction angle for the n-th order maximum in the
// Davisson-Germer geometry: D sin theta = n lambda. Returns NaN if
// argument > 1 (no real maximum at that order).
export function braggAngleRad(lambdaNm, dNm, n = 1) {
  const arg = n * lambdaNm / dNm;
  if (arg > 1) return NaN;
  return Math.asin(arg);
}

// Intensity of the diffraction pattern at angle theta (radians) for a
// finite crystal: I(theta) = sin^2(N pi d sin theta / lambda) / sin^2(pi d sin theta / lambda).
// This is the standard grating intensity for N parallel scatterers
// spaced by d. Returns intensity in [0, N^2].
export function gratingIntensity(thetaRad, lambdaNm, dNm, N) {
  const phi = Math.PI * dNm * Math.sin(thetaRad) / lambdaNm;
  const num = Math.sin(N * phi);
  const den = Math.sin(phi);
  if (Math.abs(den) < 1e-15) return N * N;
  return (num * num) / (den * den);
}
