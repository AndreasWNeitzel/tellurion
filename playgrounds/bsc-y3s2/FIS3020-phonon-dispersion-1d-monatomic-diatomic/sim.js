// 1D phonon dispersion.
// Monatomic chain (mass m, spring K): omega(k) = 2 sqrt(K/m) |sin(k a / 2)|.
// Diatomic chain (masses m1, m2 alternating, spring K):
//   omega^2 = K (1/m1 + 1/m2) +/- K sqrt((1/m1 + 1/m2)^2 - 4 sin^2(k a/2) / (m1 m2)).
// Acoustic branch: -. Optical branch: +. Gap at k = pi/a.
// Reference: Ashcroft-Mermin Ch. 22 (`ashcroft-mermin`); Kittel Solid State (`kittel-cm`).
export function monatomic(k, K = 1, m = 1, a = 1) {
  return 2 * Math.sqrt(K / m) * Math.abs(Math.sin(k * a / 2));
}
export function diatomic(k, K = 1, m1 = 1, m2 = 2, a = 1) {
  const A = K * (1 / m1 + 1 / m2);
  const D = A * A - 4 * K * K * Math.sin(k * a / 2) ** 2 / (m1 * m2);
  const sqrtD = Math.sqrt(Math.max(0, D));
  return { acoustic: Math.sqrt(Math.max(0, A - sqrtD)), optical: Math.sqrt(Math.max(0, A + sqrtD)) };
}
export function gapAtZoneBoundary(K, m1, m2) {
  const small = Math.sqrt(2 * K / Math.max(m1, m2));
  const large = Math.sqrt(2 * K / Math.min(m1, m2));
  return { low: small, high: large };
}
