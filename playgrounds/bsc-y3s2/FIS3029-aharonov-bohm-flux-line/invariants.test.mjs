import { describe, it, expect } from 'vitest';
import { phaseShift, intensity, FLUX_QUANTUM_e } from './sim.js';
describe('aharonov-bohm-flux-line', () => {
  it('integer flux quanta give no shift', () => {
    expect(Math.abs(phaseShift(2 * FLUX_QUANTUM_e) - 2)).toBeLessThan(1e-12);
  });
  it('half flux quantum: half-cycle shift', () => {
    expect(Math.abs(phaseShift(0.5 * FLUX_QUANTUM_e) - 0.5)).toBeLessThan(1e-12);
  });
  it('intensity at x=0 with no shift is maximum', () => {
    expect(intensity(0, 1, 1, 1, 0)).toBeCloseTo(2, 10);
  });
  it('intensity at x=0 with pi shift is minimum', () => {
    expect(intensity(0, 1, 1, 1, Math.PI)).toBeCloseTo(0, 10);
  });
});
