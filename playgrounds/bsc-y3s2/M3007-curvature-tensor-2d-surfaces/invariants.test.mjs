import { describe, it, expect } from 'vitest';
import { sphereK, hyperbolicK, torusK, cylinderK, gaussBonnetSphere } from './sim.js';
describe('curvature-tensor-2d-surfaces', () => {
  it('sphere K = 1/R^2', () => {
    expect(Math.abs(sphereK(2) - 0.25)).toBeLessThan(1e-12);
  });
  it('hyperbolic K negative', () => {
    expect(hyperbolicK(1)).toBe(-1);
  });
  it('cylinder K = 0', () => {
    expect(cylinderK()).toBe(0);
  });
  it('torus K positive on outer rim (theta=0)', () => {
    expect(torusK(0, 3, 1)).toBeGreaterThan(0);
  });
  it('torus K negative on inner rim (theta=pi)', () => {
    expect(torusK(Math.PI, 3, 1)).toBeLessThan(0);
  });
  it('Gauss-Bonnet on sphere: integral K dA = 4 pi (Euler char 2)', () => {
    expect(gaussBonnetSphere(1)).toBeCloseTo(4 * Math.PI, 10);
  });
});
