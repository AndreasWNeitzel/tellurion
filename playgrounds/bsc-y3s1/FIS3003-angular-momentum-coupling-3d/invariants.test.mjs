// Angular-momentum coupling: the triangle inequality and dimension
// count, Clebsch-Gordan unitarity (row and column orthonormality),
// the M = m1+m2 selection rule, tabulated CG values, the exchange
// symmetry, and the consistent vector-model geometry.

import { describe, it, expect } from 'vitest';
import {
  allowedJ, triangleHolds, clebschGordan, uncoupledBasis, coupledBasis,
  vecLen, cosJ1toJ, cosJ2toJ,
} from './sim.js';

const close = (a, b, t = 1e-9) => expect(Math.abs(a - b)).toBeLessThan(t);

describe('angular-momentum-coupling-3d invariants', () => {
  it('allowed J spans |j1-j2|..j1+j2 with 2 min(j1,j2)+1 values', () => {
    expect(allowedJ(1, 1)).toEqual([0, 1, 2]);
    expect(allowedJ(1.5, 1)).toEqual([0.5, 1.5, 2.5]);
    expect(allowedJ(2, 0.5)).toEqual([1.5, 2.5]);
    for (const [j1, j2] of [[1, 1], [1.5, 1], [2, 0.5], [2, 2]]) {
      expect(allowedJ(j1, j2).length).toBe(2 * Math.min(j1, j2) + 1);
      expect(triangleHolds(j1, j2, j1 + j2)).toBe(true);
      expect(triangleHolds(j1, j2, Math.abs(j1 - j2))).toBe(true);
      expect(triangleHolds(j1, j2, j1 + j2 + 1)).toBe(false);
    }
  });

  it('uncoupled and coupled bases have equal dimension (2j1+1)(2j2+1)', () => {
    for (const [j1, j2] of [[1, 1], [1.5, 1], [2, 0.5], [1.5, 1.5]]) {
      const dim = (2 * j1 + 1) * (2 * j2 + 1);
      expect(uncoupledBasis(j1, j2).length).toBe(dim);
      expect(coupledBasis(j1, j2).length).toBe(dim);
      let s = 0; for (const J of allowedJ(j1, j2)) s += 2 * J + 1;
      expect(s).toBe(dim);
    }
  });

  it('CG columns are orthonormal: sum over (m1,m2) of products = delta', () => {
    const j1 = 1, j2 = 1, cb = coupledBasis(j1, j2), ub = uncoupledBasis(j1, j2);
    for (let a = 0; a < cb.length; a += 1) for (let b = 0; b < cb.length; b += 1) {
      const [J1, M1] = cb[a], [J2, M2] = cb[b];
      let s = 0;
      for (const [m1, m2] of ub) s += clebschGordan(j1, m1, j2, m2, J1, M1) * clebschGordan(j1, m1, j2, m2, J2, M2);
      close(s, (a === b ? 1 : 0), 1e-9);
    }
  });

  it('CG rows are orthonormal: sum over (J,M) of products = delta', () => {
    const j1 = 1.5, j2 = 1, ub = uncoupledBasis(j1, j2), cb = coupledBasis(j1, j2);
    for (let a = 0; a < ub.length; a += 1) for (let b = 0; b < ub.length; b += 1) {
      const [p1, q1] = ub[a], [p2, q2] = ub[b];
      let s = 0;
      for (const [J, M] of cb) s += clebschGordan(j1, p1, j2, q1, J, M) * clebschGordan(j1, p2, j2, q2, J, M);
      close(s, (a === b ? 1 : 0), 1e-9);
    }
  });

  it('selection rule: CG vanishes unless M = m1 + m2 and J is allowed', () => {
    expect(clebschGordan(1, 1, 1, 0, 2, 2)).toBe(0);            // m1+m2=1 != M=2
    expect(clebschGordan(1, 1, 1, 1, 0, 2)).toBe(0);            // M=2 with J=0
    expect(clebschGordan(1, 0, 1, 0, 3, 0)).toBe(0);            // J=3 > j1+j2=2
    expect(Math.abs(clebschGordan(1, 1, 1, 0, 2, 1))).toBeGreaterThan(0);
  });

  it('tabulated CG values (Condon-Shortley) are reproduced', () => {
    close(clebschGordan(1, 1, 1, 1, 2, 2), 1, 1e-9);            // stretched = +1
    close(clebschGordan(1.5, 1.5, 1, 1, 2.5, 2.5), 1, 1e-9);
    close(Math.abs(clebschGordan(0.5, 0.5, 0.5, -0.5, 1, 0)), Math.SQRT1_2, 1e-9);
    close(Math.abs(clebschGordan(0.5, 0.5, 0.5, -0.5, 0, 0)), Math.SQRT1_2, 1e-9);
    close(Math.abs(clebschGordan(1, 1, 1, -1, 2, 0)), Math.sqrt(1 / 6), 1e-9);
    close(Math.abs(clebschGordan(1, 1, 1, -1, 1, 0)), Math.SQRT1_2, 1e-9);
    close(Math.abs(clebschGordan(1, 1, 1, -1, 0, 0)), Math.sqrt(1 / 3), 1e-9);
    close(Math.abs(clebschGordan(1, 0, 1, 0, 2, 0)), Math.sqrt(2 / 3), 1e-9);
    close(clebschGordan(1, 0, 1, 0, 1, 0), 0, 1e-9);            // forbidden by symmetry
    close(Math.abs(clebschGordan(1, 0, 1, 0, 0, 0)), Math.sqrt(1 / 3), 1e-9);
  });

  it('exchange symmetry CG(1<->2) = (-1)^(j1+j2-J) CG', () => {
    const j1 = 1.5, j2 = 1;
    for (const J of allowedJ(j1, j2)) for (let M = -J; M <= J + 1e-9; M += 1) {
      for (let m1 = -j1; m1 <= j1 + 1e-9; m1 += 1) {
        const m2 = M - m1; if (Math.abs(m2) > j2 + 1e-9) continue;
        const a = clebschGordan(j1, m1, j2, m2, J, M);
        const b = clebschGordan(j2, m2, j1, m1, J, M);
        const phase = ((Math.round(j1 + j2 - J) % 2) === 0) ? 1 : -1;
        close(a, phase * b, 1e-9);
      }
    }
  });

  it('vector model: |J| = sqrt(J(J+1)) and cos angles within [-1,1]', () => {
    close(vecLen(1), Math.sqrt(2), 1e-12);
    close(vecLen(0.5), Math.sqrt(0.75), 1e-12);
    for (const [j1, j2] of [[1, 1], [1.5, 1], [2, 1]]) {
      for (const J of allowedJ(j1, j2)) {
        if (J === 0) continue;
        expect(Math.abs(cosJ1toJ(j1, j2, J))).toBeLessThanOrEqual(1 + 1e-9);
        expect(Math.abs(cosJ2toJ(j1, j2, J))).toBeLessThanOrEqual(1 + 1e-9);
      }
      const Jm = j1 + j2;
      expect(cosJ1toJ(j1, j2, Jm)).toBeGreaterThan(0);
      expect(cosJ2toJ(j1, j2, Jm)).toBeGreaterThan(0);
    }
  });
});
