// Single planar pendulum derived three ways. The dynamics is identical;
// the three formulations differ only in which variables and constraints
// they expose.
//
// Newton: m L theta'' = -m g sin(theta) (after resolving the tension along the rod).
// Lagrangian: L_lagr = (1/2) m L^2 theta'^2 + m g L cos(theta);
//             d/dt (dL/dtheta') - dL/dtheta = 0 -> theta'' = -(g/L) sin(theta).
// Hamiltonian: H = p^2 / (2 m L^2) - m g L cos(theta); Hamilton: theta' = p/(m L^2),
//             p' = -m g L sin(theta).
//
// Reference: Lemos Analytical Mechanics Ch. 2-3 (`lemos-mech`); Marion-Thornton Ch. 7
// (`marion-thornton`).
export function pendulumRHS(theta, omega, L = 1, g = 9.81) {
  return { dtheta: omega, domega: -(g / L) * Math.sin(theta) };
}
export function leapfrog(theta, omega, dt, L = 1, g = 9.81) {
  const { domega: a0 } = pendulumRHS(theta, omega, L, g);
  const omega_h = omega + 0.5 * dt * a0;
  const theta_n = theta + dt * omega_h;
  const { domega: a1 } = pendulumRHS(theta_n, omega_h, L, g);
  const omega_n = omega_h + 0.5 * dt * a1;
  return { theta: theta_n, omega: omega_n };
}
export function energy(theta, omega, m = 1, L = 1, g = 9.81) {
  return 0.5 * m * L * L * omega * omega - m * g * L * Math.cos(theta);
}
