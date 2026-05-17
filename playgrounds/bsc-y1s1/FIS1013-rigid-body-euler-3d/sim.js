// Torque-free rigid-body rotation (Euler's equations) with a unit
// quaternion for orientation. Headless and deterministic; the
// renderer and the invariant tests both import this.
//   I1 w1' = (I2 - I3) w2 w3
//   I2 w2' = (I3 - I1) w3 w1
//   I3 w3' = (I1 - I2) w1 w2
//   q' = 1/2 q (x) [0, w_body]
// Conserved: rotational energy E = 1/2 sum Ii wi^2 and the squared
// angular momentum |L|^2 = sum Ii^2 wi^2. Rotation about the
// intermediate principal axis is unstable (the Dzhanibekov / tennis-
// racket theorem): a tiny perturbation grows and the spin flips.
// Reference: Landau and Lifshitz, Mechanics (3rd ed.), Sec. 37;
// Marion and Thornton, Classical Dynamics (5th ed.), Ch. 11.

export function createRigidBody({ I = [2, 3, 4], omega = [0.2, 4.0, 0.1], q = [1, 0, 0, 0] } = {}) {
  const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return { I: I.slice(), w: omega.slice(), q: [q[0] / n, q[1] / n, q[2] / n, q[3] / n], t: 0 };
}

function deriv(I, s) {
  // s = [w1,w2,w3, q0,q1,q2,q3] -> ds/dt
  const [w1, w2, w3, q0, q1, q2, q3] = s;
  const [I1, I2, I3] = I;
  const dw1 = (I2 - I3) * w2 * w3 / I1;
  const dw2 = (I3 - I1) * w3 * w1 / I2;
  const dw3 = (I1 - I2) * w1 * w2 / I3;
  // q' = 1/2 q (x) [0, w]  (Hamilton product, w in body frame)
  const dq0 = 0.5 * (-q1 * w1 - q2 * w2 - q3 * w3);
  const dq1 = 0.5 * (q0 * w1 + q2 * w3 - q3 * w2);
  const dq2 = 0.5 * (q0 * w2 - q1 * w3 + q3 * w1);
  const dq3 = 0.5 * (q0 * w3 + q1 * w2 - q2 * w1);
  return [dw1, dw2, dw3, dq0, dq1, dq2, dq3];
}

export function step(body, dt) {
  const I = body.I;
  const s0 = [body.w[0], body.w[1], body.w[2], body.q[0], body.q[1], body.q[2], body.q[3]];
  const add = (a, b, h) => a.map((v, i) => v + h * b[i]);
  const k1 = deriv(I, s0);
  const k2 = deriv(I, add(s0, k1, dt / 2));
  const k3 = deriv(I, add(s0, k2, dt / 2));
  const k4 = deriv(I, add(s0, k3, dt));
  const s = s0.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  const qn = Math.hypot(s[3], s[4], s[5], s[6]) || 1;
  body.w = [s[0], s[1], s[2]];
  body.q = [s[3] / qn, s[4] / qn, s[5] / qn, s[6] / qn];
  body.t += dt;
  return body;
}

export function energy(body) {
  const [I1, I2, I3] = body.I, [w1, w2, w3] = body.w;
  return 0.5 * (I1 * w1 * w1 + I2 * w2 * w2 + I3 * w3 * w3);
}

export function angularMomentumSq(body) {
  const [I1, I2, I3] = body.I, [w1, w2, w3] = body.w;
  return I1 * I1 * w1 * w1 + I2 * I2 * w2 * w2 + I3 * I3 * w3 * w3;
}

// Rotate a body-frame vector into the world frame by the quaternion.
export function bodyToWorld(q, v) {
  const [q0, q1, q2, q3] = q, [x, y, z] = v;
  // world = q v q*
  const tx = 2 * (q2 * z - q3 * y);
  const ty = 2 * (q3 * x - q1 * z);
  const tz = 2 * (q1 * y - q2 * x);
  return [
    x + q0 * tx + (q2 * tz - q3 * ty),
    y + q0 * ty + (q3 * tx - q1 * tz),
    z + q0 * tz + (q1 * ty - q2 * tx),
  ];
}

// World-frame angular-momentum vector L = R diag(I) w_body.
export function angularMomentumWorld(body) {
  const [I1, I2, I3] = body.I, [w1, w2, w3] = body.w;
  return bodyToWorld(body.q, [I1 * w1, I2 * w2, I3 * w3]);
}
