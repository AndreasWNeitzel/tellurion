// Geometric, ratio, root, and alternating-series tests on canonical sequences.
export const SERIES = {
  geom_half: { label: 'sum 1 / 2^n', terms: (n) => 1 / Math.pow(2, n), limit: 2 },
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
