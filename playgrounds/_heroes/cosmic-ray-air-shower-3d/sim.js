// Headless physics for the cosmic-ray air-shower hero. A primary
// cosmic ray (proton, alpha, or iron) of energy E_0 enters the upper
// atmosphere and starts a hadronic / electromagnetic cascade.
//
// We use the Heitler toy model (Heitler 1954; Matthews 2005):
//   * EM cascade: each electron emits a photon every X_0 = 36.6 g cm^-2;
//     each photon pair-produces every X_0. After n generations there
//     are 2^n particles each with energy E_0 / 2^n.
//   * The shower reaches maximum when E per particle = critical energy
//     E_c = 87 MeV (in air).
//   * N_max ~ E_0 / E_c, X_max ~ X_0 ln(E_0 / E_c).
// Hadronic cascade is similar but with multiplicity n_ch ~ 10 per
// interaction and pion energy ~ E/n_ch. The interaction length is
// lambda_I ~ 90 g cm^-2 in air.
//
// References:
//   Heitler, Quantum Theory of Radiation, 3rd ed. 1954.
//   Matthews, Astropart. Phys. 22 (2005) 387. `matthews-2005`.
//   Gaisser, Cosmic Rays and Particle Physics, CUP 1990. `gaisser-cosmic-rays`.

export const X_0 = 36.6;          // g cm^-2 (radiation length in air)
export const LAMBDA_I = 90;        // g cm^-2 (hadronic interaction length)
export const E_C_EM = 0.087;       // GeV (critical energy in air)
export const E_C_HAD = 1.0;        // GeV (hadronic critical energy)

// Heitler EM cascade.
export function emShowerMax(E0_GeV) {
  // N_max = E0 / E_c
  return E0_GeV / E_C_EM;
}

export function emShowerXmax(E0_GeV) {
  // X_max = X_0 * log(E0 / E_c) / log 2
  return X_0 * Math.log(E0_GeV / E_C_EM) / Math.log(2);
}

// Hadronic shower X_max (depth of muon production peak).
export function hadronicXmax(E0_GeV, A_primary = 1, multiplicity = 10) {
  // X_max ~ lambda_I + X_0 ln(E_0 / (A n_ch E_c_em)).
  const Eperc = E0_GeV / (A_primary * multiplicity);
  return LAMBDA_I + X_0 * Math.log(Eperc / E_C_EM) / Math.log(2);
}

// Number of muons at shower max (energy-dependent for hadronic).
export function nMuons(E0_GeV, A_primary = 1) {
  // N_mu = A * (E_0 / (A * E_c_pi))^alpha with alpha ~ 0.93.
  const alpha = 0.93;
  return A_primary * Math.pow(E0_GeV / (A_primary * E_C_HAD), alpha);
}

// Gaisser-Hillas longitudinal profile:
//   N(X) = N_max [(X - X_1)/(X_max - X_1)]^((X_max - X_1)/lambda)
//          exp(-(X - X_max)/lambda)
// for X > X_1 (the first-interaction depth).
export function gaisserHillas(X_gcm2, N_max, X_max, X_1 = 0, lambda = 70) {
  if (X_gcm2 < X_1) return 0;
  const a = (X_max - X_1) / lambda;
  const t = (X_gcm2 - X_1) / (X_max - X_1);
  if (t <= 0) return 0;
  return N_max * Math.pow(t, a) * Math.exp(-(X_gcm2 - X_max) / lambda);
}

// Atmospheric depth as a function of altitude (US Standard).
// X(h) = X_0_atm * exp(-h / H), X_0_atm = 1030 g cm^-2 (sea level), H = 8 km.
export function depthAtAltitude_gcm2(h_km) {
  return 1030 * Math.exp(-h_km / 8.0);
}

// Reverse: altitude where atmosphere has depth X g cm^-2 from the top.
export function altitudeAtDepth_km(X_gcm2) {
  return -8.0 * Math.log(X_gcm2 / 1030);
}

// Primary candidates: (name, A, Z).
export const PRIMARIES = [
  { name: 'proton', A: 1, Z: 1 },
  { name: 'helium-4', A: 4, Z: 2 },
  { name: 'carbon-12', A: 12, Z: 6 },
  { name: 'iron-56', A: 56, Z: 26 },
];

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
