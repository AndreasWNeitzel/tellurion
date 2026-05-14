import { describe, it, expect } from 'vitest';
import { emissivity, cutoffHz, H, KB } from './sim.js';
describe('bremsstrahlung-spectrum', () => {
  it('cutoff at h nu = kT', () => {
    expect(Math.abs(H * cutoffHz(1e7) / (KB * 1e7) - 1)).toBeLessThan(1e-12);
  });
  it('emissivity drops below cutoff exponentially', () => {
    const T = 1e7;
    const nu_c = cutoffHz(T);
    const ratio = emissivity(10 * nu_c, T, 1, 1) / emissivity(nu_c, T, 1, 1);
    expect(ratio).toBeLessThan(0.01);
  });
  it('flat below cutoff', () => {
    const T = 1e7;
    const nu_c = cutoffHz(T);
    expect(Math.abs(emissivity(0.01 * nu_c, T, 1, 1) / emissivity(0.1 * nu_c, T, 1, 1) - 1)).toBeLessThan(0.1);
  });
  it('scales as n_e n_i', () => {
    const T = 1e6, nu = 1e15;
    const a = emissivity(nu, T, 2, 3);
    const b = emissivity(nu, T, 1, 1);
    expect(Math.abs(a / b - 6)).toBeLessThan(1e-9);
  });
  it('emissivity positive at all positive nu', () => {
    for (let i = 1; i < 1e16; i *= 10) expect(emissivity(i, 1e7, 1, 1)).toBeGreaterThan(0);
  });
});
