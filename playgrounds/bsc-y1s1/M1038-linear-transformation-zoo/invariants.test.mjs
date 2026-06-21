// Invariants for the 2x2 linear map: determinant as signed area, the singular
// values as the unit-circle ellipse axes, eigenvectors as invariant directions,
// trace and determinant as the eigenvalue sum and product.

import { describe, it, expect } from 'vitest';
import { apply, determinant, trace, eigen, singularValues, stretch, PRESETS } from './sim.js';

describe('Determinant is the signed area of the image of the unit square', () => {
  it('equals the cross product of the two columns', () => {
    const M = PRESETS.shear.M;
    const area = M.a * M.d - M.c * M.b; // col1 x col2
    expect(determinant(M)).toBeCloseTo(area, 12);
  });
  it('is zero for a projection (the square collapses to a segment)', () => {
    expect(determinant(PRESETS.projection.M)).toBeCloseTo(0, 12);
  });
  it('is negative for a reflection (orientation flips)', () => {
    expect(determinant(PRESETS.reflection.M)).toBeLessThan(0);
  });
});

describe('Singular values are the semi-axes of the image ellipse', () => {
  it('their product equals the absolute determinant (ellipse area / pi)', () => {
    for (const k of Object.keys(PRESETS)) {
      const [s1, s2] = singularValues(PRESETS[k].M);
      expect(s1 * s2).toBeCloseTo(Math.abs(determinant(PRESETS[k].M)), 9);
    }
  });
  it('bound the stretch in every direction (max = sigma1, min = sigma2)', () => {
    const M = PRESETS.rotscale.M; const [s1, s2] = singularValues(M);
    let mx = 0, mn = Infinity;
    for (let i = 0; i < 720; i += 1) { const r = stretch(M, 2 * Math.PI * i / 720); mx = Math.max(mx, r); mn = Math.min(mn, r); }
    expect(mx).toBeCloseTo(s1, 3);
    expect(mn).toBeCloseTo(s2, 3);
  });
});

describe('Real eigenvectors are invariant directions', () => {
  it('M v = lambda v for each eigenpair', () => {
    const M = PRESETS.scale.M; const e = eigen(M);
    expect(e.real).toBe(true);
    e.vectors.forEach((v, i) => {
      const Mv = apply(M, v[0], v[1]); const l = e.values[i];
      expect(Mv[0]).toBeCloseTo(l * v[0], 9);
      expect(Mv[1]).toBeCloseTo(l * v[1], 9);
    });
  });
  it('a pure rotation has no real eigenvectors', () => {
    expect(eigen(PRESETS.rotation.M).real).toBe(false);
  });
});

describe('Trace and determinant are the eigenvalue sum and product', () => {
  it('hold for a map with real eigenvalues', () => {
    const M = PRESETS.shear.M; const e = eigen(M);
    expect(e.values[0] + e.values[1]).toBeCloseTo(trace(M), 9);
    expect(e.values[0] * e.values[1]).toBeCloseTo(determinant(M), 9);
  });
});
