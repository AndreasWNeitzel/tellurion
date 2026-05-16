import { describe, it, expect } from 'vitest';
import {
  counts, approxSeconds, SCALES,
  shuffledArray, recordSort, comparisonCount, SORT_KINDS,
} from './sim.js';

describe('big-o-empirical: complexity counts', () => {
  it('counts at N = 1000 are 1000, ~10000, 10^6, 10^9', () => {
    const c = counts(1000);
    expect(c.linear).toBe(1000);
    expect(c.nlogn).toBeCloseTo(1000 * Math.log2(1000), 6);
    expect(c.quadratic).toBe(1e6);
    expect(c.cubic).toBe(1e9);
  });

  it('approxSeconds scales linearly with operation count', () => {
    expect(approxSeconds(1e6)).toBeCloseTo(approxSeconds(5e5) * 2, 12);
  });

  it('quadratic and cubic blow up faster than linear', () => {
    const N = 1e4;
    const c = counts(N);
    expect(c.quadratic).toBeGreaterThan(c.nlogn);
    expect(c.cubic).toBeGreaterThan(c.quadratic);
  });

  it('SCALES has four entries', () => {
    expect(SCALES.length).toBe(4);
  });
});

describe('big-o-empirical: instrumented sorts', () => {
  it('shuffledArray is a permutation of 1..n and seed-reproducible', () => {
    const a = Array.from(shuffledArray(64, 12345));
    const b = Array.from(shuffledArray(64, 12345));
    expect(a).toEqual(b);                                  // deterministic
    expect(a.slice().sort((x, y) => x - y)).toEqual(
      Array.from({ length: 64 }, (_, i) => i + 1));
  });

  it('every sort kind produces a correctly sorted permutation', () => {
    for (const kind of SORT_KINDS) {
      const arr = shuffledArray(80, 999);
      const { sorted } = recordSort(kind, arr);
      const expected = Array.from(arr).sort((x, y) => x - y);
      expect(sorted).toEqual(expected);
    }
  });

  it('events replay to the same sorted array', () => {
    const arr = shuffledArray(50, 7);
    for (const kind of SORT_KINDS) {
      const { events, sorted } = recordSort(kind, arr);
      const work = Array.from(arr);
      for (const e of events) {
        if (e[0] === 1) { const t = work[e[1]]; work[e[1]] = work[e[2]]; work[e[2]] = t; }
        else if (e[0] === 2) { work[e[1]] = e[2]; }
      }
      expect(work).toEqual(sorted);
    }
  });

  it('merge comparisons stay within the N log2 N envelope; bubble does not', () => {
    const n = 256;
    const m = comparisonCount('merge', n, 42);
    const q = comparisonCount('bubble', n, 42);
    expect(m).toBeLessThanOrEqual(n * Math.ceil(Math.log2(n)));   // merge upper bound
    expect(m).toBeGreaterThan(0);
    expect(q).toBeGreaterThan(4 * m);                              // quadratic gap
  });

  it('the O(N^2)/O(N log N) ratio grows with N', () => {
    const small = comparisonCount('bubble', 32, 1) / comparisonCount('merge', 32, 1);
    const large = comparisonCount('bubble', 256, 1) / comparisonCount('merge', 256, 1);
    expect(large).toBeGreaterThan(small * 3);
  });
});
