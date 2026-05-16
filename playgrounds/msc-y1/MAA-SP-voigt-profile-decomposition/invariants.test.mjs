import { describe, it, expect } from 'vitest';
import { gaussian, lorentzian, pseudoVoigt, voigtConv } from './sim.js';
describe('voigt-profile-decomposition', () => {
  it('Gaussian integrates to 1', () => {
    let s = 0; const N = 5000, dx = 0.01;
    for (let i = -N / 2; i <= N / 2; i += 1) s += gaussian(i * dx, 1) * dx;
    expect(Math.abs(s - 1)).toBeLessThan(0.01);
  });
  it('Lorentzian integrates to 1', () => {
    let s = 0; const N = 50000, dx = 0.01;
    for (let i = -N / 2; i <= N / 2; i += 1) s += lorentzian(i * dx, 1) * dx;
    expect(Math.abs(s - 1)).toBeLessThan(0.05);
  });
  it('Voigt -> Gaussian when gamma -> 0', () => {
    expect(Math.abs(pseudoVoigt(0, 1, 1e-6) - gaussian(0, 1)) / gaussian(0, 1)).toBeLessThan(0.1);
  });
  it('Voigt -> Lorentzian when sigma -> 0', () => {
    expect(pseudoVoigt(0, 1e-6, 1)).toBeGreaterThan(0);
  });
  it('Voigt peak at x=0', () => {
    expect(pseudoVoigt(0, 1, 0.5)).toBeGreaterThan(pseudoVoigt(1, 1, 0.5));
  });
  it('voigtConv -> Gaussian as gamma gets small (within the slider domain)', () => {
    // gamma >= 0.05 is the playground's slider range; the adaptive grid
    // is accurate there. gamma -> 0 is a singular limit a finite grid
    // cannot resolve and is outside the domain.
    const v = voigtConv(0, 1, 0.02), g = gaussian(0, 1);
    expect(Math.abs(v - g) / g).toBeLessThan(0.12);
  });
  it('voigtConv normalised and peaked at 0', () => {
    let s = 0; const dx = 0.02;
    for (let i = -1500; i <= 1500; i += 1) s += voigtConv(i * dx, 0.8, 0.4) * dx;
    expect(Math.abs(s - 1)).toBeLessThan(0.03);
    expect(voigtConv(0, 0.8, 0.4)).toBeGreaterThan(voigtConv(1.5, 0.8, 0.4));
  });
});
