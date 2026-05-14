import { describe, it, expect } from 'vitest';
import { uniformLambda, fluxAt, fluxWithLimb } from './sim.js';
describe('transit-mandel-agol-analytic', () => {
  it('out of transit: F = 1', () => {
    expect(fluxAt(0.1, 2)).toBeCloseTo(1, 10);
  });
  it('center of transit, small planet: F = 1 - p^2', () => {
    expect(Math.abs(fluxAt(0.1, 0) - (1 - 0.01))).toBeLessThan(1e-9);
  });
  it('hot-Jupiter Rp/Rs = 0.1: depth ~ 1%', () => {
    expect(Math.abs(fluxAt(0.1, 0) - 0.99)).toBeLessThan(1e-9);
  });
  it('Earth-like Rp/Rs = 0.009: depth ~ 80 ppm', () => {
    const depth = 1 - fluxAt(0.009, 0);
    expect(depth).toBeGreaterThan(7e-5);
    expect(depth).toBeLessThan(9e-5);
  });
  it('monotone: shallower flux as z grows past contact', () => {
    expect(fluxAt(0.1, 0.5)).toBeLessThanOrEqual(fluxAt(0.1, 0.95));
  });
  it('limb darkening deepens transit center', () => {
    const F_uni = fluxAt(0.1, 0);
    const F_dark = fluxWithLimb(0.1, 0, 0.5, 0.2);
    expect(F_dark).toBeLessThan(F_uni + 0.005);
  });
});
