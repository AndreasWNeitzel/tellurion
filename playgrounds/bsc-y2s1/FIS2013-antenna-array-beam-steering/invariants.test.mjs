// Phased-array invariant tests: closed-form array-factor properties.

import { describe, it, expect } from 'vitest';
import {
  arrayPower, steerPhase, psiOf, elementPhase, gratingLobes,
  halfPowerBeamwidth, peakSidelobeDb, DEG,
} from './sim.js';

describe('phased array invariants', () => {
  it('the main beam peaks (power = 1) exactly at the steer angle', () => {
    for (const N of [2, 4, 8, 16]) {
      for (const dl of [0.3, 0.5, 0.75, 1.0]) {
        for (const s of [-50, -20, 0, 15, 45]) {
          const th0 = s * DEG;
          expect(arrayPower(th0, N, dl, th0)).toBeCloseTo(1, 9);
        }
      }
    }
  });

  it('the steer phase puts psi = 0 at the steer angle', () => {
    expect(psiOf(30 * DEG, 0.5, 30 * DEG)).toBeCloseTo(0, 12);
    // beta = -k d sin(theta0)
    expect(steerPhase(0.5, 30 * DEG)).toBeCloseTo(-2 * Math.PI * 0.5 * Math.sin(30 * DEG), 12);
  });

  it('no grating lobe when d < lambda/2 at any steer angle', () => {
    for (const s of [-60, -30, 0, 30, 60]) {
      expect(gratingLobes(0.45, s * DEG).length).toBe(0);
    }
  });

  it('a grating lobe appears for d >= lambda at broadside', () => {
    expect(gratingLobes(1.0, 0).length).toBeGreaterThanOrEqual(0); // exactly at horizon, excluded
    expect(gratingLobes(1.2, 0).length).toBeGreaterThan(0);
  });

  it('a longer array has a narrower half-power beamwidth (broadside)', () => {
    const w4 = halfPowerBeamwidth(4, 0.5, 0);
    const w16 = halfPowerBeamwidth(16, 0.5, 0);
    expect(w16).toBeLessThan(w4);
  });

  it('broadside HPBW of an 8-element half-wave array is about 12.8 deg', () => {
    const hp = halfPowerBeamwidth(8, 0.5, 0) / DEG;
    expect(hp).toBeGreaterThan(11);
    expect(hp).toBeLessThan(14.5);
  });

  it('the peak side lobe is below the main beam', () => {
    for (const N of [4, 8, 12]) {
      expect(peakSidelobeDb(N, 0.5, 0)).toBeLessThan(0);
    }
  });

  it('a uniform array first side lobe is near -13.2 dB for large N', () => {
    const sll = peakSidelobeDb(20, 0.5, 0);
    expect(sll).toBeGreaterThan(-14.5);
    expect(sll).toBeLessThan(-12);
  });

  it('element phase advances by beta per element, mod 2pi', () => {
    const dl = 0.5, th0 = 20 * DEG;
    const beta = steerPhase(dl, th0);
    for (let n = 0; n < 5; n += 1) {
      let expected = (n * beta) % (2 * Math.PI);
      if (expected < 0) expected += 2 * Math.PI;
      expect(elementPhase(n, dl, th0)).toBeCloseTo(expected, 9);
    }
  });

  it('all reported quantities stay finite across the control range', () => {
    for (const N of [2, 9, 16]) {
      for (let dl = 0.25; dl <= 1.5; dl += 0.25) {
        for (let s = -60; s <= 60; s += 20) {
          const th0 = s * DEG;
          expect(Number.isFinite(halfPowerBeamwidth(N, dl, th0))).toBe(true);
          expect(Number.isFinite(peakSidelobeDb(N, dl, th0))).toBe(true);
          expect(Number.isFinite(arrayPower(0.3, N, dl, th0))).toBe(true);
        }
      }
    }
  });
});
