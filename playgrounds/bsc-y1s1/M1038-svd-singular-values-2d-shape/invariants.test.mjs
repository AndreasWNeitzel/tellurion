// SVD 2x2 invariants.
// (a) M = U S V^T reconstructs the original matrix to 1e-12.
// (b) s_1 >= s_2 >= 0 (descending order).
// (c) U and V are orthogonal: U^T U = I, V^T V = I, within 1e-12.
// (d) For symmetric M, |s_i| = |eigenvalues of M|.
// (e) For diagonal positive M, s_i are just the diagonal entries (sorted).
// (f) Rotation matrix has s_1 = s_2 = 1.

import { describe, it, expect } from 'vitest';
import { svd2x2 } from './sim.js';

function reconstruct(s) {
  // M = U S V^T
  const a = s.u1.x * s.s1 * s.v1.x + s.u2.x * s.s2 * s.v2.x;
  const b = s.u1.x * s.s1 * s.v1.y + s.u2.x * s.s2 * s.v2.y;
  const c = s.u1.y * s.s1 * s.v1.x + s.u2.y * s.s2 * s.v2.x;
  const d = s.u1.y * s.s1 * s.v1.y + s.u2.y * s.s2 * s.v2.y;
  return { a, b, c, d };
}

function dot(u, v) { return u.x * v.x + u.y * v.y; }

describe('svd-singular-values-2d-shape', () => {
  it('M = U S V^T reconstructs general 2x2 to 1e-12', () => {
    const a = 1.5, b = -0.7, c = 0.4, d = 2.1;
    const s = svd2x2(a, b, c, d);
    const r = reconstruct(s);
    expect(Math.abs(r.a - a)).toBeLessThan(1e-12);
    expect(Math.abs(r.b - b)).toBeLessThan(1e-12);
    expect(Math.abs(r.c - c)).toBeLessThan(1e-12);
    expect(Math.abs(r.d - d)).toBeLessThan(1e-12);
  });

  it('singular values are non-negative and descending', () => {
    const s = svd2x2(1.5, -0.7, 0.4, 2.1);
    expect(s.s1).toBeGreaterThanOrEqual(s.s2);
    expect(s.s2).toBeGreaterThanOrEqual(0);
  });

  it('U columns are orthonormal', () => {
    const s = svd2x2(1.5, -0.7, 0.4, 2.1);
    expect(Math.abs(dot(s.u1, s.u1) - 1)).toBeLessThan(1e-12);
    expect(Math.abs(dot(s.u2, s.u2) - 1)).toBeLessThan(1e-12);
    expect(Math.abs(dot(s.u1, s.u2))).toBeLessThan(1e-12);
  });

  it('V columns are orthonormal', () => {
    const s = svd2x2(1.5, -0.7, 0.4, 2.1);
    expect(Math.abs(dot(s.v1, s.v1) - 1)).toBeLessThan(1e-12);
    expect(Math.abs(dot(s.v2, s.v2) - 1)).toBeLessThan(1e-12);
    expect(Math.abs(dot(s.v1, s.v2))).toBeLessThan(1e-12);
  });

  it('diagonal positive matrix has s_i equal to diagonal entries (sorted)', () => {
    const s = svd2x2(3, 0, 0, 5);
    expect(s.s1).toBeCloseTo(5, 12);
    expect(s.s2).toBeCloseTo(3, 12);
  });

  it('rotation matrix has s_1 = s_2 = 1', () => {
    const c = Math.cos(0.5);
    const sn = Math.sin(0.5);
    const s = svd2x2(c, -sn, sn, c);
    expect(s.s1).toBeCloseTo(1, 12);
    expect(s.s2).toBeCloseTo(1, 12);
  });

  it('det of U is +1 (rotation, not reflection)', () => {
    const s = svd2x2(2, 1, 1, 3);
    const det_U = s.u1.x * s.u2.y - s.u1.y * s.u2.x;
    expect(Math.abs(det_U - 1)).toBeLessThan(1e-12);
  });

  it('Frobenius norm = sqrt(s1^2 + s2^2)', () => {
    const a = 1.5, b = -0.7, c = 0.4, d = 2.1;
    const s = svd2x2(a, b, c, d);
    const fro = Math.sqrt(a * a + b * b + c * c + d * d);
    const svd_fro = Math.sqrt(s.s1 * s.s1 + s.s2 * s.s2);
    expect(Math.abs(fro - svd_fro)).toBeLessThan(1e-12);
  });
});
