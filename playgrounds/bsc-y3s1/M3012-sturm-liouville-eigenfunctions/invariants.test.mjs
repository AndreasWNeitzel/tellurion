// Sturm-Liouville invariants.
// (a) Eigenvalue lambda_n = n^2.
// (b) Orthonormality: <phi_n, phi_m> = delta_nm.
// (c) phi_n(0) = 0 and phi_n(L) = 0 (Dirichlet boundary).
// (d) Reconstruction: projected coefficients reconstruct f within tol.

import { describe, it, expect } from 'vitest';
import {
  eigenvalue, eigenfunction, innerProduct, projectCoefficients, reconstruct, L,
} from './sim.js';

describe('sturm-liouville-eigenfunctions', () => {
  it('eigenvalues are n^2', () => {
    for (let n = 1; n <= 10; n += 1) {
      expect(eigenvalue(n)).toBe(n * n);
    }
  });

  it('eigenfunctions zero at boundary x = 0 and x = pi', () => {
    for (let n = 1; n <= 5; n += 1) {
      expect(Math.abs(eigenfunction(n, 0))).toBeLessThan(1e-12);
      expect(Math.abs(eigenfunction(n, L))).toBeLessThan(1e-12);
    }
  });

  it('orthonormality: <phi_n, phi_n> = 1', () => {
    for (let n = 1; n <= 5; n += 1) {
      const norm = innerProduct((x) => eigenfunction(n, x), (x) => eigenfunction(n, x));
      expect(Math.abs(norm - 1)).toBeLessThan(1e-6);
    }
  });

  it('orthogonality: <phi_n, phi_m> = 0 for n != m', () => {
    for (let n = 1; n <= 4; n += 1) {
      for (let m = n + 1; m <= 5; m += 1) {
        const ip = innerProduct((x) => eigenfunction(n, x), (x) => eigenfunction(m, x));
        expect(Math.abs(ip)).toBeLessThan(1e-6);
      }
    }
  });

  it('triangle wave f(x) = x(pi - x) projects with nonzero coefficients', () => {
    const f = (x) => x * (L - x);
    const c = projectCoefficients(f, 20);
    expect(Math.abs(c[1])).toBeGreaterThan(0);
    expect(Math.abs(c[3])).toBeGreaterThan(0);
  });

  it('reconstruction of f(x) = x(pi-x) converges with more coefficients', () => {
    const f = (x) => x * (L - x);
    const c20 = projectCoefficients(f, 20);
    const x = L / 3;
    const rec = reconstruct(c20, x);
    expect(Math.abs(rec - f(x)) / Math.abs(f(x))).toBeLessThan(0.01);
  });

  it('eigenvalues monotonically increase', () => {
    let prev = 0;
    for (let n = 1; n <= 10; n += 1) {
      expect(eigenvalue(n)).toBeGreaterThan(prev);
      prev = eigenvalue(n);
    }
  });
});
