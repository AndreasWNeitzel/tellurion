import { describe, it, expect } from 'vitest';
import { betaPdf, posteriorParams, betaMean, betaVariance, credibleInterval } from './sim.js';

describe('bayesian-coin-update: conjugate posterior', () => {
  it('posterior parameters: a0+k and b0+n-k', () => {
    const p = posteriorParams({ a0: 2, b0: 3, k: 4, n: 10 });
    expect(p.a).toBe(6);
    expect(p.b).toBe(9);
  });

  it('Beta(1,1) is the uniform on [0,1] (pdf = 1 everywhere)', () => {
    for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      expect(Math.abs(betaPdf(t, 1, 1) - 1)).toBeLessThan(1e-10);
    }
  });

  it('Beta mean and variance match the conjugate formulae', () => {
    expect(Math.abs(betaMean(2, 3) - 0.4)).toBeLessThan(1e-12);
    expect(Math.abs(betaVariance(2, 3) - 0.04)).toBeLessThan(1e-12);
  });

  it('posterior concentrates with more data: variance shrinks as 1/n', () => {
    const p10 = posteriorParams({ a0: 1, b0: 1, k: 7, n: 10 });
    const p100 = posteriorParams({ a0: 1, b0: 1, k: 70, n: 100 });
    const v10  = betaVariance(p10.a, p10.b);
    const v100 = betaVariance(p100.a, p100.b);
    const ratio = v10 / v100;
    expect(ratio).toBeGreaterThan(6);
    expect(ratio).toBeLessThan(15);
  });

  it('95 percent credible interval contains the posterior mean', () => {
    const p = posteriorParams({ a0: 2, b0: 2, k: 7, n: 10 });
    const ci = credibleInterval(p.a, p.b, 0.95);
    const mean = betaMean(p.a, p.b);
    expect(ci.lo).toBeLessThan(mean);
    expect(ci.hi).toBeGreaterThan(mean);
    expect(ci.hi - ci.lo).toBeGreaterThan(0);
    expect(ci.hi - ci.lo).toBeLessThan(1);
  });
});

describe('bayesian-coin-update: reproducibility', () => {
  it('betaPdf is deterministic', () => {
    const a = betaPdf(0.3, 5, 7);
    const b = betaPdf(0.3, 5, 7);
    expect(a).toBe(b);
  });
});
