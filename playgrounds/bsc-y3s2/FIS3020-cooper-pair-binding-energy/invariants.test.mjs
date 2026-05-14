import { describe, it, expect } from 'vitest';
import { bindingEnergy } from './sim.js';
describe('cooper-pair-binding-energy', () => {
  it('binding energy > 0 for any N0V > 0', () => {
    for (let v = 0.05; v < 1; v += 0.1) expect(bindingEnergy(v)).toBeGreaterThan(0);
  });
  it('exponentially small for weak coupling', () => {
    expect(bindingEnergy(0.1)).toBeLessThan(0.001);
  });
  it('binding energy increases with N0V', () => {
    expect(bindingEnergy(0.5)).toBeGreaterThan(bindingEnergy(0.2));
  });
  it('matches formula 2 hbar omega_D exp(-2/N0V)', () => {
    expect(Math.abs(bindingEnergy(0.3, 1) - 2 * Math.exp(-2 / 0.3))).toBeLessThan(1e-12);
  });
});
