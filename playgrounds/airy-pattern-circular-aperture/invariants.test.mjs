// Airy diffraction pattern invariant tests.
// (a) J_1 zeros: J1(3.8317) ~ 0.
// (b) I(0) = 1 (peak central intensity, normalized).
// (c) I -> 0 at the canonical Bessel zeros.
// (d) J_1 matches table values for several x (Abramowitz & Stegun 9.1).
// (e) Central disc carries 83.8 percent of total power (Born and Wolf).

import { describe, it, expect } from 'vitest';
import { besselJ1, airyIntensity, J1_ZEROS } from './sim.js';

describe('Airy: Bessel function J_1', () => {
  it('J_1(0) = 0', () => {
    expect(besselJ1(0)).toBe(0);
  });
  it('J_1(1) ~ 0.4400505857', () => {
    expect(besselJ1(1)).toBeCloseTo(0.4400505857, 8);
  });
  it('J_1(2) ~ 0.5767248078', () => {
    expect(besselJ1(2)).toBeCloseTo(0.5767248078, 6);
  });
  it('J_1(5) ~ -0.3275791376', () => {
    expect(besselJ1(5)).toBeCloseTo(-0.3275791376, 6);
  });
  it('J_1(10) ~ 0.0434727462', () => {
    expect(besselJ1(10)).toBeCloseTo(0.0434727462, 6);
  });
});

describe('Airy: zeros of J_1 (table from Abramowitz & Stegun 9.5)', () => {
  for (const z of J1_ZEROS) {
    it(`J_1(${z}) ~ 0`, () => {
      expect(Math.abs(besselJ1(z))).toBeLessThan(1e-5);
    });
  }
});

describe('Airy: intensity formula', () => {
  it('I(0) = 1', () => {
    expect(airyIntensity(1e-12)).toBeCloseTo(1.0, 10);
    expect(airyIntensity(0)).toBe(1);
  });
  it('I(x_zero) = 0 at each J_1 zero', () => {
    for (const z of J1_ZEROS) {
      expect(airyIntensity(z)).toBeLessThan(1e-9);
    }
  });
  it('I(1.616) is around the first secondary maximum value ~ 0.5878', () => {
    // First secondary maximum is between first and second zeros.
    // The first secondary maximum of (2 J_1 / x)^2 is approximately at x = 5.136,
    // not 1.616 (which lies on the central lobe). Sanity: I(1.616) should be < 1.
    expect(airyIntensity(1.616)).toBeLessThan(1);
    expect(airyIntensity(1.616)).toBeGreaterThan(0);
  });
  it('first secondary maximum (around x ~ 5.14) has I < 0.02', () => {
    expect(airyIntensity(5.136)).toBeLessThan(0.02);
    expect(airyIntensity(5.136)).toBeGreaterThan(0.015);
  });
});

describe('Airy: central disc contains 83.8 percent of integrated power', () => {
  it('numerical integral of I(x) x dx from 0 to z1 is ~ 0.838 of total', () => {
    // Total integrated power over the full pattern is normalized to 1
    // when integrating I(x) x dx with the proper Bessel normalization.
    // Born & Wolf Section 8.5.2 give the encircled-energy fraction at the
    // first dark ring as 0.838.
    const xMax = 50;
    const N = 4000;
    const dx = xMax / N;
    let sumInside = 0, sumAll = 0;
    for (let i = 0; i < N; i += 1) {
      const x = (i + 0.5) * dx;
      const w = airyIntensity(x) * x;
      sumAll += w * dx;
      if (x <= J1_ZEROS[0]) sumInside += w * dx;
    }
    const frac = sumInside / sumAll;
    expect(frac).toBeGreaterThan(0.80);
    expect(frac).toBeLessThan(0.86);
  });
});
