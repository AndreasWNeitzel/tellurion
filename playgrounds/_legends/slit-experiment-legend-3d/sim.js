// Headless physics for the Slit-Experiment Legend. One legend covers:
// (1) Young double-slit interference (wave + particle accumulator);
// (2) Single, double, multi-slit Fraunhofer diffraction with grating;
// (3) Davisson-Germer electron diffraction off a crystal.
//
// All particle types share the same de Broglie relation lambda = h/p,
// so the same intensity formula governs photons and electrons.
//
// Fraunhofer far-field intensity for N slits of width a separated by d:
//   I(theta) = I_0 * (sin alpha / alpha)^2 * (sin(N beta) / sin beta)^2
// where alpha = pi a sin theta / lambda, beta = pi d sin theta / lambda.
// Double-slit (N = 2) reduces to (sin alpha / alpha)^2 * cos^2 beta.
//
// References:
//   Hecht, Optics, 5th ed. Pearson 2017, Ch. 10. `hecht-optics`.
//   Tonomura et al., Am. J. Phys. 57 (1989) 117 (single-electron biprism).
//     `tonomura1989`.
//   Davisson and Germer, Nature 119 (1927) 558. `davisson-germer-1927`.

const H_PLANCK = 6.626e-34;       // J s
const H_BAR = 1.0546e-34;
const E_CHARGE = 1.602e-19;       // C
const M_E = 9.109e-31;            // kg

// de Broglie wavelength for an electron at kinetic energy E (eV).
// lambda = h / sqrt(2 m E_J).
export function deBroglieElectron_m(E_eV) {
  const E_J = E_eV * E_CHARGE;
  return H_PLANCK / Math.sqrt(2 * M_E * E_J);
}

// Photon wavelength is just the slider value (in meters).

export function sinc2(x) {
  if (Math.abs(x) < 1e-12) return 1;
  const s = Math.sin(x) / x;
  return s * s;
}

// Multi-slit grating factor (sin(N beta) / sin beta)^2 with a smooth limit.
export function multiSlitFactor(N, beta) {
  if (Math.abs(Math.sin(beta)) < 1e-12) return N * N;
  const num = Math.sin(N * beta);
  const den = Math.sin(beta);
  return (num * num) / (den * den);
}

// Fraunhofer intensity at angle theta (rad). a, d, lambda in same units.
export function intensity(theta, N, a_m, d_m, lambda_m) {
  const alpha = Math.PI * a_m * Math.sin(theta) / lambda_m;
  const single = sinc2(alpha);
  if (N === 1) return single;
  const beta = Math.PI * d_m * Math.sin(theta) / lambda_m;
  return single * multiSlitFactor(N, beta);
}

// Sample a random "photon" hit position on the screen, drawn from the
// normalized intensity distribution. Uses rejection sampling.
export function sampleHit(N, a_m, d_m, lambda_m, screen_D_m, rng) {
  // Range over screen: y in [-Ymax, +Ymax]. Choose Ymax so that the
  // outer fringes are visible: theta_max ~ 5 lambda / a.
  const theta_max = Math.min(0.5, 5 * lambda_m / Math.max(a_m, 1e-12));
  // Max intensity (at theta=0): N^2 for grating, 1 for single. Take 1 to be safe.
  const I_max = (N === 1) ? 1.05 : (N * N + 1);
  for (let trial = 0; trial < 60; trial++) {
    const theta = (rng() - 0.5) * 2 * theta_max;
    const I = intensity(theta, N, a_m, d_m, lambda_m);
    if (rng() * I_max < I) {
      return screen_D_m * Math.tan(theta);   // y position on screen
    }
  }
  return 0;
}

// Position of m-th order maximum (constructive for d sin = m lambda):
//   sin(theta_m) = m lambda / d.
export function principalMaximumAngle(m, d_m, lambda_m) {
  const s = m * lambda_m / d_m;
  if (Math.abs(s) > 1) return Infinity;
  return Math.asin(s);
}

// Bragg condition for Davisson-Germer: 2 d_lattice sin theta = m lambda.
export function braggAngle(m, d_lattice_m, lambda_m) {
  const s = m * lambda_m / (2 * d_lattice_m);
  if (Math.abs(s) > 1) return Infinity;
  return Math.asin(s);
}

// First-minimum position for single slit: a sin theta = lambda.
export function singleSlitFirstMinAngle(a_m, lambda_m) {
  const s = lambda_m / a_m;
  if (Math.abs(s) > 1) return Infinity;
  return Math.asin(s);
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

// Convenience preset wavelengths (in meters).
export const WAVELENGTH_PRESETS = {
  red: 650e-9,
  green: 532e-9,
  blue: 450e-9,
};

// Nickel lattice (Davisson-Germer 1927): d_111 = 0.215 nm.
export const NICKEL_LATTICE_M = 2.15e-10;
