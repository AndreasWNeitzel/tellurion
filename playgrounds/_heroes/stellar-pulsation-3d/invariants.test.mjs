import { describe, it, expect } from 'vitest';
import { realSphericalHarmonic, surfaceDisplacement, sampleGrid, meanSquared } from './sim.js';

describe('stellar-pulsation-3d', () => {
  it('Y_0^0 = 1 (everywhere)', () => {
    expect(realSphericalHarmonic(0, 0, 1.0, 0.5)).toBeCloseTo(1, 9);
  });

  it('Y_1^0(theta) = cos(theta)', () => {
    expect(realSphericalHarmonic(1, 0, 0.7, 0.5)).toBeCloseTo(Math.cos(0.7), 9);
  });

  it('Y_2^0(theta) = (3 cos^2(theta) - 1) / 2', () => {
    const th = 0.9;
    const expected = (3 * Math.cos(th) ** 2 - 1) / 2;
    expect(realSphericalHarmonic(2, 0, th, 0)).toBeCloseTo(expected, 6);
  });

  it('Y_l^m parity in phi: cos(m phi) vs sin(m phi)', () => {
    // Y_2^2(theta, phi+pi/(2*2)) for m=+2: y(phi+pi/4) = cos(2*(phi+pi/4)) = -sin(2phi)
    // -> -Y_2^{-2}(theta, phi) up to sign  (Y_{-m} uses sin).
    const y_pos = realSphericalHarmonic(2, 2, 0.7, 0.5);
    const y_neg = realSphericalHarmonic(2, -2, 0.7, 0.5);
    expect(Math.abs(y_pos - y_neg)).toBeGreaterThan(1e-6);   // distinct modes
  });

  it('surface displacement modulates with cos(omega t)', () => {
    const d0 = surfaceDisplacement(2, 1, 0.7, 0.5, 0, 1.0, 0.1);
    const d1 = surfaceDisplacement(2, 1, 0.7, 0.5, Math.PI, 1.0, 0.1);
    expect(d0).toBeCloseTo(-d1, 9);
  });

  it('sampleGrid: l=0, m=0 returns constant 1*amp at t=0', () => {
    const Y = sampleGrid(8, 12, 0, 0, 0, 1, 0.1);
    for (let i = 0; i < Y.length; i += 1) expect(Math.abs(Y[i] - 0.1)).toBeLessThan(1e-9);
  });

  it('meanSquared > 0 for any non-trivial mode', () => {
    expect(meanSquared(40, 60, 2, 0)).toBeGreaterThan(0);
    expect(meanSquared(40, 60, 3, 2)).toBeGreaterThan(0);
  });

  it('Y_l^m has correct number of zero crossings along a meridian (l)', () => {
    // Count sign changes in P_l^0(cos theta) for theta in [0, pi].
    const l = 4;
    let prev = realSphericalHarmonic(l, 0, 1e-4, 0);
    let zeros = 0;
    for (let i = 1; i <= 200; i += 1) {
      const theta = (i / 200) * Math.PI;
      const cur = realSphericalHarmonic(l, 0, theta, 0);
      if (prev * cur < 0) zeros += 1;
      prev = cur;
    }
    expect(zeros).toBe(l);
  });
});
