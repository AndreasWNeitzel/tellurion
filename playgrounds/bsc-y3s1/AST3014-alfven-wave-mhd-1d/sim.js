// 1D Alfvén wave: a transverse magnetic field perturbation b_y travels along x at
// the Alfvén speed v_A = B_0 / sqrt(mu_0 rho). The plasma displacement xi_y satisfies
//   d^2 xi_y / dt^2 = v_A^2 d^2 xi_y / dx^2.
// Reference: Goedbloed-Poedts Ch. 5 (`goedbloed-plasma`); Shu Vol II Ch. 24 (`shu-vol2`).
export const MU0 = 4 * Math.PI * 1e-7;
export function alfvenSpeedMS(B_T, rho_kgm3) { return B_T / Math.sqrt(MU0 * rho_kgm3); }
// Travelling-wave solution for b_y(x, t) and v_y(x, t).
export function bField(x, t, lambda, amp, vA, dir = 1) {
  const k = 2 * Math.PI / lambda;
  return amp * Math.sin(k * (x - dir * vA * t));
}
export function vField(x, t, lambda, amp, vA, B0, rho, dir = 1) {
  // For an Alfven wave, v_y / b_y = -1/sqrt(mu_0 rho) * dir.
  return -dir * bField(x, t, lambda, amp, vA, dir) / Math.sqrt(MU0 * rho);
}
