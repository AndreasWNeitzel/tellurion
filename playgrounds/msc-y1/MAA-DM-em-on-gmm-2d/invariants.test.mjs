// EM-on-GMM 2D invariant tests.
// (a) EM is monotone: log-likelihood never decreases.
// (b) Responsibilities normalize to 1 across components.
// (c) Recovered means converge near ground truth means.
// (d) Mixing weights sum to 1.
// (e) Covariances stay positive-definite.

import { describe, it, expect } from 'vitest';
import { sampleGMM, initEM, emStep } from './sim.js';

const TRUE_MEANS = [[-2.5, -1.2], [2.0, 1.5], [-0.5, 2.7]];
const TRUE_COVS = [
  [0.45, 0.20, 0.20, 0.30],
  [0.70, -0.30, -0.30, 0.55],
  [0.30, 0.05, 0.05, 0.40],
];
const TRUE_WEIGHTS = [0.35, 0.35, 0.30];

describe('GMM EM: log-likelihood monotonicity', () => {
  it('log-likelihood is non-decreasing for 30 iters', () => {
    const N = 400, K = 3;
    const { data } = sampleGMM({ N, K, means: TRUE_MEANS, covs: TRUE_COVS, weights: TRUE_WEIGHTS, seed: 7 });
    let { means, covs, weights } = initEM({ data, N, K, seed: 3 });
    let prevLL = -Infinity;
    for (let i = 0; i < 30; i += 1) {
      const r = emStep({ data, N, K, means, covs, weights });
      means = r.means; covs = r.covs; weights = r.weights;
      if (i > 0) expect(r.logLike).toBeGreaterThan(prevLL - Math.abs(prevLL) * 1e-8 - 1e-10);
      prevLL = r.logLike;
    }
  });
});

describe('GMM EM: responsibilities normalize', () => {
  it('sum_k gamma_{nk} = 1 for every n', () => {
    const N = 200, K = 3;
    const { data } = sampleGMM({ N, K, means: TRUE_MEANS, covs: TRUE_COVS, weights: TRUE_WEIGHTS, seed: 5 });
    const { means, covs, weights } = initEM({ data, N, K, seed: 1 });
    const r = emStep({ data, N, K, means, covs, weights });
    for (let n = 0; n < N; n += 1) {
      let s = 0;
      for (let k = 0; k < K; k += 1) s += r.gamma[n * K + k];
      expect(s).toBeCloseTo(1, 6);
    }
  });
});

describe('GMM EM: recovery of true means', () => {
  it('after 60 iterations, every true mean has an estimated mean within 0.6', () => {
    const N = 800, K = 3;
    const { data } = sampleGMM({ N, K, means: TRUE_MEANS, covs: TRUE_COVS, weights: TRUE_WEIGHTS, seed: 11 });
    let { means, covs, weights } = initEM({ data, N, K, seed: 4 });
    for (let i = 0; i < 60; i += 1) {
      const r = emStep({ data, N, K, means, covs, weights });
      means = r.means; covs = r.covs; weights = r.weights;
    }
    for (const tMu of TRUE_MEANS) {
      let bestD = Infinity;
      for (const eMu of means) {
        const d = Math.hypot(tMu[0] - eMu[0], tMu[1] - eMu[1]);
        if (d < bestD) bestD = d;
      }
      expect(bestD).toBeLessThan(0.6);
    }
  }, 20_000);
});

describe('GMM EM: mixing weights sum to 1', () => {
  it('after any iteration sum_k pi_k = 1', () => {
    const N = 300, K = 3;
    const { data } = sampleGMM({ N, K, means: TRUE_MEANS, covs: TRUE_COVS, weights: TRUE_WEIGHTS, seed: 13 });
    let { means, covs, weights } = initEM({ data, N, K, seed: 8 });
    for (let i = 0; i < 10; i += 1) {
      const r = emStep({ data, N, K, means, covs, weights });
      means = r.means; covs = r.covs; weights = r.weights;
      let s = 0;
      for (let k = 0; k < K; k += 1) s += weights[k];
      expect(s).toBeCloseTo(1, 8);
    }
  });
});

describe('GMM EM: covariances stay positive-definite', () => {
  it('det Sigma_k > 0 for all iterations', () => {
    const N = 300, K = 3;
    const { data } = sampleGMM({ N, K, means: TRUE_MEANS, covs: TRUE_COVS, weights: TRUE_WEIGHTS, seed: 17 });
    let { means, covs, weights } = initEM({ data, N, K, seed: 9 });
    for (let i = 0; i < 25; i += 1) {
      const r = emStep({ data, N, K, means, covs, weights });
      means = r.means; covs = r.covs; weights = r.weights;
      for (const S of covs) {
        const det = S[0] * S[3] - S[1] * S[2];
        expect(det).toBeGreaterThan(0);
      }
    }
  });
});
