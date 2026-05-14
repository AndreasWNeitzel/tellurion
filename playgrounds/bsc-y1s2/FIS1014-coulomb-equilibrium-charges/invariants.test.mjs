import { describe, it, expect } from 'vitest';
import { forceAt, potentialAt } from './sim.js';
describe('coulomb-equilibrium-charges', () => {
  it('force at center of symmetric quadrupole is zero', () => {
    const q = [{x:1,y:1,q:1},{x:-1,y:1,q:1},{x:1,y:-1,q:1},{x:-1,y:-1,q:1}];
    const f = forceAt(0, 0, q);
    expect(Math.abs(f.fx)).toBeLessThan(1e-10);
    expect(Math.abs(f.fy)).toBeLessThan(1e-6);
  });
  it('force from single charge along axis', () => {
    const q = [{x: 0, y: 0, q: 1}];
    const f = forceAt(2, 0, q);
    expect(Math.abs(f.fx - 0.25)).toBeLessThan(1e-6);
    expect(Math.abs(f.fy)).toBeLessThan(1e-6);
  });
  it('opposite charges cancel at midpoint along perpendicular bisector', () => {
    const q = [{x: -1, y: 0, q: 1}, {x: 1, y: 0, q: 1}];
    const f = forceAt(0, 2, q);
    expect(Math.abs(f.fx)).toBeLessThan(1e-10);
    expect(f.fy).toBeGreaterThan(0);
  });
  it('potential at infinity is zero', () => {
    const q = [{x: 0, y: 0, q: 1}];
    expect(Math.abs(potentialAt(1e6, 0, q))).toBeLessThan(1e-5);
  });
  it('quadrupole potential at origin equals 4', () => {
    const q = [{x:1,y:1,q:1},{x:-1,y:1,q:1},{x:1,y:-1,q:1},{x:-1,y:-1,q:1}];
    const v = potentialAt(0, 0, q);
    expect(Math.abs(v - 4 / Math.sqrt(2))).toBeLessThan(1e-6);
  });
});
