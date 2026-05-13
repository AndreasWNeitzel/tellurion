// q-state Potts model invariant tests.
// (a) T_c(q) = 1 / ln(1 + sqrt(q)) matches Wu 1982.
// (b) Cold start at T = 0.5 T_c stays cold (M >= 0.9).
// (c) Hot start at T = 1.5 T_c stays hot (M -> 0 within tolerance).
// (d) Energy per site is < 0 and bounded by -2 (max bonds on a square
//     lattice with q-fold degeneracy).

import { describe, it, expect } from 'vitest';
import { createPotts, sweep, orderParameter, energyPerSite, critTemperature } from './sim.js';

describe('Potts: critical temperature', () => {
  it('T_c(q=2) ~ 1.135 (half the standard Ising T_c = 2.269 due to delta-function convention)', () => {
    expect(critTemperature(2)).toBeCloseTo(1 / Math.log(1 + Math.sqrt(2)), 6);
  });
  it('T_c(q=3) ~ 0.9950', () => {
    expect(critTemperature(3)).toBeCloseTo(1 / Math.log(1 + Math.sqrt(3)), 6);
  });
  it('T_c is monotone decreasing in q for q >= 2', () => {
    let prev = critTemperature(2);
    for (let q = 3; q <= 10; q += 1) {
      const cur = critTemperature(q);
      expect(cur).toBeLessThan(prev);
      prev = cur;
    }
  });
});

describe('Potts: order parameter dynamics', () => {
  it('q = 3 ordered phase (T = 0.5 T_c, cold start): M -> 1 within 0.05', () => {
    const Tc = critTemperature(3);
    const p = createPotts({ L: 48, q: 3, T: 0.5 * Tc, seed: 0xC0FFEE, init: 'cold' });
    sweep(p, 50);
    expect(orderParameter(p)).toBeGreaterThan(0.95);
  });

  it('q = 3 disordered phase (T = 1.5 T_c, hot start): M < 0.10 after 600 sweeps', () => {
    const Tc = critTemperature(3);
    const p = createPotts({ L: 48, q: 3, T: 1.5 * Tc, seed: 0xC0FFEE, init: 'hot' });
    sweep(p, 600);
    expect(orderParameter(p)).toBeLessThan(0.10);
  }, 15_000);

  it('q = 7 strongly disordered above T_c (T = 1.5 T_c): M < 0.10', () => {
    const Tc = critTemperature(7);
    const p = createPotts({ L: 48, q: 7, T: 1.5 * Tc, seed: 0xC0FFEE, init: 'hot' });
    sweep(p, 600);
    expect(orderParameter(p)).toBeLessThan(0.10);
  }, 15_000);
});

describe('Potts: energy bounds', () => {
  it('cold start: energy is at the lower bound -2 (each site has 4 matching bonds)', () => {
    const p = createPotts({ L: 32, q: 3, T: 0.5 * critTemperature(3), seed: 1, init: 'cold' });
    expect(energyPerSite(p)).toBeCloseTo(-2.0, 6);
  });

  it('infinite-T (q = 3): energy approaches -2/q = -0.667 (random matches)', () => {
    const p = createPotts({ L: 64, q: 3, T: 100.0, seed: 1, init: 'hot' });
    sweep(p, 50);
    const e = energyPerSite(p);
    expect(e).toBeGreaterThan(-1.0);
    expect(e).toBeLessThan(-0.4);
  });
});

describe('Potts: order parameter range', () => {
  it('M is bounded in [0, 1]', () => {
    const p = createPotts({ L: 32, q: 4, T: critTemperature(4), seed: 1, init: 'hot' });
    for (let s = 0; s < 30; s += 1) {
      sweep(p, 10);
      const M = orderParameter(p);
      expect(M).toBeGreaterThanOrEqual(0);
      expect(M).toBeLessThanOrEqual(1);
    }
  });
});
