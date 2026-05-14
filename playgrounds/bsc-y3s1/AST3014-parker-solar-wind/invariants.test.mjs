import { describe, it, expect } from 'vitest';
import { criticalRadius, parkerSpeed, G, M_SUN, R_SUN } from './sim.js';
describe('parker-solar-wind', () => {
  it('critical radius for cs = 1e5 m/s ~ 6 R_sun', () => {
    const rc = criticalRadius(1e5);
    expect(rc).toBeGreaterThan(3 * R_SUN);
    expect(rc).toBeLessThan(12 * R_SUN);
  });
  it('speed at r_c equals cs', () => {
    const cs = 1e5;
    const rc = criticalRadius(cs);
    const u = parkerSpeed(rc, cs);
    expect(Math.abs(u / cs - 1)).toBeLessThan(0.2);
  });
  it('speed at 1 AU > cs for hot corona', () => {
    const cs = 1.4e5;
    const u = parkerSpeed(1.496e11, cs);
    expect(u).toBeGreaterThan(cs);
  });
});
