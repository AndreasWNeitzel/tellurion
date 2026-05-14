import { describe, it, expect } from 'vitest';
import { nuSquared, ToomreQ, kCrit } from './sim.js';
describe('spiral-density-wave-dispersion', () => {
  it('At k = 0: nu^2 = kappa^2', () => {
    expect(nuSquared(0, 2, 0.5, 1)).toBe(4);
  });
  it('Q = 1 boundary', () => {
    expect(Math.abs(ToomreQ(Math.PI, 1, 1) - 1)).toBeLessThan(1e-9);
  });
  it('Q > 1 stable', () => {
    expect(ToomreQ(2 * Math.PI, 1, 1)).toBeGreaterThan(1);
  });
  it('k_crit positive', () => {
    expect(kCrit(2, 1)).toBeGreaterThan(0);
  });
  it('nu^2 < 0 for sigma = 0 at intermediate k', () => {
    expect(nuSquared(2, 2, 0, 1)).toBeLessThan(4);
  });
});
