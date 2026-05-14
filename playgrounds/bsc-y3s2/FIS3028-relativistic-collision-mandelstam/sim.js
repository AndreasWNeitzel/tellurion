// 2-body relativistic kinematics with Mandelstam variables.
//   s = (p1 + p2)^2 = invariant CM energy^2.
//   t = (p1 - p3)^2 = momentum transfer^2.
//   u = (p1 - p4)^2.
// s + t + u = sum of m_i^2 c^4.
// Reference: Marion-Thornton Ch. 14 (`marion-thornton`); Griffiths-Particles Ch. 3
// (`griffiths-particles`).
export function gamma(beta) { return 1 / Math.sqrt(1 - beta * beta); }
export function fixedTargetS(m1, m2, E_lab) {
  // s = m1^2 + m2^2 + 2 m2 E_lab.
  return m1 * m1 + m2 * m2 + 2 * m2 * E_lab;
}
export function colliderS(m1, m2, E1, E2) {
  // s = (E1 + E2)^2 - (p1 + p2)^2; head-on collision.
  const p1 = Math.sqrt(E1 * E1 - m1 * m1);
  const p2 = Math.sqrt(E2 * E2 - m2 * m2);
  return (E1 + E2) ** 2 - (p1 - p2) ** 2;
}
export function sqrtS(s) { return Math.sqrt(Math.max(0, s)); }
