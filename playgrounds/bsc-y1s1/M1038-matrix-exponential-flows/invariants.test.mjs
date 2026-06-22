// Invariants for the matrix exponential flow: exp(A 0) = I, the flow solves
// x' = A x, the closed form matches numerical integration, eigenvalues set the
// trace and determinant, and the classification matches the eigenvalue signs.

import { describe, it, expect } from 'vitest';
import { trace, det, eigen, expAt, flow, apply, classify, eigvecs, PRESETS } from './sim.js';

describe('exp(A t) basics', () => {
  it('exp(A 0) = I', () => {
    const M = expAt(PRESETS.stableSpiral.A, 0);
    expect(M[0][0]).toBeCloseTo(1, 9); expect(M[0][1]).toBeCloseTo(0, 9); expect(M[1][0]).toBeCloseTo(0, 9); expect(M[1][1]).toBeCloseTo(1, 9);
  });
  it('d/dt exp(A t) at t=0 equals A', () => {
    const A = PRESETS.saddle.A, h = 1e-6; const M = expAt(A, h);
    expect((M[0][0] - 1) / h).toBeCloseTo(A[0][0], 4); expect((M[0][1]) / h).toBeCloseTo(A[0][1], 4); expect((M[1][0]) / h).toBeCloseTo(A[1][0], 4);
  });
});

describe('The flow solves x prime = A x and matches integration', () => {
  it('the closed form matches RK4 integration', () => {
    for (const key of Object.keys(PRESETS)) {
      const A = PRESETS[key].A; let x = [1, 0.5]; const dt = 0.002, T = 2;
      const f = (v) => apply(A, v);
      for (let t = 0; t < T - 1e-9; t += dt) { const k1 = f(x), k2 = f([x[0] + dt / 2 * k1[0], x[1] + dt / 2 * k1[1]]), k3 = f([x[0] + dt / 2 * k2[0], x[1] + dt / 2 * k2[1]]), k4 = f([x[0] + dt * k3[0], x[1] + dt * k3[1]]); x = [x[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])]; }
      const fl = flow(A, [1, 0.5], T);
      expect(fl[0]).toBeCloseTo(x[0], 2); expect(fl[1]).toBeCloseTo(x[1], 2);
    }
  });
  it('the derivative of the flow equals A times the state', () => {
    const A = PRESETS.stableSpiral.A, x0 = [1.2, -0.4], t = 0.8, h = 1e-5;
    const num = [(flow(A, x0, t + h)[0] - flow(A, x0, t - h)[0]) / (2 * h), (flow(A, x0, t + h)[1] - flow(A, x0, t - h)[1]) / (2 * h)];
    const Ax = apply(A, flow(A, x0, t));
    expect(num[0]).toBeCloseTo(Ax[0], 4); expect(num[1]).toBeCloseTo(Ax[1], 4);
  });
});

describe('Eigenvalues and classification', () => {
  it('trace and det are the eigenvalue sum and product (real case)', () => {
    const A = PRESETS.stableNode.A, e = eigen(A);
    expect(e.l1 + e.l2).toBeCloseTo(trace(A), 9); expect(e.l1 * e.l2).toBeCloseTo(det(A), 9);
  });
  it('classification matches the eigenvalues', () => {
    expect(classify(PRESETS.stableNode.A)).toBe('stable node');
    expect(classify(PRESETS.unstableNode.A)).toBe('unstable node');
    expect(classify(PRESETS.saddle.A)).toBe('saddle');
    expect(classify(PRESETS.centre.A)).toBe('centre');
    expect(classify(PRESETS.stableSpiral.A)).toBe('stable spiral');
    expect(classify(PRESETS.unstableSpiral.A)).toBe('unstable spiral');
  });
  it('eigenvectors are invariant: A v = l v', () => {
    const A = PRESETS.saddle.A; const evs = eigvecs(A);
    for (const { l, v } of evs) { const Av = apply(A, v); expect(Av[0]).toBeCloseTo(l * v[0], 6); expect(Av[1]).toBeCloseTo(l * v[1], 6); }
  });
  it('the centre conserves the orbit radius (pure imaginary eigenvalues)', () => {
    const A = PRESETS.centre.A; const x0 = [1, 0];
    // a centre has closed orbits; the flow returns near the start after a period.
    const e = eigen(A); const T = 2 * Math.PI / e.beta; const xT = flow(A, x0, T);
    expect(xT[0]).toBeCloseTo(x0[0], 3); expect(xT[1]).toBeCloseTo(x0[1], 3);
  });
});
