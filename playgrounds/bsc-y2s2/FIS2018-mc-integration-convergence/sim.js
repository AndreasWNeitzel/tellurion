// sim.js
// Monte Carlo integration of integral_{0}^{1} f(x) dx using:
//   1. Plain uniform sampling: I_hat = (1/N) sum f(U_i), U_i ~ U(0, 1).
//   2. Importance sampling with proposal Beta(2, 2): I_hat = (1/N) sum
//      f(X_i) / q(X_i), X_i ~ Beta(2, 2).
//
// The Monte Carlo error decays as 1/sqrt(N). Importance sampling
// reduces variance when the proposal q is close to |f|.
//
// We use the test function f(x) = 1 + 10 (x - 0.5)^4 (smooth, peaked at
// x = 0.5 ish), with integral exact: int_0^1 (1 + 10 (x - 1/2)^4) dx
// = 1 + 10 * (1/5) (x - 1/2)^5 |_0^1 = 1 + 10 * 2 * (1/2)^5 / 5 = 1 + 1/8 = 1.125.
//
// Reference: MacKay, Information Theory Ch. 29 (`mackay`); Press NR Ch. 7.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

export function testFn(x) { return 1 + 10 * Math.pow(x - 0.5, 4); }
export const EXACT = 1.125;

// Box-Muller for normal samples (not used directly; here as utility).

// Sample from Beta(2, 2) via order-statistic: max of two uniforms... actually
// for Beta(2, 2) = Beta(alpha = 2, beta = 2), use the relation that two
// independent uniforms gives Beta(1, 1) (uniform). For Beta(2, 2): use the
// transformation X = (U1 + U2) / 2 where U1, U2 ~ U(0, 1).
// This gives mean 0.5 and variance 1/24, which matches Beta(2, 2).
// Actually that gives a triangular distribution, not Beta(2,2). Hmm.
// For simplicity: use rejection sampling from Beta(2, 2) pdf = 6 x (1 - x).
function sampleBeta22(rng) {
  while (true) {
    const x = rng();
    const u = rng();
    if (u < 6 * x * (1 - x) / 1.5) return x;   // 1.5 is M (envelope max)
  }
}
function betaPdf22(x) { return 6 * x * (1 - x); }

// Plain MC estimate.
export function plainMC(N, seed) {
  const rng = makeRng(seed);
  let sum = 0, sumSq = 0;
  for (let i = 0; i < N; i += 1) {
    const x = rng();
    const fx = testFn(x);
    sum += fx;
    sumSq += fx * fx;
  }
  const mean = sum / N;
  const variance = (sumSq / N - mean * mean) / N;
  return { I: mean, se: Math.sqrt(Math.max(0, variance)) };
}

// Importance-sampled MC.
export function importanceMC(N, seed) {
  const rng = makeRng(seed);
  let sum = 0, sumSq = 0;
  for (let i = 0; i < N; i += 1) {
    const x = sampleBeta22(rng);
    const ratio = testFn(x) / betaPdf22(x);
    sum += ratio;
    sumSq += ratio * ratio;
  }
  const mean = sum / N;
  const variance = (sumSq / N - mean * mean) / N;
  return { I: mean, se: Math.sqrt(Math.max(0, variance)) };
}

// Generate a list of N values to plot the convergence curve.
export function convergence(method, maxLog2 = 18, seed = DEFAULT_SEED) {
  const out = [];
  for (let k = 4; k <= maxLog2; k += 1) {
    const N = 1 << k;
    const r = method(N, seed + k);
    out.push({ N, I: r.I, se: r.se });
  }
  return out;
}
