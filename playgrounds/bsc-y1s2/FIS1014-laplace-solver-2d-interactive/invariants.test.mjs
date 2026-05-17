// Laplace/Poisson SOR: convergence, the harmonic property, exact
// Dirichlet data, and the parallel-plate and coaxial analytic limits.

import { describe, it, expect } from 'vitest';
import { createGrid, setFixed, sweep, relax, maxResidual, fieldAt, applyPreset } from './sim.js';

describe('laplace-solver-2d-interactive invariants', () => {
  it('SOR residual decays monotonically and converges toward zero', () => {
    const g = createGrid(48);
    applyPreset(g, 'plates');
    let prev = sweep(g, 1.8), drops = 0;
    for (let n = 0; n < 60; n += 1) { const r = sweep(g, 1.8); if (r <= prev + 1e-12) drops += 1; prev = r; }
    expect(drops).toBeGreaterThan(55);
    expect(prev).toBeLessThan(1e-2);
  });

  it('converged solution is harmonic in the source-free region', () => {
    const g = createGrid(64);
    applyPreset(g, 'plates');
    relax(g, 1200, 1.9);
    expect(maxResidual(g)).toBeLessThan(5e-3);
  });

  it('Dirichlet cells keep their prescribed values exactly', () => {
    const g = createGrid(40);
    setFixed(g, 12, 20, 0.7); setFixed(g, 28, 20, -0.4);
    relax(g, 300, 1.8);
    expect(g.phi[20 * 40 + 12]).toBe(0.7);
    expect(g.phi[20 * 40 + 28]).toBe(-0.4);
  });

  it('parallel-plate capacitor: interior field E = V/d within 1%', () => {
    const N = 96;
    const g = createGrid(N);
    const x1 = 30, x2 = 66;                       // plates at +1 and -1
    for (let i = 0; i < N; i += 1) { setFixed(g, i, 0, 0); setFixed(g, i, N - 1, 0); setFixed(g, 0, i, 0); setFixed(g, N - 1, i, 0); }
    for (let j = 12; j < N - 12; j += 1) { setFixed(g, x1, j, +1); setFixed(g, x2, j, -1); }
    relax(g, 4000, 1.92);
    const c = Math.round(N / 2);
    const [ex] = fieldAt(g, Math.round((x1 + x2) / 2), c);
    const analytic = (1 - (-1)) / (x2 - x1);      // V/d in grid units
    expect(Math.abs(Math.abs(ex) - analytic) / analytic).toBeLessThan(0.01);
  });

  it('coaxial cable: phi(r) = A ln r + B (log law) within 0.5%', () => {
    const N = 120, c = (N - 1) / 2, ri = 8, ro = 46;
    const g = createGrid(N);
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
      const r = Math.hypot(i - c, j - c);
      if (r <= ri) setFixed(g, i, j, 1);
      else if (r >= ro && r < ro + 2) setFixed(g, i, j, 0);
    }
    relax(g, 8000, 1.95);
    // Fit A,B from two radii, predict a third.
    const at = (rr) => g.phi[Math.round(c) * N + Math.round(c + rr)];
    const r1 = 14, r2 = 34, r3 = 24;
    const A = (at(r1) - at(r2)) / (Math.log(r1) - Math.log(r2));
    const B = at(r1) - A * Math.log(r1);
    const pred = A * Math.log(r3) + B;
    expect(Math.abs(pred - at(r3)) / Math.max(1e-6, Math.abs(at(r3)))).toBeLessThan(5e-3);
  });

  it('grounded box: potential bounded by the conductor extremes', () => {
    const g = createGrid(64);
    applyPreset(g, 'dipole');
    relax(g, 2000, 1.9);
    let lo = Infinity, hi = -Infinity;
    for (const v of g.phi) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    expect(hi).toBeLessThanOrEqual(1 + 1e-9);
    expect(lo).toBeGreaterThanOrEqual(-1 - 1e-9);
  });
});
