import { describe, it, expect } from 'vitest';
import { soundSpeed, shellRadius, C_KM_S } from './sim.js';
describe('baryon-acoustic-oscillation-toy', () => {
  it('Pre-recombination R~0 limit: c_s = c/sqrt(3)', () => {
    expect(Math.abs(soundSpeed(0) - C_KM_S / Math.sqrt(3))).toBeLessThan(1e-9);
  });
  it('R = 1: c_s = c / sqrt(6)', () => {
    expect(Math.abs(soundSpeed(1) - C_KM_S / Math.sqrt(6))).toBeLessThan(1e-9);
  });
  it('Shell radius linear in t', () => {
    expect(Math.abs(shellRadius(2, 1) - 2)).toBeLessThan(1e-12);
  });
  it('c_s decreases with R (baryons drag photons)', () => {
    expect(soundSpeed(2)).toBeLessThan(soundSpeed(0));
  });
});
