// sim.js
// Epsilon-delta continuity. For a function f and a point x_0, the
// continuity statement is: for every epsilon > 0 there exists delta > 0
// such that |x - x_0| < delta implies |f(x) - f(x_0)| < epsilon.
// We pick a smooth f (sin x), let the user set epsilon and x_0, then
// compute the maximum delta that satisfies the implication on [x_0 - 1, x_0 + 1].
//
// Reference: Arfken-Weber Ch. 1 (`arfken-weber`).

export function f(x) {
  return Math.sin(x);
}

// Maximum delta such that |f(x) - f(x_0)| <= epsilon for all |x - x_0| <= delta.
// Bisection / scan over a grid since f is smooth and monotonic locally.
export function maxDelta(x0, epsilon, dMax = 2.0, N = 1000) {
  const f0 = f(x0);
  let dHi = dMax, dLo = 0;
  for (let iter = 0; iter < 30; iter += 1) {
    const dMid = 0.5 * (dHi + dLo);
    let ok = true;
    for (let k = 0; k <= N; k += 1) {
      const x = x0 - dMid + (2 * dMid) * k / N;
      if (Math.abs(f(x) - f0) > epsilon) { ok = false; break; }
    }
    if (ok) dLo = dMid; else dHi = dMid;
  }
  return dLo;
}
