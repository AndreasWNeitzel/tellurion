// Green's function for the 1D boundary-value problem -u'' = f on
// [0, L] with Dirichlet ends u(0) = u(L) = 0 (Arfken and Weber). The
// Green's function is the "tent" G(x, x'); the solution is the
// weighted superposition u(x) = integral G(x, x') f(x') dx'. The
// direct tridiagonal solve (shared cn-tridiag engine) is the
// reference. Deterministic, no RNG.
import { tridiagonalSolveComplex } from '../../../shared/js/engine/cn-tridiag.js';

export const L = 1;

export function grid(N) {
  const x = new Float64Array(N);
  for (let i = 0; i < N; i += 1) x[i] = L * i / (N - 1);
  return x;
}

// Tent Green's function for -G'' = delta(x - xp), G(0)=G(L)=0:
//   G = x (L - xp) / L for x <= xp,  xp (L - x) / L for x >= xp.
export function greenG(x, xp) {
  return x <= xp ? x * (L - xp) / L : xp * (L - x) / L;
}

// Source profiles f(x).
export function source(kind, x, p) {
  if (kind === 'sine') return Math.sin(p * Math.PI * x / L);
  if (kind === 'box') return (x > 0.5 - p * 0.1 && x < 0.5 + p * 0.1) ? 1 : 0;
  if (kind === 'point') {                                   // narrow Gaussian bump
    const s = 0.02 + 0.01 * p;
    return Math.exp(-((x - 0.5) ** 2) / (2 * s * s));
  }
  return Math.sin(Math.PI * x / L) + 0.6 * Math.sin(3 * p * Math.PI * x / L);
}

// u(x_i) = integral_0^L G(x_i, x') f(x') dx' for an arbitrary sampled
// source f (composite trapezoid). Linear in f by construction.
export function applyGreen(x, f) {
  const N = x.length, dx = L / (N - 1), u = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    let s = 0;
    for (let j = 0; j < N; j += 1) {
      const w = (j === 0 || j === N - 1) ? 0.5 : 1;
      s += w * greenG(x[i], x[j]) * f[j];
    }
    u[i] = s * dx;
  }
  return u;
}
export function solveViaGreen(kind, N, p) {
  const x = grid(N);
  const f = Float64Array.from(x, (xx) => source(kind, xx, p));
  return { x, f, u: applyGreen(x, f) };
}

// Direct reference: tridiagonal solve of -u'' = f, Dirichlet 0, via
// the shared complex Thomas solver (imaginary parts zero).
export function solveDirect(kind, N, p) {
  const x = grid(N), dx = L / (N - 1);
  const f = Float64Array.from(x, (xx) => source(kind, xx, p));
  const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), d = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    if (i === 0 || i === N - 1) { b[i] = 1; d[i] = 0; continue; }
    a[i] = 1; b[i] = -2; c[i] = 1;
    d[i] = -f[i] * dx * dx;                                 // -u'' = f  ->  (u_{i-1}-2u_i+u_{i+1})/dx^2 = -f
  }
  const z = new Float64Array(N);
  const ur = new Float64Array(N), ui = new Float64Array(N);
  tridiagonalSolveComplex(a, z, b, z.slice(), c, z.slice(), d, z.slice(), ur, ui, N);
  return { x, f, u: ur };
}

// Analytic solution for the sine source f = sin(m pi x / L):
// u = sin(m pi x / L) / (m pi / L)^2.
export function analyticSine(N, m) {
  const x = grid(N), k = m * Math.PI / L;
  return { x, u: Float64Array.from(x, (xx) => Math.sin(k * xx) / (k * k)) };
}

// Residual of the recovered solution: max | -u'' - f | on the interior.
export function odeResidual(x, u, f) {
  const dx = x[1] - x[0];
  let r = 0;
  for (let i = 1; i < x.length - 1; i += 1) {
    const upp = (u[i + 1] - 2 * u[i] + u[i - 1]) / (dx * dx);
    r = Math.max(r, Math.abs(-upp - f[i]));
  }
  return r;
}
export function maxDiff(a, b) {
  let e = 0; for (let i = 0; i < a.length; i += 1) e = Math.max(e, Math.abs(a[i] - b[i]));
  return e;
}
