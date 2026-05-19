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

// Comoving sound horizon at recombination, the BAO standard ruler.
// A toy normalisation: anchored to the Planck value ~150 Mpc at the
// fiducial baryon loading R_fid, and scaling with the sound speed
// (more baryons -> slower c_s -> smaller horizon). Eisenstein et al.
// 2005; Planck 2018 give r_d ~ 147 Mpc.
export const R_FID = 0.6;
export const RS_FID_MPC = 150;
export function soundHorizon(R_baryon) {
  return RS_FID_MPC * (soundSpeed(R_baryon) / soundSpeed(R_FID));
}

// Toy galaxy two-point correlation function: a smooth power-law
// clustering term plus the acoustic bump parked at the sound horizon
// r_s. This is the observable that turned BAO into a standard ruler.
export function baoXi(r, r_s) {
  if (r <= 0) return 0;
  const smooth = 0.04 * Math.pow(28 / r, 1.7);
  const z = (r - r_s) / 12;
  const bump = 0.014 * Math.exp(-(z * z));
  return smooth + bump;
}
