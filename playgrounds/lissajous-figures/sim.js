// sim.js
// Lissajous figures: parametric curves
//   x(t) = A sin(a t + delta)
//   y(t) = B sin(b t)
// Closed curve iff a / b is rational. Period = 2 pi / gcd(a, b) (in
// integer-ratio case). delta sets the phase of the x-channel; for a = b,
// delta = pi / 2 traces a circle and delta = 0 traces a 45-degree line.
//
// Reference: Crawford, Waves and Oscillations, Berkeley Physics Vol. 3
// Ch. 1 (`crawford-waves`).

export const A = 1.0;
export const B = 1.0;

export function x(t, a, delta) { return A * Math.sin(a * t + delta); }
export function y(t, b)         { return B * Math.sin(b * t); }

// Period of the curve for integer (or near-integer) a, b.
// In dimensionless time units, period = 2 pi / gcd(a, b) if a, b are
// rational scalings of a common unit. We treat a, b as positive integers
// here for closed-curve presets.
function gcd(a, b) {
  while (b > 1e-9) {
    [a, b] = [b, a - b * Math.floor(a / b)];
  }
  return a;
}
export function period(a, b) {
  return 2 * Math.PI / Math.max(1e-9, gcd(a, b));
}

export function sampleCurve(a, b, delta, N = 1000) {
  const xs = new Float64Array(N);
  const ys = new Float64Array(N);
  const T = period(a, b);
  for (let i = 0; i < N; i += 1) {
    const t = T * i / (N - 1);
    xs[i] = x(t, a, delta);
    ys[i] = y(t, b);
  }
  return { xs, ys, T };
}

// Presets that produce visually striking ratios.
export const PRESETS = {
  '1:1':  { a: 1, b: 1, delta: Math.PI / 2 },   // circle
  '1:2':  { a: 1, b: 2, delta: Math.PI / 2 },   // figure-eight
  '2:3':  { a: 2, b: 3, delta: Math.PI / 2 },   // standard "bowtie"
  '3:4':  { a: 3, b: 4, delta: Math.PI / 2 },
  '3:5':  { a: 3, b: 5, delta: Math.PI / 2 },
  '5:7':  { a: 5, b: 7, delta: Math.PI / 2 },
};
