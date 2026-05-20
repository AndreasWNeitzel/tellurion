// Headless physics for the tidal-disruption-event hero. A star of
// mass M_star and radius R_star on a near-parabolic orbit around a
// supermassive black hole (SMBH) of mass M_BH gets torn apart when
// it crosses the tidal radius
//
//   R_T = R_star * (M_BH / M_star)^(1/3).
//
// Inside R_T, the tidal acceleration across the star exceeds its
// self-gravity. About half the debris is bound to the BH and falls
// back on a wide range of orbits with energy spread Delta E ~ G M_BH
// R_star / R_T^2 = G M_BH^(1/3) (M_star / R_star^2)^... The mass
// return rate follows Rees 1988:
//
//   dM/dt ~ t^(-5/3)
//
// at late times. Peak fallback rate occurs at the time when the
// most-bound debris returns:
//
//   t_peak ~ 2 pi (R_T^3 / (G M_BH))^(1/2) (M_BH / M_star)^(1/2)
//          = 40 days * (M_BH / 10^6 M_sun)^(1/2) (M_star / M_sun)^(-1)
//                     (R_star / R_sun)^(3/2).
//
// References:
//   Rees, Nature 333 (1988) 523. `rees-1988-tde`.
//   Hills, Nature 254 (1975) 295.
//   Komossa, J. High Energy Astrophys. 7 (2015) 148 (review).

const G = 6.6743e-11;            // m^3 kg^-1 s^-2
const C = 2.998e8;                // m/s
const M_SUN = 1.989e30;           // kg
const R_SUN = 6.957e8;            // m
const AU = 1.496e11;              // m
const DAY = 86400;                // s
const YEAR = 365.25 * DAY;

export function tidalRadius_m(M_BH_solar, M_star_solar, R_star_solar) {
  // R_T = R_star (M_BH / M_star)^(1/3)
  return R_star_solar * R_SUN * Math.pow(M_BH_solar / M_star_solar, 1 / 3);
}

export function schwarzschildRadius_m(M_solar) {
  return 2 * G * M_solar * M_SUN / (C * C);
}

// Is the star fully disrupted? It is if R_T > R_S (otherwise the star
// is swallowed whole). For a sun-like star the critical SMBH mass is
// ~ 10^8 M_sun; above this it cannot tidally disrupt the star.
export function isDisrupted(M_BH_solar, M_star_solar, R_star_solar) {
  return tidalRadius_m(M_BH_solar, M_star_solar, R_star_solar) > schwarzschildRadius_m(M_BH_solar);
}

// Critical SMBH mass for disruption (R_T = R_S).
export function maxDisruptingBH_solar(M_star_solar, R_star_solar) {
  // R_star (M/M_star)^{1/3} = 2 G M M_sun / c^2
  // Solving for M: M^{2/3} = R_star R_sun c^2 / (2 G M_star^{1/3} M_sun^{1/3} M_sun)
  // -> M = (R_star R_sun c^2 / (2 G M_sun))^{3/2} / sqrt(M_star)
  const A = R_star_solar * R_SUN * C * C / (2 * G * M_SUN);
  return Math.pow(A, 3 / 2) / Math.sqrt(M_star_solar);
}

// Peak fallback time in seconds. The most-bound debris has energy
// Delta E = G M_BH R_star / R_T^2 = G M_BH^{1/3} M_star^{2/3} / R_star.
// Its Keplerian period is
//   T_peak = pi R_T^{3/2} / sqrt(2 G M_star).
// Equivalently 2 pi sqrt(R_T^3 / (G M_BH)) * (M_BH/M_star)^{1/2} / 2.
// For a sun-like star + 10^6 M_sun SMBH this gives ~ 41 days.
export function peakFallbackTime_s(M_BH_solar, M_star_solar, R_star_solar) {
  const R_T = tidalRadius_m(M_BH_solar, M_star_solar, R_star_solar);
  return Math.PI * Math.pow(R_T, 1.5) / Math.sqrt(2 * G * M_star_solar * M_SUN);
}

export function peakFallbackTime_days(M_BH_solar, M_star_solar, R_star_solar) {
  return peakFallbackTime_s(M_BH_solar, M_star_solar, R_star_solar) / DAY;
}

// Fallback rate dM/dt as a function of time (in seconds since
// disruption). Phenomenological form: rises sharply to a peak at
// t_peak, then declines as t^{-5/3}.
export function fallbackRate(t_s, M_BH_solar, M_star_solar, R_star_solar) {
  const tp = peakFallbackTime_s(M_BH_solar, M_star_solar, R_star_solar);
  if (t_s < 0.01 * tp) return 0;
  if (t_s < tp) {
    return Math.pow(t_s / tp, 4);   // rapid rise (Lodato-Rossi 2011 toy form)
  }
  return Math.pow(t_s / tp, -5 / 3);
}

// Peak luminosity (Eddington-limited fraction of accretion).
//   L_peak ~ 0.1 (dM/dt)_peak c^2, capped at L_Edd.
//   L_Edd = 4 pi G M_BH m_p c / sigma_T = 1.26e31 W (M / M_sun)
export function eddingtonLuminosity_W(M_BH_solar) {
  return 1.26e31 * M_BH_solar;
}

export function peakAccretionRate_kg_s(M_BH_solar, M_star_solar, R_star_solar) {
  // Half the stellar mass returns; t_peak sets the rate scale.
  const tp = peakFallbackTime_s(M_BH_solar, M_star_solar, R_star_solar);
  return 0.5 * M_star_solar * M_SUN / tp;
}

export function peakLuminosity_W(M_BH_solar, M_star_solar, R_star_solar) {
  const Mdot = peakAccretionRate_kg_s(M_BH_solar, M_star_solar, R_star_solar);
  const L_acc = 0.1 * Mdot * C * C;
  return Math.min(L_acc, eddingtonLuminosity_W(M_BH_solar));
}

// Lightcurve L(t) using the rate scaled by (peak rate -> peak L).
export function lightcurve_W(t_s, M_BH_solar, M_star_solar, R_star_solar) {
  const Lp = peakLuminosity_W(M_BH_solar, M_star_solar, R_star_solar);
  return Lp * fallbackRate(t_s, M_BH_solar, M_star_solar, R_star_solar);
}

// Deterministic RNG.
export function makeRng(seed = 0xC0FFEE) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stream geometry constants.
export const STREAM_LENGTH = 4;    // visual units after pericentric passage
export const STREAM_WIDTH = 0.2;   // visual width
