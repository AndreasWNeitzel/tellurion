import { describe, it, expect } from 'vitest';
import { eigenfrequencies, eccentricityOsc } from './sim.js';
describe('secular-perturbation-laplace-lagrange', () => {
  it('eigenfrequencies positive', () => {
    const e = eigenfrequencies(1, 0.5, 0.5);
    expect(e.g1).toBeGreaterThan(0);
    expect(e.g2).toBeGreaterThan(0);
  });
  it('Oscillation periodic', () => {
    expect(Math.abs(eccentricityOsc(0.1, 1, 0) - 0.1)).toBeLessThan(1e-9);
    expect(Math.abs(eccentricityOsc(0.1, 1, 2 * Math.PI * 2) - 0.1)).toBeLessThan(1e-6);
  });
});
