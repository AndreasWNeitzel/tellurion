// sim.js
// Blackbody radiation: the ultraviolet catastrophe of the Rayleigh-Jeans law and
// its resolution by Planck. The spectral radiance per wavelength is
//   Planck:          B_lam = (2 h c^2 / lam^5) / (exp(hc/(lam kB T)) - 1),
//   Rayleigh-Jeans:  B_lam = 2 c kB T / lam^4,
// and per frequency
//   Planck:          B_nu  = (2 h nu^3 / c^2) / (exp(h nu/(kB T)) - 1),
//   Rayleigh-Jeans:  B_nu  = 2 nu^2 kB T / c^2.
// Rayleigh-Jeans is the long-wavelength (low-frequency) limit of Planck but
// diverges at short wavelength (the catastrophe); Planck's exponential cuts it
// off. The peak follows Wien's law (lam_max T = b) and the integral follows
// Stefan-Boltzmann (total ~ T^4). SI units throughout.
//
// Reference: Eisberg and Resnick, Quantum Physics, Ch. 1; Planck 1901.

export const H = 6.62607015e-34;      // J s
export const C = 2.99792458e8;        // m/s
export const KB = 1.380649e-23;       // J/K
export const SIGMA = 5.670374419e-8;  // W/m^2/K^4 (Stefan-Boltzmann)
export const WIEN = 2.897771955e-3;   // m K (Wien displacement, wavelength)

export function planckLambda(lam, T) { const x = H * C / (lam * KB * T); return (2 * H * C * C / Math.pow(lam, 5)) / (Math.exp(x) - 1); }
export function rayleighJeansLambda(lam, T) { return 2 * C * KB * T / Math.pow(lam, 4); }
export function planckNu(nu, T) { const x = H * nu / (KB * T); return (2 * H * nu * nu * nu / (C * C)) / (Math.exp(x) - 1); }
export function rayleighJeansNu(nu, T) { return 2 * nu * nu * KB * T / (C * C); }

export function wienPeakLambda(T) { return WIEN / T; }                 // wavelength of the per-lambda peak
export function wienPeakNu(T) { return 2.821439372 * KB * T / H; }     // frequency of the per-frequency peak
export function stefanBoltzmann(T) { return SIGMA * Math.pow(T, 4); }  // total emissive power (W/m^2)

// Numerically integrated total radiance over wavelength (W/m^2/sr); the
// hemispheric emissive power is pi times this, which must equal sigma T^4.
export function integratedRadianceLambda(T, lamLo = 1e-8, lamHi = 5e-4, n = 4000) {
  let s = 0; const dl = (lamHi - lamLo) / n;
  for (let i = 0; i < n; i += 1) { const lam = lamLo + (i + 0.5) * dl; s += planckLambda(lam, T) * dl; }
  return s;
}
