// Headless physics for the Cepheid variable hero.
// A classical (Type I) Cepheid is a yellow supergiant that pulsates
// radially through the kappa mechanism: He II partial ionization in
// a narrow layer drives the oscillation. Leavitt (1908; 1912) found
// that the apparent magnitude of Cepheids in the SMC correlates with
// their pulsation period, calibrated decades later to the absolute
// magnitude as the period-luminosity relation:
//
//   M_V = -2.78 log P(days) - 1.35      (Madore + Freedman 1991)
//
// More modern HST and Gaia DR3 Leavitt-Law calibrations give
// essentially the same slope and zero point. The bolometric
// luminosity follows from a typical Cepheid (T_eff ~ 6000 K and
// R/R_sun ~ 25 to 200 from short to long period).
//
// References:
//   Leavitt, Harvard Coll. Obs. Circ. 173 (1912) 1. `leavitt-1912`.
//   Madore and Freedman, PASP 103 (1991) 933. `madore-freedman-1991`.
//   Freedman, ApJ 919 (2021) 16 (review).

const L_SUN = 3.828e33;       // erg/s
const R_SUN_CM = 6.957e10;     // cm
const SIGMA_SB = 5.6704e-5;    // erg cm^-2 s^-1 K^-4
const M_V_SUN = 4.83;           // absolute V magnitude of the Sun

export function periodLuminosity_MV(P_days) {
  // Madore-Freedman 1991.
  return -2.78 * Math.log10(Math.max(0.5, P_days)) - 1.35;
}

// Absolute bolometric magnitude:
//   M_bol = -2.5 log10(L / L_sun_bol) + 4.74
// where L_sun_bol = 3.828e33 erg/s and M_bol_sun = 4.74.
export function MbolFromL(L_Lsun) {
  return -2.5 * Math.log10(Math.max(1e-30, L_Lsun)) + 4.74;
}

// Typical mean radius (in R_sun) as a function of period (Cepheid
// P-R relation, Gieren 1998; rough fit).
export function meanRadius_Rsun(P_days) {
  // log R = 0.75 log P + 1.10
  return Math.pow(10, 0.75 * Math.log10(Math.max(0.5, P_days)) + 1.10);
}

// Effective temperature in the middle of the Cepheid instability strip.
export function meanTeff_K(P_days) {
  // Cooler at longer P; rough fit: T = 6500 K (P/1 day)^(-0.05)
  return 6500 * Math.pow(Math.max(0.5, P_days), -0.05);
}

// Luminosity from radius and T_eff.
export function luminosity_Lsun(R_Rsun, T_K) {
  return Math.pow(R_Rsun, 2) * Math.pow(T_K / 5778, 4);
}

// Pulsation: R(t) = R0 (1 + delta_R sin(2 pi phase)). Lightcurve
// follows L = R^2 T^4 with a phase-shifted T(t) (warmer at min
// radius, cooler at max radius), giving the asymmetric Cepheid
// lightcurve.
export function radiusAtPhase(phase, P_days, deltaR = 0.10) {
  const phi = 2 * Math.PI * phase;
  return meanRadius_Rsun(P_days) * (1 + deltaR * Math.sin(phi));
}

export function TeffAtPhase(phase, P_days, deltaT = 0.08) {
  // Temperature peaks ~ quarter-period AFTER minimum radius (so the
  // light maximum lags the radius minimum); standard Cepheid form.
  const phi = 2 * Math.PI * phase;
  const baseT = meanTeff_K(P_days);
  return baseT * (1 - deltaT * Math.sin(phi - Math.PI / 4));
}

export function lightcurveLsun(phase, P_days) {
  const R = radiusAtPhase(phase, P_days);
  const T = TeffAtPhase(phase, P_days);
  return luminosity_Lsun(R, T);
}

// Distance modulus mu = m - M = 5 log d - 5 (d in parsecs).
export function distanceModulus(d_pc) {
  return 5 * Math.log10(Math.max(1, d_pc)) - 5;
}

// Apparent V magnitude.
export function apparentMag(M_V, d_pc) {
  return M_V + distanceModulus(d_pc);
}

// Sample of known Cepheids: (name, period_days, distance_pc).
export const KNOWN_CEPHEIDS = [
  { name: 'delta Cep', P: 5.366, d_pc: 273 },
  { name: 'eta Aql', P: 7.177, d_pc: 290 },
  { name: 'zeta Gem', P: 10.150, d_pc: 360 },
  { name: 'l Car', P: 35.55, d_pc: 480 },
  { name: 'RS Pup', P: 41.4, d_pc: 1990 },
];

// Blackbody color helper (same as wd-cooling for consistency).
export function blackbodyColor(T_K) {
  const T = Math.max(1000, Math.min(40000, T_K));
  const t100 = T / 100;
  let r, g, b;
  if (T < 6600) {
    r = 255;
    g = 99.4708025 * Math.log(t100) - 161.1195681;
  } else {
    r = 329.698727446 * Math.pow(t100 - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t100 - 60, -0.0755148492);
  }
  if (T >= 6600) b = 255;
  else if (T <= 1900) b = 0;
  else b = 138.5177312231 * Math.log(t100 - 10) - 305.0447927307;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return { r: r | 0, g: g | 0, b: b | 0 };
}
