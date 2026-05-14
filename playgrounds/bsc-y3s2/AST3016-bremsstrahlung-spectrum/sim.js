// Thermal bremsstrahlung emission spectrum for an optically thin plasma at T.
// j_nu = 6.8e-38 T^{-1/2} Z^2 n_e n_i e^{-h nu / kT} g_ff erg s^-1 cm^-3 Hz^-1.
// Reference: Rybicki-Lightman Ch. 5 (`rybickilightman1979`); Carroll-Ostlie Ch. 12
// (`carroll-ostlie`).
export const H = 6.62607015e-34, KB = 1.380649e-23;
export function emissivity(nu, T, n_e, n_i, Z = 1, g_ff = 1.2) {
  const factor = 6.8e-38 * Math.pow(T, -0.5) * Z * Z * n_e * n_i * g_ff;
  const exp = Math.exp(-H * nu / (KB * T));
  return factor * exp;
}
export function cutoffHz(T) { return KB * T / H; }
