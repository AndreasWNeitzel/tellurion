// GP kernel zoo invariant tests.
// (a) Cholesky exists for valid kernels.
// (b) Prior is zero-mean (sample mean -> 0 over many draws).
// (c) Posterior interpolates observations to 1e-3 with low noise.
// (d) Posterior std <= prior std everywhere.
// (e) k(x, x) = sigma_f^2 for stationary kernels.

import { describe, it, expect } from 'vitest';
import { KERNELS, covariance, cholesky, priorSamples, posterior } from './sim.js';

describe('GP: Cholesky exists for valid kernels', () => {
  it('RBF kernel: cholesky factors without errors', () => {
    const xs = new Float64Array(30);
    for (let i = 0; i < 30; i += 1) xs[i] = -3 + 6 * i / 29;
    const k = KERNELS.rbf(0.5, 1.0);
    const K = covariance(k, xs);
    const L = cholesky(K, 30);
    expect(L).toBeDefined();
    for (let i = 0; i < 30; i += 1) expect(L[i * 30 + i]).toBeGreaterThan(0);
  });
});

describe('GP: prior is zero-mean', () => {
  it('average of many prior draws is near 0 at each grid point', () => {
    const xs = new Float64Array(40);
    for (let i = 0; i < 40; i += 1) xs[i] = -3 + 6 * i / 39;
    const k = KERNELS.rbf(0.7, 1.0);
    const N_DRAWS = 200;
    const draws = priorSamples(k, xs, N_DRAWS, 7);
    const meanPerPoint = new Float64Array(40);
    for (const draw of draws) for (let i = 0; i < 40; i += 1) meanPerPoint[i] += draw[i] / N_DRAWS;
    for (let i = 0; i < 40; i += 1) expect(Math.abs(meanPerPoint[i])).toBeLessThan(0.20);
  });
});

describe('GP: posterior interpolates observations with low noise', () => {
  it('posterior mean equals y_obs at x_obs to 1e-3', () => {
    const xs = new Float64Array(40);
    for (let i = 0; i < 40; i += 1) xs[i] = -3 + 6 * i / 39;
    const obsIdx = 12;
    const xObs = [xs[obsIdx]];
    const yObs = [1.3];
    const k = KERNELS.rbf(0.5, 1.0);
    const { mu, std } = posterior(k, xs, xObs, yObs, 1e-5);
    expect(Math.abs(mu[obsIdx] - 1.3)).toBeLessThan(1e-3);
    expect(std[obsIdx]).toBeLessThan(0.01);
  });
});

describe('GP: posterior tightens after observations', () => {
  it('posterior std <= prior std everywhere', () => {
    const xs = new Float64Array(40);
    for (let i = 0; i < 40; i += 1) xs[i] = -3 + 6 * i / 39;
    const k = KERNELS.rbf(0.7, 1.0);
    const { std: priorStd } = posterior(k, xs, [], [], 0.1);
    const { std: postStd } = posterior(k, xs, [-1.5, 0.5, 1.8], [1, -0.5, 0.8], 0.1);
    for (let i = 0; i < xs.length; i += 1) {
      expect(postStd[i]).toBeLessThanOrEqual(priorStd[i] + 1e-10);
    }
  });
});

describe('GP: k(x, x) = sigma_f^2', () => {
  it('RBF, Matern 3/2, Matern 5/2 self-covariance equals sigma_f^2', () => {
    const kRBF = KERNELS.rbf(0.5, 1.5);
    expect(kRBF(2, 2)).toBeCloseTo(1.5 * 1.5, 8);
    const kM32 = KERNELS.matern32(0.5, 1.5);
    expect(kM32(2, 2)).toBeCloseTo(1.5 * 1.5, 8);
    const kM52 = KERNELS.matern52(0.5, 1.5);
    expect(kM52(2, 2)).toBeCloseTo(1.5 * 1.5, 8);
  });
});
