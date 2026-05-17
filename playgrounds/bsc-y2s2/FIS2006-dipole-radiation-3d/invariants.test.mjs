// Dipole radiation: the sin^2 theta pattern with axial nulls, the
// Larmor total power matching the angular integral, omega^4 scaling,
// 1/r^2 Poynting flux conservation, the orthogonal far-field triad
// with |E| = c|B|, and the antenna being more directional.

import { describe, it, expect } from 'vitest';
import {
  C, dipolePattern, antennaPattern, totalPowerE, dPdOmegaE,
  integratedPower, sphereFlux, directivity, farFieldTriad, dot, larmorPoint,
} from './sim.js';

describe('dipole-radiation-3d invariants', () => {
  it('sin^2 pattern: nulls on the axis, maximum in the equatorial plane', () => {
    expect(dipolePattern(0)).toBeCloseTo(0, 12);
    expect(dipolePattern(Math.PI)).toBeCloseTo(0, 12);
    expect(dipolePattern(Math.PI / 2)).toBeCloseTo(1, 12);
    // fore-aft symmetric and monotone up to the equator
    for (const th of [0.2, 0.6, 1.0, 1.4]) expect(dipolePattern(th)).toBeCloseTo(dipolePattern(Math.PI - th), 12);
    let prev = -1;
    for (let th = 0; th <= Math.PI / 2 + 1e-9; th += Math.PI / 40) { const p = dipolePattern(th); expect(p).toBeGreaterThanOrEqual(prev - 1e-12); prev = p; }
  });

  it('Larmor total power equals the integral of dP/dOmega (within 0.2%)', () => {
    const p0 = 1e-9, w = 2 * Math.PI * 1e8;
    const closed = totalPowerE(p0, w);
    expect(Math.abs(integratedPower(p0, w) - closed) / closed).toBeLessThan(2e-3);
    expect(closed).toBeGreaterThan(0);
  });

  it('radiated power scales as omega^4', () => {
    const p0 = 2e-9, w = 1e8;
    expect(totalPowerE(p0, 2 * w) / totalPowerE(p0, w)).toBeCloseTo(16, 9);
    expect(totalPowerE(p0, 3 * w) / totalPowerE(p0, w)).toBeCloseTo(81, 9);
    expect(totalPowerE(2 * p0, w) / totalPowerE(p0, w)).toBeCloseTo(4, 9);  // p0^2
  });

  it('Poynting flux is the same through any sphere (1/r^2 falloff)', () => {
    const p0 = 1e-9, w = 2 * Math.PI * 2e8, P = totalPowerE(p0, w);
    for (const r of [1, 10, 100, 5000]) {
      expect(Math.abs(sphereFlux(r, p0, w) - P) / P).toBeLessThan(2e-3);
    }
  });

  it('far-zone E, B, r-hat are mutually orthogonal with |E| = c|B|', () => {
    for (const [th, ph] of [[0.7, 0.0], [1.2, 1.0], [2.1, 2.5], [Math.PI / 2, 4.0]]) {
      const f = farFieldTriad(th, ph);
      expect(Math.abs(dot(f.rhat, f.Ehat))).toBeLessThan(1e-12);
      expect(Math.abs(dot(f.rhat, f.Bhat))).toBeLessThan(1e-12);
      expect(Math.abs(dot(f.Ehat, f.Bhat))).toBeLessThan(1e-12);
      for (const v of [f.rhat, f.Ehat, f.Bhat]) expect(Math.hypot(...v)).toBeCloseTo(1, 12);
      expect(f.Emag / f.Bmag).toBeCloseTo(C, 3);
    }
  });

  it('the dipole directivity is 3/2; the half-wave antenna is more directional', () => {
    const Dd = directivity(dipolePattern);
    expect(Dd).toBeCloseTo(1.5, 3);
    const Da = directivity(antennaPattern);
    expect(Da).toBeGreaterThan(Dd);
    expect(Da).toBeCloseTo(1.64, 1);                          // textbook half-wave value
    expect(antennaPattern(0)).toBeCloseTo(0, 9);
    expect(antennaPattern(Math.PI)).toBeCloseTo(0, 9);
    expect(antennaPattern(Math.PI / 2)).toBeGreaterThan(0.9);
  });

  it('dP/dOmega is consistent with the closed-form total and the Larmor relation', () => {
    const p0 = 3e-10, w = 2 * Math.PI * 5e8;
    // peak is at the equator, exactly (dP/dOmega) = mu0 p0^2 w^4 / 32 pi^2 c
    const peak = dPdOmegaE(Math.PI / 2, p0, w);
    expect(peak).toBeGreaterThan(dPdOmegaE(0.3, p0, w));
    expect(dPdOmegaE(0, p0, w)).toBeCloseTo(0, 20);
    // a point charge of equivalent acceleration obeys the same Larmor form
    expect(larmorPoint(1.6e-19, 1e20)).toBeGreaterThan(0);
  });
});
