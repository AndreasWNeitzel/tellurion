import { describe, it, expect } from 'vitest';
import { gamma, thomasFactor, thomasRate } from './sim.js';
describe('thomas-precession', () => {
  it('thomas factor vanishes at beta = 0', () => {
    expect(thomasFactor(0)).toBe(0);
  });
  it('thomas factor positive for any nonzero beta', () => {
    expect(thomasFactor(0.3)).toBeGreaterThan(0);
  });
  it('thomas rate at beta=0.5 ~ (gamma-1)*omega', () => {
    const beta = 0.5, omega = 1;
    expect(Math.abs(thomasRate(beta, omega) - (gamma(beta) - 1) * omega)).toBeLessThan(1e-12);
  });
  it('thomas factor approaches infinity as beta -> 1', () => {
    expect(thomasFactor(0.99)).toBeGreaterThan(5);
  });
});
