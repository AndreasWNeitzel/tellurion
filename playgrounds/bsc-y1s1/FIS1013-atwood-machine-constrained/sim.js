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

// Double (compound) Atwood, ideal (massless rope and pulleys).
// m1 hangs on one side of the fixed pulley; the other side carries a
// massless movable pulley that itself carries m2 and m3. With rope
// tension T over the fixed pulley and T2 over the movable one, a
// massless movable pulley forces T = 2 T2. Solving Newton on the three
// masses with the rope constraints gives, with g down positive,
//   T2 = 4 g / (1/m2 + 1/m3 + 4/m1),  T = 2 T2,
//   a1 = g - 2 T2/m1   (m1, down +)
//   a2 = g -   T2/m2   (m2, down +)
//   a3 = g -   T2/m3   (m3, down +)
// and the movable pulley accelerates at -a1. q1 = m1 drop, q2 = m2
// drop relative to the movable pulley; both second derivatives are
// state-independent, so the motion is exact under the update below.
// Reference: Morin, Introduction to Classical Mechanics, Ch. 3
// (the double Atwood machine).
export function doubleAccel({ m1, m2, m3 }) {
  const T2 = 4 * G / (1 / m2 + 1 / m3 + 4 / m1);
  const T = 2 * T2;
  const a1 = G - 2 * T2 / m1;
  const a2 = G - T2 / m2;
  const a3 = G - T2 / m3;
  const aP = -a1;                 // movable pulley (down +)
  return { T, T2, a1, a2, a3, aP, q1dd: a1, q2dd: a2 - aP };
}

export function createDouble(p = {}) {
  return {
    mode: 'double',
    m1: p.m1 ?? 4, m2: p.m2 ?? 2, m3: p.m3 ?? 1,
    q1: 0, v1: 0,        // m1 drop and its rate
    q2: 0, v2: 0,        // m2 drop relative to the movable pulley
    t: 0,
  };
}

export function stepDouble(s, dt) {
  const { q1dd, q2dd } = doubleAccel(s);
  s.q1 += s.v1 * dt + 0.5 * q1dd * dt * dt; s.v1 += q1dd * dt;
  s.q2 += s.v2 * dt + 0.5 * q2dd * dt * dt; s.v2 += q2dd * dt;
  s.t += dt;
  return s;
}

// Absolute vertical velocities (down +) from the generalized rates.
export function doubleVels(s) {
  const vP = -s.v1;
  return { v1: s.v1, vP, v2: vP + s.v2, v3: vP - s.v2 };
}

// Total mechanical energy of the ideal double Atwood (conserved; the
// invariant test probes this). y measured down, PE = -m g (drop).
export function energyDouble(s) {
  const { v1, v2, v3 } = doubleVels(s);
  const KE = 0.5 * s.m1 * v1 * v1 + 0.5 * s.m2 * v2 * v2 + 0.5 * s.m3 * v3 * v3;
  const PE = -G * (s.m1 * s.q1 + s.m2 * (-s.q1 + s.q2) + s.m3 * (-s.q1 - s.q2));
  return KE + PE;
}

export { G };
