// Bloch oscillations: a particle in a 1D periodic potential, subjected to a uniform
// force F, undergoes oscillatory motion at the Bloch frequency
//   omega_B = e F a / hbar, period T_B = 2 pi hbar / (e F a) = h / (e F a).
// Quasi-momentum k(t) = k_0 + e F t / hbar (mod 2pi/a -- Bragg reflection).
// Position oscillates with amplitude W / (2 e F) where W is the bandwidth.
// Reference: Ashcroft-Mermin Ch. 12 (`ashcroft-mermin`).
export function blochFrequency(F, a = 1, e = 1, hbar = 1) {
  return e * F * a / hbar;
}
export function quasiMomentum(t, k0, F, a = 1, e = 1, hbar = 1) {
  let k = k0 + e * F * t / hbar;
  // Wrap to first BZ.
  while (k > Math.PI / a) k -= 2 * Math.PI / a;
  while (k < -Math.PI / a) k += 2 * Math.PI / a;
  return k;
}
// Cosine band: E(k) = -W/2 cos(k a). Group velocity v(k) = (1/hbar) dE/dk = (W a / 2 hbar) sin(k a).
export function groupVelocity(k, W, a = 1, hbar = 1) {
  return (W * a / (2 * hbar)) * Math.sin(k * a);
}
// Position as a function of time: x(t) - x(0) = - (W / 2 e F) (cos(omega_B t) - 1) - (W a / 2 hbar) integral of sin.
export function position(t, k0, F, W, a = 1, e = 1, hbar = 1) {
  // x(t) = (W / 2 e F)(cos(k0 a + e F a t / hbar) - cos(k0 a)).
  const arg0 = k0 * a;
  const arg = k0 * a + e * F * a * t / hbar;
  return (W / (2 * e * F)) * (Math.cos(arg) - Math.cos(arg0));
}
