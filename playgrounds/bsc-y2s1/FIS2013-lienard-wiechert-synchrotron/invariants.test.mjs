import { describe, it, expect } from 'vitest';
import { gammaFromBeta, betaFromGamma, lobeParallel, lobePerpendicular, openingAngle } from './sim.js';
describe('lienard-wiechert-synchrotron', () => {
  it('gamma roundtrip', () => {
    expect(Math.abs(betaFromGamma(gammaFromBeta(0.9)) - 0.9)).toBeLessThan(1e-12);
  });
  it('Larmor recovered at beta -> 0', () => {
    expect(Math.abs(lobeParallel(Math.PI / 2, 1e-6) - 1)).toBeLessThan(1e-3);
  });
  it('parallel lobe vanishes along motion', () => {
    expect(lobeParallel(0, 0.5)).toBe(0);
  });
  it('perpendicular case more forward-beamed at higher gamma', () => {
    const p1 = lobePerpendicular(0.05, 0, 0.99);
    const p2 = lobePerpendicular(0.05, 0, 0.5);
    expect(p1).toBeGreaterThan(p2);
  });
  it('opening angle scales as 1/gamma', () => {
    expect(Math.abs(openingAngle(10) * 10 - 1)).toBeLessThan(1e-12);
  });
  it('peak shifts toward forward direction as beta -> 1', () => {
    let peakTheta1 = 0, max1 = -Infinity;
    let peakTheta2 = 0, max2 = -Infinity;
    for (let i = 1; i < 180; i += 1) {
      const th = i * Math.PI / 180;
      const v1 = lobePerpendicular(th, 0, 0.9);
      const v2 = lobePerpendicular(th, 0, 0.99);
      if (v1 > max1) { max1 = v1; peakTheta1 = th; }
      if (v2 > max2) { max2 = v2; peakTheta2 = th; }
    }
    expect(peakTheta2).toBeLessThan(peakTheta1);
  });
});
