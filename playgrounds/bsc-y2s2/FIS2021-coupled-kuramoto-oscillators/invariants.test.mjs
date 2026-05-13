// Kuramoto invariants.
// (a) r in [0, 1].
// (b) K = 0: no synchronization.
// (c) K above K_c: r > 0.5.
// (d) K_c = 2 gamma for Lorentzian.
// (e) N exported and reasonable.

import { describe, it, expect } from 'vitest';
import {
  createKuramoto, stepKuramoto, orderParameter, criticalCoupling, N,
} from './sim.js';

describe('Kuramoto: r is in [0, 1]', () => {
  it('order parameter stays in [0, 1] throughout 500 steps', () => {
    const s = createKuramoto({ K: 1.5, gamma: 0.5, seed: 0x1234 });
    for (let i = 0; i < 500; i += 1) {
      stepKuramoto(s, 0.02);
      const r = orderParameter(s);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
});

describe('Kuramoto: K = 0 gives no synchronization', () => {
  it('after long time, r < 0.3 at K = 0', () => {
    const s = createKuramoto({ K: 0, gamma: 0.5, seed: 0x1234 });
    for (let i = 0; i < 3000; i += 1) stepKuramoto(s, 0.02);
    expect(orderParameter(s)).toBeLessThan(0.3);
  }, 30_000);
});

describe('Kuramoto: K well above K_c synchronizes', () => {
  it('K = 4 (K_c = 1): r > 0.5 after long time', () => {
    const s = createKuramoto({ K: 4.0, gamma: 0.5, seed: 0x9876 });
    for (let i = 0; i < 3000; i += 1) stepKuramoto(s, 0.02);
    expect(orderParameter(s)).toBeGreaterThan(0.5);
  }, 30_000);
});

describe('Kuramoto: K_c formula', () => {
  it('criticalCoupling(gamma) = 2 gamma exact', () => {
    for (const gamma of [0.1, 0.3, 0.5, 1.0]) {
      expect(criticalCoupling(gamma)).toBeCloseTo(2 * gamma, 12);
    }
  });
});

describe('Kuramoto: N exported', () => {
  it('N positive and reasonable', () => {
    expect(N).toBeGreaterThan(0);
    expect(N).toBeLessThan(10_000);
  });
});
