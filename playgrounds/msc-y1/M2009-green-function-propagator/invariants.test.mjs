import { describe, it, expect } from 'vitest';
import {
  L, grid, greenG, source, applyGreen, solveViaGreen, solveDirect,
  analyticSine, odeResidual, maxDiff,
} from './sim.js';

describe('green-function-propagator invariants', () => {
  const N = 200;

  it('the Green function is symmetric: G(x, x′) = G(x′, x)', () => {
    let maxErr = 0;
    for (const x of [0.07, 0.31, 0.5, 0.62, 0.88]) {
      for (const xp of [0.13, 0.4, 0.55, 0.77, 0.95]) {
        maxErr = Math.max(maxErr, Math.abs(greenG(x, xp) - greenG(xp, x)));
      }
    }
    expect(maxErr).toBeLessThan(1e-12);
  });

  it('the Green function vanishes on the Dirichlet boundary and peaks at the source', () => {
    for (const xp of [0.2, 0.5, 0.8]) {
      expect(greenG(0, xp)).toBe(0);
      expect(greenG(L, xp)).toBe(0);
      expect(greenG(xp, xp)).toBeCloseTo(xp * (L - xp) / L, 12);   // tent apex
    }
    expect(greenG(0.4, 0)).toBe(0);
    expect(greenG(0.4, L)).toBe(0);
  });

  it('the Green function has a unit downward slope jump at the source point', () => {
    const xp = 0.5, h = 1e-5;
    const sL = (greenG(xp - h, xp) - greenG(xp - 2 * h, xp)) / h;
    const sR = (greenG(xp + 2 * h, xp) - greenG(xp + h, xp)) / h;
    expect(sR - sL).toBeCloseTo(-1, 4);                            // -G'' = delta
    expect(greenG(xp - 1e-9, xp)).toBeCloseTo(greenG(xp + 1e-9, xp), 6); // continuous
  });

  it('u = integral G f solves -u′′ = f with the right boundary conditions', () => {
    for (const k of ['sine', 'box', 'point', 'twobumps']) {
      const s = solveViaGreen(k, N, 3);
      expect(odeResidual(s.x, s.u, s.f)).toBeLessThan(1e-4);       // ODE satisfied
      expect(Math.abs(s.u[0])).toBeLessThan(1e-9);                 // u(0) = 0
      expect(Math.abs(s.u[N - 1])).toBeLessThan(1e-9);             // u(L) = 0
    }
  });

  it('the Green solution matches the direct tridiagonal solve and the analytic sine', () => {
    const g = solveViaGreen('sine', N, 2);
    const d = solveDirect('sine', N, 2);
    const a = analyticSine(N, 2);
    expect(maxDiff(g.u, d.u)).toBeLessThan(1e-9);                  // same as the direct BVP solve
    expect(maxDiff(g.u, a.u)).toBeLessThan(1e-4);                  // matches the exact solution
    expect(maxDiff(d.u, a.u)).toBeLessThan(1e-4);
  });

  it('the Green operator is linear in the source', () => {
    const x = grid(N);
    const fa = Float64Array.from(x, (xx) => source('sine', xx, 1));
    const fb = Float64Array.from(x, (xx) => source('point', xx, 4));
    const ua = applyGreen(x, fa), ub = applyGreen(x, fb);
    const comb = Float64Array.from(x, (_, i) => 2.5 * fa[i] - 1.3 * fb[i]);
    const uc = applyGreen(x, comb);
    let maxErr = 0;
    for (let i = 0; i < N; i += 1) maxErr = Math.max(maxErr, Math.abs(uc[i] - (2.5 * ua[i] - 1.3 * ub[i])));
    expect(maxErr).toBeLessThan(1e-12);
    // zero source gives zero solution
    expect(applyGreen(x, new Float64Array(N)).every((v) => v === 0)).toBe(true);
  });

  it('a more peaked source gives a sharper response (qualitative check)', () => {
    const wide = solveViaGreen('point', N, 9);                     // broader Gaussian
    const narrow = solveViaGreen('point', N, 1);                   // narrow Gaussian
    const peak = (u) => Math.max(...u);
    // both peak at the centre; the broader source deposits more total
    expect(peak(wide.u)).toBeGreaterThan(peak(narrow.u));
    expect(odeResidual(wide.x, wide.u, wide.f)).toBeLessThan(1e-4);
  });

  it('deterministic: identical inputs reproduce the solution', () => {
    expect(solveViaGreen('sine', N, 2).u[100]).toBe(solveViaGreen('sine', N, 2).u[100]);
    expect(greenG(0.37, 0.62)).toBe(greenG(0.37, 0.62));
    expect(solveDirect('box', N, 3).u[80]).toBe(solveDirect('box', N, 3).u[80]);
  });
});
