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
// Non-relativistic Fermi function (Coulomb correction): F ~ 2 pi eta /
// (1 - exp(-2 pi eta)), eta = alpha Z Etot / p. Enhances low-energy
// electrons (eta > 0 for beta-minus). Finite at p -> 0.
export function fermiFunction(Z, E_e_keV, m_e_keV = 511) {
  const Etot = E_e_keV + m_e_keV;
  const p = Math.sqrt(Math.max(1e-6, Etot * Etot - m_e_keV * m_e_keV));
  const eta = (1 / 137) * Z * Etot / p;
  const x = 2 * Math.PI * eta;
  return x / (1 - Math.exp(-x));
}
// Allowed beta spectrum N(E_e) = F(Z,E) p Etot (Q - E_e)^2 (statistical
// shape; the (Q - E)^2 neutrino phase space gives the endpoint).
export function betaSpectrum(E_e_keV, Q_keV, Z = 1, m_e_keV = 511) {
  if (E_e_keV <= 0 || E_e_keV >= Q_keV) return 0;
  const Etot = E_e_keV + m_e_keV;
  const p = Math.sqrt(Math.max(0, Etot * Etot - m_e_keV * m_e_keV));
  return fermiFunction(Z, E_e_keV, m_e_keV) * p * Etot * (Q_keV - E_e_keV) ** 2;
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
