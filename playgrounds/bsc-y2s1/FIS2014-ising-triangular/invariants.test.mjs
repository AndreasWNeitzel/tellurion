import { describe, it, expect } from 'vitest';
import { createIsing, sweep, magnetization, energyPerSite, TC_ANALYTIC } from './sim.js';

describe('ising-triangular: limiting cases', () => {
  it('cold start, very low T: magnetization stays close to +/-1', () => {
    const s = createIsing({ L: 32, T: 0.5, seed: 1, init: 'cold' });
    sweep(s, 50);
    expect(Math.abs(magnetization(s))).toBeGreaterThan(0.95);
  });

  it('hot start, very high T: magnetization fluctuates near zero', () => {
    const s = createIsing({ L: 32, T: 12, seed: 1, init: 'hot' });
    sweep(s, 200);
    expect(Math.abs(magnetization(s))).toBeLessThan(0.15);
  });

  it('exact Tc = 4 / ln(3) ~ 3.6410', () => {
    expect(Math.abs(TC_ANALYTIC - 4 / Math.log(3))).toBeLessThan(1e-12);
    expect(Math.abs(TC_ANALYTIC - 3.6410)).toBeLessThan(0.001);
  });
});

describe('ising-triangular: energy bounds', () => {
  it('energy per site lies in [-3, 3]', () => {
    const s = createIsing({ L: 32, T: 2, seed: 1, init: 'hot' });
    sweep(s, 30);
    const e = energyPerSite(s);
    expect(e).toBeGreaterThan(-3.01);
    expect(e).toBeLessThan(3.01);
  });

  it('cold lattice has e = -3 per site (every bond aligned)', () => {
    const s = createIsing({ L: 16, T: 0.01, seed: 0, init: 'cold' });
    expect(energyPerSite(s)).toBeCloseTo(-3, 6);
  });
});

describe('ising-triangular: reproducibility', () => {
  it('same seed gives bit-identical magnetization after N sweeps', () => {
    const a = createIsing({ L: 16, T: 3, seed: 42, init: 'hot' });
    const b = createIsing({ L: 16, T: 3, seed: 42, init: 'hot' });
    sweep(a, 30);
    sweep(b, 30);
    expect(magnetization(a)).toBe(magnetization(b));
  });
});
