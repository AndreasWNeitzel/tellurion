// sim.js
// Inverse-Compton cooling for relativistic electrons in a soft-photon
// bath. The cooling time (Thomson limit) is
//
//   t_IC = (3 m_e c) / (4 sigma_T gamma U_ph)
//
// where sigma_T = 6.652e-29 m^2 is the Thomson cross section,
// U_ph is the soft-photon energy density (J/m^3), and gamma is the
// electron Lorentz factor. The inverse of t_IC is the cooling rate
// per gamma; equivalently the time for gamma to halve.
//
// Reference: Rybicki and Lightman, Radiative Processes in Astrophysics
// Ch. 7 (`rybickilightman1979`).

export const SIGMA_T = 6.652e-29;  // m^2
export const M_E_KG  = 9.1093837e-31;
export const C       = 299792458;
export const KB      = 1.380649e-23;
export const A_RAD   = 7.5657e-16;  // radiation constant (J / m^3 / K^4)
export const YEAR_S  = 3.15576e7;

// Cooling time (s) for IC in a uniform photon field of energy density U (J/m^3).
export function tCoolSeconds(gamma, U_ph) {
  return (3 * M_E_KG * C) / (4 * SIGMA_T * gamma * U_ph);
}

// Photon energy density for a thermal bath at T (K).
export function uPhotonThermalJM3(T) {
  return A_RAD * Math.pow(T, 4);
}

// Cooling time in years.
export function tCoolYears(gamma, U_ph) {
  return tCoolSeconds(gamma, U_ph) / YEAR_S;
}

// CMB photon energy density at redshift z, given T_0 = 2.725 K.
export function uCMB(z = 0) {
  const T = 2.725 * (1 + z);
  return uPhotonThermalJM3(T);
}
