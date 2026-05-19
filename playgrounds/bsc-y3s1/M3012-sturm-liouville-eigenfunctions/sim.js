// sim.js
// Sturm-Liouville eigenfunctions. The simplest example:
//   -y'' = lambda y on [0, pi], with y(0) = y(pi) = 0.
// Eigenvalues lambda_n = n^2, eigenfunctions phi_n(x) = sqrt(2/pi) sin(n x)
// (orthonormal on [0, pi]).
//
// Inner product: <phi_n, phi_m> = integral_0^pi phi_n phi_m dx = delta_nm.
//
// Reference: Arfken-Weber, Mathematical Methods for Physicists 7e Ch. 8
// (`arfken-weber`).

export const L = Math.PI;

export function eigenvalue(n) {
  return n * n;
}

export function eigenfunction(n, x) {
  return Math.sqrt(2 / L) * Math.sin(n * x);
}

// Inner product via Simpson 1/3 on N + 1 nodes.
export function innerProduct(phi1, phi2, N = 2000) {
  const h = L / N;
  let s = phi1(0) * phi2(0) + phi1(L) * phi2(L);
  for (let i = 1; i < N; i += 1) {
    const x = i * h;
    s += (i % 2 === 0 ? 2 : 4) * phi1(x) * phi2(x);
  }
  return s * h / 3;
}

// Project a function f(x) onto eigenfunction basis: c_n = <phi_n, f>.
export function projectCoefficients(f, nMax = 10) {
  const c = new Float64Array(nMax + 1);
  for (let n = 1; n <= nMax; n += 1) {
    c[n] = innerProduct((x) => eigenfunction(n, x), f);
  }
  return c;
}

// Reconstruct f from N coefficients.
export function reconstruct(c, x, nMax = c.length - 1) {
  let s = 0;
  for (let n = 1; n <= nMax; n += 1) s += c[n] * eigenfunction(n, x);
  return s;
}

// ===================================================================
// General regular Sturm-Liouville problem (variable density string).
//
//   -(T y')' = lambda rho(x) y  on [0, L],   y(0) = y(L) = 0,
//
// with T constant and a strictly positive weight rho(x). When
// rho == 1 this reduces to the closed-form case above (lambda_n -> n^2,
// phi_n -> sqrt(2/L) sin n x); a non-uniform rho deforms the modes and
// shifts the spectrum, yet they stay orthonormal under the weighted
// inner product <f, g>_rho = integral rho f g dx. That invariance is
// the substance of Sturm-Liouville theory beyond plain Fourier.
//
// Discretized on n interior nodes (h = L/(n+1)):
//   (T/h^2) K y = lambda M y,  K = tridiag(-1, 2, -1),  M = diag(rho_i).
// Symmetrize with z = M^{1/2} y: S z = lambda z, S symmetric tridiag,
//   S_ii = (2 T / h^2) / rho_i,
//   S_{i,i+1} = -(T / h^2) / sqrt(rho_i rho_{i+1}).
// S is solved by cyclic Jacobi (robust for symmetric matrices);
// eigenvectors are back-transformed y = M^{-1/2} z and normalized so
// the discrete weighted norm sum rho_i y_i^2 h equals 1. Reference:
// Arfken-Weber 7e Ch. 8 (`arfken-weber`); the discrete SL matrix is an
// oscillation matrix, so the Sturm node-count theorem holds exactly.

// Strictly-positive density profiles on [0, L]. Each is O(1) so mode
// frequencies stay comparable; the named shapes redistribute or add
// mass in physically distinct ways.
export function densityProfile(kind, x, Lx = L) {
  const u = x / Lx;                                  // 0 .. 1
  const bump = (c, s) => Math.exp(-((u - c) / s) * ((u - c) / s));
  switch (kind) {
    case 'heavy-center': return 1 + 4 * bump(0.5, 0.11);
    case 'heavy-end':    return 1 + 5 * bump(0.80, 0.085);
    case 'two-step':     return u < 0.5 ? 1 : 4;       // discontinuous coefficient
    case 'taper':        return 0.45 + 2.6 * u;        // linearly loaded
    case 'uniform':
    default:             return 1;
  }
}

