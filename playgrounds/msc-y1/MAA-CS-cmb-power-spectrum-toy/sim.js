// Toy CMB temperature power spectrum: D_l = l(l+1) C_l / 2 pi.
// Simple model with acoustic peaks: D_l ~ A_s exp(-l^2 / l_damp^2) (1 + sum_k B_k cos(l / l_k))
// Reference: Liddle Cosmology Ch. 12 (`liddle-cosmology`); Weinberg Cosmology Ch. 7
// (`weinberg-cosmology`).
export function Dl(l, ls = 220, damp = 2000, amps = [1, 0.4, 0.5, 0.25, 0.3]) {
  // Acoustic peaks at integer multiples of ls (~ 220).
  let s = 1;
  for (let k = 1; k <= amps.length; k += 1) {
    s += amps[k - 1] * Math.cos(Math.PI * l / (k * ls));
  }
  return 1.5 * Math.max(0.05, s) * Math.exp(-Math.pow(l / damp, 2)) * Math.pow(l / 200, 1.2);
}
export function firstPeakL(Omega_m) {
  // l_A roughly = pi (D_A / r_s). Slight shift with Omega_m.
  return 220 + 50 * (0.3 - Omega_m);
}
