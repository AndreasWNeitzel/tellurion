import { describe, it, expect } from 'vitest';
import { eigenfrequencies, eccentricityOsc, amd } from './sim.js';
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
  it('AMD e1^2+e2^2 conserved under the exchange', () => {
    const e0 = 0.15, w = 0.3;
    for (const t of [0, 1.7, 3.9, 8.2, 15.0]) {
      const e1 = e0 * Math.abs(Math.cos(w * t));
      const e2 = e0 * Math.abs(Math.sin(w * t));
      expect(Math.abs(amd(e1, e2) - e0 * e0)).toBeLessThan(1e-12);
    }
  });
});
