import { describe, it, expect } from 'vitest';
import { greatCircle, angularSeparation } from './sim.js';
describe('geodesic-deviation-equation', () => {
  it('two geodesics from equator with d phi converge at the pole', () => {
    const g1 = greatCircle(Math.PI / 2, Math.PI / 2, 0.0, Math.PI / 2);
    const g2 = greatCircle(Math.PI / 2, Math.PI / 2, 0.1, Math.PI / 2);
    const ang = angularSeparation(g1, g2);
    expect(ang).toBeLessThan(0.05);
  });
  it('point at t=0 is start point', () => {
    const g = greatCircle(0, Math.PI / 2, 0.5, 0);
    expect(Math.abs(g.theta - Math.PI / 2)).toBeLessThan(1e-6);
    expect(Math.abs(g.phi - 0.5)).toBeLessThan(1e-6);
  });
  it('moves east after small t (alpha=0)', () => {
    const g = greatCircle(0.1, Math.PI / 2, 0, 0);
    expect(g.phi).toBeGreaterThan(0);
  });
});
