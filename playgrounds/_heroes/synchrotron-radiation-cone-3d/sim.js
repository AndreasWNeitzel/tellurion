// Headless physics for the synchrotron-radiation-cone hero. A
// relativistic electron of Lorentz factor gamma orbits in a uniform
// magnetic field B at the Larmor angular frequency omega_L = e B /
// (gamma m_e c) and emits synchrotron radiation. The radiation is
// beamed into a forward cone of half-angle 1/gamma. The
// characteristic frequency is
//
//   nu_c = (3/2) gamma^3 nu_L,    nu_L = e B / (2 pi gamma m_e c).
//
// The spectrum has a self-similar peak around nu_c with a high-
// frequency exponential cutoff.
//
// References:
//   Rybicki and Lightman, Radiative Processes in Astrophysics,
//   Chapter 6. `rybicki-lightman`.
//   Jackson, Classical Electrodynamics, 3rd ed., Sec. 14.4. `jackson3e`.

const E_CHARGE = 1.602e-19;
const M_E = 9.109e-31;
const C = 2.998e8;

// Larmor (gyro) frequency for a relativistic electron.
export function larmorFrequency_Hz(gamma, B_T) {
  return E_CHARGE * B_T / (2 * Math.PI * gamma * M_E);
}

export function gyroRadius_m(gamma, B_T) {
  return gamma * M_E * C / (E_CHARGE * B_T);
}

// Beaming half-angle (radians).
export function beamingHalfAngle_rad(gamma) {
  if (gamma <= 1) return Infinity;
  return 1 / gamma;
}

// Critical (peak) synchrotron frequency.
export function criticalFrequency_Hz(gamma, B_T) {
  return 1.5 * Math.pow(gamma, 3) * larmorFrequency_Hz(gamma, B_T);
}

// Approximate spectral shape F(x), x = nu / nu_c (the standard
// synchrotron-function envelope). We use Westfold's approximation:
//   F(x) ~ 1.85 x^(1/3) exp(-x)    (good to a few percent).
export function specShape(x) {
  if (x <= 0) return 0;
  return 1.85 * Math.pow(x, 1 / 3) * Math.exp(-x);
}

// Power radiated by a single electron (Larmor + relativistic):
//   P = (2/3) (e^4 / (m_e^2 c)) gamma^2 beta^2 B^2.
// In SI with the appropriate factor of 4 pi eps_0:
//   P = sigma_T c U_B (4/3) gamma^2 beta^2.
export function singleElectronPower_W(gamma, B_T) {
  const beta2 = 1 - 1 / (gamma * gamma);
  const SIGMA_T = 6.652e-29;     // Thomson cross-section
  const U_B = (B_T * B_T) / (2 * 4 * Math.PI * 1e-7);   // B^2 / (2 mu_0)
  return (4 / 3) * SIGMA_T * C * U_B * gamma * gamma * beta2;
}

// Observer sees a pulse each time the beaming cone (centered on the
// instantaneous velocity vector) sweeps across the line of sight.
// In the orbit plane, this is once per gyration. Off-axis, the pulse
// is broader and weaker.
export function pulseWidth_s(gamma, B_T) {
  // Duration ~ 1 / (gamma * omega_orbit) (relativistic beaming).
  const omega = E_CHARGE * B_T / (gamma * M_E);
  return 1 / (gamma * omega);
}

export function orbitPeriod_s(gamma, B_T) {
  return 1 / larmorFrequency_Hz(gamma, B_T);
}
