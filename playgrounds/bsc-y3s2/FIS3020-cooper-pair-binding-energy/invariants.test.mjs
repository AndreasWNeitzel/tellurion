import { describe, it, expect } from 'vitest';
import { bindingEnergy, pairWavefunction } from './sim.js';
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
  it('binding energy scales linearly with hbar omega_D', () => {
    const E1 = bindingEnergy(0.3, 1.0);
    const E2 = bindingEnergy(0.3, 2.0);
    expect(Math.abs(E2 - 2 * E1)).toBeLessThan(1e-12);
  });
  it('wavefunction is positive for all xi', () => {
    const E_b = bindingEnergy(0.3);
    for (let xi = -1; xi <= 1; xi += 0.1) {
      expect(pairWavefunction(xi, E_b)).toBeGreaterThan(0);
    }
  });
  it('wavefunction peaks near Fermi surface (xi = 0)', () => {
    const E_b = bindingEnergy(0.3);
    const g_peak = pairWavefunction(0, E_b);
    const g_far = pairWavefunction(2, E_b);
    expect(g_peak).toBeGreaterThan(g_far);
  });
  it('wavefunction decays as |xi| increases', () => {
    const E_b = bindingEnergy(0.3);
    const g0 = pairWavefunction(0, E_b);
    const g1 = pairWavefunction(1, E_b);
    const g2 = pairWavefunction(2, E_b);
    expect(g0).toBeGreaterThan(g1);
    expect(g1).toBeGreaterThan(g2);
  });
});
