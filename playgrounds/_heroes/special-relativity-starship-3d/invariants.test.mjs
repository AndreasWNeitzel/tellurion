// special-relativity-starship-3d invariants. Prove the cockpit optics
// is the exact Lorentz transform (shared engine via ./sim.js), at the
// thresholds in spec.md.

import { describe, it, expect } from 'vitest';
import {
  gamma, aberrateCos, deaberrateCos, dopplerFactor, beamingFactor,
  contractedLength, properTime, boostEvent, interval2, shiftedWavelength,
} from './sim.js';

describe('special-relativity-starship-3d', () => {
  it('gamma equals 1/sqrt(1-beta^2) exactly and is 1 at rest', () => {
    expect(gamma(0)).toBe(1);
    expect(gamma(0.6)).toBeCloseTo(1.25, 12);
    expect(gamma(0.87)).toBeCloseTo(1 / Math.sqrt(1 - 0.87 ** 2), 10);
  });

  it('spacetime interval is invariant under the boost to 1e-6', () => {
    for (const beta of [0.3, 0.7, 0.95, 0.999]) {
      for (const [t, x] of [[2, 0.4], [1.5, 1.5], [3, -1.2]]) {
        const e = boostEvent(t, x, beta);
        expect(Math.abs(interval2(e.t, e.x) - interval2(t, x))).toBeLessThan(1e-6);
      }
    }
  });

  it('aberration is self-consistent under the inverse boost', () => {
    for (const beta of [0.2, 0.6, 0.9, 0.99]) {
      for (let c = -1; c <= 1.0001; c += 0.2) {
        expect(deaberrateCos(beta, aberrateCos(beta, c))).toBeCloseTo(c, 9);
      }
    }
  });

  it('Newtonian limit: beta -> 0 gives no aberration, no shift, gamma 1', () => {
    expect(aberrateCos(1e-9, 0.3)).toBeCloseTo(0.3, 8);
    expect(dopplerFactor(1e-9, 0.3)).toBeCloseTo(1, 8);
    expect(shiftedWavelength(550, 1e-9, 0.5)).toBeCloseTo(550, 5);
  });

  it('forward blueshift, aft redshift; beaming is exactly Doppler^4', () => {
    expect(dopplerFactor(0.7, 1)).toBeGreaterThan(1);
    expect(dopplerFactor(0.7, -1)).toBeLessThan(1);
    for (const c of [-0.6, 0.1, 1]) {
      expect(beamingFactor(0.8, c)).toBeCloseTo(dopplerFactor(0.8, c) ** 4, 9);
    }
  });

  it('length contraction and proper time share one gamma', () => {
    expect(contractedLength(12, 0.8)).toBeCloseTo(12 / gamma(0.8), 12);
    expect(properTime(12, 0.8)).toBeCloseTo(12 / gamma(0.8), 12);
  });

  it('deterministic: pure functions reproduce outputs', () => {
    expect(dopplerFactor(0.83, 0.21)).toBe(dopplerFactor(0.83, 0.21));
    expect(aberrateCos(0.5, -0.3)).toBe(aberrateCos(0.5, -0.3));
  });
});
