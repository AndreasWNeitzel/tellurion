import { describe, it, expect } from 'vitest';
import { gaussian, lorentzian, pseudoVoigt } from './sim.js';
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
});
