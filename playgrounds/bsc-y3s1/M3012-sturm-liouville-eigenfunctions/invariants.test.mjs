// Sturm-Liouville invariants.
// (a) Eigenvalue lambda_n = n^2.
// (b) Orthonormality: <phi_n, phi_m> = delta_nm.
// (c) phi_n(0) = 0 and phi_n(L) = 0 (Dirichlet boundary).
// (d) Reconstruction: projected coefficients reconstruct f within tol.

import { describe, it, expect } from 'vitest';
import {
  eigenvalue, eigenfunction, innerProduct, projectCoefficients, reconstruct, L,
  solveSL, densityProfile, nodeCount, projectWeighted,
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

// General variable-density Sturm-Liouville solver (the playground core).
describe('sturm-liouville variable-density solver', () => {
  it('all density profiles are strictly positive', () => {
    for (const kind of ['uniform', 'heavy-center', 'heavy-end', 'two-step', 'taper']) {
      for (let i = 0; i <= 50; i += 1) {
        expect(densityProfile(kind, (i / 50) * L, L)).toBeGreaterThan(0);
      }
    }
  });

  it('uniform string reduces to the closed form: lambda_k -> k^2', () => {
    const s = solveSL('uniform', 120, L);
    for (let k = 1; k <= 8; k += 1) {
      const rel = Math.abs(s.lambda[k - 1] - k * k) / (k * k);
      expect(rel).toBeLessThan(0.02);                 // FD error O(h^2), small modes
    }
    // and the shape matches sqrt(2/L) sin(k x) up to sign
    for (let k = 1; k <= 5; k += 1) {
      let num = 0, da = 0, db = 0;
      for (let j = 0; j < s.n + 2; j += 1) {
        const a = s.modes[k - 1][j];
        const b = eigenfunction(k, s.xg[j]);
        num += a * b; da += a * a; db += b * b;
      }
      expect(Math.abs(num) / Math.sqrt(da * db)).toBeGreaterThan(0.999);
    }
  });

  it('Sturm oscillation theorem: mode k has exactly k-1 interior nodes', () => {
    for (const kind of ['uniform', 'heavy-center', 'two-step', 'taper']) {
      const s = solveSL(kind, 96, L);
      for (let k = 1; k <= 12; k += 1) {
        expect(nodeCount(s.modes[k - 1])).toBe(k - 1);
      }
    }
  });

  it('eigenvalues are positive and strictly ordered for every profile', () => {
    for (const kind of ['uniform', 'heavy-center', 'heavy-end', 'two-step', 'taper']) {
      const s = solveSL(kind, 96, L);
      expect(s.lambda[0]).toBeGreaterThan(0);
      for (let k = 1; k < 30; k += 1) expect(s.lambda[k]).toBeGreaterThan(s.lambda[k - 1]);
    }
  });

  it('modes are weighted-orthonormal: sum rho_i psi_m psi_k h = delta_mk', () => {
    const s = solveSL('heavy-center', 96, L);
    for (let m = 1; m <= 8; m += 1) {
      for (let k = m; k <= 8; k += 1) {
        let ip = 0;
        for (let j = 1; j <= s.n; j += 1) ip += s.rho[j] * s.modes[m - 1][j] * s.modes[k - 1][j] * s.h;
        expect(Math.abs(ip - (m === k ? 1 : 0))).toBeLessThan(1e-6);
      }
    }
  });

  it('modes vanish exactly at both clamped ends', () => {
    const s = solveSL('taper', 80, L);
    for (let k = 1; k <= 10; k += 1) {
      expect(s.modes[k - 1][0]).toBe(0);
      expect(s.modes[k - 1][s.n + 1]).toBe(0);
    }
  });

  it('loading the string lowers its fundamental (heavier rho, lower lambda_1)', () => {
    const u = solveSL('uniform', 96, L);
    const hc = solveSL('heavy-center', 96, L);
    const he = solveSL('heavy-end', 96, L);
    expect(hc.lambda[0]).toBeLessThan(u.lambda[0]);
    expect(he.lambda[0]).toBeLessThan(u.lambda[0]);
  });

  it('weighted projection recovers a smooth profile within 1 percent', () => {
    const s = solveSL('two-step', 96, L);
    const f = (x) => Math.sin(Math.PI * x / L);
    const c = projectWeighted(f, s, 24);
    let maxRel = 0;
    for (let j = 8; j <= s.n - 8; j += 7) {
      let rec = 0;
      for (let k = 1; k <= 24; k += 1) rec += c[k] * s.modes[k - 1][j];
      const tv = f(s.xg[j]);
      if (Math.abs(tv) > 0.2) maxRel = Math.max(maxRel, Math.abs(rec - tv) / Math.abs(tv));
    }
    expect(maxRel).toBeLessThan(0.01);
  });

  it('deterministic: the solver reproduces eigenpairs exactly', () => {
    const a = solveSL('heavy-end', 80, L);
    const b = solveSL('heavy-end', 80, L);
    for (let k = 0; k < 20; k += 1) expect(a.lambda[k]).toBe(b.lambda[k]);
    expect(a.modes[3][20]).toBe(b.modes[3][20]);
  });
});
