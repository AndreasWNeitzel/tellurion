import { describe, it, expect } from 'vitest';
import { intensity, resolvingPower, principalMaxAngle } from './sim.js';
describe('grating-resolving-power', () => {
  it('principal max at sin theta = m lambda / d', () => {
    const lam = 500, d = 2;
    const theta = principalMaxAngle(1, lam, d);
    expect(Math.abs(Math.sin(theta) - lam * 1e-9 / (d * 1e-6))).toBeLessThan(1e-10);
  });
  it('R = m N', () => {
    expect(resolvingPower(2, 1000)).toBe(2000);
  });
  it('Intensity at theta = 0 with N slits ~ N^2', () => {
    const I = intensity(1e-6, 500, 2, 0.5, 10);
    expect(Math.abs(I / 100 - 1)).toBeLessThan(0.05);
  });
  it('Two close wavelengths: distinct peaks at R = mN', () => {
    const N = 100, m = 1, d = 2, a = 0.5;
    const lam = 500;
    const dlam = lam / (m * N);
    const theta1 = principalMaxAngle(m, lam, d);
    const theta2 = principalMaxAngle(m, lam + dlam, d);
    expect(theta2).toBeGreaterThan(theta1);
  });
});
