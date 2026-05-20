// Headless physics for the Faraday-rotation hero. A linearly
// polarized EM wave propagates through a magnetized plasma along
// magnetic-field-parallel direction B_par. In the cold-plasma limit
// (omega >> omega_p, omega_c), the two circular polarizations have
// slightly different refractive indices; the linear polarization
// rotates by
//
//   chi(z) = RM * lambda^2
//
// where the rotation measure is
//
//   RM = (e^3 / (2 pi m_e^2 c^4)) * integral_0^L n_e(z) B_par(z) dz
//      = 8.12e5 rad/m^2 * integral [n_e in cm^-3] [B in Gauss] [dz in pc].
//
// References:
//   Manchester and Taylor, Pulsars, W. H. Freeman 1977, Ch. 8.
//   Beck, Astron. Astrophys. Rev. 24 (2015) 4 (review).
//   Burn, Mon. Not. R. Astron. Soc. 133 (1966) 67 (origin).
//   Citation key: `beck-2015-magnetic-fields`, `burn-1966`.

export const TWO_PI = 2 * Math.PI;
export const RM_COEFF_CGS = 8.12e5;     // rad m^-2 per (cm^-3 G pc)

// Rotation measure in rad/m^2 from constant B_par (G), n_e (cm^-3),
// path length L (pc).
export function rotationMeasure(B_par_G, n_e_cm3, L_pc) {
  return RM_COEFF_CGS * n_e_cm3 * B_par_G * L_pc;
}

// Rotation angle at wavelength lambda (m).
export function rotationAngle(RM_rad_m2, lambda_m) {
  return RM_rad_m2 * lambda_m * lambda_m;
}

// Convenience: rotation in degrees.
export function rotationAngleDeg(RM_rad_m2, lambda_m) {
  return (rotationAngle(RM_rad_m2, lambda_m) * 180) / Math.PI;
}

// Phase velocity difference between left- and right-circular
// polarizations (cold plasma):
//   delta n = (omega_p^2 / omega^3) * omega_c_par
// where omega_p = sqrt(4 pi n_e e^2 / m_e), omega_c = e B / (m_e c).
// We expose only the integrated rotation measure, since this is what
// observers actually use.

// Known Galactic ISM values (canonical):
//   n_e ~ 0.03 cm^-3 (warm ionized medium average)
//   B_par ~ 1 to 3 microgauss along Galactic plane
//   L ~ 1 kpc = 1000 pc
//   => RM ~ 8.12e5 * 0.03 * 3e-6 * 1000 = 73 rad/m^2 (consistent with
//      observed Galactic pulsar RMs of 10-100 rad/m^2).
export const KNOWN_SOURCES = [
  // name, RM (rad/m^2), median (path-averaged) B_par (G), n_e (cm^-3), L (pc)
  { name: 'Galactic pulsar', RM: 73, B: 3e-6, ne: 0.03, L: 1000 },
  { name: 'Sgr A* probe',    RM: 5e5, B: 3e-2, ne: 30, L: 1 },
  { name: 'AGN jet edge',    RM: 1e4, B: 1e-4, ne: 1e-2, L: 1e4 },
  { name: 'Faraday screen (M51)', RM: 200, B: 1e-5, ne: 0.1, L: 500 },
];

// Wavelengths to render (in meters). VLA L-band ~ 0.2 m, S-band ~
// 0.12 m, C-band ~ 0.06 m. Visible light ~ 5e-7 m.
export const PRESET_WAVELENGTHS = {
  L_band: 0.21,    // 1.4 GHz (HI line)
  S_band: 0.13,    // 2.3 GHz
  C_band: 0.06,    // 5.0 GHz
  X_band: 0.03,    // 10 GHz
};

// Sample N polarization vectors along the path length L (meters in
// world units). Each point gets phi(z) = chi_total * z / L.
export function polarizationAlongPath(N, RM_rad_m2, lambda_m, chi_offset = 0) {
  const chi_total = rotationAngle(RM_rad_m2, lambda_m);
  const out = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    out.push(chi_offset + t * chi_total);
  }
  return out;
}
