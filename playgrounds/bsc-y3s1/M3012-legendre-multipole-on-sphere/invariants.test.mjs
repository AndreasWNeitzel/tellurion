// Invariants for Legendre multipoles: the low polynomials match closed forms,
// endpoint and parity values, the count and location of nodal cones, and
// orthogonality.

import { describe, it, expect } from 'vitest';
import { legendreP, legendreRoots, angular, nodalAngles, inner } from './sim.js';

describe('Legendre polynomials match the closed forms', () => {
  it('P_0..P_3', () => {
    for (const x of [-0.7, 0.2, 0.9]) {
      expect(legendreP(0, x)).toBeCloseTo(1, 12);
      expect(legendreP(1, x)).toBeCloseTo(x, 12);
      expect(legendreP(2, x)).toBeCloseTo((3 * x * x - 1) / 2, 12);
      expect(legendreP(3, x)).toBeCloseTo((5 * x * x * x - 3 * x) / 2, 12);
    }
  });
  it('P_l(1) = 1 and P_l(-1) = (-1)^l', () => {
    for (let l = 0; l <= 5; l += 1) { expect(legendreP(l, 1)).toBeCloseTo(1, 9); expect(legendreP(l, -1)).toBeCloseTo((-1) ** l, 9); }
  });
  it('parity: P_l(-x) = (-1)^l P_l(x)', () => {
    for (let l = 0; l <= 5; l += 1) expect(legendreP(l, -0.6)).toBeCloseTo((-1) ** l * legendreP(l, 0.6), 9);
  });
});

describe('Nodal cones', () => {
  it('P_l has l roots in (-1,1)', () => {
    for (let l = 0; l <= 5; l += 1) expect(legendreRoots(l).length).toBe(l);
  });
  it('known roots: P_1 at 0, P_2 at +/- 1/sqrt(3)', () => {
    expect(legendreRoots(1)[0]).toBeCloseTo(0, 6);
    const r2 = legendreRoots(2);
    expect(Math.abs(r2[0])).toBeCloseTo(1 / Math.sqrt(3), 5); expect(Math.abs(r2[1])).toBeCloseTo(1 / Math.sqrt(3), 5);
  });
  it('the dipole has one nodal cone at theta = 90 degrees', () => {
    const a = nodalAngles(1); expect(a).toHaveLength(1); expect(a[0]).toBeCloseTo(Math.PI / 2, 5);
  });
  it('the angular function vanishes at the nodal cones', () => {
    for (const th of nodalAngles(3)) expect(angular(3, th)).toBeCloseTo(0, 5);
  });
});

describe('Orthogonality', () => {
  it('integral P_l P_m = 0 for l != m, 2/(2l+1) for l = m', () => {
    expect(inner(2, 3)).toBeCloseTo(0, 3);
    expect(inner(1, 3)).toBeCloseTo(0, 3);
    expect(inner(2, 2)).toBeCloseTo(2 / 5, 3);
    expect(inner(0, 0)).toBeCloseTo(2, 3);
  });
});
