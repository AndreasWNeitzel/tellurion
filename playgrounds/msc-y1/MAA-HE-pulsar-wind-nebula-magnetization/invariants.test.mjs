import { describe, it, expect } from 'vitest';
import { terminationRadius, sigma_M, CRAB_L, CRAB_R_TS_PC } from './sim.js';
describe('pulsar-wind-nebula-magnetization', () => {
  it('R_TS scales as sqrt(L)', () => {
    expect(Math.abs(terminationRadius(4, 1) / terminationRadius(1, 1) - 2)).toBeLessThan(1e-9);
  });
  it('R_TS scales as 1/sqrt(P_ext)', () => {
    expect(Math.abs(terminationRadius(1, 4) / terminationRadius(1, 1) - 0.5)).toBeLessThan(1e-9);
  });
  it('Crab termination shock ~ 0.1 pc with P_ext ~ 5e-9 dyn/cm^2', () => {
    const R = terminationRadius(CRAB_L, 5e-9);
    const PC = 3.086e18;
    expect(R / PC).toBeGreaterThan(0.01);
    expect(R / PC).toBeLessThan(1);
  });
  it('sigma high when U_B >> U_part', () => {
    expect(sigma_M(10, 1)).toBe(10);
  });
});
