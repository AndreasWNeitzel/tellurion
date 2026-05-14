// Linear-system solvers on a 1D Poisson tridiagonal system A x = b.
// A_ii = 2, A_{i, i+/-1} = -1; matches discretized -u'' = f on a unit grid.
// Reference: Villate VPython Numerical Methods Ch. 6 (`villate-vpython`).
export function makePoissonRHS(N) {
  const b = new Float64Array(N);
  for (let i = 0; i < N; i += 1) b[i] = Math.sin(Math.PI * (i + 1) / (N + 1));
  return b;
}
export function applyA(x) {
  const N = x.length, y = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    y[i] = 2 * x[i] - (i > 0 ? x[i - 1] : 0) - (i < N - 1 ? x[i + 1] : 0);
  }
  return y;
}
export function residual(x, b) {
  const Ax = applyA(x);
  let s = 0; for (let i = 0; i < x.length; i += 1) s += (b[i] - Ax[i]) ** 2;
  return Math.sqrt(s);
}
// Tridiagonal direct solver (Thomas).
export function thomas(b) {
  const N = b.length;
  const c = new Float64Array(N), d = new Float64Array(N), x = new Float64Array(N);
  c[0] = -1 / 2; d[0] = b[0] / 2;
  for (let i = 1; i < N; i += 1) {
    const denom = 2 - (-1) * c[i - 1];
    c[i] = (-1) / denom;
    d[i] = (b[i] - (-1) * d[i - 1]) / denom;
  }
  x[N - 1] = d[N - 1];
  for (let i = N - 2; i >= 0; i -= 1) x[i] = d[i] - c[i] * x[i + 1];
  return x;
}
export function jacobiStep(x, b) {
  const N = x.length, xn = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const left = i > 0 ? x[i - 1] : 0;
    const right = i < N - 1 ? x[i + 1] : 0;
    xn[i] = (b[i] + left + right) / 2;
  }
  return xn;
}
export function gaussSeidelStep(x, b) {
  const N = x.length;
  for (let i = 0; i < N; i += 1) {
    const left = i > 0 ? x[i - 1] : 0;
    const right = i < N - 1 ? x[i + 1] : 0;
    x[i] = (b[i] + left + right) / 2;
  }
  return x;
}
export function conjugateGradientStep(x, r, p, b) {
  const Ap = applyA(p);
  let rr = 0, pAp = 0;
  for (let i = 0; i < x.length; i += 1) { rr += r[i] * r[i]; pAp += p[i] * Ap[i]; }
  if (pAp < 1e-30) return { x, r, p };
  const alpha = rr / pAp;
  const r_new = new Float64Array(x.length); let rr_new = 0;
  for (let i = 0; i < x.length; i += 1) { x[i] += alpha * p[i]; r_new[i] = r[i] - alpha * Ap[i]; rr_new += r_new[i] * r_new[i]; }
  const beta = rr_new / rr;
  const p_new = new Float64Array(x.length);
  for (let i = 0; i < x.length; i += 1) p_new[i] = r_new[i] + beta * p[i];
  return { x, r: r_new, p: p_new };
}
