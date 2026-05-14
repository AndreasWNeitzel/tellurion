import { describe, it, expect } from 'vitest';
import { gapZero, Tc, gapAtT } from './sim.js';
describe('bcs-gap-self-consistent', () => {
  it('gap zero at T = Tc', () => {
    const N0V = 0.3;
    const tc = Tc(N0V);
    expect(gapAtT(tc * 1.001, N0V)).toBe(0);
  });
  it('gap at T = 0 equals gapZero', () => {
    const N0V = 0.3;
    expect(Math.abs(gapAtT(1e-3, N0V) - gapZero(N0V)) / gapZero(N0V)).toBeLessThan(0.05);
  });
  it('universal ratio 2 Delta(0) / kTc ~ 3.53', () => {
    const N0V = 0.3;
    const ratio = 2 * gapZero(N0V) / Tc(N0V);
    expect(Math.abs(ratio - 3.528) / 3.528).toBeLessThan(0.02);
  });
  it('Delta decreases with T (T < Tc)', () => {
    const N0V = 0.3;
    expect(gapAtT(0.5 * Tc(N0V), N0V)).toBeGreaterThan(gapAtT(0.9 * Tc(N0V), N0V));
  });
});
