// Bondi spherical accretion onto a point mass M with isothermal sound speed c_s.
// Bondi radius r_B = GM / c_s^2 (transonic crossing point at r = r_B / 2 (isothermal),
// or at r = (5 - 3 gamma)/4 r_B for adiabatic).
// Accretion rate Mdot_B = pi G^2 M^2 rho_inf / c_s^3 * lambda_c,
//   where lambda_c ~ 0.25 for isothermal.
// Reference: Frank-King-Raine Accretion Power Ch. 2 (`frank-king-raine`); Shu Vol II
// Ch. 7 (`shu-vol2`).
export const G = 6.674e-11, M_SUN = 1.989e30, AU = 1.496e11;
export function bondiRadius(M, cs) { return G * M / (cs * cs); }
// Isothermal Bondi (Parker-like solution): u^2/cs^2 - ln(u^2/cs^2) + 4 ln(r/r_B) + 4 r_B/r = -3 + 4 ln(1/2).
// We numerically root-solve for u(r) along the supersonic branch.
export function bondiVelocityIsothermal(r, M, cs) {
  const rB = bondiRadius(M, cs);
  const x = r / rB;
  const rhs = -3 + 4 * Math.log(0.5);
  // f(y) = y - ln(y) + 4 ln(x) + 4/x - 4 - 4 ln(2) but with y = u^2/cs^2.
  // f(y) = 0 has two branches; pick subsonic for r > r_B/2, supersonic for r < r_B/2.
  const target = rhs - 4 * Math.log(x) - 4 / x;
  let y = x < 0.5 ? 2.5 : 0.4;
  for (let it = 0; it < 50; it += 1) {
    const fy = y - Math.log(y) - target;
    const dfy = 1 - 1 / y;
    if (Math.abs(dfy) < 1e-6) break;
    y -= fy / dfy;
    if (y < 1e-6) y = 1e-6;
  }
  return cs * Math.sqrt(y) * Math.sign(-1);
}
// Density via continuity: rho(r) u(r) r^2 = const = Mdot / 4 pi.
export function bondiDensity(r, u, Mdot) { return Math.abs(Mdot / (4 * Math.PI * r * r * u)); }
// Bondi accretion rate, isothermal.
export function MdotBondi(M, cs, rho_inf) {
  return Math.PI * Math.E * Math.E * G * G * M * M * rho_inf / (cs * cs * cs);
}
