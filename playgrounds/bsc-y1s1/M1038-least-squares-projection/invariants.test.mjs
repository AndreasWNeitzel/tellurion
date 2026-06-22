// Invariants for least squares: the normal equations (orthogonal residual), the
// SSR parabola and its minimum at the least-squares slope, the centroid property,
// and that no other slope does better.

import { describe, it, expect } from 'vitest';
import { stats, lsSlope, lsIntercept, ssr, ssrCentroid, ssrMin, residuals, normalSums, PRESET } from './sim.js';

describe('The normal equations hold at the least-squares fit', () => {
  it('the residual is orthogonal to the columns (sum r = 0 and sum r x = 0)', () => {
    const m = lsSlope(PRESET); const ns = normalSums(PRESET, m);
    expect(ns.sumR).toBeCloseTo(0, 9);
    expect(ns.sumRx).toBeCloseTo(0, 9);
  });
  it('the fitted line passes through the centroid', () => {
    const s = stats(PRESET), m = lsSlope(PRESET), c = lsIntercept(PRESET);
    expect(m * s.xbar + c).toBeCloseTo(s.ybar, 12);
  });
});

describe('SSR is a parabola minimised at the least-squares slope', () => {
  it('SSR(m_hat) equals the closed-form minimum', () => {
    const m = lsSlope(PRESET);
    expect(ssrCentroid(PRESET, m)).toBeCloseTo(ssrMin(PRESET), 9);
  });
  it('no other slope gives a smaller SSR', () => {
    const m = lsSlope(PRESET), best = ssrCentroid(PRESET, m);
    for (const dm of [-0.5, -0.2, -0.05, 0.05, 0.2, 0.5]) expect(ssrCentroid(PRESET, m + dm)).toBeGreaterThan(best - 1e-12);
  });
  it('the parabola matches Syy - 2 m Sxy + m^2 Sxx', () => {
    const s = stats(PRESET);
    for (const m of [-1, 0, 0.5, 1.3]) expect(ssrCentroid(PRESET, m)).toBeCloseTo(s.Syy - 2 * m * s.Sxy + m * m * s.Sxx, 9);
  });
});

describe('The centroid line SSR agrees with the general SSR', () => {
  it('ssrCentroid(m) equals ssr(m, ybar - m xbar)', () => {
    const s = stats(PRESET);
    for (const m of [-0.3, 0.7]) expect(ssrCentroid(PRESET, m)).toBeCloseTo(ssr(PRESET, m, s.ybar - m * s.xbar), 9);
  });
  it('the least-squares slope is a stationary point (derivative zero)', () => {
    const m = lsSlope(PRESET), h = 1e-5;
    const d = (ssrCentroid(PRESET, m + h) - ssrCentroid(PRESET, m - h)) / (2 * h);
    expect(d).toBeCloseTo(0, 6);
  });
});
