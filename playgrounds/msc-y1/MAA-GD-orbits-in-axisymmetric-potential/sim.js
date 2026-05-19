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

// Hero (appended; everything above is byte-identical). The original
// rk4Orbit integrated R-double-dot = F_R only, with no angular
// momentum, so every orbit was a degenerate radial plunge through
// R = 0. The correct meridional-plane motion at conserved L_z uses
// the effective potential Phi_eff = Phi + L_z^2 / (2 R^2), whose
// centrifugal wall keeps the star between a peri- and apo-radius and
// makes the orbit a rosette (Binney and Tremaine, Galactic Dynamics
// 2e, Sec. 3.2).
export function effPotential(R, z, M, a, b, Lz) {
  return miyamotoPotential(R, z, M, a, b) + (Lz * Lz) / (2 * R * R);
}

// Specific energy of the meridional + azimuthal motion (conserved).
export function orbitEnergy(state, M, a, b, Lz) {
  const [R, z, vR, vz] = state;
  return 0.5 * (vR * vR + vz * vz) + effPotential(R, z, M, a, b, Lz);
}

// state = [R, z, vR, vz]; kick-drift-kick leapfrog (symplectic, as the
// spec requires) with the centrifugal term L_z^2 / R^3 added to F_R.
export function leapfrogMeridional(state, dt, M, a, b, Lz) {
  const acc = (R, z) => [
    forceR(R, z, M, a, b) + (Lz * Lz) / (R * R * R),
    forceZ(R, z, M, a, b),
  ];
  let [R, z, vR, vz] = state;
  let [aR, aZ] = acc(R, z);
  vR += 0.5 * dt * aR; vz += 0.5 * dt * aZ;
  R += dt * vR; z += dt * vz;
  if (R < 1e17) R = 1e17;                 // NaN guard; inert for sane L_z
  [aR, aZ] = acc(R, z);
  vR += 0.5 * dt * aR; vz += 0.5 * dt * aZ;
  return [R, z, vR, vz];
}
