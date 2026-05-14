// Sedov-Taylor self-similar point-explosion blast wave.
// Energy E released in an ambient medium of density rho_1; the shock radius grows
// as R(t) = xi_0 (E t^2 / rho_1)^{1/5}, with xi_0 ~ 1.15 for gamma = 5/3.
// Post-shock conditions (strong-shock, gamma = 5/3):
//   rho_2 / rho_1 = (gamma + 1) / (gamma - 1) = 4,
//   u_2 = 3 v_s / 4,  P_2 = (3/4) rho_1 v_s^2,
// where v_s = dR/dt = (2/5) R/t.
// Reference: Shu Vol II Ch. 17 (`shu-vol2`); Acheson Fluids Ch. 9 (`acheson-fluids`).
export const XI = 1.15;
export function shockRadius(E, t, rho1, xi = XI) {
  return xi * Math.pow(E * t * t / rho1, 1 / 5);
}
export function shockSpeed(E, t, rho1, xi = XI) {
  return (2 / 5) * shockRadius(E, t, rho1, xi) / t;
}
export function postShockDensity(rho1, gamma = 5 / 3) {
  return rho1 * (gamma + 1) / (gamma - 1);
}
export function postShockPressure(rho1, vs, gamma = 5 / 3) {
  return (2 / (gamma + 1)) * rho1 * vs * vs;
}
