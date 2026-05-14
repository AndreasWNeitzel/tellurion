import { describe, it, expect } from 'vitest';
import { airyIntensity, strehl, firstNullArcsec } from './sim.js';
describe('psf-strehl', () => {
  it('Airy maximum at theta = 0', () => {
    expect(airyIntensity(0, 500, 8)).toBeCloseTo(1, 5);
  });
  it('First null at 1.22 lambda/D', () => {
    const theta = 1.22 * 500e-9 / 8;
    expect(airyIntensity(theta, 500, 8)).toBeLessThan(1e-3);
  });
  it('Strehl 1 for zero wavefront error', () => {
    expect(strehl(0)).toBe(1);
  });
  it('Strehl drops to ~0.8 at sigma = lambda/14 (Marechal)', () => {
    expect(Math.abs(strehl(1 / 14) - 0.82)).toBeLessThan(0.01);
  });
  it('VLT 8m at H band: first null ~ 0.05"', () => {
    const arcsec = firstNullArcsec(1650, 8);
    expect(arcsec).toBeGreaterThan(0.04);
    expect(arcsec).toBeLessThan(0.06);
  });
});
