// sim.js
// Rosenzweig-MacArthur predator-prey model with Hopf bifurcation:
//
//   x' = r x (1 - x / K) - a x y / (b + x)
//   y' = e a x y / (b + x) - d y
//
// where x is prey, y is predator, r is prey intrinsic growth rate, K is
// prey carrying capacity, a is attack rate, b is half-saturation,
// e is assimilation efficiency, d is predator mortality.
//
// As K increases past K_H = b (1 + d / (e a - d)) / (1 - d / (e a - d)),
// the interior equilibrium loses stability through a supercritical Hopf
// bifurcation; for K > K_H a stable limit cycle emerges.
//
// Reference: Strogatz, Nonlinear Dynamics Ch. 8.

export function createPredPrey({ r = 0.5, K = 2.0, a = 1.0, b = 0.3, e = 0.5, d = 0.2, x0 = 0.4, y0 = 0.3 } = {}) {
  return { x: x0, y: y0, r, K, a, b, e, d, t: 0, nSteps: 0 };
}

function deriv(s) {
  const fr = s.a * s.x * s.y / (s.b + s.x);
  return {
    dx: s.r * s.x * (1 - s.x / s.K) - fr,
    dy: s.e * fr - s.d * s.y,
  };
}

export function stepPredPrey(s, dt = 0.01) {
  function combine(s0, k, fac) {
    return { x: s0.x + fac * k.dx, y: s0.y + fac * k.dy,
             r: s0.r, K: s0.K, a: s0.a, b: s0.b, e: s0.e, d: s0.d };
  }
  const k1 = deriv(s);
  const k2 = deriv(combine(s, k1, dt / 2));
  const k3 = deriv(combine(s, k2, dt / 2));
  const k4 = deriv(combine(s, k3, dt));
  s.x += dt / 6 * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
  s.y += dt / 6 * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
  if (s.x < 0) s.x = 0;
  if (s.y < 0) s.y = 0;
  s.t += dt;
  s.nSteps += 1;
}

// Interior equilibrium (non-trivial).
//   d y* = e a x* / (b + x*)  =>  x* = b d / (e a - d)
//   r x* (1 - x*/K) = a x* y* / (b + x*)
//   y* = (r / a) (1 - x*/K) (b + x*)
export function equilibrium({ r, K, a, b, e, d }) {
  const xStar = b * d / (e * a - d);
  if (xStar > K || xStar < 0) return null;
  const yStar = (r / a) * (1 - xStar / K) * (b + xStar);
  return { x: xStar, y: yStar };
}

// Hopf threshold from Strogatz: K_H = (b + xStar) where xStar is the
// equilibrium prey. Above K_H the equilibrium is unstable; below it is stable.
export function hopfThreshold({ a, b, e, d }) {
  const xStar = b * d / (e * a - d);
  return b + 2 * xStar;       // standard expression for K_H in this model
}
