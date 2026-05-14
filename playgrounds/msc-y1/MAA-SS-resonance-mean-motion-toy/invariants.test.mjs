import { describe, it, expect } from 'vitest';
import { resonanceSemiMajor, periodRatio, KIRKWOOD_RATIOS } from './sim.js';
describe('resonance-mean-motion-toy', () => {
  it('2:1 resonance with Jupiter at 5.2 AU is at 3.28 AU', () => {
    const a = resonanceSemiMajor(5.2, 2, 1);
    expect(Math.abs(a - 3.28)).toBeLessThan(0.05);
  });
  it('3:1 at 2.5 AU', () => {
    expect(Math.abs(resonanceSemiMajor(5.2, 3, 1) - 2.5)).toBeLessThan(0.05);
  });
  it('Period ratio from a ratio', () => {
    expect(Math.abs(periodRatio(1, 1.587) - 2)).toBeLessThan(0.01);
  });
  it('Kirkwood ratios non-empty', () => {
    expect(KIRKWOOD_RATIOS.length).toBeGreaterThan(0);
  });
});
