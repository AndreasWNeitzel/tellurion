// Noether: a continuous symmetry of the Lagrangian implies a conserved quantity.
//   Time-translation -> energy.
//   Rotation symmetry (central force) -> angular momentum.
//   Translation in x -> linear momentum p_x.
// The simulation below is a 2D particle in an attractive potential V(r) = -1/r;
// can be modified to break rotational symmetry by adding eps cos(2 theta).
// Reference: Lemos Ch. 4 (`lemos-mech`); Marion-Thornton Ch. 7 (`marion-thornton`).
export function force(x, y, breakRot) {
  const r2 = x * x + y * y + 1e-9;
  const r = Math.sqrt(r2);
  const f_central_mag = -1 / r2;
  let fx = f_central_mag * x / r;
  let fy = f_central_mag * y / r;
  if (breakRot) {
    const theta = Math.atan2(y, x);
    const dV_dtheta = -2 * breakRot * Math.sin(2 * theta);
    fx += dV_dtheta * (-y) / r2;
    fy += dV_dtheta * x / r2;
  }
  return { fx, fy };
}
export function rk4(state, dt, breakRot) {
  const f = (s) => { const fr = force(s[0], s[1], breakRot); return [s[2], s[3], fr.fx, fr.fy]; };
  const k1 = f(state);
  const s2 = state.map((v, i) => v + 0.5 * dt * k1[i]);
  const k2 = f(s2);
  const s3 = state.map((v, i) => v + 0.5 * dt * k2[i]);
  const k3 = f(s3);
  const s4 = state.map((v, i) => v + dt * k3[i]);
  const k4 = f(s4);
  return state.map((v, i) => v + dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6);
}
export function angularMomentum(state) { return state[0] * state[3] - state[1] * state[2]; }
export function energy(state, breakRot) {
  const KE = 0.5 * (state[2] * state[2] + state[3] * state[3]);
  const r = Math.sqrt(state[0] * state[0] + state[1] * state[1]) + 1e-9;
  let PE = -1 / r;
  if (breakRot) { const theta = Math.atan2(state[1], state[0]); PE += breakRot * Math.cos(2 * theta) / r; }
  return KE + PE;
}
