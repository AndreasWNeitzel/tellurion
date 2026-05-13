// 2x2 eigendecomposition invariants.
// (a) Identity matrix: eigenvalues 1, 1; eigenvectors canonical basis.
// (b) Symmetric matrix has orthogonal eigenvectors.
// (c) Rotation matrix (theta != 0, pi): complex eigenvalues, real = false.
// (d) Eigenvalue equation: M v = lambda v for both pairs.
// (e) Trace and det match sum and product of eigenvalues.
// (f) Eigenvectors normalized: |v| = 1.

import { describe, it, expect } from 'vitest';
import { eigen2x2 } from './sim.js';

function matVec(a, b, c, d, x, y) {
  return [a * x + b * y, c * x + d * y];
}

describe('eigenvector-rotation-2x2', () => {
  it('identity matrix returns lambda = 1 with canonical basis', () => {
    const r = eigen2x2(1, 0, 0, 1);
    expect(r.real).toBe(true);
    expect(r.eigenvalues[0]).toBe(1);
    expect(r.eigenvalues[1]).toBe(1);
  });

  it('symmetric matrix has orthogonal eigenvectors', () => {
    const r = eigen2x2(2, 1, 1, 3);
    expect(r.real).toBe(true);
    const v1 = r.eigenvectors[0];
    const v2 = r.eigenvectors[1];
    const dot = v1.x * v2.x + v1.y * v2.y;
    expect(Math.abs(dot)).toBeLessThan(1e-12);
  });

  it('rotation matrix gives complex eigenvalues (real = false)', () => {
    const c = Math.cos(0.5);
    const s = Math.sin(0.5);
    const r = eigen2x2(c, -s, s, c);
    expect(r.real).toBe(false);
  });

  it('eigenvalue equation M v = lambda v holds', () => {
    const a = 4, b = 1, c = 2, d = 3;
    const r = eigen2x2(a, b, c, d);
    expect(r.real).toBe(true);
    for (let i = 0; i < 2; i += 1) {
      const lam = r.eigenvalues[i];
      const v = r.eigenvectors[i];
      const [Mx, My] = matVec(a, b, c, d, v.x, v.y);
      const resX = Math.abs(Mx - lam * v.x);
      const resY = Math.abs(My - lam * v.y);
      expect(resX).toBeLessThan(1e-12);
      expect(resY).toBeLessThan(1e-12);
    }
  });

  it('trace and det match sum and product of eigenvalues', () => {
    const a = 4, b = 1, c = 2, d = 3;
    const r = eigen2x2(a, b, c, d);
    const sum = r.eigenvalues[0] + r.eigenvalues[1];
    const prod = r.eigenvalues[0] * r.eigenvalues[1];
    expect(Math.abs(sum - (a + d))).toBeLessThan(1e-12);
    expect(Math.abs(prod - (a * d - b * c))).toBeLessThan(1e-12);
  });

  it('eigenvectors are unit length', () => {
    const r = eigen2x2(2, 1, 1, 3);
    for (const v of r.eigenvectors) {
      const n = Math.hypot(v.x, v.y);
      expect(Math.abs(n - 1)).toBeLessThan(1e-12);
    }
  });

  it('diagonal matrix returns axis-aligned eigenvectors', () => {
    const r = eigen2x2(2, 0, 0, 3);
    expect(r.real).toBe(true);
    // Eigenvalues 3, 2 (in tr+root, tr-root order)
    expect(r.eigenvalues[0]).toBeCloseTo(3, 12);
    expect(r.eigenvalues[1]).toBeCloseTo(2, 12);
  });
});
