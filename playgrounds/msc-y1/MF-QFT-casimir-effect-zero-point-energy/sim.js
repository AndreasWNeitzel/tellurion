// Casimir effect between two perfect parallel plates (Casimir 1948;
// Milonni, The Quantum Vacuum; Lamoreaux 1997). SI units.
//
//   energy per area  E/A = - pi^2 hbar c / (720 d^3)
//   pressure         P   = - dE/dd / A = pi^2 hbar c / (240 d^4)
// Only modes with k_n = n pi / d (n = 1, 2, ...) are allowed between
// the plates; the regularised difference from the free-space
// continuum is the (attractive) Casimir energy.

export const HBAR = 1.054571817e-34;                   // J s
export const C = 2.99792458e8;                         // m/s

// Attractive Casimir pressure (Pa), magnitude.
export function casimirPressure(d) {
  return Math.PI * Math.PI * HBAR * C / (240 * Math.pow(d, 4));
}
// Casimir energy per unit area (J/m^2), negative (binding).
export function casimirEnergyPerArea(d) {
  return -Math.PI * Math.PI * HBAR * C / (720 * Math.pow(d, 3));
}
// Force per area from -dE/dd (should equal casimirPressure).
export function forcePerArea(d, h = d * 1e-5) {
  return -(casimirEnergyPerArea(d + h) - casimirEnergyPerArea(d - h)) / (2 * h);
}

// Allowed transverse wavenumber of the n-th standing mode.
export function modeWavenumber(n, d) { return n * Math.PI / d; }
export function modeWavelength(n, d) { return 2 * d / n; }
// A free-space mode of wavelength lambda "fits" between the plates
// iff at least a half wavelength spans the gap: d >= lambda/2.
export function modeFits(lambda, d) { return d >= lambda / 2 - 1e-18; }
// Number of allowed modes with k_n <= kMax (grows linearly in d).
export function modeCountBelow(kMax, d) { return Math.floor(kMax * d / Math.PI); }

// Pressure / energy / force sampled over a log range of separations.
export function pressureCurve(dMin, dMax, steps) {
  const d = new Float64Array(steps + 1), P = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const dd = dMin * Math.pow(dMax / dMin, i / steps);
    d[i] = dd; P[i] = casimirPressure(dd);
  }
  return { d, P };
}
