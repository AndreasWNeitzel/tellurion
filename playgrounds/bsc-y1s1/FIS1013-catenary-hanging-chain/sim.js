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

// General catenary y(x) = a cosh((x - x0)/a) + c through two arbitrary
// support points P1, P2 with a fixed cable length L. Solves the standard
// transcendental constraint sqrt(L^2 - v^2) = 2 a sinh(h/(2a)) for a by
// bisection (monotonic), then x0 and c from the endpoints. Returns null
// if the cable is too short to span the points (drawn straight instead).
export function solveCatenary2pt(x1, y1, x2, y2, L) {
  const h = x2 - x1;                       // x2 > x1 assumed by caller
  const v = y2 - y1;
  const chord = Math.hypot(h, v);
  if (L <= chord + 1e-6 || Math.abs(h) < 1e-6) return null;
  const A = Math.sqrt(L * L - v * v);      // = 2 a sinh(h/2a)
  const g = (a) => 2 * a * Math.sinh(h / (2 * a)) - A;
  // g decreases from +inf (a->0) toward |h| (a->inf); A > |h| so a root exists.
  let lo = 1e-4, hi = 1e4;
  for (let it = 0; it < 80; it += 1) {
    const mid = Math.sqrt(lo * hi);        // geometric bisection (wide range)
    if (g(mid) > 0) lo = mid; else hi = mid;
  }
  const a = Math.sqrt(lo * hi);
  const x0 = 0.5 * (x1 + x2) - a * Math.asinh(v / (2 * a * Math.sinh(h / (2 * a))));
  const c = y1 - a * Math.cosh((x1 - x0) / a);
  return { a, x0, c };
}

export function catenary2ptY(sol, x) {
  return sol.a * Math.cosh((x - sol.x0) / sol.a) + sol.c;
}

export function sampleCatenary2pt(sol, x1, x2, N = 160) {
  const xs = new Float64Array(N + 1), ys = new Float64Array(N + 1);
  for (let i = 0; i <= N; i += 1) {
    const x = x1 + (x2 - x1) * i / N;
    xs[i] = x; ys[i] = catenary2ptY(sol, x);
  }
  return { xs, ys };
}
