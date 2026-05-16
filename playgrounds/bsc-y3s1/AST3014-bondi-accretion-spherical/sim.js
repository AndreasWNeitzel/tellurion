// Bondi spherical accretion onto a point mass M with isothermal sound speed c_s.
// Bondi radius r_B = GM / c_s^2 (transonic crossing point at r = r_B / 2 (isothermal),
// or at r = (5 - 3 gamma)/4 r_B for adiabatic).
// Accretion rate Mdot_B = pi G^2 M^2 rho_inf / c_s^3 * lambda_c,
//   where lambda_c ~ 0.25 for isothermal.
// Reference: Frank-King-Raine Accretion Power Ch. 2 (`frank-king-raine`); Shu Vol II
// Ch. 7 (`shu-vol2`).
export const G = 6.674e-11, M_SUN = 1.989e30, AU = 1.496e11;
export function bondiRadius(M, cs) { return G * M / (cs * cs); }
// Isothermal Bondi transonic accretion. With w = (u/cs)^2 the Bernoulli
// + continuity integral is
//   w - ln w = -3 + 4 ln(r/r_s) + 4 (r_s / r),
// whose right-hand side equals 1 at r = r_s, where w - ln w is minimised
// at w = 1: the flow is exactly sonic there. r_s = r_B / 2 (isothermal).
// For r < r_s take the supersonic root (w > 1), for r > r_s the subsonic
// root (0 < w < 1); both limbs join smoothly through M = 1 at r_s.
export const SONIC_OVER_BONDI = 0.5;
export function bondiVelocityIsothermal(r, M, cs) {
  const rs = SONIC_OVER_BONDI * bondiRadius(M, cs);
  const xi = r / rs;
  const rhs = -3 + 4 * Math.log(xi) + 4 / xi;          // = 1 exactly at xi = 1
  // Solve w - ln w = rhs on the correct branch (rhs >= 1 always).
  let w = r < rs ? Math.max(1.5, rhs) : 0.3;            // supersonic vs subsonic seed
  for (let it = 0; it < 60; it += 1) {
    const f = w - Math.log(w) - rhs;
    const df = 1 - 1 / w;
    if (Math.abs(df) < 1e-9) break;
    let wn = w - f / df;
    if (r < rs) { if (wn < 1) wn = 1 + 1e-6; }          // stay supersonic
    else { if (wn <= 0) wn = 1e-6; if (wn > 1) wn = 1 - 1e-6; }   // stay subsonic
    w = wn;
  }
  return -cs * Math.sqrt(w);
}
// Density via continuity: rho(r) u(r) r^2 = const = Mdot / 4 pi.
export function bondiDensity(r, u, Mdot) { return Math.abs(Mdot / (4 * Math.PI * r * r * u)); }
// Bondi accretion rate, isothermal.
export function MdotBondi(M, cs, rho_inf) {
  return Math.PI * Math.E * Math.E * G * G * M * M * rho_inf / (cs * cs * cs);
}
