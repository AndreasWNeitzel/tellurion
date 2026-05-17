// Atwood machine with a pulley of finite moment of inertia. Headless
// and deterministic. The rope is inextensible so the two masses share
// one coordinate x (downward displacement of m1 = upward of m2) and the
// pulley angular speed is v/R. Newton on each mass plus the pulley
// torque equation gives
//   a = (m1 - m2) g / (m1 + m2 + I/R^2),
// with I = 1/2 M R^2 for a uniform disk, I = M R^2 for a thin ring.
// The two rope tensions differ for a massive pulley:
//   T1 = m1 (g - a),  T2 = m2 (g + a),  (T1 - T2) R = I a / R.
// Reference: Marion and Thornton, Classical Dynamics (5th ed.), Sec. 2;
// Kleppner and Kolenkow, An Introduction to Mechanics (2nd ed.), Ch. 6.

const G = 9.81;

export function pulleyInertia(M, R, kind) {
  return (kind === 'ring' ? 1.0 : 0.5) * M * R * R;
}

export function acceleration({ m1, m2, M, R, kind }) {
  const I = pulleyInertia(M, R, kind);
  return (m1 - m2) * G / (m1 + m2 + I / (R * R));
}

export function tensions(p) {
  const a = acceleration(p);
  return { a, T1: p.m1 * (G - a), T2: p.m2 * (G + a), alpha: a / p.R };
}

export function createAtwood(p = {}) {
  const s = {
    m1: p.m1 ?? 3, m2: p.m2 ?? 2, M: p.M ?? 1, R: p.R ?? 0.4,
    kind: p.kind ?? 'disk', x: 0, v: 0, t: 0,
  };
  return s;
}

// Constant-acceleration motion (a is state-independent), RK4 on (x, v)
// for a faithful integrator the invariant tests can probe.
export function step(s, dt) {
  const a = acceleration(s);
  const f = (st) => [st[1], a];
  const y0 = [s.x, s.v];
  const add = (u, k, h) => [u[0] + h * k[0], u[1] + h * k[1]];
  const k1 = f(y0);
  const k2 = f(add(y0, k1, dt / 2));
  const k3 = f(add(y0, k2, dt / 2));
  const k4 = f(add(y0, k3, dt));
  s.x += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
  s.v += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
  s.t += dt;
  return s;
}

// Total mechanical energy: translational + rotational KE plus the
// gravitational PE (referenced to x = 0). m1 falls by x, m2 rises by x.
export function energy(s) {
  const I = pulleyInertia(s.M, s.R, s.kind);
  const KE = 0.5 * (s.m1 + s.m2) * s.v * s.v + 0.5 * I * (s.v / s.R) ** 2;
  const PE = -s.m1 * G * s.x + s.m2 * G * s.x;
  return KE + PE;
}

export { G };
