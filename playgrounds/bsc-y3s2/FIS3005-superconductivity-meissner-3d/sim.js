// Superconductivity: the Meissner effect, the London penetration
// depth, the critical field and the type-II Abrikosov vortex
// lattice. A superconducting sphere of radius R in a uniform field
// B0 is a perfect diamagnet: screening currents add a dipole so the
// normal field vanishes at the surface and B = 0 inside (for
// B0 < Bc, T < Tc). Outside, B = B0 + dipole with moment chosen so
// B_r(R) = 0; the tangential field is enhanced to (3/2) B0 at the
// equator. The field that does leak in decays as exp(-x/lambdaL)
// over the London depth. Critical field
// Bc(T) = Bc0 (1 - (T/Tc)^2); flux quantum Phi0 = h/2e; the
// triangular vortex lattice spacing is sqrt(2 Phi0 / (sqrt3 B)).
// Headless, deterministic. Reference: Tinkham, Introduction to
// Superconductivity (2nd ed.), Ch. 1-5 (`tinkham`); Kittel,
// Introduction to Solid State Physics (8th ed.), Ch. 10-12
// (`kittel-cm`).

export const PHI0 = 2.067833848e-15;     // Wb, h/2e
export const H_PLANCK = 6.62607015e-34;
export const E_CHARGE = 1.602176634e-19;

export function fluxQuantum() { return H_PLANCK / (2 * E_CHARGE); }

// Critical field vs temperature (empirical parabola).
export function criticalField(Bc0, T, Tc) {
  if (T >= Tc) return 0;
  return Bc0 * (1 - (T / Tc) ** 2);
}
export function isSuperconducting(B0, Bc0, T, Tc) {
  return T < Tc && B0 < criticalField(Bc0, T, Tc);
}

// Field of a perfect-diamagnet sphere (radius R) in uniform B0 z.
// Spherical components at (r, theta). Dipole strength fixed by
// B_r(R, theta) = 0 for all theta: the well-known result
// B_r = B0 cos t (1 - R^3/r^3), B_t = -B0 sin t (1 + R^3/(2 r^3)).
// Inside the sphere B = 0 (Meissner) when superconducting.
export function meissnerField(r, theta, R, B0, superconducting = true) {
  if (superconducting && r < R) return { Br: 0, Bt: 0, Bmag: 0 };
  if (!superconducting) {
    return { Br: B0 * Math.cos(theta), Bt: -B0 * Math.sin(theta), Bmag: B0 };
  }
  const c = (R / r) ** 3;
  const Br = B0 * Math.cos(theta) * (1 - c);
  const Bt = -B0 * Math.sin(theta) * (1 + c / 2);
  return { Br, Bt, Bmag: Math.hypot(Br, Bt) };
}

// Surface tangential field magnitude at colatitude theta:
// |B_t(R)| = (3/2) B0 sin theta -> (3/2) B0 at the equator, 0 poles.
export function surfaceField(theta, B0) { return 1.5 * B0 * Math.sin(theta); }

// London decay of B into a flat surface: B(x) = B_s exp(-x/lambda).
export function londonProfile(x, Bs, lambda) { return Bs * Math.exp(-x / lambda); }

// Ginzburg-Landau ratio and the type boundary kappa = 1/sqrt2.
export function glKappa(lambda, xi) { return lambda / xi; }
export function isTypeII(lambda, xi) { return glKappa(lambda, xi) > 1 / Math.SQRT2; }

// Triangular Abrikosov lattice constant for induction B (one Phi0
// per unit cell, cell area sqrt3 a^2 / 2): a = sqrt(2 Phi0/(sqrt3 B)).
export function vortexSpacing(B) {
  if (B <= 0) return Infinity;
  return Math.sqrt(2 * PHI0 / (Math.sqrt(3) * B));
}
// Number of vortices threading area A at induction B.
export function vortexCount(B, area) { return Math.max(0, Math.round(B * area / PHI0)); }

// Lower/upper critical fields from GL (per unit Phi0): Bc1 ~
// Phi0/(4 pi lambda^2) ln kappa, Bc2 = Phi0/(2 pi xi^2). Returned in
// the same units via the supplied lambda, xi (metres).
export function Bc1(lambda, xi) {
  const k = glKappa(lambda, xi);
  return (PHI0 / (4 * Math.PI * lambda * lambda)) * Math.log(Math.max(1.01, k));
}
export function Bc2(xi) { return PHI0 / (2 * Math.PI * xi * xi); }
