import { describe, it, expect } from 'vitest';
import { greenFn, solve } from './sim.js';
describe('green-function-1d-laplacian', () => {
  it('G(0, x0) = 0 (boundary)', () => {
    expect(greenFn(0, 0.5, 1)).toBe(0);
  });
  it('G(L, x0) = 0 (boundary)', () => {
    expect(greenFn(1, 0.5, 1)).toBe(0);
  });
  it('symmetric: G(x, x0) = G(x0, x)', () => {
    expect(greenFn(0.3, 0.7, 1)).toBe(greenFn(0.7, 0.3, 1));
  });
  it('solution to -u" = 1 satisfies u(0) = u(L) = 0', () => {
    const r = solve((x) => 1, 1, 100);
    expect(Math.abs(r.u[0])).toBeLessThan(1e-3);
    expect(Math.abs(r.u[r.u.length - 1])).toBeLessThan(1e-3);
  });
  it('solution to -u" = 1 has midpoint u(L/2) = L^2/8', () => {
    const r = solve((x) => 1, 1, 200);
    const mid = r.u[100];
    expect(Math.abs(mid - 1 / 8)).toBeLessThan(1e-3);
  });
});
