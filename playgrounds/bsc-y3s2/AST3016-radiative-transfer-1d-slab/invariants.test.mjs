import { describe, it, expect } from 'vitest';
import { transmitOptical, profileVsTau } from './sim.js';
describe('radiative-transfer-1d-slab', () => {
  it('tau=0: I_out = I_in', () => {
    expect(transmitOptical(2, 5, 0)).toBe(2);
  });
  it('thick slab: I -> S', () => {
    expect(Math.abs(transmitOptical(10, 1, 100) - 1)).toBeLessThan(1e-12);
  });
  it('Vacuum source-free: I = I_in for any tau (S=I_in)', () => {
    expect(Math.abs(transmitOptical(3, 3, 5) - 3)).toBeLessThan(1e-12);
  });
  it('Emission line: I_in < S yields growing I with tau', () => {
    expect(transmitOptical(1, 5, 2)).toBeGreaterThan(1);
  });
  it('Absorption line: I_in > S yields decreasing I with tau', () => {
    expect(transmitOptical(5, 1, 2)).toBeLessThan(5);
  });
  it('Monotone limit obtains for large tau', () => {
    const p = profileVsTau(5, 1, 10);
    expect(Math.abs(p.I[p.I.length - 1] - 1)).toBeLessThan(0.01);
  });
});
