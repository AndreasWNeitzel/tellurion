import { describe, it, expect } from 'vitest';
import { bisect, newton, secant } from './sim.js';
describe('root-finding-bisect-newton-secant', () => {
  it('bisect finds sqrt(2) on [1, 2]', () => {
    const r = bisect((x) => x * x - 2, 1, 2);
    expect(Math.abs(r.root - Math.SQRT2)).toBeLessThan(1e-9);
  });
  it('newton finds sqrt(2) from x0 = 1.5', () => {
    const r = newton((x) => x * x - 2, (x) => 2 * x, 1.5);
    expect(Math.abs(r.root - Math.SQRT2)).toBeLessThan(1e-10);
  });
  it('secant finds sqrt(2) from x0=1, x1=2', () => {
    const r = secant((x) => x * x - 2, 1, 2);
    expect(Math.abs(r.root - Math.SQRT2)).toBeLessThan(1e-10);
  });
  it('newton fewer iterations than bisect for same tol', () => {
    const rB = bisect((x) => x * x - 2, 1, 2);
    const rN = newton((x) => x * x - 2, (x) => 2 * x, 1.5);
    expect(rN.trail.length).toBeLessThan(rB.trail.length);
  });
  it('bisect rejects same-sign interval', () => {
    const r = bisect((x) => x * x - 2, 5, 10);
    expect(r.ok).toBe(false);
  });
  it('newton can diverge from bad initial guess', () => {
    const r = newton((x) => x * x + 1, (x) => 2 * x, 1);
    expect(r.ok).toBe(false);
  });
});
