// Stellar aberration invariants.
// (a) Forward direction (theta = 0) unchanged.
// (b) Backward (theta = pi) unchanged.
// (c) Small-beta: shift ~ beta sin theta.
// (d) Earth's annual aberration max ~ 20.5 arcseconds at theta = pi/2.
// (e) Forward-backward limit: high beta beams light toward forward.
// (f) Inverse: thetaRest(thetaObs(theta, beta), beta) = theta.

import { describe, it, expect } from 'vitest';
import {
  thetaObs, thetaRest, aberrationShift,
  aberrationSmallBeta, BETA_EARTH_ORBIT, ABERRATION_CONST_AS,
} from './sim.js';

const RAD_TO_AS = 180 * 3600 / Math.PI;

describe('aberration-of-light-stellar', () => {
  it('forward direction (theta = 0) unchanged', () => {
    expect(Math.abs(thetaObs(0, 0.5))).toBeLessThan(1e-12);
  });

  it('backward direction (theta = pi) unchanged', () => {
    expect(Math.abs(thetaObs(Math.PI, 0.5) - Math.PI)).toBeLessThan(1e-12);
  });

  it('small-beta shift agrees with beta sin theta', () => {
    const beta = 1e-4;
    const theta = 1.0;
    const exact = aberrationShift(theta, beta);
    const approx = aberrationSmallBeta(theta, beta);
    expect(Math.abs(exact - approx) / exact).toBeLessThan(1e-3);
  });

  it('Earth annual aberration max ~ 20.5 arcsec at theta = pi/2', () => {
    const shiftRad = aberrationShift(Math.PI / 2, BETA_EARTH_ORBIT);
    const shiftAs = shiftRad * RAD_TO_AS;
    expect(Math.abs(shiftAs - ABERRATION_CONST_AS) / ABERRATION_CONST_AS).toBeLessThan(0.01);
  });

  it('high beta beams light toward forward (theta_obs < theta_rest)', () => {
    for (const theta of [0.5, 1.0, Math.PI / 2, 2.0]) {
      expect(thetaObs(theta, 0.9)).toBeLessThan(theta);
    }
  });

  it('inverse: thetaRest(thetaObs(theta, beta), beta) = theta', () => {
    for (const theta of [0.3, 1.0, 2.0, Math.PI - 0.1]) {
      for (const beta of [0.1, 0.5, 0.9]) {
        const round = thetaRest(thetaObs(theta, beta), beta);
        expect(Math.abs(round - theta)).toBeLessThan(1e-12);
      }
    }
  });

  it('beta = 0 gives no aberration at any angle', () => {
    for (const t of [0.5, 1.0, 2.5]) {
      expect(Math.abs(aberrationShift(t, 0))).toBeLessThan(1e-12);
    }
  });

  it('symmetric: theta = pi/2 gives largest shift (small beta)', () => {
    const b = 0.01;
    const s1 = Math.abs(aberrationShift(0.3, b));
    const s2 = Math.abs(aberrationShift(Math.PI / 2, b));
    const s3 = Math.abs(aberrationShift(Math.PI - 0.3, b));
    expect(s2).toBeGreaterThan(s1);
    expect(s2).toBeGreaterThan(s3);
  });
});
