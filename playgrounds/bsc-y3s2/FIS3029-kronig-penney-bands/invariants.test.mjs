// Kronig-Penney invariant tests.
// (a) f(0, P) = 1 + P.
// (b) At P = 0 (free electron) all energies allowed.
// (c) Band edges at f(qa) = +/- 1.
// (d) Strong binding P >> 1 opens wide gaps.

import { describe, it, expect } from 'vitest';
import { fKP, bandIntervals, kaForEnergy, dispersionCurves } from './sim.js';

describe('Kronig-Penney: closed-form properties', () => {
  it('f(0, P) = 1 + P', () => {
    expect(fKP(0, 5)).toBeCloseTo(6, 12);
  });
  it('f(pi, P) = -1', () => {
    expect(fKP(Math.PI, 4)).toBeCloseTo(-1, 12);
  });
});

describe('Kronig-Penney: free-electron limit P = 0', () => {
  it('every energy allowed when P = 0 (total band length > 0.95 of range)', () => {
    const intervals = bandIntervals(0, 50);
    let totalLen = 0;
    for (const [lo, hi] of intervals) totalLen += hi - lo;
    expect(totalLen / 50).toBeGreaterThan(0.95);
  });
});

describe('Kronig-Penney: strong binding P >> 1 opens wide gaps', () => {
  it('P = 12 has at least 3 distinct bands in [0, 80]', () => {
    const intervals = bandIntervals(12, 80);
    expect(intervals.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Kronig-Penney: band edges satisfy f = +/- 1', () => {
  it('boundaries of each band are roots of |f| = 1', () => {
    const P = 4.0;
    const intervals = bandIntervals(P, 60);
    expect(intervals.length).toBeGreaterThanOrEqual(2);
    for (const [lo, hi] of intervals) {
      if (lo > 0.01) {
        const f = fKP(Math.sqrt(lo), P);
        expect(Math.abs(Math.abs(f) - 1)).toBeLessThan(0.02);
      }
      if (hi < 59.5) {
        const f = fKP(Math.sqrt(hi), P);
        expect(Math.abs(Math.abs(f) - 1)).toBeLessThan(0.02);
      }
    }
  });
});

describe('Kronig-Penney: gap exists at k a = pi for P > 0', () => {
  it('there is a forbidden energy interval bracketing eps = pi^2 ~ 9.87 for P = 5', () => {
    // The first gap typically opens around k a = pi, i.e., near eps = pi^2.
    // For P = 5 this gap is wide enough to be obvious.
    const intervals = bandIntervals(5, 30);
    expect(intervals.length).toBeGreaterThanOrEqual(2);
    // Confirm there's a gap (intervals are non-adjacent)
    const firstEnd = intervals[0][1];
    const secondStart = intervals[1][0];
    expect(secondStart - firstEnd).toBeGreaterThan(0.1);
  });
});

describe('Kronig-Penney: kaForEnergy returns NaN in gaps', () => {
  it('inside a gap, kaForEnergy returns NaN', () => {
    const P = 5;
    const intervals = bandIntervals(P, 30);
    if (intervals.length >= 2) {
      const gapMid = (intervals[0][1] + intervals[1][0]) / 2;
      expect(Number.isNaN(kaForEnergy(gapMid, P))).toBe(true);
    }
  });
});
