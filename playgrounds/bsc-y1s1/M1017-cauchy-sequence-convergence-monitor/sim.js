// sim.js
// Cauchy-sequence convergence: a sequence {a_n} converges iff for every
// epsilon > 0 there exists N such that |a_n - a_m| < epsilon for all
// n, m > N. We monitor a few canonical sequences and the "Cauchy width"
// w(N) = max_{n, m >= N} |a_n - a_m|.
export const SEQUENCES = {
  geom: { label: '1 / 2^n', fn: (n) => 1 / Math.pow(2, n), limit: 0 },
  harm: { label: 'sum 1 / k from 1 to n', fn: (n) => { let s = 0; for (let k = 1; k <= n; k += 1) s += 1 / k; return s; }, limit: Infinity },
  arctan: { label: 'sum (-1)^k / (2 k + 1)', fn: (n) => { let s = 0; for (let k = 0; k <= n; k += 1) s += (k % 2 === 0 ? 1 : -1) / (2 * k + 1); return s; }, limit: Math.PI / 4 },
  zeta2: { label: 'sum 1 / k^2', fn: (n) => { let s = 0; for (let k = 1; k <= n; k += 1) s += 1 / (k * k); return s; }, limit: Math.PI * Math.PI / 6 },
};
export function cauchyWidth(name, N0, Nmax) {
  const f = SEQUENCES[name].fn;
  let min = Infinity, max = -Infinity;
  for (let n = N0; n <= Nmax; n += 1) { const v = f(n); if (v < min) min = v; if (v > max) max = v; }
  return max - min;
}
export function isCauchy(name, eps = 1e-6, Nmax = 1000) {
  for (let N0 = 1; N0 < Nmax / 2; N0 += 1) {
    if (cauchyWidth(name, N0, Nmax) < eps) return { isCauchy: true, N0 };
  }
  return { isCauchy: false, N0: Infinity };
}
