// sim.js
// Standing waves on a uniform string fixed at both ends.
//
//   y_n(x, t) = A_n sin(n pi x / L) cos(2 pi f_n t + phi_n)
//
// where f_n = n c / (2L). Mode n has n - 1 interior nodes and n antinodes.
//
// Generic superposition: y(x, t) = sum_n A_n sin(n pi x / L) cos(2 pi f_n t).
//
// Reference: French, Vibrations and Waves Ch. 5 (`french-vibrations`).

export const L = 1.0;
export const C = 1.0;   // wave speed; sets the time scale f_1 = C / (2 L) = 0.5
export function freqN(n) { return n * C / (2 * L); }

// Single-mode displacement.
export function yMode(x, t, n, A = 1.0, phi = 0) {
  return A * Math.sin(n * Math.PI * x / L) * Math.cos(2 * Math.PI * freqN(n) * t + phi);
}

// Superposition of selected modes with amplitudes A[n].
export function ySuper(x, t, amps) {
  let s = 0;
  for (let n = 1; n < amps.length; n += 1) {
    if (amps[n] !== 0) s += amps[n] * Math.sin(n * Math.PI * x / L) * Math.cos(2 * Math.PI * freqN(n) * t);
  }
  return s;
}

// Antinode positions for mode n: x_k = (2 k - 1) L / (2 n), k = 1..n.
export function antinodes(n) {
  const out = [];
  for (let k = 1; k <= n; k += 1) out.push((2 * k - 1) * L / (2 * n));
  return out;
}
// Interior node positions: x_k = k L / n, k = 1..n - 1.
export function nodes(n) {
  const out = [];
  for (let k = 1; k < n; k += 1) out.push(k * L / n);
  return out;
}

// Total energy of a single normalized mode is independent of t.
// E_n = (1/4) mu omega_n^2 A^2 L (per Crawford Eq.). For our visualization
// we don't need the absolute value, but the time-averaged amplitude is
// useful as a test.
