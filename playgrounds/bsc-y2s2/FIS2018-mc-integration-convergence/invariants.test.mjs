// Monte Carlo hit-or-miss invariants.
// (a) Each shape's estimate converges to its exact area.
// (b) The standard error scales as 1/sqrt(N).
// (c) The estimate is statistically consistent with the truth.
// (d) The running tallies are self-consistent.

import { describe, it, expect } from 'vitest';
import { SHAPES, shapeByKey, makeEstimator, throwDarts, areaEstimate } from './sim.js';

describe('MC: hit-or-miss converges to each shape area', () => {
  for (const s of SHAPES) {
    it(`${s.key}: estimate within 0.01 of the exact area at N = 4e5`, () => {
      const est = makeEstimator(0xC0FFEE);
      throwDarts(est, s, 400_000);
      const e = areaEstimate(est);
      expect(Math.abs(e.area - s.area)).toBeLessThan(0.01);
    }, 30_000);
  }
});

describe('MC: standard error scales as 1/sqrt(N)', () => {
  it('SE ratio between N and 100N is in [7, 13]', () => {
    const shape = shapeByKey('quarter-disk');
    const e1 = makeEstimator(1); throwDarts(e1, shape, 1_000);
    const e2 = makeEstimator(2); throwDarts(e2, shape, 100_000);
    const ratio = areaEstimate(e1).se / areaEstimate(e2).se;
    expect(ratio).toBeGreaterThan(7);
    expect(ratio).toBeLessThan(13);
  }, 30_000);
});

describe('MC: estimate is statistically consistent', () => {
  it('every shape lands within 4 sigma of its exact area at N = 5e4', () => {
    for (const s of SHAPES) {
      const est = makeEstimator(0xBEEF);
      throwDarts(est, s, 50_000);
      const e = areaEstimate(est);
      expect(Math.abs(e.area - s.area)).toBeLessThan(4 * e.se);
    }
  }, 30_000);
});

describe('MC: running tallies are self-consistent', () => {
  it('throwDarts advances nTotal by n and the hit count matches', () => {
    const est = makeEstimator(7);
    const darts = throwDarts(est, SHAPES[0], 5_000);
    expect(darts.length).toBe(5_000);
    expect(est.nTotal).toBe(5_000);
    expect(est.nHit).toBeLessThanOrEqual(est.nTotal);
    expect(darts.filter((d) => d.hit).length).toBe(est.nHit);
  });
});
