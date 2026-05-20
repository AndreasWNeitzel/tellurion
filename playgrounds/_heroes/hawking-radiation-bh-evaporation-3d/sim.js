// Headless physics for the Hawking-radiation / BH evaporation hero.
//
// A non-rotating, uncharged (Schwarzschild) black hole of mass M
// emits thermal radiation with Hawking temperature
//
//   T_H  =  hbar c^3 / (8 pi G M k_B)
//        = 6.17 * 10^-8 K * (M_sun / M).
//
// The radiated power (Stefan-Boltzmann from a sphere of area A_BH =
// 4 pi r_s^2 = 16 pi G^2 M^2 / c^4):
//
//   P_H  =  sigma T_H^4 A_BH
//        = hbar c^6 / (15360 pi G^2 M^2)
//        = 9.0 * 10^-29 W * (M_sun / M)^2.
//
// The mass decreases as dM/dt = -P_H / c^2, leading to an evaporation
// time
//
//   t_evap  =  5120 pi G^2 M^3 / (hbar c^4)
//           = 6.65 * 10^74 s * (M / M_sun)^3
//           ~ 2.1 * 10^67 yr * (M / M_sun)^3.
//
// For a primordial 10^12 kg BH (~ 2e-19 M_sun), t_evap ~ 10^10 yr =
// age of the universe.
//
// References:
//   Hawking, Nature 248 (1974) 30. `hawking-1974`.
//   Hawking, Comm. Math. Phys. 43 (1975) 199. `hawking-1975`.
//   Carr, Hamadache, Houri, Astrophys. J. 833 (2016) 61 (review of primordial BHs).

const G = 6.6743e-11;            // m^3 kg^-1 s^-2
const C = 2.998e8;                // m/s
const HBAR = 1.0546e-34;          // J s
const KB = 1.3807e-23;            // J/K
const SIGMA_SB = 5.6704e-8;       // W m^-2 K^-4
const M_SUN = 1.989e30;           // kg
const SECONDS_PER_YEAR = 3.156e7;

export function schwarzschildRadius_m(M_kg) {
  return 2 * G * M_kg / (C * C);
}

export function hawkingTemperature_K(M_kg) {
  // T_H = hbar c^3 / (8 pi G M k_B)
  return (HBAR * Math.pow(C, 3)) / (8 * Math.PI * G * M_kg * KB);
}

export function hawkingPower_W(M_kg) {
  // P_H = hbar c^6 / (15360 pi G^2 M^2)
  return (HBAR * Math.pow(C, 6)) / (15360 * Math.PI * G * G * M_kg * M_kg);
}

export function evaporationTime_s(M_kg) {
  // t_evap = 5120 pi G^2 M^3 / (hbar c^4)
  return (5120 * Math.PI * G * G * Math.pow(M_kg, 3)) / (HBAR * Math.pow(C, 4));
}

export function evaporationTime_yr(M_kg) {
  return evaporationTime_s(M_kg) / SECONDS_PER_YEAR;
}

// Mass at time t for an initial mass M0 (closed-form integral of
//   dM/dt = -A / M^2, A = hbar c^4 / (15360 pi G^2)
// gives M^3 = M0^3 - 3 A t. We use K_EVAP = 3 A = hbar c^4 / (5120 pi G^2)
// so the equation simplifies to M^3 = M0^3 - K_EVAP t. Then t_evap =
// M0^3 / K_EVAP = 5120 pi G^2 M0^3 / (hbar c^4).
const K_EVAP = (HBAR * Math.pow(C, 4)) / (5120 * Math.PI * G * G);

export function massAtTime_kg(M0_kg, t_s) {
  const inner = Math.pow(M0_kg, 3) - K_EVAP * t_s;
  if (inner <= 0) return 0;
  return Math.pow(inner, 1 / 3);
}

// Convenience converters.
export function massInSolar(M_kg) { return M_kg / M_SUN; }
export function solarToKg(M_solar) { return M_solar * M_SUN; }

// Spectrum peak frequency from Wien: nu_peak = 2.821 k T / h.
export function peakFrequency_Hz(T_K) {
  return 2.821 * KB * T_K / (2 * Math.PI * HBAR);
}

// Deterministic RNG for particle-pair spawn positions.
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

// Critical mass at which evaporation time equals age of universe (~ 14 Gyr).
//   t_evap ~ 2.1e67 yr * (M / M_sun)^3 = 1.4e10 yr
//   M / M_sun = (1.4e10 / 2.1e67)^(1/3) = (6.67e-58)^(1/3) ~ 8.7e-20
//   M ~ 1.7e11 kg.
export const PRIMORDIAL_BH_KG = 1.7e11;
