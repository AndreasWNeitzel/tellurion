// Main-sequence mass-luminosity relation. Approximate piecewise power laws:
//   M < 0.43 M_sun: L = 0.23 M^2.3
//   0.43 < M < 2:   L = M^4
//   2 < M < 55:     L = 1.4 M^3.5
//   M > 55:         L = 32000 M
// Reference: Carroll-Ostlie Ch. 7 (`carroll-ostlie`); Hansen-Kawaler Ch. 5
// (`hansen-kawaler`).
export function L_solar(M_solar) {
  if (M_solar < 0.43) return 0.23 * Math.pow(M_solar, 2.3);
  if (M_solar < 2) return Math.pow(M_solar, 4);
  if (M_solar < 55) return 1.4 * Math.pow(M_solar, 3.5);
  return 32000 * M_solar;
}
export function MS_lifetime_Gyr(M_solar) {
  // t_MS = 10 Gyr (M/L) in solar units.
  return 10 * M_solar / L_solar(M_solar);
}
