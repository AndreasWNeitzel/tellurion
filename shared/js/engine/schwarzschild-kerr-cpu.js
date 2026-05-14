// Black-hole geometry quantities used for invariant gates.
// Schwarzschild radius (units of M): r_s = 2.
// Photon sphere (Schwarzschild): r_ph = 3 M.
// Critical impact parameter (Schwarzschild): b_crit = 3 sqrt(3) M.
// ISCO (Schwarzschild): r_ISCO = 6 M.
// Kerr ISCO (prograde): r_ISCO = M (3 + Z_2 - sqrt((3 - Z_1)(3 + Z_1 + 2 Z_2))).
// Kerr ergosphere: r_erg = M + sqrt(M^2 - a^2 cos^2 theta).
// Reference: Shapiro-Teukolsky Black Holes Ch. 12 (`shapiro-teukolsky`).

export function schwarzschildRadius(M = 1) { return 2 * M; }
export function photonSphereSchwarzschild(M = 1) { return 3 * M; }
export function bCritSchwarzschild(M = 1) { return 3 * Math.sqrt(3) * M; }
export function iscoKerr(a, M = 1) {
  const Z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const Z2 = Math.sqrt(3 * a * a + Z1 * Z1);
  return M * (3 + Z2 - Math.sign(a) * Math.sqrt((3 - Z1) * (3 + Z1 + 2 * Z2)));
}
export function ergosphereOuter(a, theta, M = 1) {
  return M + Math.sqrt(M * M - a * a * Math.cos(theta) * Math.cos(theta));
}
export function horizonOuter(a, M = 1) {
  return M + Math.sqrt(M * M - a * a);
}
// Weak-field deflection: phi = 4 M / b.
export function deflectionWeakField(b, M = 1) { return 4 * M / b; }
