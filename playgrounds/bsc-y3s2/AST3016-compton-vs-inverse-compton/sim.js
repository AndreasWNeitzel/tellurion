// sim.js
// Compton vs inverse Compton scattering.
//
// Forward Compton: a photon of energy E hits a stationary electron and
// scatters at angle theta with shifted energy
//   E' = E / (1 + (E / m_e c^2)(1 - cos theta)).
//
// Inverse Compton (Thomson limit gamma * E << m_e c^2):
// a relativistic electron at Lorentz factor gamma scatters a photon of
// energy E up to typical energy
//   E_typ = 4/3 * gamma^2 * E.
// Maximum upscatter energy (head-on collision, backscatter):
//   E_max = 4 gamma^2 E / (1 + 4 gamma E / m_e c^2)
// reduces to E_max = 4 gamma^2 E in the Thomson limit.
//
// Reference: Rybicki and Lightman, Radiative Processes in Astrophysics
// Ch. 7 (`rybickilightman1979`).

export const M_E_EV = 0.5109989461e6;

// Forward Compton: scattered-photon energy.
export function comptonForward(eV, thetaRad) {
  const x = eV / M_E_EV;
  return eV / (1 + x * (1 - Math.cos(thetaRad)));
}

// Inverse Compton: maximum upscatter energy.
export function icMaxEnergy(gamma, eV) {
  const x = 4 * gamma * eV / M_E_EV;
  return 4 * gamma * gamma * eV / (1 + x);
}

// Thomson-limit (gamma * E << m_e c^2) upscatter typical energy.
export function icTypicalThomson(gamma, eV) {
  return (4 / 3) * gamma * gamma * eV;
}

// Whether the (gamma, E) point sits in the Thomson regime.
export function isThomsonRegime(gamma, eV) {
  return gamma * eV < 0.1 * M_E_EV;
}

// Klein-Nishina suppression factor: ratio of IC cross-section to Thomson.
// Crude approximation: sigma_KN / sigma_T ~ 1 / (1 + 4 gamma E / m c^2) for gamma E < m_e c^2.
export function suppressionFactor(gamma, eV) {
  return 1 / (1 + 4 * gamma * eV / M_E_EV);
}
