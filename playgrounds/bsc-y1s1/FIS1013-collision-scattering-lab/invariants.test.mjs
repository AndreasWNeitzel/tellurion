// Two-body scattering: closed-form deflection laws, the Rutherford
// cross section, and the large-impact-parameter limit.

import { describe, it, expect } from 'vitest';
import { reducedMass, chiHardSphere, dsigmaHardSphere, chiCoulomb, dsigmaRutherford, chiYukawa } from './sim.js';

describe('collision-scattering-lab invariants', () => {
  it('reduced mass: equal masses give mu = m/2; mu < min(m1,m2)', () => {
    expect(reducedMass(2, 2)).toBeCloseTo(1, 12);
    expect(reducedMass(1, 1e6)).toBeGreaterThan(0.999);
    expect(reducedMass(3, 5)).toBeLessThan(3);
  });

  it('hard sphere: chi = pi - 2 asin(b/R), head-on -> pi, grazing -> 0', () => {
    expect(chiHardSphere(0, 1)).toBeCloseTo(Math.PI, 10);
    expect(chiHardSphere(1, 1)).toBeCloseTo(0, 10);
    expect(chiHardSphere(0.5, 1)).toBeCloseTo(Math.PI - 2 * Math.asin(0.5), 10);
    expect(chiHardSphere(1.5, 1)).toBe(0);
  });

  it('hard sphere differential cross section is isotropic = R^2/4', () => {
    expect(dsigmaHardSphere(2)).toBeCloseTo(1, 12);
    expect(dsigmaHardSphere(0.5)).toBeCloseTo(0.0625, 12);
  });

  it('Coulomb: head-on (b=0) backscatters; chi decreases with b', () => {
    const E = 5, alpha = 2;
    expect(chiCoulomb(0, alpha, E)).toBeCloseTo(Math.PI, 6);
    let prev = Math.PI;
    for (const b of [0.05, 0.2, 0.5, 1, 2, 5]) { const c = chiCoulomb(b, alpha, E); expect(c).toBeLessThan(prev + 1e-9); prev = c; }
    expect(chiCoulomb(50, alpha, E)).toBeLessThan(0.05);
  });

  it('Rutherford cross section follows the 1/sin^4(chi/2) law', () => {
    const E = 4, alpha = 1.5;
    const ratio = dsigmaRutherford(Math.PI / 3, alpha, E) / dsigmaRutherford(Math.PI / 2, alpha, E);
    const analytic = Math.sin(Math.PI / 4) ** 4 / Math.sin(Math.PI / 6) ** 4;
    expect(Math.abs(ratio - analytic) / analytic).toBeLessThan(1e-3);
  });

  it('integrated Yukawa deflection is positive and decreases with b', () => {
    const mu = 1, v0 = 3;
    let prev = Infinity;
    for (const b of [0.2, 0.5, 1.0, 2.0, 4.0]) {
      const c = chiYukawa(b, 1.5, 2.0, mu, v0);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(prev + 1e-6);
      prev = c;
    }
  });

  it('large impact parameter gives negligible deflection (all potentials)', () => {
    expect(chiHardSphere(10, 1)).toBe(0);
    expect(chiCoulomb(100, 2, 5)).toBeLessThan(0.02);
    expect(chiYukawa(20, 1, 1.5, 1, 3)).toBeLessThan(0.05);
  });
});
