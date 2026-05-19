// Superconductor Meissner effect (DOM-free engine). Units mu0/4pi = 1.
//
// A bar magnet (point dipole m at height h above a superconducting
// half-space z = 0) is screened by the Meissner effect. Below the
// critical temperature the supercurrents expel the field from the
// bulk; the boundary condition "no normal B at the surface" is
// reproduced exactly by an IMAGE dipole, so outside the sample the
// field is the real dipole plus its mirror image, and a magnet feels
// a repulsion that can levitate it. The field that does leak in
// decays over the London penetration depth,
//
//   B(d) = B_surface exp(-d / lambda_L),
//   lambda_L(T) = lambda0 / sqrt(1 - (T/Tc)^4)   (two-fluid model),
//
// and superconductivity is quenched above Tc or above the critical
// field Hc(T) = Hc0 [1 - (T/Tc)^2]. Above Tc the field penetrates
// freely (no image, no expulsion). The repulsive force on a vertical
// dipole at height h above the ideal superconductor is
//
//   F = 3 m^2 / (32 h^4)            (mu0/4pi = 1, upward),
//
// the image-dipole result; balancing it against weight gives the
// levitation height. div B = 0 everywhere away from the sources, the
// invariant the tests check.
//
// References: Tinkham, Introduction to Superconductivity, 2nd ed.,
// Dover 2004, Ch. 1-2; Jackson, Classical Electrodynamics, 3rd ed.,
// Sec. 5.6 (image of a dipole in a perfect diamagnet).

export function lambdaL(T, Tc = 1, lambda0 = 1) {
  if (T >= Tc) return Infinity;                 // normal state, no screening
  const x = T / Tc;
  return lambda0 / Math.sqrt(1 - x * x * x * x);
}

export function criticalField(T, Tc = 1, Hc0 = 1) {
  if (T >= Tc) return 0;
  const x = T / Tc;
  return Hc0 * (1 - x * x);
}

export function isSuperconducting(T, Tc, Bapplied, Hc0 = 1) {
  return T < Tc && Bapplied < criticalField(T, Tc, Hc0);
}

// Point-dipole field at r (vector from the dipole), moment m (vector).
// B = [ 3 (m.rhat) rhat - m ] / r^3   (mu0/4pi = 1).
export function dipoleField(rx, ry, rz, mx, my, mz) {
  const r2 = rx * rx + ry * ry + rz * rz;
  const r = Math.sqrt(r2);
  if (r < 1e-9) return [0, 0, 0];
  const r3 = r2 * r;
  const mdotr = (mx * rx + my * ry + mz * rz) / r;
  const ux = rx / r, uy = ry / r, uz = rz / r;
  return [
    (3 * mdotr * ux - mx) / r3,
    (3 * mdotr * uy - my) / r3,
    (3 * mdotr * uz - mz) / r3,
  ];
}

// Total field at point P = (x,y,z) for a dipole of moment (0,0,mz) at
// (0,0,h) above the plane z = 0. If superconducting, add the image
// dipole at (0,0,-h) with moment (0,0,+mz) so the normal field
// vanishes at z = 0 and the bulk (z < 0) is screened (then decays
// over lambda inside). If normal, only the real dipole (penetrates).
export function fieldAt(P, h, mz, sc, lambda) {
  const [x, y, z] = P;
  const real = dipoleField(x, y, z - h, 0, 0, mz);
  if (!sc) return real;                         // normal: field penetrates
  if (z >= 0) {
    // Image at depth h with moment -mz (the Meissner B.n = 0 surface
    // condition); the anti-parallel coaxial pair is repulsive, the
    // levitation. (See the on-axis cancellation in the test.)
    const img = dipoleField(x, y, z + h, 0, 0, -mz);
    return [real[0] + img[0], real[1] + img[1], real[2] + img[2]];
  }
  // inside the sample: exponential London decay of the surface value
  const surf = fieldAt([x, y, 1e-6], h, mz, true, lambda);
  const dcy = Math.exp(z / (lambda > 0 ? lambda : 1e9));   // z<0 -> decays
  return [surf[0] * dcy, surf[1] * dcy, surf[2] * dcy];
}

// Numerical divergence of the field at an exterior point (should be 0).
export function divergence(P, h, mz, sc, lambda, eps = 1e-3) {
  const fx1 = fieldAt([P[0] + eps, P[1], P[2]], h, mz, sc, lambda)[0];
  const fx0 = fieldAt([P[0] - eps, P[1], P[2]], h, mz, sc, lambda)[0];
  const fy1 = fieldAt([P[0], P[1] + eps, P[2]], h, mz, sc, lambda)[1];
  const fy0 = fieldAt([P[0], P[1] - eps, P[2]], h, mz, sc, lambda)[1];
  const fz1 = fieldAt([P[0], P[1], P[2] + eps], h, mz, sc, lambda)[2];
  const fz0 = fieldAt([P[0], P[1], P[2] - eps], h, mz, sc, lambda)[2];
  return (fx1 - fx0 + fy1 - fy0 + fz1 - fz0) / (2 * eps);
}

// Image-dipole repulsion on a vertical dipole at height h:
//   F = 3 m^2 / (32 h^4)  (upward, mu0/4pi = 1).
export function levitationForce(h, mz) {
  return (3 * mz * mz) / (32 * h * h * h * h);
}

// Equilibrium levitation height where the repulsion balances weight
// W = mass * g. (Ideal Meissner is Earnshaw-unstable; real Type-II
// pinning supplies stability. The playground states this.)
export function levitationHeight(mz, weight) {
  // 3 m^2 / (32 h^4) = W  =>  h = (3 m^2 / (32 W))^{1/4}
  return Math.pow((3 * mz * mz) / (32 * weight), 0.25);
}

// London skin profile (fraction of the surface field) at depth d > 0
// into the sample.
export function penetrationProfile(d, lambda) {
  return Math.exp(-d / (lambda > 0 ? lambda : 1e9));
}
