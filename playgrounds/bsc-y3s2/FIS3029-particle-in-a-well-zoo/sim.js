// sim.js
// Quantum particle in three canonical 1D wells: infinite square well,
// finite square well, harmonic oscillator. Closed-form eigenfunctions
// and eigenenergies in each case (Griffiths 2018 QM, Chapters 2 - 4).
//
// All energies in units of hbar^2 / (2 m L^2) for the wells, hbar omega
// for the oscillator.
//
// Wells:
//   - Infinite well on [0, L]: psi_n(x) = sqrt(2/L) sin(n pi x / L),
//     E_n = (n pi)^2 hbar^2 / (2 m L^2).  We set L = 2 in code units.
//   - Finite well [-a, a] of depth V_0: even and odd solutions to
//     k tan(k a) = kappa  (even)
//     k cot(k a) = -kappa (odd)
//     with k = sqrt(2 m E) / hbar, kappa = sqrt(2 m (V_0 - E)) / hbar.
//     Numerical bisection for bound states. Number of bound states:
//     ceil(z0 / (pi/2)) with z0 = a sqrt(2 m V_0 / hbar^2).
//   - Harmonic oscillator V = (1/2) m omega^2 x^2:
//     psi_n(x) = N_n H_n(xi) exp(-xi^2 / 2), xi = sqrt(m omega / hbar) x;
//     E_n = (n + 1/2) hbar omega.
//
// In code units we use m = hbar = omega = 1.

const PI = Math.PI;

// ========== Infinite square well ==========================================
// Well on [0, L]; level n = 1, 2, 3, ...
export function infiniteWellPsi(n, x, L) {
  if (x < 0 || x > L) return 0;
  return Math.sqrt(2 / L) * Math.sin(n * PI * x / L);
}
export function infiniteWellE(n, L) {
  return (n * PI) ** 2 / (2 * L * L);  // in units of hbar^2 / m
}

// ========== Finite square well (centered at origin, depth V_0) ============
// Even-parity: k tan(k a) - kappa = 0
// Odd-parity:  k cot(k a) + kappa = 0
// k = sqrt(2 m E) (m = hbar = 1)
// kappa = sqrt(2 m (V_0 - E))

function bisect(f, a, b, tol = 1e-10, maxIter = 100) {
  let fa = f(a), fb = f(b);
  if (fa * fb > 0) return NaN;
  for (let i = 0; i < maxIter; i += 1) {
    const m = 0.5 * (a + b);
    const fm = f(m);
    if (Math.abs(fm) < tol || (b - a) < tol) return m;
    if (fa * fm <= 0) { b = m; fb = fm; }
    else              { a = m; fa = fm; }
  }
  return 0.5 * (a + b);
}

// Find all bound-state energies of the finite square well.
// Returns array of { E, parity: 'even'|'odd' }.
export function finiteWellLevels(a, V0) {
  const z0 = a * Math.sqrt(2 * V0);   // m=hbar=1
  const nBound = Math.ceil(z0 / (PI / 2));
  const levels = [];
  // The eigenenergies are parameterized by z = k a in (0, z0); even when
  // tan(z) = sqrt((z0/z)^2 - 1), odd when -cot(z) = sqrt((z0/z)^2 - 1).
  // Convert to f(E) using k = sqrt(2 E), kappa = sqrt(2 (V0 - E)).
  function fEven(E) { const k = Math.sqrt(2 * E); const kappa = Math.sqrt(2 * (V0 - E)); return k * Math.tan(k * a) - kappa; }
  function fOdd(E)  { const k = Math.sqrt(2 * E); const kappa = Math.sqrt(2 * (V0 - E)); return k / Math.tan(k * a) + kappa; }
  // The poles of tan and cot at k a = (n + 1/2) pi resp. n pi partition (0, V0) into intervals. Bracket bisection in each.
  const eps = 1e-8;
  // Even: poles where k a = (j + 1/2) pi, i.e., E = ((2 j + 1) pi / (2 a))^2 / 2
  let prevE = eps;
  for (let j = 0; j < nBound + 2; j += 1) {
    const Epole = ((2 * j + 1) * PI / (2 * a)) ** 2 / 2;
    const hi = Math.min(V0 - 1e-9, Epole - 1e-6);
    if (prevE < hi && fEven(prevE) * fEven(hi) < 0) {
      const E = bisect(fEven, prevE, hi);
      if (Number.isFinite(E) && E < V0) levels.push({ E, parity: 'even' });
    }
    prevE = Epole + 1e-6;
    if (prevE >= V0) break;
  }
  // Odd: poles where k a = j pi
  prevE = eps;
  for (let j = 1; j < nBound + 2; j += 1) {
    const Epole = (j * PI / a) ** 2 / 2;
    const hi = Math.min(V0 - 1e-9, Epole - 1e-6);
    if (prevE < hi && fOdd(prevE) * fOdd(hi) < 0) {
      const E = bisect(fOdd, prevE, hi);
      if (Number.isFinite(E) && E < V0) levels.push({ E, parity: 'odd' });
    }
    prevE = Epole + 1e-6;
    if (prevE >= V0) break;
  }
  levels.sort((u, v) => u.E - v.E);
  return levels;
}

