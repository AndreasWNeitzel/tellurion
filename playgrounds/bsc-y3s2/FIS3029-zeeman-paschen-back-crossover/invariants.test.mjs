import { describe, it, expect } from 'vitest';
import { weakFieldEnergy, strongFieldEnergy, gFactor, BOHR_MAGNETON_eV_T } from './sim.js';
describe('zeeman-paschen-back-crossover', () => {
  it('g_J for 2p_{3/2} is 4/3', () => {
    expect(Math.abs(gFactor(1.5, 1, 0.5) - 4 / 3)).toBeLessThan(1e-9);
  });
  it('g_J for 2p_{1/2} is 2/3', () => {
    expect(Math.abs(gFactor(0.5, 1, 0.5) - 2 / 3)).toBeLessThan(1e-9);
  });
  it('Strong-field linear in B', () => {
    expect(strongFieldEnergy(1, 0.5, 2) / strongFieldEnergy(1, 0.5, 1)).toBeCloseTo(2, 10);
  });
  it('Weak field: m_j = 0 has no shift', () => {
    expect(weakFieldEnergy(0.5, 0, 0, 0.5, 1)).toBe(0);
  });
});
