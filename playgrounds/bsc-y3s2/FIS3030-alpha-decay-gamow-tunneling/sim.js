// Gamow theory of alpha decay: tunneling through Coulomb barrier.
// Gamow factor: G = 2 pi e^2 (2 Z_d) / (4 pi eps0 hbar v) (semi-classical).
// Half-life log10(T_{1/2}) = a + b Z / sqrt(Q_alpha), Geiger-Nuttall law.
// We use the textbook a = -46.83 (Z=daughter, Q in MeV), b = 1.61.
// Reference: Krane Nuclear Physics Ch. 8 (`krane-nuclear`).
export function geigerNuttallLogT(Z_d, Q_MeV) {
  return -46.83 + 1.61 * Z_d / Math.sqrt(Q_MeV);
}
// Gamow penetration factor exponent: 2 G ~ Z_d sqrt(2 m c^2 / Q).
export function gamowExponent(Z_d, Q_MeV) {
  return 1.4 * Z_d / Math.sqrt(Q_MeV);
}
