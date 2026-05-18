import { describe, it, expect } from 'vitest';
import {
  WAVELENGTHS, cutoffFreq, rayleigh, aerialImage, reticleGrating,
  gratingContrast, contrast,
} from './sim.js';

describe('nanofabrication-lithography-resolution invariants', () => {
  it('coherent pupil cutoff is exactly NA / lambda', () => {
    expect(cutoffFreq(1.0, 193)).toBeCloseTo(1.0 / 193, 12);
    expect(cutoffFreq(1.35, 13.5)).toBeCloseTo(0.1, 12);
    // larger NA or smaller lambda -> higher cutoff (more resolution)
    expect(cutoffFreq(1.35, 193)).toBeGreaterThan(cutoffFreq(0.93, 193));
    expect(cutoffFreq(1.0, 13.5)).toBeGreaterThan(cutoffFreq(1.0, 193));
  });

  it('Rayleigh resolution R = k1 lambda / NA, and smaller lambda is sharper', () => {
    expect(rayleigh(0.61, 193, 1.0)).toBeCloseTo(0.61 * 193, 9);
    expect(rayleigh(0.5, 193, 1.35)).toBeCloseTo(0.5 * 193 / 1.35, 9);
    // EUV (13.5 nm) resolves far finer than ArF (193 nm) at equal k1, NA
    expect(rayleigh(0.5, WAVELENGTHS.euv, 0.55))
      .toBeLessThan(rayleigh(0.5, WAVELENGTHS.arf, 0.55));
    // exact linearity in lambda: halving lambda halves R
    expect(rayleigh(0.4, 100, 1.2)).toBeCloseTo(2 * rayleigh(0.4, 50, 1.2), 9);
  });

  it('a grating coarser than the two-beam limit images with high contrast', () => {
    const lam = 193, NA = 1.0;
    const hpLimit = lam / (2 * NA);                       // k1 = 0.5 coherent limit
    expect(gratingContrast(2.0 * hpLimit, lam, NA)).toBeGreaterThan(0.6);
  });

  it('a grating finer than the cutoff is not resolved (contrast collapses by >5x)', () => {
    const lam = 193, NA = 1.0;
    const hpLimit = lam / (2 * NA);
    const coarse = gratingContrast(2.0 * hpLimit, lam, NA);   // resolved
    const fine = gratingContrast(0.5 * hpLimit, lam, NA);     // past cutoff
    expect(fine).toBeLessThan(0.25);                          // strongly suppressed
    expect(fine).toBeLessThan(coarse / 5);                    // collapse vs resolved
  });

  it('the resolution cutoff sits at lambda/(2 NA) to within 5% (Rayleigh)', () => {
    const lam = 193, NA = 1.0;
    const hpLimit = lam / (2 * NA);
    // scan half-pitch downward, find where contrast crosses 0.5
    let crossed = null;
    for (let s = 2.0; s > 0.4; s -= 0.01) {
      if (gratingContrast(s * hpLimit, lam, NA) < 0.5) { crossed = s * hpLimit; break; }
    }
    expect(crossed).not.toBeNull();
    expect(Math.abs(crossed - hpLimit) / hpLimit).toBeLessThan(0.05);
  });

  it('aerial intensity is non-negative everywhere (|.|^2)', () => {
    const N = 256, dx = 6;
    const t = reticleGrating(N, dx, 80);
    const I = aerialImage(t, dx, 193, 1.0);
    for (let n = 0; n < N; n += 1) expect(I[n]).toBeGreaterThanOrEqual(-1e-12);
  });

  it('deterministic: the DFT pipeline reproduces the image exactly', () => {
    const N = 256, dx = 6;
    const t = reticleGrating(N, dx, 90);
    const a = aerialImage(t, dx, 193, 1.0);
    const b = aerialImage(t, dx, 193, 1.0);
    let d = 0;
    for (let n = 0; n < N; n += 1) d = Math.max(d, Math.abs(a[n] - b[n]));
    expect(d).toBe(0);
    expect(contrast(a)).toBe(contrast(b));
  });
});
