// Gamow peak: the convolution of the Maxwell-Boltzmann tail and the
// quantum tunneling probability that sets where thermonuclear fusion
// actually happens. All energies are in keV.
//
// The thermally-averaged reaction rate (with a constant astrophysical
// S-factor) carries its temperature dependence through the integrand
//   I(E) = exp(-E / kT) * exp(-sqrt(E_G / E)),
// the product of the number of ions with energy E (Maxwell-Boltzmann)
// and their barrier-penetration probability (Gamow factor). The product
// is sharply peaked at the Gamow energy E0, in a window where both
// factors are individually tiny.
//
// References:
//   Clayton, Principles of Stellar Evolution and Nucleosynthesis
//     (1983), Sec. 4-3, Eqs. 4-46 to 4-58.
//   Iliadis, Nuclear Physics of Stars (2007), Sec. 3.2.1.
//   Hansen, Kawaler and Trimble, Stellar Interiors (2004), Sec. 6.2.

export const MU_C2 = 931494.1;          // atomic mass unit energy (keV)
export const ALPHA = 1 / 137.035999;    // fine-structure constant
export const KB_KEV = 8.617333e-8;      // Boltzmann constant (keV / K)

// Reduced mass of the colliding pair in atomic mass units.
export function reducedMass(A1, A2) {
  return (A1 * A2) / (A1 + A2);
}

// Gamow energy E_G (keV): the barrier penetration probability is
// exp(-sqrt(E_G / E)). E_G = 2 mu c^2 (pi alpha Z1 Z2)^2.
export function gamowEnergy(Z1, Z2, A1, A2) {
  const mu = reducedMass(A1, A2) * MU_C2;
  const x = Math.PI * ALPHA * Z1 * Z2;
  return 2 * mu * x * x;
}

// Thermal energy kT (keV) at temperature T (K).
export function kT_keV(T) {
  return KB_KEV * T;
}

// Maxwell-Boltzmann occupation factor (unnormalised, peaks at E = 0).
export function maxwell(E, kT) {
  return Math.exp(-E / kT);
}

// Barrier penetration (Gamow) factor, rising with energy.
export function penetration(E, E_G) {
  if (E <= 0) return 0;
  return Math.exp(-Math.sqrt(E_G / E));
}

// Reaction-rate integrand I(E) = Maxwell * penetration (S-factor const).
export function integrand(E, kT, E_G) {
  if (E <= 0) return 0;
  return Math.exp(-E / kT - Math.sqrt(E_G / E));
}

// Gamow peak energy E0 (keV): argmax of the integrand,
// E0 = (sqrt(E_G) kT / 2)^(2/3).
export function peakEnergy(E_G, kT) {
  return Math.pow(0.5 * Math.sqrt(E_G) * kT, 2 / 3);
}

// 1/e full width of the Gaussian approximation to the peak,
// Delta = 4 sqrt(E0 kT / 3).
export function peakWidth(E0, kT) {
  return 4 * Math.sqrt((E0 * kT) / 3);
}

// Peak value of the integrand at E0 (the true maximum of I(E)).
export function peakValue(E_G, kT) {
  return integrand(peakEnergy(E_G, kT), kT, E_G);
}

// Thermally-averaged rate up to a constant: integral of I(E) dE over the
// region that contains the peak. Trapezoid on a fixed grid. This carries
// the dominant exponential temperature dependence of <sigma v>.
export function rate(kT, E_G, opts = {}) {
  const E0 = peakEnergy(E_G, kT);
  const dE = peakWidth(E0, kT);
  const Emax = Math.max(E0 + 10 * dE, 10 * kT);
  const n = opts.steps || 2000;
  const h = Emax / n;
  let sum = 0;
  for (let i = 1; i < n; i += 1) sum += integrand(i * h, kT, E_G);
  return sum * h;                       // endpoints are ~0, omitted
}

// Local power-law exponent nu = d ln rate / d ln T at temperature T (K).
export function rateExponent(T, E_G) {
  const r1 = rate(kT_keV(T * 0.99), E_G);
  const r2 = rate(kT_keV(T * 1.01), E_G);
  if (r1 <= 0 || r2 <= 0) return 0;
  return (Math.log(r2) - Math.log(r1)) / (Math.log(1.01) - Math.log(0.99));
}

// Representative reactions across the burning sequence. defLogT is a
// log10 T (K) that frames the peak well for that channel.
export const REACTIONS = [
  { key: 'pp', label: 'p + p', Z1: 1, Z2: 1, A1: 1, A2: 1, defLogT: 7.18 },
  { key: 'pN14', label: 'p + ¹⁴N (CNO)', Z1: 1, Z2: 7, A1: 1, A2: 14, defLogT: 7.30 },
  { key: 'he3he3', label: '³He + ³He', Z1: 2, Z2: 2, A1: 3, A2: 3, defLogT: 7.20 },
  { key: 'aC12', label: 'α + ¹²C', Z1: 2, Z2: 6, A1: 4, A2: 12, defLogT: 8.30 },
  { key: 'C12C12', label: '¹²C + ¹²C', Z1: 6, Z2: 6, A1: 12, A2: 12, defLogT: 8.90 },
];
