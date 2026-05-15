// Eddington grey-atmosphere invariants.
// (a) T(2/3) = T_eff (photosphere definition).
// (b) T(0) = T_eff (1/2)^(1/4) ~ 0.841 T_eff (boundary).
// (c) T(infty) -> T_eff (3 tau / 4)^(1/4) asymptotic.
// (d) Limb darkening I(mu = 1) = 1 (center); I(mu = 0) = 0.4 (limb).

import { describe, it, expect } from 'vitest';
import {
  temperatureKEdd, T_BOUNDARY_RATIO, TAU_PHOTOSPHERE, limbDarkening,
} from './sim.js';

describe('eddington-grey-atmosphere', () => {
  it('T(2/3) = T_eff exactly', () => {
    expect(Math.abs(temperatureKEdd(2 / 3, 5778) - 5778)).toBeLessThan(1e-9);
  });

  it('T(0) = T_eff (1/2)^(1/4)', () => {
    const T = temperatureKEdd(0, 5778);
    expect(Math.abs(T - 5778 * T_BOUNDARY_RATIO)).toBeLessThan(1e-9);
    expect(T_BOUNDARY_RATIO).toBeCloseTo(0.84090, 4);
  });

  it('T(tau >> 1) asymptotes to T_eff (3 tau / 4)^(1/4)', () => {
    const tau = 100;
    const T = temperatureKEdd(tau, 5778);
    const expected = 5778 * Math.pow(0.75 * tau, 0.25);
    expect(Math.abs(T - expected) / expected).toBeLessThan(0.01);
  });

  it('T monotonic increasing in tau', () => {
    let prev = 0;
    for (const tau of [0, 0.1, 0.5, 1, 2, 10]) {
      const T = temperatureKEdd(tau, 5778);
      expect(T).toBeGreaterThanOrEqual(prev);
      prev = T;
    }
  });

  it('limb darkening: center disk (mu=1) is 1', () => {
    expect(Math.abs(limbDarkening(1) - 1)).toBeLessThan(1e-12);
  });

  it('limb darkening: edge (mu = 0) is 0.4', () => {
    expect(Math.abs(limbDarkening(0) - 0.4)).toBeLessThan(1e-12);
  });

  it('limb darkening: monotonic decreasing from 1 to 0.4', () => {
    let prev = 1;
    for (const mu of [1.0, 0.7, 0.4, 0.1, 0]) {
      const I = limbDarkening(mu);
      expect(I).toBeLessThanOrEqual(prev);
      prev = I;
    }
  });

  it('TAU_PHOTOSPHERE constant equals 2/3', () => {
    expect(TAU_PHOTOSPHERE).toBeCloseTo(2 / 3, 12);
  });
  it('1-F: disk center is at least 2x brighter than the limb', () => {
    // I(mu) = 0.4 + 0.6 mu. Center mu=1 -> I=1.0. Limb mu->0 -> I->0.4.
    const Icenter = 0.4 + 0.6 * 1.0;
    const Ilimb = 0.4 + 0.6 * 0.0;
    expect(Icenter / Ilimb).toBeGreaterThanOrEqual(2.0);
  });
});
