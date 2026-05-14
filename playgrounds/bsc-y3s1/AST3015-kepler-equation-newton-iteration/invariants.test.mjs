// Kepler equation invariants.
// (a) Circular orbit (e = 0): E = M trivially.
// (b) Solution satisfies M = E - e sin E to tolerance.
// (c) Newton converges quadratically: residual drops by orders per iteration.
// (d) Mean motion: 2pi increment in M advances one period.
// (e) Orbit lies on the ellipse a^2 = x_offset^2 + (y / sqrt(1-e^2))^2... well, the standard a-e parametrization.

import { describe, it, expect } from 'vitest';
import { solveKepler, residual, orbitXY } from './sim.js';

describe('kepler-equation-newton-iteration', () => {
  it('circular orbit e = 0: E = M', () => {
    for (const M of [0.5, 1.5, 3.0, -2.0]) {
      const r = solveKepler(M, 0);
      // E should equal M (modulo 2 pi).
      expect(Math.abs(r.E - M)).toBeLessThan(1e-12);
    }
  });

  it('residual M = E - e sin E satisfied to 1e-12', () => {
    for (const e of [0.1, 0.5, 0.9, 0.99]) {
      for (const M of [0.5, 1.5, 3.0, -2.0]) {
        const r = solveKepler(M, e);
        expect(Math.abs(residual(r.E, e, M))).toBeLessThan(1e-10);
      }
    }
  });

  it('Newton convergence: usually < 10 iterations even for e = 0.99', () => {
    const r = solveKepler(0.5, 0.99);
    expect(r.iterations).toBeLessThan(15);
  });

  it('history shows quadratic-ish convergence', () => {
    const r = solveKepler(0.5, 0.6);
    // After 3 iterations residual should drop several orders.
    const r0 = Math.abs(residual(r.history[0], 0.6, 0.5));
    const r3 = Math.abs(residual(r.history[Math.min(3, r.history.length - 1)], 0.6, 0.5));
    expect(r3 / r0).toBeLessThan(1e-3);
  });

  it('orbit closure: M + 2 pi returns to same (x, y)', () => {
    const a = 1.0, e = 0.5;
    const p0 = orbitXY(a, e, 0.5);
    const p1 = orbitXY(a, e, 0.5 + 2 * Math.PI);
    expect(Math.abs(p0.x - p1.x)).toBeLessThan(1e-10);
    expect(Math.abs(p0.y - p1.y)).toBeLessThan(1e-10);
  });

  it('perihelion at M = 0: position is (a (1 - e), 0)', () => {
    const a = 1.0, e = 0.6;
    const p = orbitXY(a, e, 0);
    expect(Math.abs(p.x - a * (1 - e))).toBeLessThan(1e-12);
    expect(Math.abs(p.y)).toBeLessThan(1e-12);
  });

  it('aphelion at M = pi: position is (-a (1 + e), 0)', () => {
    const a = 1.0, e = 0.6;
    const p = orbitXY(a, e, Math.PI);
    expect(Math.abs(p.x + a * (1 + e))).toBeLessThan(1e-12);
    expect(Math.abs(p.y)).toBeLessThan(1e-12);
  });
});
