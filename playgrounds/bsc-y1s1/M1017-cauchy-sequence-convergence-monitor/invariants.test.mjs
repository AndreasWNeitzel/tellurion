import { describe, it, expect } from 'vitest';
import { SEQUENCES, cauchyWidth, isCauchy } from './sim.js';

describe('cauchy-sequence-convergence-monitor', () => {
  it('geometric 1/2^n is Cauchy', () => {
    expect(isCauchy('geom', 1e-6).isCauchy).toBe(true);
  });
  it('harmonic series is NOT Cauchy (diverges)', () => {
    const r = isCauchy('harm', 0.1, 200);
    expect(r.isCauchy).toBe(false);
  });
  it('arctan partial sums converge to pi/4', () => {
    expect(Math.abs(SEQUENCES.arctan.fn(10000) - Math.PI / 4)).toBeLessThan(1e-3);
  });
  it('zeta(2) partial sums converge to pi^2 / 6', () => {
    expect(Math.abs(SEQUENCES.zeta2.fn(10000) - Math.PI * Math.PI / 6)).toBeLessThan(1e-3);
  });
  it('cauchyWidth shrinks with N0 for convergent sequences', () => {
    expect(cauchyWidth('geom', 50, 100)).toBeLessThan(cauchyWidth('geom', 1, 100));
  });
});
