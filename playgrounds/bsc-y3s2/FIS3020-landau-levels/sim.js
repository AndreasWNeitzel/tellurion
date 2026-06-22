// Landau quantization: a charged particle in a uniform magnetic field B. Classically it
// orbits at the cyclotron frequency omega_c = eB/m; quantum mechanically the energy is
// quantized into Landau levels E_n = (n + 1/2) hbar omega_c, each with a degeneracy
// proportional to B (eB/h states per unit area). The 2D density of states collapses from
// a flat continuum into a comb at the Landau levels, and as B sweeps the levels cross the
// Fermi energy (the de Haas-van Alphen oscillations). Units hbar = m = e = 1.
// Reference: Ashcroft and Mermin, Solid State Physics, Ch. 14.

export function cyclotronFreq(B) { return B; }                       // omega_c = eB/m
export function landauEnergy(n, B) { return (n + 0.5) * B; }         // E_n
export function magneticLength(B) { return 1 / Math.sqrt(B); }       // l_B = sqrt(hbar/eB)
export function orbitRadius(n, B) { return Math.sqrt((2 * n + 1) / B); }  // quantum orbit radius l_B sqrt(2n+1)
export function classicalRadius(E, B) { return Math.sqrt(2 * E) / B; }    // r = v/omega_c at energy E

// Degeneracy per unit area of one Landau level, eB/h = B/(2 pi) with hbar = 1.
export function degeneracyDensity(B) { return B / (2 * Math.PI); }

// Index of the highest filled Landau level at Fermi energy EF (-1 if none filled).
export function highestFilledLevel(EF, B) { return Math.floor(EF / B - 0.5); }
export function filledCount(EF, B) { return Math.max(0, highestFilledLevel(EF, B) + 1); }

// Broadened density of states (sum of Gaussians at the Landau levels), for display.
export function densityOfStates(E, B, width, nMax = 40) {
  let g = 0;
  const norm = 1 / (width * Math.sqrt(2 * Math.PI));
  for (let n = 0; n <= nMax; n += 1) { const d = E - landauEnergy(n, B); g += norm * Math.exp(-(d * d) / (2 * width * width)); }
  return g;
}
