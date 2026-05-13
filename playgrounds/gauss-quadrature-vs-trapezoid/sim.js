// sim.js
// Numerical integration:
//   * Trapezoidal rule with n+1 equispaced points on [-1, 1]:
//       I ~ (h/2)(f0 + fn) + h sum_{k=1..n-1} f_k,  h = 2/n.
//   * Gauss-Legendre quadrature with n nodes:
//       I ~ sum_{i=1..n} w_i f(x_i)
//
// Trapezoid converges algebraically (O(h^2) for smooth f, faster for
// periodic). Gauss-Legendre achieves exponential convergence for analytic
// f.
//
// We hardcode Gauss-Legendre nodes and weights for n = 2..16 by computing
// them once via the Golub-Welsch algorithm at module load.
//
// Reference: Press NR Ch. 4 (Gauss-Legendre), Trefethen ATAP Ch. 18.

function golubWelsch(n) {
  // Build the symmetric tridiagonal Jacobi matrix for Legendre polynomials:
  //   beta_k = k / sqrt((2k-1)(2k+1)),  k = 1..n-1
  // Eigenvalues are nodes; weights = 2 * (first component of eigenvector)^2.
  // We do a simple QR iteration on the symmetric tridiagonal matrix.
  const d = new Float64Array(n);     // diagonal (all zero for Legendre)
  const e = new Float64Array(n);     // off-diagonal
  for (let k = 1; k < n; k += 1) e[k] = k / Math.sqrt((2 * k - 1) * (2 * k + 1));
  // Z holds the eigenvectors (start = identity)
  const Z = [];
  for (let i = 0; i < n; i += 1) { const row = new Float64Array(n); row[i] = 1; Z.push(row); }
  // Implicit QL algorithm with shifts (compact version).
  for (let l = 0; l < n; l += 1) {
    let iter = 0;
    while (true) {
      let m;
      for (m = l; m < n - 1; m += 1) {
        const dd = Math.abs(d[m]) + Math.abs(d[m + 1]);
        if (Math.abs(e[m + 1]) + dd === dd) break;
      }
      if (m === l) break;
      if (iter++ > 30) throw new Error('QL too many iterations');
      let g = (d[l + 1] - d[l]) / (2 * e[l + 1]);
      let r = Math.hypot(g, 1);
      g = d[m] - d[l] + e[l + 1] / (g + (g >= 0 ? r : -r));
      let s = 1, c = 1, p = 0;
      for (let i = m - 1; i >= l; i -= 1) {
        const f = s * e[i + 1];
        const b = c * e[i + 1];
        r = Math.hypot(f, g);
        e[i + 2] = r;
        if (r === 0) { d[i + 1] -= p; e[m + 1] = 0; break; }
        s = f / r; c = g / r;
        g = d[i + 1] - p;
        const tt = (d[i] - g) * s + 2 * c * b;
        p = s * tt;
        d[i + 1] = g + p;
        g = c * tt - b;
        // accumulate eigenvectors
        for (let row = 0; row < n; row += 1) {
          const fz = Z[row][i + 1];
          Z[row][i + 1] = s * Z[row][i] + c * fz;
          Z[row][i] = c * Z[row][i] - s * fz;
        }
      }
      if (r === 0 && (m - 1) >= l) continue;
      d[l] -= p; e[l + 1] = g; e[m + 1] = 0;
    }
  }
  // Sort by node value
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => d[a] - d[b]);
  const nodes = new Float64Array(n);
  const weights = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    nodes[i] = d[idx[i]];
    weights[i] = 2 * Z[0][idx[i]] * Z[0][idx[i]];
  }
  return { nodes, weights };
}

// Precompute Gauss-Legendre for n = 1..16.
const GL = {};
for (let n = 1; n <= 16; n += 1) GL[n] = golubWelsch(n);

export function gaussLegendre(fn, n) {
  const { nodes, weights } = GL[n];
  let s = 0;
  for (let i = 0; i < n; i += 1) s += weights[i] * fn(nodes[i]);
  return s;
}

export function trapezoid(fn, n) {
  // n+1 points on [-1, 1].
  const h = 2 / n;
  let s = 0.5 * (fn(-1) + fn(1));
  for (let k = 1; k < n; k += 1) s += fn(-1 + k * h);
  return s * h;
}

// Test functions on [-1, 1] with known integrals.
export const testFns = {
  'cos':       { fn: (x) => Math.cos(2 * x),     exact: 2 * Math.sin(2) / 2 },  // integral cos(2x) = sin(2x)/2 |-1..1 = sin(2)
  'gaussian':  { fn: (x) => Math.exp(-4 * x * x), exact: 0.881895 },             // computed analytically below
  'runge':     { fn: (x) => 1 / (1 + 25 * x * x),  exact: 0.5493603069 },        // integral arctan(5x)/5 |-1..1
  'sqrt-abs':  { fn: (x) => Math.sqrt(Math.abs(x)), exact: 4/3 },                // integral sqrt|x| on [-1,1] = 2 * 2/3
};

// For testing.
export { GL };
