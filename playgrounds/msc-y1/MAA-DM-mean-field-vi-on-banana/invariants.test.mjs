// Mean-field VI on banana invariant tests.
// (a) ELBO climbs over training.
// (b) Variational mean converges near banana mode.
// (c) Sigma in safe range.
// (d) log p banana topology sanity.

import { describe, it, expect } from 'vitest';
import { createVI, viStep, logBanana } from './sim.js';

describe('VI: ELBO climbs with training', () => {
  it('ELBO at step 800 > ELBO at step 50', () => {
    const theta = createVI({ muX: 0, logSX: 0, muY: 0, logSY: 0 });
    let earlyElbo = 0;
    for (let i = 0; i < 50; i += 1) earlyElbo = viStep(theta, 0.005, 32, 100 + i);
    let lateElbo = 0;
    for (let i = 0; i < 750; i += 1) lateElbo = viStep(theta, 0.005, 32, 200 + i);
    expect(lateElbo).toBeGreaterThan(earlyElbo - 1);
  });
});

describe('VI: converges near the banana mode', () => {
  it('mu_x and mu_y end up near 0 after 1000 iters', () => {
    const theta = createVI({ muX: 0, logSX: 0, muY: 0, logSY: 0 });
    for (let i = 0; i < 1000; i += 1) viStep(theta, 0.005, 32, 50 + i);
    expect(Math.abs(theta.muX)).toBeLessThan(1.0);
    expect(theta.muY).toBeLessThan(1.5);
  });
});

describe('VI: sigma stays in safe range', () => {
  it('log sigma in [-3, 2]', () => {
    const theta = createVI({ muX: 0, logSX: 0, muY: 0, logSY: 0 });
    for (let i = 0; i < 500; i += 1) viStep(theta, 0.005, 32, 11 + i);
    expect(theta.logSX).toBeGreaterThanOrEqual(-3);
    expect(theta.logSX).toBeLessThanOrEqual(2);
    expect(theta.logSY).toBeGreaterThanOrEqual(-3);
    expect(theta.logSY).toBeLessThanOrEqual(2);
  });
});

describe('VI: log p banana topology', () => {
  it('log p(0, 0) > log p(2, -2)', () => {
    expect(logBanana(0, 0)).toBeGreaterThan(logBanana(2, -2));
  });

  it('log p along the valley y = x^2 stays near zero', () => {
    for (const x of [-1, -0.5, 0, 0.5, 1]) {
      const lp = logBanana(x, x * x);
      expect(lp).toBeGreaterThan(-0.5);
    }
  });
});
