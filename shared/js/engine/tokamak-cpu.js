// Simplified tokamak field structure (toroidal vacuum approximation).
//   B_phi = B0 R0 / R (toroidal field from external coils, 1/R dependence).
//   B_theta = mu0 I_p / (2 pi r) for r <= a (current uniformly distributed; outside r=a,
//     B_theta = mu0 I_p / (2 pi r)).
//   Safety factor q(r) = r B_phi / (R0 B_theta).
//   At r = a: q_a = (a/R0) * B_phi(R0)/B_theta(a) = 2 pi a^2 B0 / (mu0 R0 I_p).
// Reference: Goedbloed-Poedts Ch. 5 (`goedbloed-plasma`); Freidberg, Ideal MHD.

export const MU0 = 4 * Math.PI * 1e-7;

export function safetyAtEdge(B0, R0, a, Ip_MA) {
  const Ip = Ip_MA * 1e6;
  return 2 * Math.PI * a * a * B0 / (MU0 * R0 * Ip);
}
export function safetyAxis(B0, R0, a, Ip_MA) {
  // Parabolic current profile -> q(0) = q_a / 2.
  return safetyAtEdge(B0, R0, a, Ip_MA) / 2;
}
export function bToroidal(R, B0, R0) { return B0 * R0 / R; }
// Banana-orbit bounce period (estimate): T_b = q R / v_par.
export function bounceTime(q, R, v_par) { return q * R / v_par; }
