// Airy / Rayleigh resolution invariant tests.

import { describe, it, expect } from 'vitest';
import {
  besselJ1, airyIntensity, airyAtRayleigh, rayleighAngle,
  axialIntensity, dipRatio, verdict, J1_FIRST_ZERO, RAYLEIGH_FACTOR,
} from './sim.js';

describe('Airy / Rayleigh invariants', () => {
  it('J1 has its first zero at x = 3.8317', () => {
    expect(Math.abs(besselJ1(J1_FIRST_ZERO))).toBeLessThan(1e-6);
  });

  it('Airy intensity is 1 at the centre and 0 at the first dark ring', () => {
    expect(airyIntensity(0)).toBeCloseTo(1, 12);
    expect(airyIntensity(J1_FIRST_ZERO)).toBeLessThan(1e-10);
    expect(airyAtRayleigh(1)).toBeLessThan(1e-10);       // first ring at one Rayleigh unit
  });

  it('the Rayleigh angle is 1.22 lambda / D', () => {
    expect(RAYLEIGH_FACTOR).toBeCloseTo(1.21967, 4);
    const lam = 550e-9, D = 1.0;
    expect(rayleighAngle(lam, D)).toBeCloseTo(1.21967 * lam / D, 12);
  });

  it('two sources just resolved (s = 1) leave a central dip to ~0.735 of the peak', () => {
    const mid = axialIntensity(0, 1);
    // peak near a source centre
    let peak = 0;
    for (let u = 0.4; u <= 0.6; u += 0.001) peak = Math.max(peak, axialIntensity(u, 1));
    expect(mid / peak).toBeGreaterThan(0.72);
    expect(mid / peak).toBeLessThan(0.75);
  });

  it('the central dip deepens monotonically through the resolution regime', () => {
    // Up to s ~ 1.8 the saddle sits on the main lobes and the dip deepens
    // monotonically; beyond that the Airy side rings make it oscillate.
    let prev = 1.01;
    for (let s = 0.3; s <= 1.8; s += 0.1) {
      const d = dipRatio(s);
      expect(d).toBeLessThanOrEqual(prev + 1e-9);         // ratio drops (dip deepens)
      prev = d;
    }
  });

  it('the saddle never exceeds the peak (dip ratio <= 1)', () => {
    for (let s = 0.05; s <= 3; s += 0.05) {
      expect(dipRatio(s)).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('the verdict crosses from unresolved to resolved at the Rayleigh limit', () => {
    expect(verdict(0.6)).toBe('UNRESOLVED');
    expect(verdict(1.0)).toBe('AT RAYLEIGH LIMIT');
    expect(verdict(1.6)).toBe('RESOLVED');
  });

  it('a larger aperture resolves a fixed binary (smaller theta_R, larger s)', () => {
    const lam = 550e-9, dtheta = 0.1 / 206265; // 0.1 arcsec in radians
    const sSmall = dtheta / rayleighAngle(lam, 0.3);
    const sLarge = dtheta / rayleighAngle(lam, 3.0);
    expect(sLarge).toBeGreaterThan(sSmall);
    expect(verdict(sSmall)).toBe('UNRESOLVED');
    expect(verdict(sLarge)).toBe('RESOLVED');
  });

  it('all quantities stay finite across the control range', () => {
    for (let D = 0.15; D <= 3; D += 0.3) {
      for (let lam = 400; lam <= 800; lam += 100) {
        const s = (0.1 / 206265) / rayleighAngle(lam * 1e-9, D);
        expect(Number.isFinite(s)).toBe(true);
        expect(Number.isFinite(dipRatio(s))).toBe(true);
        expect(Number.isFinite(axialIntensity(0, s))).toBe(true);
      }
    }
  });
});
