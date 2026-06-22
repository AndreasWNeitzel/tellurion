// Invariants for Stern-Gerlach: the beam splits into 2s+1 symmetric discrete
// spots inside the wider classical band, and the quantum landings cluster on those
// spots with a balanced, zero-mean distribution.

import { describe, it, expect } from 'vitest';
import { spots, spotCount, classicalHalfWidth, makeRng, sampleQuantum } from './sim.js';

describe('The beam splits into 2s+1 discrete spots', () => {
  it('count matches 2s+1 for half-integer and integer spin', () => {
    expect(spotCount(0.5)).toBe(2); expect(spotCount(1)).toBe(3); expect(spotCount(1.5)).toBe(4); expect(spotCount(2)).toBe(5);
  });
  it('spots are symmetric about zero with the outermost at +/- d', () => {
    for (const s of [0.5, 1, 1.5]) {
      const sp = spots(s, 2).map((q) => q.y);
      expect(Math.min(...sp)).toBeCloseTo(-2, 9); expect(Math.max(...sp)).toBeCloseTo(2, 9);
      expect(sp.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 9);
    }
  });
  it('spin-1/2 gives exactly two spots at +/- d', () => {
    const sp = spots(0.5, 1.5).map((q) => q.y).sort((a, b) => a - b);
    expect(sp).toHaveLength(2); expect(sp[0]).toBeCloseTo(-1.5, 9); expect(sp[1]).toBeCloseTo(1.5, 9);
  });
});

describe('The quantum spots lie inside the wider classical band', () => {
  it('classical half-width exceeds the outermost spot', () => {
    for (const s of [0.5, 1, 1.5]) expect(classicalHalfWidth(s, 1)).toBeGreaterThan(1);
  });
  it('half-width equals d sqrt(s(s+1))/s', () => {
    expect(classicalHalfWidth(0.5, 1)).toBeCloseTo(Math.sqrt(0.75) / 0.5, 9);
    expect(classicalHalfWidth(1, 1)).toBeCloseTo(Math.sqrt(2), 9);
  });
});

describe('Quantum sampling clusters on the spots with zero mean', () => {
  it('every landing sits near one of the 2s+1 spots and the mean is ~0', () => {
    const s = 0.5, d = 2, spread = 0.05; const rng = makeRng(0xC0FFEE); const sp = spots(s, d).map((q) => q.y);
    let sum = 0, n = 4000; let up = 0;
    for (let i = 0; i < n; i += 1) { const r = sampleQuantum(s, d, spread, rng); sum += r.y; if (r.y > 0) up += 1; const near = sp.some((y) => Math.abs(r.y - y) < 6 * spread); expect(near).toBe(true); }
    expect(sum / n).toBeCloseTo(0, 1);
    expect(up / n).toBeGreaterThan(0.4); expect(up / n).toBeLessThan(0.6); // balanced up/down
  });
});
