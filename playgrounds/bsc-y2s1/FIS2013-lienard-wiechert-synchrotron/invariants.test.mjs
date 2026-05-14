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
  it('beam narrows as beta -> 1 (FWHM half-angle smaller)', () => {
    function widthHalfMax(beta) {
      const peak = lobePerpendicular(0.001, 0, beta);
      for (let i = 1; i < 1800; i += 1) {
        const th = i * Math.PI / 1800;
        const v = lobePerpendicular(th, 0, beta);
        if (v < peak / 2) return th;
      }
      return Math.PI;
    }
    expect(widthHalfMax(0.99)).toBeLessThan(widthHalfMax(0.9));
  });
});
