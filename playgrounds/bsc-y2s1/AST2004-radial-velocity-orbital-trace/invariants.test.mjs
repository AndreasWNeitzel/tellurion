import { describe, it, expect } from 'vitest';
import { semiAmplitudeKMs, radialVelocityKMs, trueAnomaly, solveKepler } from './sim.js';
describe('radial-velocity-orbital-trace', () => {
  it('circular orbit at omega=0: sinusoid amplitude K', () => {
    const K = 10;
    const v_peak = radialVelocityKMs(0, K, 0, 0);
    expect(Math.abs(v_peak - K)).toBeLessThan(1e-6);
  });
  it('circular orbit: integral over phase is zero', () => {
    let sum = 0;
    for (let i = 0; i < 1000; i += 1) sum += radialVelocityKMs(i / 1000, 10, 0, 0);
    expect(Math.abs(sum / 1000)).toBeLessThan(0.05);
  });
  it('semiAmplitude approx 30 km/s for Earth twin', () => {
    const K = semiAmplitudeKMs(1, 1, 0, 1);
    expect(K).toBeGreaterThan(25);
    expect(K).toBeLessThan(35);
  });
  it('K scales as 1/sqrt(1-e^2)', () => {
    const K0 = semiAmplitudeKMs(1, 1, 0, 1);
    const K9 = semiAmplitudeKMs(1, 1, 0.9, 1);
    expect(Math.abs(K9 / K0 - 1 / Math.sqrt(0.19))).toBeLessThan(0.01);
  });
  it('eccentric orbit asymmetric: peak != -trough at omega = 0', () => {
    let mx = -Infinity, mn = Infinity;
    for (let i = 0; i < 1000; i += 1) {
      const v = radialVelocityKMs(i / 1000, 10, 0, 0.7);
      if (v > mx) mx = v; if (v < mn) mn = v;
    }
    expect(Math.abs(mx + mn)).toBeGreaterThan(0.5);
  });
});
