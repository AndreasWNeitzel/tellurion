// sim.js
// Free rigid-body rotation, Euler's equations in the body frame:
//
//   I1 w1' = (I2 - I3) w2 w3
//   I2 w2' = (I3 - I1) w3 w1
//   I3 w3' = (I1 - I2) w1 w2
//
// With I1 < I2 < I3, rotation about the intermediate axis (2) is
// linearly unstable: a tiny perturbation grows and the body
// periodically flips (the tennis-racket / Dzhanibekov effect).
// Rotation about the major (1) or minor (3) axis is stable.
//
// Orientation is carried as a unit quaternion integrated from the
// body angular velocity. Energy E = 1/2 sum I_k w_k^2 and the angular
// momentum magnitude |L|^2 = sum (I_k w_k)^2 are conserved.
//
// Reference: Goldstein, Classical Mechanics 3e, Sec. 5.6 (`goldstein-mech`);
// Marsden and Ratiu, Mechanics and Symmetry.

export const AXES = { major: 0, intermediate: 1, minor: 2 };

export function createRacket({
  I = [1, 2, 3], spin = 6, axis = 1, perturb = 0.05,
} = {}) {
  const w = [0, 0, 0];
  w[axis] = spin;
  // Seed the two transverse axes with the perturbation.
  for (let k = 0; k < 3; k += 1) if (k !== axis) w[k] = perturb * spin * (k === (axis + 1) % 3 ? 1 : 0.6);
  return { I: I.slice(), w, q: [1, 0, 0, 0], t: 0, E0: null, L0: null };
}

function omegaDot(I, w) {
  return [
    ((I[1] - I[2]) * w[1] * w[2]) / I[0],
    ((I[2] - I[0]) * w[2] * w[0]) / I[1],
    ((I[0] - I[1]) * w[0] * w[1]) / I[2],
  ];
}

function qMul(a, b) {
  return [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ];
}
function qNorm(q) {
  const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
}

export function step(s, dt = 1 / 240) {
  const I = s.I;
  // RK4 on the body angular velocity.
  const w = s.w;
  const k1 = omegaDot(I, w);
  const w2 = w.map((v, i) => v + 0.5 * dt * k1[i]);
  const k2 = omegaDot(I, w2);
  const w3 = w.map((v, i) => v + 0.5 * dt * k2[i]);
  const k3 = omegaDot(I, w3);
  const w4 = w.map((v, i) => v + dt * k3[i]);
  const k4 = omegaDot(I, w4);
  for (let i = 0; i < 3; i += 1) s.w[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  // Quaternion kinematics: q' = 1/2 q * (0, w_body).
  const wq = [0, s.w[0], s.w[1], s.w[2]];
  const qd = qMul(s.q, wq).map((v) => 0.5 * v);
  s.q = qNorm([s.q[0] + qd[0] * dt, s.q[1] + qd[1] * dt, s.q[2] + qd[2] * dt, s.q[3] + qd[3] * dt]);
  s.t += dt;
}

// World-frame rotation matrix (columns are the body principal axes).
export function rotationMatrix(s) {
  const [a, b, c, d] = s.q;
  return [
    [1 - 2 * (c * c + d * d), 2 * (b * c - a * d), 2 * (b * d + a * c)],
    [2 * (b * c + a * d), 1 - 2 * (b * b + d * d), 2 * (c * d - a * b)],
    [2 * (b * d - a * c), 2 * (c * d + a * b), 1 - 2 * (b * b + c * c)],
  ];
}

export function energy(s) {
  return 0.5 * (s.I[0] * s.w[0] ** 2 + s.I[1] * s.w[1] ** 2 + s.I[2] * s.w[2] ** 2);
}
export function angularMomentumMag(s) {
  return Math.hypot(s.I[0] * s.w[0], s.I[1] * s.w[1], s.I[2] * s.w[2]);
}

export function diagnostics(s) {
  if (s.E0 === null) { s.E0 = energy(s); s.L0 = angularMomentumMag(s); }
  const E = energy(s), L = angularMomentumMag(s);
  return {
    w: s.w.slice(),
    energyDrift: (E - s.E0) / (s.E0 || 1),
    LDrift: (L - s.L0) / (s.L0 || 1),
    t: s.t,
  };
}
