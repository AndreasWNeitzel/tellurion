import { describe, it, expect } from 'vitest';
import { collide, ke, momentum } from './sim.js';
describe('elastic-inelastic-collisions-2d', () => {
  it('momentum conserved', () => {
    const r = collide(1, 2, 1, -1, 0.5);
    expect(Math.abs(momentum(1, r.v1, 1, r.v2) - momentum(1, 2, 1, -1))).toBeLessThan(1e-12);
  });
  it('elastic: KE conserved', () => {
    const r = collide(1, 2, 1, -1, 1);
    expect(Math.abs(ke(1, r.v1, 1, r.v2) - ke(1, 2, 1, -1))).toBeLessThan(1e-12);
  });
  it('elastic equal mass head-on: v1 v2 swap', () => {
    const r = collide(1, 5, 1, -3, 1);
    expect(Math.abs(r.v1 - (-3))).toBeLessThan(1e-12);
    expect(Math.abs(r.v2 - 5)).toBeLessThan(1e-12);
  });
  it('perfectly inelastic: v1 = v2', () => {
    const r = collide(1, 5, 2, -2, 0);
    expect(Math.abs(r.v1 - r.v2)).toBeLessThan(1e-12);
  });
  it('inelastic loses KE', () => {
    const r = collide(1, 5, 2, -2, 0);
    expect(ke(1, r.v1, 2, r.v2)).toBeLessThan(ke(1, 5, 2, -2));
  });
});
