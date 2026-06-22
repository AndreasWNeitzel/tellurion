// Invariants for change of basis: coordinates reconstruct the vector, the standard
// basis returns the vector itself, the transform is linear, P^{-1}P = I, and the
// similarity transform preserves trace and determinant.

import { describe, it, expect } from 'vitest';
import { det2, coordsInBasis, reconstruct, matrixP, inverseP, similarity } from './sim.js';

const b1 = [1.3, 0.4], b2 = [-0.3, 1.1], v = [1.6, 1.2];

describe('Coordinates reconstruct the same vector', () => {
  it('c1 b1 + c2 b2 = v', () => {
    const c = coordsInBasis(b1, b2, v); const r = reconstruct(b1, b2, c);
    expect(r[0]).toBeCloseTo(v[0], 12); expect(r[1]).toBeCloseTo(v[1], 12);
  });
  it('the standard basis returns the vector itself', () => {
    const c = coordsInBasis([1, 0], [0, 1], v);
    expect(c[0]).toBeCloseTo(v[0], 12); expect(c[1]).toBeCloseTo(v[1], 12);
  });
});

describe('Change of coordinates is linear', () => {
  it('coords(v + w) = coords(v) + coords(w)', () => {
    const w = [-0.7, 2.1]; const cv = coordsInBasis(b1, b2, v), cw = coordsInBasis(b1, b2, w);
    const cvw = coordsInBasis(b1, b2, [v[0] + w[0], v[1] + w[1]]);
    expect(cvw[0]).toBeCloseTo(cv[0] + cw[0], 12); expect(cvw[1]).toBeCloseTo(cv[1] + cw[1], 12);
  });
});

describe('P and its inverse', () => {
  it('P^{-1} P = I', () => {
    const P = matrixP(b1, b2), Pi = inverseP(b1, b2);
    const prod = [[Pi[0][0] * P[0][0] + Pi[0][1] * P[1][0], Pi[0][0] * P[0][1] + Pi[0][1] * P[1][1]], [Pi[1][0] * P[0][0] + Pi[1][1] * P[1][0], Pi[1][0] * P[0][1] + Pi[1][1] * P[1][1]]];
    expect(prod[0][0]).toBeCloseTo(1, 12); expect(prod[0][1]).toBeCloseTo(0, 12);
    expect(prod[1][0]).toBeCloseTo(0, 12); expect(prod[1][1]).toBeCloseTo(1, 12);
  });
  it('det(P) is the signed area of the basis cell', () => {
    expect(det2(b1, b2)).toBeCloseTo(1.3 * 1.1 - (-0.3) * 0.4, 12);
  });
});

describe('Similarity transform preserves trace and determinant', () => {
  it('A_B = P^{-1} A P has the same trace and det as A', () => {
    const A = [[2, 0.7], [-0.4, 1]]; const AB = similarity(b1, b2, A);
    expect(AB[0][0] + AB[1][1]).toBeCloseTo(A[0][0] + A[1][1], 9);
    expect(AB[0][0] * AB[1][1] - AB[0][1] * AB[1][0]).toBeCloseTo(A[0][0] * A[1][1] - A[0][1] * A[1][0], 9);
  });
  it('in its eigenbasis a matrix becomes diagonal', () => {
    // A = [[3,1],[0,2]] has eigenvectors (1,0) for 3 and (1,-1) for 2.
    const A = [[3, 1], [0, 2]]; const AB = similarity([1, 0], [1, -1], A);
    expect(AB[0][1]).toBeCloseTo(0, 9); expect(AB[1][0]).toBeCloseTo(0, 9);
    expect(AB[0][0]).toBeCloseTo(3, 9); expect(AB[1][1]).toBeCloseTo(2, 9);
  });
});
