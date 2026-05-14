// Free-particle Schrodinger Gaussian wavepacket evolution (analytic).
// psi(x, 0) = (2 pi sigma^2)^{-1/4} exp(-(x - x0)^2 / (4 sigma^2)) exp(i k0 x)
// psi(x, t) propagates with sigma(t)^2 = sigma^2 + (i hbar t / (2 m))
// Probability density:
//   |psi|^2 = (1 / sqrt(2 pi sigma_t^2)) exp(-(x - x0 - hbar k0 t / m)^2 / (2 sigma_t^2))
// where sigma_t^2 = sigma^2 (1 + (hbar t / (2 m sigma^2))^2).
// Reference: Eisberg-Resnick Ch. 5 (`eisberg-resnick`); Crawford Ch. 6 (`crawford-waves`).
export function spreadAt(sigma0, t, hbar = 1, m = 1) {
  return sigma0 * Math.sqrt(1 + Math.pow(hbar * t / (2 * m * sigma0 * sigma0), 2));
}
export function center(x0, k0, t, hbar = 1, m = 1) {
  return x0 + hbar * k0 * t / m;
}
export function density(x, t, x0, k0, sigma0, hbar = 1, m = 1) {
  const sig_t = spreadAt(sigma0, t, hbar, m);
  const c = center(x0, k0, t, hbar, m);
  const norm = 1 / Math.sqrt(2 * Math.PI * sig_t * sig_t);
  return norm * Math.exp(-Math.pow(x - c, 2) / (2 * sig_t * sig_t));
}
// Real part of psi (with phase): for visualization. Approximate.
export function realPsi(x, t, x0, k0, sigma0, hbar = 1, m = 1) {
  const sig_t = spreadAt(sigma0, t, hbar, m);
  const c = center(x0, k0, t, hbar, m);
  const env = Math.pow(2 * Math.PI * sig_t * sig_t, -0.25) * Math.exp(-Math.pow(x - c, 2) / (4 * sig_t * sig_t));
  const phase = k0 * x - (hbar * k0 * k0 / (2 * m)) * t;
  return env * Math.cos(phase);
}
