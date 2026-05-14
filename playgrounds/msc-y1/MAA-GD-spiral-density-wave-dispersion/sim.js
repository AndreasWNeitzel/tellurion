// Lin-Shu density-wave theory: tightly-wound spiral wave dispersion relation for a
// razor-thin gravitating disk with sound speed c_s (or velocity dispersion sigma).
//   (omega - m Omega)^2 = kappa^2 - 2 pi G Sigma |k| + k^2 c_s^2.
// Toomre stability: Q = c_s kappa / (pi G Sigma) > 1 for axisymmetric stability.
// Reference: Binney-Tremaine Ch. 6 (`binney-tremaine`).
export function nuSquared(k, kappa, sigma, G_Sigma) {
  // Returns (omega - m Omega)^2 for the dispersion relation. Negative => unstable.
  return kappa * kappa - 2 * Math.PI * G_Sigma * Math.abs(k) + k * k * sigma * sigma;
}
export function ToomreQ(sigma, kappa, G_Sigma) {
  return sigma * kappa / (Math.PI * G_Sigma);
}
// Most unstable wavenumber (axisymmetric): k_crit = kappa^2 / (2 pi G Sigma) for c_s = 0.
export function kCrit(kappa, G_Sigma) {
  return kappa * kappa / (2 * Math.PI * G_Sigma);
}
