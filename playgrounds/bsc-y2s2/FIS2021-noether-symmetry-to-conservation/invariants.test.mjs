import { describe, it, expect } from 'vitest';
import { rk4, angularMomentum, energy } from './sim.js';
describe('noether-symmetry-to-conservation', () => {
  it('central force: angular momentum conserved', () => {
    let s = [1, 0, 0, 0.8];
    const L0 = angularMomentum(s);
    for (let i = 0; i < 5000; i += 1) s = rk4(s, 0.01, 0);
    expect(Math.abs(angularMomentum(s) - L0) / Math.abs(L0)).toBeLessThan(0.01);
  });
  it('symmetry-breaking term causes L to vary', () => {
    let s = [1, 0, 0, 0.8];
    const L0 = angularMomentum(s);
    for (let i = 0; i < 5000; i += 1) s = rk4(s, 0.01, 0.3);
    expect(Math.abs(angularMomentum(s) - L0)).toBeGreaterThan(0.001);
  });
  it('time-invariant system: energy conserved', () => {
    let s = [1, 0, 0, 0.8];
    const E0 = energy(s, 0);
    for (let i = 0; i < 5000; i += 1) s = rk4(s, 0.01, 0);
    expect(Math.abs(energy(s, 0) - E0) / Math.abs(E0)).toBeLessThan(0.01);
  });
});
