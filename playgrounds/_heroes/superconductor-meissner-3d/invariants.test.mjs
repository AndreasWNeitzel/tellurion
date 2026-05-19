// superconductor-meissner-3d invariants. The vanishing normal field
// at the cold surface, the divergence-free total field, the
// exponential London decay and the levitation balance prove the
// shared engine (via ./sim.js) is real electromagnetism.

import { describe, it, expect } from 'vitest';
import {
  lambdaL, criticalField, isSuperconducting, fieldAt, divergence,
  levitationForce, levitationHeight, penetrationProfile,
} from './sim.js';

describe('superconductor-meissner-3d', () => {
  it('lambda diverges at Tc; Hc is parabolic; quench logic', () => {
    expect(lambdaL(0, 1, 1)).toBeCloseTo(1, 12);
    expect(lambdaL(1.1, 1, 1)).toBe(Infinity);
    expect(criticalField(0, 1, 2)).toBeCloseTo(2, 12);
    expect(criticalField(1, 1, 2)).toBeCloseTo(0, 12);
    expect(isSuperconducting(0.3, 1, 0.2, 1)).toBe(true);
    expect(isSuperconducting(0.3, 1, 9, 1)).toBe(false);
  });

  it('Meissner: normal field vanishes at the surface; a normal sample does not expel', () => {
    for (const [x, y] of [[0.4, 0], [1.1, 0.5]]) {
      expect(Math.abs(fieldAt([x, y, 1e-5], 3, 1, true, 1)[2])).toBeLessThan(1e-2);
    }
    expect(Math.abs(fieldAt([0.4, 0, 1e-5], 3, 1, false, 1)[2])).toBeGreaterThan(1e-2);
  });

  it('the total external field is divergence-free to 1e-4 (with and without image)', () => {
    expect(Math.abs(divergence([0.9, 0.3, 1.7], 3, 1, true, 1))).toBeLessThan(1e-4);
    expect(Math.abs(divergence([1.3, 0.7, 2.1], 3, 1, false, 1))).toBeLessThan(1e-4);
  });

  it('London decay matches the set lambda to 1 percent; bulk ~ 0', () => {
    const lam = 0.8;
    const B0 = Math.hypot(...fieldAt([0.2, 0, -1e-6], 3, 1, true, lam));
    for (const d of [0.5, 1, 2]) {
      const B = Math.hypot(...fieldAt([0.2, 0, -d], 3, 1, true, lam));
      expect(Math.abs(B / B0 - Math.exp(-d / lam)) / Math.exp(-d / lam)).toBeLessThan(0.01);
    }
    expect(penetrationProfile(5 * lam, lam)).toBeLessThan(0.01);
  });

  it('levitation: 1/h^4 repulsion balances weight at the equilibrium height', () => {
    expect(levitationForce(2, 1) / levitationForce(4, 1)).toBeCloseTo(16, 6);
    const W = 0.05, m = 2, h = levitationHeight(m, W);
    expect(levitationForce(h, m)).toBeCloseTo(W, 9);
    expect(levitationHeight(3, W)).toBeGreaterThan(levitationHeight(2, W));
  });

  it('deterministic: pure functions reproduce outputs', () => {
    expect(fieldAt([1, 0.5, 2], 3, 1, true, 1)[2]).toBe(fieldAt([1, 0.5, 2], 3, 1, true, 1)[2]);
  });
});
