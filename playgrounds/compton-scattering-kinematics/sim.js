// sim.js
// Compton scattering kinematics. A photon of incident wavelength lambda
// (in nm) scatters off a free electron at scattering angle theta and
// emerges with wavelength lambda'. The closed-form Compton shift is
//
//   delta_lambda = lambda' - lambda = (h / (m_e c)) (1 - cos theta)
//
// where h / (m_e c) is the electron Compton wavelength,
// lambda_C = 2.4263102367 pm = 0.0024263102367 nm.
//
// The recoiling electron carries kinetic energy
//   T = h c (1/lambda - 1/lambda').
//
// Reference: Eisberg and Resnick, Quantum Physics 2e Ch. 2 (`eisberg-resnick`).

export const LAMBDA_C_NM = 0.0024263102367; // electron Compton wavelength in nm
export const HC_EV_NM    = 1239.841984;     // h c in eV*nm

export function comptonShift(thetaRad) {
  return LAMBDA_C_NM * (1 - Math.cos(thetaRad));
}

export function scatteredWavelength(lambdaNm, thetaRad) {
  return lambdaNm + comptonShift(thetaRad);
}

// Photon energy in eV from wavelength in nm.
export function photonEnergy(lambdaNm) {
  return HC_EV_NM / lambdaNm;
}

// Electron kinetic energy (eV) after scattering.
export function electronKE(lambdaNm, thetaRad) {
  const lambdaP = scatteredWavelength(lambdaNm, thetaRad);
  return HC_EV_NM * (1 / lambdaNm - 1 / lambdaP);
}

// Electron recoil angle phi (radians) measured from the incident photon
// direction, on the opposite side of the scattering plane from the
// outgoing photon. Standard formula:
//   cot(phi) = (1 + alpha) tan(theta/2)
// where alpha = h nu / (m_e c^2) = lambda_C / lambda.
export function electronRecoilAngle(lambdaNm, thetaRad) {
  if (thetaRad === 0) return Math.PI / 2; // limiting (no scatter, electron undisturbed); pick a safe value
  const alpha = LAMBDA_C_NM / lambdaNm;
  const cot = (1 + alpha) * Math.tan(thetaRad / 2);
  return Math.atan(1 / cot);
}

// Convenience derived: max shift at backscatter (theta = pi) is 2 lambda_C.
export function maxShift() {
  return 2 * LAMBDA_C_NM;
}
