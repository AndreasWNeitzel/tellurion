// Shapiro-delay invariants.
// (a) Leading-order matches full at b << r.
// (b) Decreases as b grows.
// (c) Increases as r grows.
// (d) Linear in M.
// (e) Full formula at b = r yields zero.
// (f) Manual formula match.

import { describe, it, expect } from 'vitest';
import { shapiroDelay, shapiroDelayFull } from './sim.js';

describe('Shapiro: leading-order matches full at b << r', () => {
  it('|delta_full - delta_lead| / delta_lead < 0.05 at b = 1, r = 1000', () => {
    const rE = 1000, rR = 1000, b = 1;
    const lead = shapiroDelay(rE, rR, b);
    const full = shapiroDelayFull(rE, rR, b);
    expect(Math.abs(full - lead) / lead).toBeLessThan(0.05);
  });
});

describe('Shapiro: decreases with b', () => {
  it('larger b gives smaller delay', () => {
    for (const r of [100, 1000]) {
      expect(shapiroDelay(r, r, 1)).toBeGreaterThan(shapiroDelay(r, r, 5));
      expect(shapiroDelay(r, r, 5)).toBeGreaterThan(shapiroDelay(r, r, 10));
    }
  });
});

describe('Shapiro: increases with r', () => {
  it('larger r_E gives larger delay at fixed b', () => {
    const b = 1;
    expect(shapiroDelay(100, 100, b)).toBeLessThan(shapiroDelay(1000, 1000, b));
  });
});

describe('Shapiro: linear in M', () => {
  it('delay(2M) = 2 delay(M)', () => {
    const rE = 100, rR = 100, b = 1;
    const d1 = shapiroDelay(rE, rR, b, 1);
    const d2 = shapiroDelay(rE, rR, b, 2);
    expect(d2).toBeCloseTo(2 * d1, 9);
  });
});

describe('Shapiro: full formula at b = r yields zero', () => {
  it('shapiroDelayFull(r, r, r) = 0', () => {
    expect(shapiroDelayFull(10, 10, 10, 1)).toBeCloseTo(0, 9);
  });
});

describe('Shapiro: leading-order formula matches manual', () => {
  it('shapiroDelay = 2 M ln(4 r_E r_R / b^2) exact', () => {
    const rE = 100, rR = 200, b = 1, M = 1;
    const expected = 2 * M * Math.log(4 * rE * rR / (b * b));
    expect(shapiroDelay(rE, rR, b, M)).toBeCloseTo(expected, 12);
  });
});
