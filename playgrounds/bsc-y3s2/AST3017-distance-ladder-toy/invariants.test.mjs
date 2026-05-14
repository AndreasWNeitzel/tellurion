import { describe, it, expect } from 'vitest';
import { distanceModulus, ladderUncertainty, RANGE_PC } from './sim.js';
describe('distance-ladder-toy', () => {
  it('distance modulus at 10 pc is 0', () => {
    expect(distanceModulus(10)).toBe(0);
  });
  it('distance modulus at 1 kpc is 10', () => {
    expect(Math.abs(distanceModulus(1000) - 10)).toBeLessThan(1e-12);
  });
  it('ladder error: orthogonal sum of rung errors', () => {
    expect(Math.abs(ladderUncertainty([0.03, 0.04]) - 0.05)).toBeLessThan(1e-12);
  });
  it('parallax range starts at 1 pc', () => {
    expect(RANGE_PC.parallax[0]).toBe(1);
  });
});
