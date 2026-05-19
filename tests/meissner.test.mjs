// Shared-engine tests for shared/js/engine/meissner-cpu.js (built
// before the superconductor-meissner-3d hero). The image cancellation
// of the normal field at the surface, the divergence-free field, the
// exponential London decay and the levitation force balance prove the
// electromagnetism is real, not a scripted lift.

import { describe, it, expect } from 'vitest';
import {
  lambdaL, criticalField, isSuperconducting, dipoleField, fieldAt,
  divergence, levitationForce, levitationHeight, penetrationProfile,
} from '../shared/js/engine/meissner-cpu.js';

describe('London depth and critical field', () => {
  it('lambda diverges as T -> Tc and is finite below', () => {
    expect(lambdaL(0, 1, 1)).toBeCloseTo(1, 12);
    expect(lambdaL(0.5, 1, 1)).toBeGreaterThan(1);
    expect(lambdaL(0.99, 1, 1)).toBeGreaterThan(5);
    expect(lambdaL(1.2, 1, 1)).toBe(Infinity);          // normal state
  });
  it('critical field falls to zero at Tc (parabolic)', () => {
    expect(criticalField(0, 1, 2)).toBeCloseTo(2, 12);
    expect(criticalField(1, 1, 2)).toBeCloseTo(0, 12);
    expect(criticalField(0.5, 1, 2)).toBeCloseTo(2 * 0.75, 9);
    expect(isSuperconducting(0.3, 1, 0.2, 1)).toBe(true);
    expect(isSuperconducting(0.3, 1, 5, 1)).toBe(false);  // over-field quench
    expect(isSuperconducting(1.1, 1, 0, 1)).toBe(false);  // over Tc
  });
});

describe('dipole and image field', () => {
  it('a pure dipole field is divergence-free in free space', () => {
    // normal state, no image: still div B = 0 away from the source
    const d = divergence([1.3, 0.7, 2.1], 3, 1, false, 1);
    expect(Math.abs(d)).toBeLessThan(1e-4);
  });

  it('superconducting: the normal (z) field vanishes at the surface', () => {
    const h = 3, m = 1;
    for (const [x, y] of [[0.4, 0], [1.2, 0.6], [0, 1.5]]) {
      const Bz = fieldAt([x, y, 1e-5], h, m, true, 1)[2];
      expect(Math.abs(Bz)).toBeLessThan(1e-2);          // expelled at surface
    }
    // and a normal sample does NOT expel it
    const BzN = fieldAt([0.4, 0, 1e-5], h, m, false, 1)[2];
    expect(Math.abs(BzN)).toBeGreaterThan(1e-2);
  });

  it('the total external field stays divergence-free with the image', () => {
    const d = divergence([0.9, 0.3, 1.7], 3, 1, true, 1);
    expect(Math.abs(d)).toBeLessThan(1e-4);
  });
});

describe('London penetration into the bulk', () => {
  it('field decays exponentially with the set lambda to 1 percent', () => {
    const lam = 0.8;
    const B0 = Math.hypot(...fieldAt([0.2, 0, -1e-6], 3, 1, true, lam));
    for (const d of [0.5, 1.0, 2.0]) {
      const B = Math.hypot(...fieldAt([0.2, 0, -d], 3, 1, true, lam));
      const ratio = B / B0;
      expect(Math.abs(ratio - Math.exp(-d / lam)) / Math.exp(-d / lam)).toBeLessThan(0.01);
    }
    expect(penetrationProfile(0, lam)).toBeCloseTo(1, 12);
    expect(penetrationProfile(5 * lam, lam)).toBeLessThan(0.01);  // bulk ~ 0
  });
});

describe('levitation force balance', () => {
  it('repulsion ~ 1/h^4 and the equilibrium height balances weight', () => {
    expect(levitationForce(2, 1) / levitationForce(4, 1)).toBeCloseTo(16, 6);
    const W = 0.05, m = 2;
    const h = levitationHeight(m, W);
    expect(levitationForce(h, m)).toBeCloseTo(W, 9);
    // stronger magnet floats higher
    expect(levitationHeight(3, W)).toBeGreaterThan(levitationHeight(2, W));
  });

  it('deterministic: pure functions reproduce outputs', () => {
    expect(fieldAt([1, 0.5, 2], 3, 1, true, 1)[2]).toBe(fieldAt([1, 0.5, 2], 3, 1, true, 1)[2]);
    expect(levitationHeight(2, 0.1)).toBe(levitationHeight(2, 0.1));
  });
});
