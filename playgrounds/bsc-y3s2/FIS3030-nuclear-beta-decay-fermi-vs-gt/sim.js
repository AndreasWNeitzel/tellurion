// Beta decay: Fermi (vector) vs Gamow-Teller (axial) transitions.
// Fermi: delta J = 0, no parity change, no spin flip; coupling G_V.
// Gamow-Teller: delta J = 0, +/-1 (no 0 to 0), no parity change, possible spin flip; coupling G_A.
// Mixed transitions get both.
// The Kurie plot: sqrt(N(E_e) / (p_e^2 F(Z, E_e))) is linear in E_e for allowed beta decay,
// with x-intercept at endpoint Q.
// Reference: Krane Ch. 9 (`krane-nuclear`).
export function kurie(E_e, Q, m_e_keV = 511) {
  if (E_e >= Q) return 0;
  const T = Q - E_e;
  return T;
}
// Selection rules predicate.
export function isFermi(deltaJ, deltaPi) { return deltaJ === 0 && deltaPi === 0; }
export function isGamowTeller(deltaJ, J_i, J_f, deltaPi) {
  if (deltaPi !== 0) return false;
  if (J_i === 0 && J_f === 0) return false;
  return Math.abs(deltaJ) <= 1;
}
export function transitionType(J_i, J_f, deltaPi) {
  const dJ = J_f - J_i;
  if (isFermi(dJ, deltaPi) && isGamowTeller(dJ, J_i, J_f, deltaPi)) return 'Mixed';
  if (isFermi(dJ, deltaPi)) return 'Fermi (pure)';
  if (isGamowTeller(dJ, J_i, J_f, deltaPi)) return 'GT (pure)';
  return 'Forbidden';
}
