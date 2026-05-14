// Toy BAO model: matter-radiation tightly coupled prior to recombination drives a sound wave.
// Sound speed c_s ≈ c / sqrt(3 (1 + R)), R = 3 rho_b / 4 rho_gamma.
// Sound horizon at recombination: s = integral_0^t_rec c_s dt ~ 150 Mpc (Planck).
// Reference: Liddle Cosmology Ch. 11 (`liddle-cosmology`); Weinberg Cosmology Ch. 8
// (`weinberg-cosmology`).
export const C_KM_S = 2.998e5;
export function soundSpeed(R_baryon, c = C_KM_S) {
  return c / Math.sqrt(3 * (1 + R_baryon));
}
// Wave packet: gaussian initial radial profile that propagates outward at c_s.
export function shellRadius(t, c_s) { return c_s * t; }
