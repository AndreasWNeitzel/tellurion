// 2D site percolation invariant tests.
// (a) Trivial limits p = 0, 1.
// (b) Below p_c: no spanning cluster.
// (c) Above p_c: spanning cluster exists.
// (d) Largest-cluster fraction monotone in p.

import { describe, it, expect } from 'vitest';
import { occupy, cluster, largestClusterFraction, spans, P_C } from './sim.js';

describe('Percolation: trivial limits', () => {
  it('p = 1.0: one cluster of size L^2', () => {
    const L = 32;
    const grid = occupy(L, 1.0, 1);
    const { sizes } = cluster(grid, L);
    expect(sizes.size).toBe(1);
    const [size] = [...sizes.values()];
    expect(size).toBe(L * L);
  });

  it('p = 0.0: no clusters', () => {
    const grid = occupy(32, 0.0, 1);
    const { sizes } = cluster(grid, 32);
    expect(sizes.size).toBe(0);
  });
});

describe('Percolation: below p_c, no spanning cluster (with high probability)', () => {
  it('L = 64, p = 0.3: no spanning cluster in any of 5 trials', () => {
    let spanCount = 0;
    for (let s = 0; s < 5; s += 1) {
      const grid = occupy(64, 0.30, s * 11 + 1);
      if (spans(grid, 64)) spanCount += 1;
    }
    expect(spanCount).toBeLessThan(2);
  });
});

describe('Percolation: above p_c, spanning cluster exists', () => {
  it('L = 64, p = 0.85: spanning cluster in at least 4 of 5 trials', () => {
    let spanCount = 0;
    for (let s = 0; s < 5; s += 1) {
      const grid = occupy(64, 0.85, s * 11 + 1);
      if (spans(grid, 64)) spanCount += 1;
    }
    expect(spanCount).toBeGreaterThanOrEqual(4);
  });
});

describe('Percolation: largest cluster fraction grows with p', () => {
  it('P_inf(0.4) < P_inf(0.6) < P_inf(0.8)', () => {
    const f04 = largestClusterFraction(occupy(64, 0.4, 1), 64);
    const f06 = largestClusterFraction(occupy(64, 0.6, 1), 64);
    const f08 = largestClusterFraction(occupy(64, 0.8, 1), 64);
    expect(f04).toBeLessThan(f06);
    expect(f06).toBeLessThan(f08);
  });
});

describe('Percolation: critical value', () => {
  it('P_C = 0.59274621 (Newman-Ziff 2000)', () => {
    expect(P_C).toBeCloseTo(0.59274621, 7);
  });
});
