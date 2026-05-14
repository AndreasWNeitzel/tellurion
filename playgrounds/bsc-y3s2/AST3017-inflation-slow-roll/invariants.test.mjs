// Slow-roll invariants.
// (a) phi^4 at N = 60: n_s ~ 0.93, r ~ 0.27. Excluded by Planck.
// (b) phi^2 at N = 60: n_s ~ 0.95, r ~ 0.13. Excluded but marginal.
// (c) Starobinsky at N = 50-60: n_s ~ 0.96, r ~ 0.004. Comfortably within Planck.
// (d) r scales as 1/N for chaotic models.
// (e) n_s monotonic toward 1 as N grows.

import { describe, it, expect } from 'vitest';
import { nsR, withinPlanckBox, MODELS, PLANCK_NS } from './sim.js';

describe('inflation-slow-roll', () => {
  it('Starobinsky at N = 60 is within Planck box', () => {
    const { ns, r } = nsR('starobinsky', 60);
    expect(withinPlanckBox(ns, r)).toBe(true);
  });

  it('phi^4 at N = 60 is excluded by Planck', () => {
    const { ns, r } = nsR('phi4', 60);
    expect(withinPlanckBox(ns, r)).toBe(false);
  });

  it('phi^2 at N = 60: r ~ 0.13', () => {
    const { r } = nsR('phi2', 60);
    expect(r).toBeGreaterThan(0.1);
    expect(r).toBeLessThan(0.15);
  });

  it('r scales as 1 / N for phi^2', () => {
    const r1 = nsR('phi2', 50).r;
    const r2 = nsR('phi2', 100).r;
    expect(Math.abs(r2 - r1 / 2) / r1).toBeLessThan(1e-12);
  });

  it('n_s approaches 1 as N grows for any model', () => {
    for (const m of ['phi2', 'phi4', 'starobinsky']) {
      const n1 = nsR(m, 50).ns;
      const n2 = nsR(m, 200).ns;
      expect(n2).toBeGreaterThan(n1);
    }
  });

  it('Starobinsky r decreases as 1 / N^2', () => {
    const r1 = nsR('starobinsky', 50).r;
    const r2 = nsR('starobinsky', 100).r;
    expect(Math.abs(r2 - r1 / 4) / r1).toBeLessThan(1e-12);
  });

  it('Planck n_s central value is 0.9649', () => {
    expect(PLANCK_NS).toBeCloseTo(0.9649, 4);
  });

  it('MODELS list contains 4 entries', () => {
    expect(MODELS.length).toBe(4);
  });
});
