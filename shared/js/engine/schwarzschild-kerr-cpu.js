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

// Schwarzschild null-geodesic deflection by RK4 on d2u/dphi2 + u = 3 u^2 (M = 1).
// Returns { captured, phi, deflection } where deflection = phi - pi for escaped rays.
export function deflectionAngleSchwarzschild(b, dphi = 0.0005) {
  // Integrate from u = u_small inbound (du < 0) to the periapsis (du flips sign).
  // Record phi at periapsis as phi_half. The asymptote sits at phi = -phi_inf
  // where phi_inf is the angle from u_small to u=0, approximated by integrating
  // backward in the weak-field tail (negligible for u_small ~ 1e-3 / b).
  // Total light-bending deflection = 2 * phi_half - pi.
  const uStart = 1e-3 / b;
  let u = uStart;
  // Inbound branch: u increases with phi, so du > 0.
  let du = Math.sqrt(Math.max(0, 1 / (b * b) - u * u + 2 * u * u * u));
  let phi = 0;
  for (let i = 0; i < 400000; i += 1) {
    const k1u = du, k1d = -u + 3 * u * u;
    const u2 = u + 0.5 * dphi * k1u, du2 = du + 0.5 * dphi * k1d;
    const k2u = du2, k2d = -u2 + 3 * u2 * u2;
    const u3 = u + 0.5 * dphi * k2u, du3 = du + 0.5 * dphi * k2d;
    const k3u = du3, k3d = -u3 + 3 * u3 * u3;
    const u4 = u + dphi * k3u, du4 = du + dphi * k3d;
    const k4u = du4, k4d = -u4 + 3 * u4 * u4;
    const duNew = du + dphi * (k1d + 2 * k2d + 2 * k3d + k4d) / 6;
    u += dphi * (k1u + 2 * k2u + 2 * k3u + k4u) / 6;
    phi += dphi;
    if (u > 0.5) return { captured: true, phi };
    if (du > 0 && duNew <= 0) {
      // Periapsis reached (du flipped from + to -). phi_half = phi at periapsis.
      return { captured: false, phi, deflection: 2 * phi - Math.PI };
    }
    du = duNew;
  }
  return { captured: false, phi, deflection: 2 * phi - Math.PI };
}
