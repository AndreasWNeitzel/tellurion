// sim.js
// Polynomial interpolation: equispaced nodes (Runge phenomenon) vs
// Chebyshev nodes on the Runge function f(x) = 1 / (1 + 25 x^2) on
// [-1, 1].
//
// As n grows, equispaced interpolation diverges (max error -> infinity)
// while Chebyshev interpolation converges (exponential rate for analytic
// f). For the abs function f(x) = |x|, both schemes only converge as
// 1/n (Chebyshev) and diverge (equispaced).
//
// Reference: Trefethen, Approximation Theory and Approximation Practice
// (`trefethen-spectral`); Press NR Ch. 5.

export function rungeFn(x) { return 1 / (1 + 25 * x * x); }
export function absFn(x) { return Math.abs(x); }

// Equispaced nodes on [-1, 1]:
export function equispacedNodes(n) {
  const out = new Float64Array(n + 1);
  for (let i = 0; i <= n; i += 1) out[i] = -1 + 2 * i / n;
  return out;
}

// Chebyshev nodes (Chebyshev-Lobatto, second kind, including endpoints):
export function chebyshevNodes(n) {
  const out = new Float64Array(n + 1);
  for (let i = 0; i <= n; i += 1) out[i] = Math.cos(Math.PI * i / n);
  // sort ascending for plotting clarity
  out.sort();
  return out;
}

// Lagrange interpolation at x given nodes xi and function values yi.
export function lagrangeInterp(x, xi, yi) {
  let sum = 0;
  const n = xi.length;
  for (let i = 0; i < n; i += 1) {
    let li = 1;
    for (let j = 0; j < n; j += 1) {
      if (j !== i) li *= (x - xi[j]) / (xi[i] - xi[j]);
    }
    sum += yi[i] * li;
  }
  return sum;
}

// Build interpolant function for a node set and target function.
export function buildInterp(nodes, fn) {
  const yi = new Float64Array(nodes.length);
  for (let i = 0; i < nodes.length; i += 1) yi[i] = fn(nodes[i]);
  return (x) => lagrangeInterp(x, nodes, yi);
}

// Sup-norm error on a grid of M points.
export function maxError(p, fn, M = 1001) {
  let maxErr = 0;
  for (let i = 0; i < M; i += 1) {
    const x = -1 + 2 * i / (M - 1);
    const err = Math.abs(p(x) - fn(x));
    if (err > maxErr) maxErr = err;
  }
  return maxErr;
}
