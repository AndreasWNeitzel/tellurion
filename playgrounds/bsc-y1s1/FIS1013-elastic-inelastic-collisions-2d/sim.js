// 1D collision of two particles (mass m1, m2; initial velocities u1, u2;
// restitution coefficient e in [0, 1]):
//   v1 = ((m1 - e m2) u1 + (1 + e) m2 u2) / (m1 + m2)
//   v2 = ((1 + e) m1 u1 + (m2 - e m1) u2) / (m1 + m2)
// e = 1: elastic (KE conserved). e = 0: perfectly inelastic (objects stick if free).
export function collide(m1, u1, m2, u2, e) {
  const M = m1 + m2;
  const v1 = ((m1 - e * m2) * u1 + (1 + e) * m2 * u2) / M;
  const v2 = ((1 + e) * m1 * u1 + (m2 - e * m1) * u2) / M;
  return { v1, v2 };
}
export function ke(m1, u1, m2, u2) { return 0.5 * (m1 * u1 * u1 + m2 * u2 * u2); }
export function momentum(m1, u1, m2, u2) { return m1 * u1 + m2 * u2; }
