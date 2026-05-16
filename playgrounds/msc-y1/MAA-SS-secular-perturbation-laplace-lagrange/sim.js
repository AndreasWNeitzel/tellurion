// Laplace-Lagrange secular theory: eccentricity and longitude of perihelion
// of n planets evolve as superpositions of n eigenmodes.
// For two planets: e_j cos(ω_j) and e_j sin(ω_j) precess at eigenfrequencies g_1, g_2
// from diagonalizing the secular matrix A.
// Reference: Murray-Dermott Solar System Dynamics Ch. 7 (`murray-dermott`).
export function eigenfrequencies(n_j, n_k, alpha) {
  // n_j, n_k = mean motions. alpha = a_j / a_k < 1.
  // For demonstration, use diagonal 2x2 matrix.
  // Eigenfrequencies (very simplified): g_1 = alpha n_k, g_2 = alpha n_j.
  return { g1: alpha * n_k * 0.001, g2: alpha * n_j * 0.001 };
}
// Eccentricity oscillation: e_j(t) = e_j0 cos((g_2 - g_1) t / 2).
export function eccentricityOsc(e0, dg, t) {
  return e0 * Math.cos(dg * t / 2);
}
// Equal-mass angular-momentum deficit: e1^2 + e2^2 is the conserved
// secular invariant, the amplitude that the two planets exchange.
export function amd(e1, e2) {
  return e1 * e1 + e2 * e2;
}
