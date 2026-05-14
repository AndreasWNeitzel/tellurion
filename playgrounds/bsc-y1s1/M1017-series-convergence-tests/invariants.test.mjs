import { describe, it, expect } from 'vitest';
import { SERIES, partialSum, ratioTest, rootTest } from './sim.js';
describe('series-convergence-tests', () => {
  it('geometric 1/2^n converges to 2', () => expect(Math.abs(partialSum('geom_half', 100) - 2)).toBeLessThan(1e-15));
  it('pseries_2 converges to pi^2/6', () => expect(Math.abs(partialSum('pseries_2', 100000) - Math.PI * Math.PI / 6)).toBeLessThan(1e-3));
  it('alt_log2 converges to ln 2', () => expect(Math.abs(partialSum('alt_log2', 100000) - Math.log(2))).toBeLessThan(1e-4));
  it('harmonic diverges', () => expect(partialSum('pseries_1', 1000000)).toBeGreaterThan(10));
  it('ratio test for geom: rho = 1/2', () => expect(Math.abs(ratioTest('geom_half', 10) - 0.5)).toBeLessThan(1e-12));
  it('root test for geom: lim = 1/2', () => {
    expect(Math.abs(rootTest('geom_half', 50) - 0.5)).toBeLessThan(0.05);
  });
  it('SERIES has four entries', () => expect(Object.keys(SERIES).length).toBe(4));
});
