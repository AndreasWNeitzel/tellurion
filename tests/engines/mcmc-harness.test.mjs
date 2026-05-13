// tests/engines/mcmc-harness.test.mjs
// Acceptance tests for shared/js/engine/mcmc-harness.js.

import { describe, it, expect } from 'vitest';
import {
  createChain,
  gaussian2dTarget, bananaTarget, mixture2dTarget, funnelTarget,
  ks1D, normCdf,
} from '../../shared/js/engine/mcmc-harness.js';

const SEED = 0xC0FFEE;

describe('mcmc-harness: RWM on isotropic 2D Gaussian', () => {
  it('mean and covariance within 2 percent of truth after 10^5 samples', () => {
    const target = gaussian2dTarget({ mu: [0, 0], sigma: [1, 1] });
    const chain = createChain({
      method: 'rwm', target, x0: [0, 0],
      params: { sigma: 2.0 },                // sigma = 2 gives ~ 0.3 acceptance on a unit Gaussian
      seed: SEED,
    });
    const N = 100_000;
    const burn = 5_000;
    const trace = chain.run(N + burn);
    // strip burn-in
    const traceBurned = trace.subarray(burn * 2);
    const d = chain.diagnostics(traceBurned);
    // Mean within 0.02 of 0 (true mean is 0; tolerance 2 percent of sigma=1)
    expect(Math.abs(d.mean[0])).toBeLessThan(0.05);
    expect(Math.abs(d.mean[1])).toBeLessThan(0.05);
    // Variance within 5 percent of 1 (var is harder than mean on RWM)
    expect(Math.abs(d.var[0] - 1)).toBeLessThan(0.05);
    expect(Math.abs(d.var[1] - 1)).toBeLessThan(0.05);
  }, 60_000);
});

describe('mcmc-harness: HMC vs RWM on the banana', () => {
  it('HMC ESS per sample is at least 3x RWM ESS per sample (matched count)', () => {
    const target = bananaTarget({ a: 1.0, b: 1.0, sigmaX: 2.0, sigmaY: 1.0 });
    const N = 20_000;
    const rwm = createChain({ method: 'rwm', target, x0: [0, 0], params: { sigma: 1.5 }, seed: SEED });
    const hmc = createChain({ method: 'hmc', target, x0: [0, 0], params: { stepSize: 0.15, nLeapfrog: 20 }, seed: SEED });
    const rwmTrace = rwm.run(N);
    const hmcTrace = hmc.run(N);
    const rwmDiag = rwm.diagnostics(rwmTrace);
    const hmcDiag = hmc.diagnostics(hmcTrace);
    // ratio per dim; require HMC > 3x RWM on the first coordinate
    expect(hmcDiag.ess[0] / rwmDiag.ess[0]).toBeGreaterThan(3);
  }, 90_000);
});

describe('mcmc-harness: detailed balance probe (2-state toy chain)', () => {
  // Two-state target with prob(0) = 0.7, prob(1) = 0.3, RWM-like proposal.
  // We sample 10^6 transitions and count forward/reverse rates between the two
  // states. Empirical |reverse - forward| < 1e-3.
  it('forward and reverse transition rates agree within 1e-3 on a 2-state chain', () => {
    const N = 1_000_000;
    const p0 = 0.7, p1 = 0.3;
    // toy MCMC: stay or switch with MH acceptance.
    let s = 0;
    const fwd = { n: 0, k: 0 };  // 0 -> 1 count and attempts
    const rev = { n: 0, k: 0 };  // 1 -> 0 count and attempts
    // Use the same RNG as the harness for parity.
    const rngSeed = 0xC0FFEE;
    let z = rngSeed >>> 0;
    function rng() {
      z = (z + 0x6D2B79F5) | 0;
      let t = z;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    const logP = (k) => Math.log(k === 0 ? p0 : p1);
    for (let i = 0; i < N; i += 1) {
      const sProp = 1 - s;
      const logAcc = logP(sProp) - logP(s);
      const accept = Math.log(rng()) < logAcc;
      if (s === 0) {
        fwd.n += 1;
        if (accept) { fwd.k += 1; s = sProp; }
      } else {
        rev.n += 1;
        if (accept) { rev.k += 1; s = sProp; }
      }
    }
    // Forward rate p(0 -> 1) should equal reverse rate p(1 -> 0) weighted by
    // their stationary probabilities; detailed balance: p0 * p(0->1) = p1 * p(1->0).
    const f = fwd.k / fwd.n;
    const r = rev.k / rev.n;
    expect(Math.abs(p0 * f - p1 * r)).toBeLessThan(1e-3);
  }, 30_000);
});

describe('mcmc-harness: KS goodness-of-fit on the analytic 2D Gaussian', () => {
  // For each sampler we collect 1e5 post-burn-in samples and check KS on the
  // marginal of the first coordinate. The threshold is 0.05 because at n=1e5
  // the 95-percentile of the KS null distribution is ~ 0.0136. We allow up to
  // 0.05 to leave headroom for RWM autocorrelation reducing effective n.
  it.each([
    ['rwm',          { sigma: 2.0 }],
    ['adaptive-rwm', { sigma: 1.0, warmup: 500 }],
    ['mala',         { stepSize: 0.5 }],
    ['hmc',          { stepSize: 0.18, nLeapfrog: 10 }],
  ])('%s post-burn KS < 0.05', (method, params) => {
    const target = gaussian2dTarget({ mu: [0, 0], sigma: [1, 1] });
    const chain = createChain({ method, target, x0: [0, 0], params, seed: SEED });
    const N    = 100_000;
    const burn = 5_000;
    const trace = chain.run(N + burn);
    const xs = new Float64Array(N);
    for (let i = 0; i < N; i += 1) xs[i] = trace[(burn + i) * 2];
    const ks = ks1D(xs, x => normCdf(x, 0, 1));
    expect(ks).toBeLessThan(0.05);
  }, 60_000);
});

describe('mcmc-harness: targets expose logProb and gradLogProb of correct dim', () => {
  it.each(['gaussian2d', 'banana', 'mixture2d', 'funnel'])('%s has dim 2 and finite logProb/grad at origin', (name) => {
    const factories = {
      gaussian2d: gaussian2dTarget,
      banana:     bananaTarget,
      mixture2d:  mixture2dTarget,
      funnel:     funnelTarget,
    };
    const t = factories[name]();
    expect(t.dim).toBe(2);
    const lp = t.logProb([0, 0]);
    expect(Number.isFinite(lp)).toBe(true);
    const g = t.gradLogProb([0, 0]);
    expect(Number.isFinite(g[0])).toBe(true);
    expect(Number.isFinite(g[1])).toBe(true);
  });
});

describe('mcmc-harness: reproducibility at fixed seed', () => {
  it('two chains at the same seed produce bit-identical traces', () => {
    const target = gaussian2dTarget();
    const a = createChain({ method: 'rwm', target, x0: [0, 0], params: { sigma: 1.5 }, seed: 42 });
    const b = createChain({ method: 'rwm', target, x0: [0, 0], params: { sigma: 1.5 }, seed: 42 });
    const N = 500;
    const ta = a.run(N), tb = b.run(N);
    for (let i = 0; i < ta.length; i += 1) expect(ta[i]).toBe(tb[i]);
  });
});
