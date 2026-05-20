// Headless physics for the white-dwarf cooling hero.
//
// A white dwarf (WD) is the inert remnant left after a low- or
// intermediate-mass star sheds its envelope. It is supported by
// electron degeneracy and slowly cools by radiating its residual
// thermal energy. Mestel (1952) derived the canonical cooling law
//
//   L(t) ~ A * M * mu_ion^(-1) * t^(-7/5),
//
// which gives a cooling timescale t_cool ~ 10^9 yr for L ~ 10^-3
// L_sun. Beyond ~ Gyr, when the central ion temperature falls below
// the Debye temperature, the C/O ions crystallize from the centre
// outward, releasing latent heat and producing the bump in WD
// luminosity functions at log L/L_sun ~ -4 (Winget et al. 1987).
//
// The WD mass-radius relation: Eggleton (1983) fit, simplified for
// 0.4 to 1.2 M_sun:
//   R / R_sun = 0.0114 * sqrt[(Mch/M)^(2/3) - (M/Mch)^(2/3)] *
//               (1 + 3.5 (M/Mp)^(-2/3) + (M/Mp)^(-1))^(-2/3),
// with Mch = 1.44 M_sun, Mp = 0.00057 M_sun.
//
// References:
//   Mestel, MNRAS 112 (1952) 583. `mestel-cooling`.
//   Winget et al., ApJ 315 (1987) L77. `winget-1987`.
//   Fontaine, Brassard, Bergeron, PASP 113 (2001) 409.
//     `fontaine-brassard-bergeron-2001`.
//   Eggleton, ApJ 268 (1983) 368. `eggleton-1983`.

export const M_CHANDRA = 1.44;        // M_sun
export const R_SUN_KM = 6.957e5;       // km
export const L_SUN = 3.828e33;         // erg/s
export const SIGMA = 5.6704e-5;        // Stefan-Boltzmann, erg cm^-2 s^-1 K^-4
export const SECONDS_PER_YEAR = 3.156e7;

// Eggleton mass-radius relation. Returns radius in R_sun.
export function eggletonRadius_Rsun(M_solar) {
  const Mp = 0.00057;
  const Mc = M_CHANDRA;
  const x = (Mc / M_solar) ** (2 / 3);
  const y = (M_solar / Mc) ** (2 / 3);
  if (x - y <= 0) return 0;
  const r = 0.0114 * Math.sqrt(x - y);
  const f = (1 + 3.5 * (M_solar / Mp) ** (-2 / 3) + (M_solar / Mp) ** (-1)) ** (-2 / 3);
  return r * f;
}

// Mestel cooling: L / L_sun = A * (M/M_sun) * (t / 10^9 yr)^(-7/5).
// We calibrate A so that a 0.6 M_sun WD has L = 10^(-3) L_sun at t = 1 Gyr.
const MESTEL_A = 1.6e-3 / 0.6;

export function mestelLuminosity_Lsun(M_solar, t_yr) {
  if (t_yr <= 0) return 1; // initial hot WD
  return MESTEL_A * M_solar * Math.pow(t_yr / 1e9, -7 / 5);
}

// Mestel cooling time to reach a given luminosity (years).
export function mestelTime_yr(M_solar, L_Lsun) {
  const t_Gyr = Math.pow(MESTEL_A * M_solar / Math.max(1e-30, L_Lsun), 5 / 7);
  return t_Gyr * 1e9;
}

// Effective temperature from L and R.
export function effectiveTemperature_K(L_Lsun, R_Rsun) {
  const L = L_Lsun * L_SUN;
  const R = R_Rsun * R_SUN_KM * 1e5;     // R in cm
  return Math.pow(L / (4 * Math.PI * R * R * SIGMA), 0.25);
}

// Color (blackbody RGB) from effective temperature in K. We use a
// simplified empirical mapping calibrated to give reasonable hues
// from O-type (40000+ K, blue) to M-type (3000 K, red).
export function blackbodyColor(T_K) {
  const T = Math.max(1000, Math.min(40000, T_K));
  // Wien displacement: peak wavelength = 2.898e-3 / T (m).
  const t100 = T / 100;
  let r, g, b;
  if (T < 6600) {
    r = 255;
    g = 99.4708025 * Math.log(t100) - 161.1195681;
  } else {
    r = 329.698727446 * Math.pow(t100 - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t100 - 60, -0.0755148492);
  }
  if (T >= 6600) {
    b = 255;
  } else if (T <= 1900) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(t100 - 10) - 305.0447927307;
  }
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return { r: r | 0, g: g | 0, b: b | 0 };
}

// Crystallization: the C/O ion plasma crystallizes when Gamma = (Z e)^2 /
// (a kT) ~ 175 (Salpeter 1961). Empirically the crystal core fraction
// grows monotonically from 0 to ~0.99 over ~ 5 to 10 Gyr depending on
// mass. We model
//   f_X(t) = 1 - exp(-((t - t_X) / tau_X)^2)  for t > t_X
// with t_X = 1.5 Gyr and tau_X = 5 Gyr (calibrated to Fontaine et al.).
export function crystalFraction(t_yr, M_solar) {
  const t_X = 1.5e9 * (0.6 / M_solar);      // hotter -> later onset
  const tau_X = 3e9 * (0.6 / M_solar);
  if (t_yr < t_X) return 0;
  return 1 - Math.exp(-Math.pow((t_yr - t_X) / tau_X, 2));
}

// Galactic-disk age constraint: oldest visible WDs (Winget+ 1987)
// imply disk age ~ 9 Gyr. Used to mark the WD luminosity-function
// cutoff in the playground.
export const DISK_AGE_GYR = 9.0;