// Wavefunction on [-3a, 3a] for a given bound level. Normalized numerically.
export function finiteWellPsi(level, a, V0, xs) {
  const E = level.E;
  const k = Math.sqrt(2 * E);
  const kappa = Math.sqrt(2 * (V0 - E));
  const psi = new Float64Array(xs.length);
  // Coefficient continuity: inside, psi = A cos(k x) (even) or A sin(k x) (odd)
  // Outside x > a: psi = B exp(-kappa x); from continuity at x = a:
  //   even: B = A cos(k a) exp(kappa a)
  //   odd:  B = A sin(k a) exp(kappa a)
  // Set A = 1 then normalize at the end.
  for (let i = 0; i < xs.length; i += 1) {
    const x = xs[i];
    if (Math.abs(x) <= a) {
      psi[i] = level.parity === 'even' ? Math.cos(k * x) : Math.sin(k * x);
    } else {
      const sign = level.parity === 'odd' && x < 0 ? -1 : 1;
      const A_outer = level.parity === 'even'
        ? Math.cos(k * a) * Math.exp(kappa * a)
        : Math.sin(k * a) * Math.exp(kappa * a);
      psi[i] = sign * A_outer * Math.exp(-kappa * Math.abs(x));
    }
  }
  // Normalize
  let s = 0;
  const dx = xs[1] - xs[0];
  for (let i = 0; i < psi.length; i += 1) s += psi[i] * psi[i] * dx;
  const norm = 1 / Math.sqrt(Math.max(1e-30, s));
  for (let i = 0; i < psi.length; i += 1) psi[i] *= norm;
  return psi;
}

// ========== Harmonic oscillator ==========================================
// xi = x (with m = hbar = omega = 1), H_n Hermite polynomial.
// Recurrence: H_0 = 1, H_1 = 2 xi, H_{n+1} = 2 xi H_n - 2 n H_{n-1}.
function hermiteN(n, xi) {
  if (n === 0) return 1;
  if (n === 1) return 2 * xi;
  let H0 = 1, H1 = 2 * xi;
  for (let k = 2; k <= n; k += 1) {
    const H2 = 2 * xi * H1 - 2 * (k - 1) * H0;
    H0 = H1; H1 = H2;
  }
  return H1;
}

function factorial(n) { let f = 1; for (let k = 2; k <= n; k += 1) f *= k; return f; }

export function harmonicWellPsi(n, x) {
  const xi = x;
  const H = hermiteN(n, xi);
  const norm = 1 / Math.sqrt(Math.pow(2, n) * factorial(n) * Math.sqrt(PI));
  return norm * H * Math.exp(-0.5 * xi * xi);
}

export function harmonicWellE(n) {
  return n + 0.5;
}
