// Thomas precession: a particle moving in a curved (non-inertial accelerated) trajectory
// in SR picks up an extra rotation rate compared to nonrelativistic expectations.
// For circular motion at radius r and speed v = beta c, the Thomas precession is
//   Omega_T = (gamma - 1) (a cross v) / v^2 = (gamma - 1) omega_orb (for circular).
// The total precession (Larmor in a B field) is omega_L - omega_T = (g - 1) omega_L/g.
// Reference: Jackson 3e Ch. 11.8 (`jackson3e`); Marion-Thornton Ch. 14 (`marion-thornton`).
export function gamma(beta) { return 1 / Math.sqrt(1 - beta * beta); }
export function thomasFactor(beta) { return gamma(beta) - 1; }
// For an electron orbiting in a circle at velocity v, the Thomas-Wigner precession rate is
// omega_T = (gamma - 1) omega_orbit (Sokolov-Ternov simplification).
export function thomasRate(beta, omega_orb) { return thomasFactor(beta) * omega_orb; }
