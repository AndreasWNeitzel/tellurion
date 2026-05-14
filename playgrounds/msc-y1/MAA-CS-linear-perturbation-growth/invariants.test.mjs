import { describe, it, expect } from 'vitest';
import { Omega_m_at, growthFactor, deltaGrowth } from './sim.js';
describe('linear-perturbation-growth', () => {
  it('Omega_m -> 1 at early times', () => {
    expect(Math.abs(Omega_m_at(0.01) - 1)).toBeLessThan(0.01);
  });
  it('Omega_m_today ~ 0.315', () => {
    expect(Math.abs(Omega_m_at(1) - 0.315)).toBeLessThan(0.005);
  });
  it('f ~ 1 in matter era', () => {
    expect(Math.abs(growthFactor(0.1) - 1)).toBeLessThan(0.01);
  });
  it('f < 1 today (suppression by Lambda)', () => {
    expect(growthFactor(1)).toBeLessThan(1);
  });
  it('delta grows monotonically', () => {
    expect(deltaGrowth(1)).toBeGreaterThan(deltaGrowth(0.5));
  });
  it('delta(a~1) > delta(a~0.1)', () => {
    expect(deltaGrowth(1)).toBeGreaterThan(deltaGrowth(0.1));
  });
});
