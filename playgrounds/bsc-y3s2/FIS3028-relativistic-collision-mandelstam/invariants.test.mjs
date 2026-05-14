import { describe, it, expect } from 'vitest';
import { fixedTargetS, colliderS, sqrtS, gamma } from './sim.js';
describe('relativistic-collision-mandelstam', () => {
  it('fixed-target s sums correctly', () => {
    expect(Math.abs(fixedTargetS(1, 1, 10) - (2 + 20))).toBeLessThan(1e-12);
  });
  it('collider head-on: s = (E1 + E2)^2 (equal masses)', () => {
    expect(Math.abs(colliderS(0, 0, 10, 10) - 400)).toBeLessThan(1e-9);
  });
  it('s grows sqrtly with E_lab', () => {
    expect(Math.abs(sqrtS(fixedTargetS(1, 100, 1e6))).toFixed(0)).toBe(sqrtS(2 * 100 * 1e6).toFixed(0));
  });
  it('gamma at v = 0.9c is 2.294', () => {
    expect(Math.abs(gamma(0.9) - 2.294)).toBeLessThan(0.01);
  });
});
