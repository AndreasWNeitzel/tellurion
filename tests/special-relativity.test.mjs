// Shared-engine tests for shared/js/engine/special-relativity-cpu.js
// (built before the special-relativity-starship-3d hero). These prove
// the optics is the exact Lorentz transform: the spacetime interval
// is boost-invariant, aberration is its own inverse, gamma is exact,
// and the Newtonian limit is recovered as beta -> 0.

import { describe, it, expect } from 'vitest';
import {
  gamma, aberrateCos, deaberrateCos, dopplerFactor, beamingFactor,
  contractedLength, properTime, boostEvent, interval2, shiftedWavelength,
} from '../shared/js/engine/special-relativity-cpu.js';

describe('Lorentz factor', () => {
  it('gamma = 1/sqrt(1-beta^2) exactly, and 1 at beta=0', () => {
    expect(gamma(0)).toBe(1);
    expect(gamma(0.6)).toBeCloseTo(1.25, 12);
    expect(gamma(0.8)).toBeCloseTo(5 / 3, 12);
    expect(gamma(0.995)).toBeCloseTo(1 / Math.sqrt(1 - 0.995 ** 2), 10);
  });
});

describe('aberration is exact and self-inverse', () => {
  it('deaberrate(aberrate(c)) = c for all angles and speeds', () => {
    for (const beta of [0.1, 0.5, 0.87, 0.99]) {
      for (let c = -1; c <= 1; c += 0.1) {
        const round = deaberrateCos(beta, aberrateCos(beta, c));
        expect(round).toBeCloseTo(c, 9);
      }
    }
  });
  it('forward stays forward, the sky bunches forward as beta grows', () => {
    expect(aberrateCos(0.9, 1)).toBeCloseTo(1, 9);
    expect(aberrateCos(0.9, -1)).toBeCloseTo(-1, 9);
    // a star at 90 deg in the lab moves forward (cos > 0) in the ship
    expect(aberrateCos(0.8, 0)).toBeGreaterThan(0);
  });
});

describe('spacetime interval is boost invariant', () => {
  it('s^2 = t^2 - x^2 unchanged under a boost to 1e-6', () => {
    for (const beta of [0.2, 0.6, 0.95]) {
      for (const [t, x] of [[2, 0.5], [1, 1], [3, -2], [0.7, 0.3]]) {
        const e = boostEvent(t, x, beta);
        expect(Math.abs(interval2(e.t, e.x) - interval2(t, x))).toBeLessThan(1e-6);
      }
    }
  });
});

describe('Doppler and beaming', () => {
  it('forward is blueshift (D>1), aft is redshift (D<1)', () => {
    expect(dopplerFactor(0.6, 1)).toBeGreaterThan(1);
    expect(dopplerFactor(0.6, -1)).toBeLessThan(1);
    expect(dopplerFactor(0, 0.3)).toBeCloseTo(1, 12);   // no shift at rest
  });
  it('beaming is exactly the fourth power of the Doppler factor', () => {
    for (const c of [-0.7, 0, 0.5, 1]) {
      const D = dopplerFactor(0.7, c);
      expect(beamingFactor(0.7, c)).toBeCloseTo(D ** 4, 9);
    }
  });
  it('a forward star blueshifts (shorter wavelength)', () => {
    expect(shiftedWavelength(550, 0.5, 1)).toBeLessThan(550);
    expect(shiftedWavelength(550, 0.5, -1)).toBeGreaterThan(550);
  });
});

describe('length contraction and proper time', () => {
  it('length contracts and proper time dilates by the same gamma', () => {
    expect(contractedLength(10, 0.8)).toBeCloseTo(10 / gamma(0.8), 12);
    expect(properTime(10, 0.8)).toBeCloseTo(10 / gamma(0.8), 12);
    expect(contractedLength(10, 0)).toBe(10);
    expect(properTime(10, 0)).toBe(10);
  });
});
