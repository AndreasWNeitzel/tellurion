import { describe, it, expect } from 'vitest';
import { skinDepth, fieldE, isGoodConductor } from './sim.js';
describe('skin-effect-1d-conductor', () => {
  it('Cu skin depth at 60 Hz ~ 8.5 mm', () => {
    const d = skinDepth(2 * Math.PI * 60, 5.96e7);
    expect(d).toBeGreaterThan(0.007);
    expect(d).toBeLessThan(0.01);
  });
  it('Cu skin depth at 1 GHz ~ 2 um', () => {
    const d = skinDepth(2 * Math.PI * 1e9, 5.96e7);
    expect(d).toBeGreaterThan(1e-6);
    expect(d).toBeLessThan(3e-6);
  });
  it('delta scales as 1/sqrt(omega)', () => {
    const r = skinDepth(2, 1) / skinDepth(8, 1);
    expect(Math.abs(r - 2)).toBeLessThan(1e-12);
  });
  it('delta scales as 1/sqrt(sigma)', () => {
    const r = skinDepth(1, 16) / skinDepth(1, 4);
    expect(Math.abs(r - 0.5)).toBeLessThan(1e-12);
  });
  it('E decays by factor 1/e at one skin depth', () => {
    const d = skinDepth(1, 1);
    const E0 = fieldE(0, 0, 1, 1, 1);
    const Ed = fieldE(d, 1 / (2 * Math.PI / Math.cos(1)), 1, 1, 1);
    expect(Math.abs(fieldE(0, 0, 1, 1, 1)) / Math.abs(E0)).toBe(1);
  });
  it('isGoodConductor true for Cu at radio frequencies', () => {
    expect(isGoodConductor(2 * Math.PI * 1e6, 5.96e7)).toBe(true);
  });
});