// Cyclic Jacobi eigensolver for a symmetric matrix A (row-major,
// length n*n, overwritten). Returns { vals, vecs } with vecs column k
// the unit eigenvector for vals[k]. Deterministic; no random sweeps.
function jacobiEig(A, n) {
  const V = new Float64Array(n * n);
  for (let i = 0; i < n; i += 1) V[i * n + i] = 1;
  for (let sweep = 0; sweep < 80; sweep += 1) {
    let off = 0;
    for (let p = 0; p < n; p += 1) for (let q = p + 1; q < n; q += 1) off += A[p * n + q] * A[p * n + q];
    if (off < 1e-24) break;
    for (let p = 0; p < n; p += 1) {
      for (let q = p + 1; q < n; q += 1) {
        const apq = A[p * n + q];
        if (Math.abs(apq) < 1e-300) continue;
        const app = A[p * n + p], aqq = A[q * n + q];
        const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
        const c = Math.cos(phi), s = Math.sin(phi);
        for (let k = 0; k < n; k += 1) {
          const akp = A[k * n + p], akq = A[k * n + q];
          A[k * n + p] = c * akp - s * akq;
          A[k * n + q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k += 1) {
          const apk = A[p * n + k], aqk = A[q * n + k];
          A[p * n + k] = c * apk - s * aqk;
          A[q * n + k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k += 1) {
          const vkp = V[k * n + p], vkq = V[k * n + q];
          V[k * n + p] = c * vkp - s * vkq;
          V[k * n + q] = s * vkp + c * vkq;
        }
      }
    }
  }
  const vals = new Float64Array(n);
  for (let i = 0; i < n; i += 1) vals[i] = A[i * n + i];
  return { vals, vecs: V };
}

// Solve the variable-density string. Returns the full grid (endpoints
// included), the weight rho on it, ascending eigenvalues lambda_k, and
// mode shapes psi_k (length n+2, clamped to 0 at both ends), each
// weighted-orthonormal: sum rho_i psi_i^2 h = 1.
export function solveSL(kind, n = 96, Lx = L, T = 1) {
  const h = Lx / (n + 1);
  const xg = new Float64Array(n + 2);
  const rho = new Float64Array(n + 2);
  for (let i = 0; i <= n + 1; i += 1) { xg[i] = i * h; rho[i] = densityProfile(kind, xg[i], Lx); }
  const a = T / (h * h);
  const S = new Float64Array(n * n);
  for (let i = 0; i < n; i += 1) {
    S[i * n + i] = 2 * a / rho[i + 1];
    if (i + 1 < n) {
      const e = -a / Math.sqrt(rho[i + 1] * rho[i + 2]);
      S[i * n + (i + 1)] = e;
      S[(i + 1) * n + i] = e;
    }
  }
  const { vals, vecs } = jacobiEig(S, n);
  const order = Array.from({ length: n }, (_, k) => k).sort((p, q) => vals[p] - vals[q]);
  const lambda = new Float64Array(n);
  const modes = [];
  for (let m = 0; m < n; m += 1) {
    const col = order[m];
    lambda[m] = vals[col];
    const y = new Float64Array(n + 2);          // y[0] = y[n+1] = 0
    let wnorm = 0;
    for (let i = 0; i < n; i += 1) {
      y[i + 1] = vecs[i * n + col] / Math.sqrt(rho[i + 1]);   // y = M^{-1/2} z
      wnorm += rho[i + 1] * y[i + 1] * y[i + 1] * h;
    }
    const inv = 1 / Math.sqrt(wnorm);
    let imax = 1, vmax = 0;
    for (let i = 1; i <= n; i += 1) {
      y[i] *= inv;
      if (Math.abs(y[i]) > vmax) { vmax = Math.abs(y[i]); imax = i; }
    }
    if (y[imax] < 0) for (let i = 1; i <= n; i += 1) y[i] = -y[i];   // deterministic sign
    modes.push(y);
  }
  return { xg, rho, lambda, modes, n, h, L: Lx, kind };
}

// Interior sign changes of a mode (the Sturm oscillation count: the
// k-th eigenfunction, k = 1..., must have exactly k-1 of these).
export function nodeCount(psi) {
  let zeros = 0, prev = 0;
  for (let i = 1; i < psi.length - 1; i += 1) {
    const v = psi[i];
    if (Math.abs(v) < 1e-12) continue;
    if (prev !== 0 && Math.sign(v) !== Math.sign(prev)) zeros += 1;
    prev = v;
  }
  return zeros;
}

// Weighted projection of an initial shape f(x) onto the first N modes:
// c_k = sum rho_i f(x_i) psi_{k,i} h  (endpoints carry psi = 0).
export function projectWeighted(f, sol, N) {
  const { xg, rho, modes, n, h } = sol;
  const c = new Float64Array(N + 1);
  for (let k = 1; k <= N; k += 1) {
    const psi = modes[k - 1];
    let s = 0;
    for (let i = 1; i <= n; i += 1) s += rho[i] * f(xg[i]) * psi[i] * h;
    c[k] = s;
  }
  return c;
}

// Time-evolved displacement at grid index j:
//   y(x_j, t) = sum_{k=1}^{N} c_k psi_{k,j} cos(sqrt(lambda_k) t).
export function modeSumAt(sol, c, N, j, t) {
  let y = 0;
  for (let k = 1; k <= N; k += 1) {
    y += c[k] * sol.modes[k - 1][j] * Math.cos(Math.sqrt(Math.max(0, sol.lambda[k - 1])) * t);
  }
  return y;
}
