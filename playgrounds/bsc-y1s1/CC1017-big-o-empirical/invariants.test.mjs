import { describe, it, expect } from 'vitest';
import { counts, approxSeconds, SCALES } from './sim.js';

describe('big-o-empirical', () => {
  it('counts at N = 1000 are 1000, ~10000, 10^6, 10^9', () => {
    const c = counts(1000);
    expect(c.linear).toBe(1000);
    expect(c.nlogn).toBeCloseTo(1000 * Math.log2(1000), 6);
    expect(c.quadratic).toBe(1e6);
    expect(c.cubic).toBe(1e9);
  });

  it('approxSeconds scales linearly with operation count', () => {
    expect(approxSeconds(1e6)).toBeCloseTo(approxSeconds(5e5) * 2, 12);
  });

  it('quadratic and cubic blow up faster than linear', () => {
    const N = 1e4;
    const c = counts(N);
    expect(c.quadratic).toBeGreaterThan(c.nlogn);
    expect(c.cubic).toBeGreaterThan(c.quadratic);
  });

  it('SCALES has four entries', () => {
    expect(SCALES.length).toBe(4);
  });
});
