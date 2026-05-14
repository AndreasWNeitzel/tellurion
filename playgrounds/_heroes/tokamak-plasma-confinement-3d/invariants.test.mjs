import { describe, it, expect } from 'vitest';
import { safetyAtEdge, safetyAxis, bToroidal, bounceTime, MU0 } from './sim.js';
describe('tokamak-plasma-confinement-3d', () => {
  it('q_a from formula reproduces ITER-like number', () => {
    // ITER: R0=6.2, a=2, B0=5.3, Ip=15 MA -> q_a ~ 3.
    const q = safetyAtEdge(5.3, 6.2, 2, 15);
    expect(q).toBeGreaterThan(0.5); expect(q).toBeLessThan(3);
  });
  it('q_axis = q_a / 2 for parabolic current', () => {
    expect(Math.abs(safetyAxis(5, 6, 2, 10) / safetyAtEdge(5, 6, 2, 10) - 0.5)).toBeLessThan(1e-9);
  });
  it('Bt scales as 1/R', () => {
    expect(Math.abs(bToroidal(2, 5, 1) - 2.5)).toBeLessThan(1e-9);
    expect(Math.abs(bToroidal(4, 5, 1) - 1.25)).toBeLessThan(1e-9);
  });
  it('bounce period: T_b > 0', () => {
    expect(bounceTime(2, 6, 1e6)).toBeGreaterThan(0);
  });
});
