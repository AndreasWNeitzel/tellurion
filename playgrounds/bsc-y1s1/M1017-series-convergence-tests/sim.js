// Geometric, ratio, root, and alternating-series tests on canonical sequences.
export const SERIES = {
  geom_half: { label: 'sum_{n>=1} 1 / 2^n', terms: (n) => 1 / Math.pow(2, n), limit: 1 },
  pseries_2: { label: 'sum 1 / n^2', terms: (n) => 1 / (n * n), limit: Math.PI * Math.PI / 6 },
  pseries_1: { label: 'harmonic 1 / n', terms: (n) => 1 / n, limit: Infinity },
  alt_log2: { label: 'sum (-1)^(n+1) / n', terms: (n) => Math.pow(-1, n + 1) / n, limit: Math.log(2) },
};
export function partialSum(name, N) {
  const t = SERIES[name].terms;
  let s = 0;
  for (let n = 1; n <= N; n += 1) s += t(n);
  return s;
}
export function ratioTest(name, N) {
  const t = SERIES[name].terms;
  return Math.abs(t(N + 1) / t(N));
}
export function rootTest(name, N) {
  const t = SERIES[name].terms;
  return Math.pow(Math.abs(t(N)), 1 / N);
}

// A parametric family the user can sweep across its convergence boundary.
//   'pseries'     : 1 / n^p             converges iff p > 1        (integral / p-test)
//   'geometric'   : r^n                 converges iff |r| < 1      (ratio / root test)
//   'alternating' : (-1)^(n+1) / n^p    converges iff p > 0        (alternating test)
export function makeSeries(type, param) {
  if (type === 'geometric') {
    const r = param;
    const conv = Math.abs(r) < 1;
    return {
      terms: (n) => Math.pow(r, n),
      label: `r^n,  r = ${r.toFixed(2)}`,
      converges: conv, conditional: false,
      test: 'ratio / root test',
      reason: `|r| = ${Math.abs(r).toFixed(2)} ${conv ? '< 1' : '≥ 1'}`,
      closedLimit: conv ? r / (1 - r) : Infinity,
    };
  }
  if (type === 'alternating') {
    const p = param;
    const conv = p > 0;
    return {
      terms: (n) => Math.pow(-1, n + 1) / Math.pow(n, p),
      label: `(-1)^(n+1) / n^${p.toFixed(2)}`,
      converges: conv, conditional: conv && p <= 1,
      test: 'alternating-series test',
      reason: p > 1 ? 'absolutely (p > 1)' : (conv ? 'conditionally (0 < p ≤ 1)' : 'terms do not → 0'),
      closedLimit: Math.abs(p - 1) < 1e-9 ? Math.log(2) : null,
    };
  }
  // p-series.
  const p = param;
  const conv = p > 1;
  return {
    terms: (n) => 1 / Math.pow(n, p),
    label: `1 / n^${p.toFixed(2)}`,
    converges: conv, conditional: false,
    test: 'integral / p-test',
    reason: `p = ${p.toFixed(2)} ${conv ? '> 1' : '≤ 1'}`,
    closedLimit: Math.abs(p - 2) < 1e-9 ? Math.PI * Math.PI / 6 : null,
  };
}
