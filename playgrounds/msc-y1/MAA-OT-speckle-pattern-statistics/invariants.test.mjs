import { describe, it, expect } from 'vitest';
import { speckleField, expectedSpeckleCount } from './sim.js';
describe('speckle-pattern-statistics', () => {
  it('expected count: (D/r0)^2', () => {
    expect(expectedSpeckleCount(10, 1)).toBe(100);
  });
  it('field is a valid intensity array', () => {
    const I = speckleField(8, 3, 1.2, 0xABCD);
    expect(I.length).toBe(64);
    expect(I.every(v => v >= 0)).toBe(true);
  });
  it('deterministic for fixed seed', () => {
    const I1 = speckleField(16, 3, 1.5, 0xCAFE);
    const I2 = speckleField(16, 3, 1.5, 0xCAFE);
    let diff = 0;
    for (let i = 0; i < I1.length; i += 1) diff += Math.abs(I1[i] - I2[i]);
    expect(diff).toBeLessThan(1e-6);
  });
});
