// sim.js
// Catenary: shape of a uniform, perfectly flexible chain hanging under
// gravity between two fixed endpoints.
//
//   y(x) = a cosh(x / a) - a
//
// where a = T_0 / (mu g) is the catenary parameter (horizontal tension over
// linear mass density times g). At a -> infinity (taut chain) the shape
// flattens to a parabola y approx x^2 / (2a) and then to a straight line at
// x.
//
// Arc length from 0 to x: s(x) = a sinh(x / a).
// Slope at x: dy/dx = sinh(x / a).
// Tension in the chain at height y: T(y) = T_0 + mu g y = mu g (a + y).
//
// Reference: Lemos, Analytical Mechanics Ch. 2 (`lemos-analytical`).

export const HALF_SPAN = 1.0;

export function y(x, a) {
  return a * Math.cosh(x / a) - a;
}
export function slope(x, a) {
  return Math.sinh(x / a);
}
export function arclen(x, a) {
  return a * Math.sinh(x / a);
}
export function tension(x, a, mu = 1, g = 9.81) {
  return mu * g * (a + y(x, a));
}

// Parabola approximation y ~ x^2 / (2 a) (Taylor expansion of cosh).
export function parabolaApprox(x, a) {
  return x * x / (2 * a);
}

// Sample the catenary curve as a polyline.
export function sampleCurve(a, N = 200, half = HALF_SPAN) {
  const xs = new Float64Array(N + 1);
  const ys = new Float64Array(N + 1);
  for (let i = 0; i <= N; i += 1) {
    const x = -half + (2 * half) * i / N;
    xs[i] = x;
    ys[i] = y(x, a);
  }
  return { xs, ys };
}

// Sag at center (x = 0 deepest below the suspension points).
export function sag(a, half = HALF_SPAN) {
  return y(half, a);
}
