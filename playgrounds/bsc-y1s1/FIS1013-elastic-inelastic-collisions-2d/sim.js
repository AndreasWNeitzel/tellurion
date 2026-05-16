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

// 2D oblique disk collision. p1,p2 are centre positions [x,y]; v1,v2 are
// velocity vectors. The impulse acts along the line of centres (normal)
// with restitution e; tangential components are unchanged (frictionless).
export function collide2d(m1, p1, v1, m2, p2, v2, e) {
  let nx = p2[0] - p1[0], ny = p2[1] - p1[1];
  const d = Math.hypot(nx, ny) || 1;
  nx /= d; ny /= d;
  const v1n = v1[0] * nx + v1[1] * ny;
  const v2n = v2[0] * nx + v2[1] * ny;
  if (v1n - v2n <= 0) return { v1: v1.slice(), v2: v2.slice() };   // separating
  const M = m1 + m2;
  const v1nP = ((m1 - e * m2) * v1n + (1 + e) * m2 * v2n) / M;
  const v2nP = ((1 + e) * m1 * v1n + (m2 - e * m1) * v2n) / M;
  return {
    v1: [v1[0] + (v1nP - v1n) * nx, v1[1] + (v1nP - v1n) * ny],
    v2: [v2[0] + (v2nP - v2n) * nx, v2[1] + (v2nP - v2n) * ny],
  };
}
export function ke2d(m1, v1, m2, v2) {
  return 0.5 * (m1 * (v1[0] ** 2 + v1[1] ** 2) + m2 * (v2[0] ** 2 + v2[1] ** 2));
}
