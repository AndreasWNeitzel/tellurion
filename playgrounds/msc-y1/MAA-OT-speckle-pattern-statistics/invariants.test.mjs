import { describe, it, expect } from 'vitest';
import { speckleField, expectedSpeckleCount, boilField, negExpPdf } from './sim.js';
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
  it('boilField is non-negative, right size, and decorrelates in time', () => {
    const a = boilField(16, 3, 1.5, 0, 0xCAFE);
    const b = boilField(16, 3, 1.5, 0, 0xCAFE);
    const c = boilField(16, 3, 1.5, 5.0, 0xCAFE);
    expect(a.length).toBe(256);
    expect(a.every((v) => v >= 0)).toBe(true);
    let same = 0, moved = 0;
    for (let i = 0; i < a.length; i += 1) { same += Math.abs(a[i] - b[i]); moved += Math.abs(a[i] - c[i]); }
    expect(same).toBeLessThan(1e-6);          // same t, same seed -> identical
    expect(moved).toBeGreaterThan(1e-3);      // it boils
  });
  it('fully developed speckle: intensity contrast V = sigma/mean ~ 1', () => {
    const I = boilField(96, 8, 3, 0, 0xC0FFEE);
    let mean = 0; for (const v of I) mean += v; mean /= I.length;
    let varr = 0; for (const v of I) varr += (v - mean) ** 2; varr /= I.length;
    const V = Math.sqrt(varr) / mean;
    expect(V).toBeGreaterThan(0.82);          // negative-exponential statistics
    expect(V).toBeLessThan(1.18);
  });
  it('negative-exponential PDF: normalised and mean = Ibar', () => {
    const Ibar = 2.3, dI = 0.002;
    let norm = 0, mean = 0;
    for (let I = 0; I < 40 * Ibar; I += dI) { const p = negExpPdf(I, Ibar); norm += p * dI; mean += I * p * dI; }
    expect(Math.abs(norm - 1)).toBeLessThan(1e-2);
    expect(Math.abs(mean - Ibar)).toBeLessThan(2e-2);
  });
});
