// Invariants for the determinant-as-area playground: the determinant equals the
// shoelace area of the image parallelogram, the sign tracks orientation, and the
// special matrices give their known determinants.

import { describe, it, expect } from 'vitest';
import { det2, parallelogramArea, angleBetween, PRESETS } from './sim.js';

describe('Determinant equals the signed parallelogram area', () => {
  it('|det| equals the shoelace area of the image of the unit square', () => {
    for (const [a, b, c, d] of [[1, 0, 0, 1], [1.5, 0.3, -0.4, 1.2], [2, 1, 1, 0.5], [1, 0.5, 2, 1]]) {
      expect(Math.abs(det2(a, b, c, d))).toBeCloseTo(parallelogramArea(a, b, c, d), 9);
    }
  });
  it('det = |v1||v2| sin(angle between the columns)', () => {
    const a = 1.5, b = 0.4, c = -0.6, d = 1.1;
    const r1 = Math.hypot(a, b), r2 = Math.hypot(c, d);
    expect(det2(a, b, c, d)).toBeCloseTo(r1 * r2 * Math.sin(angleBetween(a, b, c, d)), 9);
  });
});

describe('Sign and orientation', () => {
  it('positive when v2 is counterclockwise from v1, negative when clockwise', () => {
    expect(det2(1, 0, 0, 1)).toBeGreaterThan(0);     // v2 = +90 deg from v1
    expect(det2(1, 0, 0, -1)).toBeLessThan(0);       // v2 = -90 deg
  });
  it('zero when the columns are linearly dependent', () => {
    expect(det2(1, 0.5, 2, 1)).toBeCloseTo(0, 12);   // v2 = 2 * v1
  });
});

describe('Known determinants of the presets', () => {
  it('rotation and shear have det 1, reflection -1, scaling 2.25, singular 0', () => {
    const D = (p) => det2(p.a, p.b, p.c, p.d);
    expect(D(PRESETS.rotation)).toBeCloseTo(1, 9);
    expect(D(PRESETS.shear)).toBeCloseTo(1, 9);
    expect(D(PRESETS.reflect)).toBeCloseTo(-1, 9);
    expect(D(PRESETS.scale)).toBeCloseTo(2.25, 9);
    expect(D(PRESETS.singular)).toBeCloseTo(0, 9);
  });
});
