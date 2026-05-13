// AF triangular Ising invariant tests.
// (a) Energy and magnetization bounds.
// (b) High-T disorder: m -> 0.
// (c) Cold-start stripe pattern is close to ground state.
// (d) Same-3 plaquette fraction (signature of frustration).

import { describe, it, expect } from 'vitest';
import { createAF, sweep, magnetization, energyPerSite, frustratedFraction } from './sim.js';

describe('AF triangular: bounds', () => {
  it('|m| bounded by 1', () => {
    const s = createAF({ L: 32, T: 0.5, seed: 1, init: 'hot' });
    expect(Math.abs(magnetization(s))).toBeLessThanOrEqual(1);
  });
  it('energy per site bounded by 3 J (3 bonds per site)', () => {
    const s = createAF({ L: 32, T: 0.5, seed: 1, init: 'hot' });
    expect(energyPerSite(s)).toBeGreaterThanOrEqual(-3);
    expect(energyPerSite(s)).toBeLessThanOrEqual(3);
  });
});

describe('AF triangular: high-T disorder', () => {
  it('at T = 5: |m| < 0.05 after 200 sweeps', () => {
    const s = createAF({ L: 48, T: 5.0, seed: 1, init: 'hot' });
    sweep(s, 200);
    expect(Math.abs(magnetization(s))).toBeLessThan(0.05);
  });
});

describe('AF triangular: cold-start stripe pattern persists at very low T', () => {
  it('at T = 0.05: e is close to its theoretical minimum', () => {
    const s = createAF({ L: 48, T: 0.05, seed: 1, init: 'cold' });
    sweep(s, 30);
    const e = energyPerSite(s);
    // Stripe pattern has energy approximately -1 per site; allow tolerance.
    expect(e).toBeLessThan(-0.8);
  });
});

describe('AF triangular: same-3 plaquettes exist (frustration signature)', () => {
  it('at T = 1.0: same-3 plaquette fraction is in (0, 0.5)', () => {
    const s = createAF({ L: 48, T: 1.0, seed: 1, init: 'hot' });
    sweep(s, 300);
    const ff = frustratedFraction(s);
    expect(ff).toBeGreaterThan(0);
    expect(ff).toBeLessThan(0.5);
  });
});
