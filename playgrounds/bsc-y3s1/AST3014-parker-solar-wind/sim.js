// Parker (1958) isothermal solar wind. Velocity u(r) satisfies
//   (u^2 / c_s^2 - 1)(1/u du/dr) = (2/r)(1 - r_c / r),
// where r_c = GM_sun / (2 c_s^2) is the critical/sonic radius.
// The transonic solution passes through u = c_s at r = r_c.
// Reference: Shu Vol II Ch. 17 (`shu-vol2`); Frank-King-Raine Ch. 2 (`frank-king-raine`).
export const G = 6.674e-11, M_SUN = 1.989e30, R_SUN = 6.957e8;
export function criticalRadius(cs, M = M_SUN) { return G * M / (2 * cs * cs); }
export function parkerSpeed(r, cs, M = M_SUN) {
  // Implicit equation: psi(u) = u^2/cs^2 - ln(u^2/cs^2) - 4 ln(r/r_c) - 4 r_c/r + 3 = 0.
  const rc = criticalRadius(cs, M);
  const target = 4 * Math.log(r / rc) + 4 * rc / r - 3;
  let u_norm2 = r > rc ? 4 : 0.01;
  for (let it = 0; it < 60; it += 1) {
    const fy = u_norm2 - Math.log(u_norm2) - target;
    const dfy = 1 - 1 / u_norm2;
    if (Math.abs(dfy) < 1e-6) break;
    u_norm2 -= fy / dfy;
    if (u_norm2 < 1e-6) u_norm2 = 1e-6;
  }
  return cs * Math.sqrt(u_norm2);
}
