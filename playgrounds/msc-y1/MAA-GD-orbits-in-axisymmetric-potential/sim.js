// Axisymmetric potential: Phi(R, z) = -GM / sqrt(R^2 + (a + sqrt(z^2 + b^2))^2) (Miyamoto-Nagai disk).
// Orbit integrated in (R, z) effective plane at fixed L_z.
// Reference: Binney-Tremaine Ch. 3 (`binney-tremaine`).
export const G_SI = 6.674e-11;
export function miyamotoPotential(R, z, M, a, b) {
  const num = G_SI * M;
  const denom = Math.sqrt(R * R + Math.pow(a + Math.sqrt(z * z + b * b), 2));
  return -num / denom;
}
export function forceR(R, z, M, a, b) {
  const denom = Math.pow(R * R + Math.pow(a + Math.sqrt(z * z + b * b), 2), 1.5);
  return -G_SI * M * R / denom;
}
export function forceZ(R, z, M, a, b) {
  const zb = Math.sqrt(z * z + b * b);
  const num = -G_SI * M * z * (a + zb);
  return num / (zb * Math.pow(R * R + Math.pow(a + zb, 2), 1.5));
}
export function rk4Orbit(state, dt, M, a, b) {
  // state = [R, z, vR, vz]
  const f = (s) => {
    const aR = forceR(s[0], s[1], M, a, b);
    const aZ = forceZ(s[0], s[1], M, a, b);
    return [s[2], s[3], aR, aZ];
  };
  const k1 = f(state);
  const s2 = state.map((v, i) => v + 0.5 * dt * k1[i]);
  const k2 = f(s2);
  const s3 = state.map((v, i) => v + 0.5 * dt * k2[i]);
  const k3 = f(s3);
  const s4 = state.map((v, i) => v + dt * k3[i]);
  const k4 = f(s4);
  return state.map((v, i) => v + dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6);
}
