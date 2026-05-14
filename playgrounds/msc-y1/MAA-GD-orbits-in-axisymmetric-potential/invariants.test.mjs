import { describe, it, expect } from 'vitest';
import { miyamotoPotential, rk4Orbit, forceR, forceZ } from './sim.js';
describe('orbits-in-axisymmetric-potential', () => {
  it('Potential negative', () => {
    expect(miyamotoPotential(1e20, 0, 1e41, 5e19, 3e18)).toBeLessThan(0);
  });
  it('Force radial inward', () => {
    expect(forceR(1e20, 0, 1e41, 5e19, 3e18)).toBeLessThan(0);
  });
  it('Force vertical points toward midplane', () => {
    expect(forceZ(1e20, 1e19, 1e41, 5e19, 3e18)).toBeLessThan(0);
    expect(forceZ(1e20, -1e19, 1e41, 5e19, 3e18)).toBeGreaterThan(0);
  });
  it('rk4 advances state', () => {
    const s0 = [1e20, 1e18, 0, 5e4];
    const s1 = rk4Orbit(s0, 1e12, 1e41, 5e19, 3e18);
    expect(s1[1]).not.toBe(s0[1]);
  });
});
