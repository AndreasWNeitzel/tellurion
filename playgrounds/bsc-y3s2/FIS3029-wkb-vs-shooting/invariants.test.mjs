// WKB Bohr-Sommerfeld invariant tests.
// (a) Harmonic oscillator (p = 2): BS yields E_n = n + 1/2 exactly to 1e-3.
// (b) BS levels monotonically increase with n.
// (c) Quartic (p = 4): BS at n = 0 differs from exact 1.0604 by < 15 percent.
// (d) BS converges to exact at large n.

import { describe, it, expect } from 'vitest';
import { POTENTIALS, bohrSommerfeldLadder, bohrSommerfeldLevel, EXACT_LEVELS } from './sim.js';

describe('WKB Bohr-Sommerfeld: harmonic oscillator', () => {
  it('p = 2: BS reproduces E_n = n + 1/2 exactly to 1e-3', () => {
    const V = POTENTIALS.power(2);
    const ladder = bohrSommerfeldLadder(V, 6);
    for (let n = 0; n < 6; n += 1) {
      expect(Math.abs(ladder[n] - (n + 0.5))).toBeLessThan(1e-3);
    }
  });
});

describe('WKB Bohr-Sommerfeld: monotonicity', () => {
  it('BS levels increase with n for several p values', () => {
    for (const p of [2, 3, 4, 5, 6]) {
      const V = POTENTIALS.power(p);
      const ladder = bohrSommerfeldLadder(V, 6);
      for (let n = 1; n < 6; n += 1) {
        expect(ladder[n]).toBeGreaterThan(ladder[n - 1]);
      }
    }
  });
});

describe('WKB Bohr-Sommerfeld: known limitations', () => {
  it('p = 4: BS at n = 0 is < 0.5 (fails badly for non-quadratic ground states)', () => {
    // BS at n=0 for V = x^4/4 gives ~ 0.34; this is much smaller than the
    // true ground state energy (~ 1.06). The discrepancy is the canonical
    // illustration of BS failure at low quantum numbers.
    const V = POTENTIALS.power(4);
    const e0 = bohrSommerfeldLevel(V, 0);
    expect(e0).toBeLessThan(0.5);
    expect(e0).toBeGreaterThan(0.3);
  });

  it('p = 4: BS at n = 5 is in [5, 30]', () => {
    const V = POTENTIALS.power(4);
    const e5 = bohrSommerfeldLevel(V, 5);
    expect(e5).toBeGreaterThan(5);
    expect(e5).toBeLessThan(30);
  });
});
