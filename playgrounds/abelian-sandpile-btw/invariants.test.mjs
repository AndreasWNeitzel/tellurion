// BTW sandpile invariants.
// (a) Heights in [0, 3] at steady state.
// (b) Topple count non-negative.
// (c) Heavy-tailed avalanche distribution.
// (d) Histogram populated.
// (e) L exported.

import { describe, it, expect } from 'vitest';
import { createBTW, stepBTW, avalanchePLBins, L } from './sim.js';

describe('BTW: heights in [0, 3] at steady state', () => {
  it('after 5000 drops, all heights < 4', () => {
    const s = createBTW({ L_size: 16, seed: 0xC0FFEE });
    for (let i = 0; i < 5000; i += 1) stepBTW(s);
    for (let i = 0; i < s.grid.length; i += 1) {
      expect(s.grid[i]).toBeGreaterThanOrEqual(0);
      expect(s.grid[i]).toBeLessThan(4);
    }
  }, 30_000);
});

describe('BTW: topple count non-negative', () => {
  it('every drop returns a non-negative topple count', () => {
    const s = createBTW({ L_size: 16, seed: 1 });
    for (let i = 0; i < 2000; i += 1) {
      const t = stepBTW(s);
      expect(t).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('BTW: avalanche distribution heavy-tailed', () => {
  it('max avalanche after 10k drops > 10', () => {
    const s = createBTW({ L_size: 16, seed: 0xABCDEF });
    for (let i = 0; i < 10_000; i += 1) stepBTW(s);
    const maxAv = Math.max(...s.avalanches);
    expect(maxAv).toBeGreaterThan(10);
  }, 30_000);
});

describe('BTW: avalanche histogram populated', () => {
  it('avalanchePLBins yields non-zero counts', () => {
    const s = createBTW({ L_size: 16, seed: 7 });
    for (let i = 0; i < 5000; i += 1) stepBTW(s);
    const { bins, counts } = avalanchePLBins(s, 10);
    expect(bins.length).toBe(10);
    let nonzero = 0;
    for (const c of counts) if (c > 0) nonzero += 1;
    expect(nonzero).toBeGreaterThan(0);
  }, 30_000);
});

describe('BTW: L exported = 32', () => {
  it('default lattice size constant', () => {
    expect(L).toBe(32);
  });
});
