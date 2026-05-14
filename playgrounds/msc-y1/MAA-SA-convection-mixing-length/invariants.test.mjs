import { describe, it, expect } from 'vitest';
import { vConv, FConv, schwarzschild, HpScale } from './sim.js';
describe('convection-mixing-length', () => {
  it('vConv vanishes at DeltaT = 0', () => {
    expect(vConv(10, 0, 1e7, 1e8)).toBe(0);
  });
  it('FConv positive for positive DeltaT', () => {
    expect(FConv(1, 1e8, 1, 1)).toBeGreaterThan(0);
  });
  it('schwarzschild correctly classifies', () => {
    expect(schwarzschild(0.4, 0.3)).toBe('convective');
    expect(schwarzschild(0.2, 0.3)).toBe('radiative');
  });
  it('Hp scales as P/rho/g', () => {
    expect(HpScale(1e15, 1, 100)).toBe(1e13);
  });
});
