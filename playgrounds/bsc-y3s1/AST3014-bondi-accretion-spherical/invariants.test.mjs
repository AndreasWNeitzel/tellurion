import { describe, it, expect } from 'vitest';
import { bondiRadius, bondiVelocityIsothermal, MdotBondi, SONIC_OVER_BONDI, G, M_SUN } from './sim.js';
describe('bondi-accretion-spherical', () => {
  it('Bondi radius for 1 Msun, cs=10 km/s ~ 10 AU', () => {
    const cs = 1e4;
    const rB = bondiRadius(M_SUN, cs);
    expect(rB).toBeGreaterThan(1e12);
    expect(rB).toBeLessThan(1e13);
  });
  it('rB scales as M', () => {
    const r1 = bondiRadius(M_SUN, 1e4);
    const r2 = bondiRadius(2 * M_SUN, 1e4);
    expect(Math.abs(r2 / r1 - 2)).toBeLessThan(1e-12);
  });
  it('Mdot scales as M^2', () => {
    const m1 = MdotBondi(M_SUN, 1e4, 1e-20);
    const m2 = MdotBondi(2 * M_SUN, 1e4, 1e-20);
    expect(Math.abs(m2 / m1 - 4)).toBeLessThan(1e-12);
  });
  it('Mdot scales as 1/cs^3', () => {
    const m1 = MdotBondi(M_SUN, 1e4, 1e-20);
    const m2 = MdotBondi(M_SUN, 2e4, 1e-20);
    expect(Math.abs(m2 / m1 - 0.125)).toBeLessThan(1e-12);
  });
  it('Velocity is finite (returns a number)', () => {
    const rB = bondiRadius(M_SUN, 1e4);
    const u = bondiVelocityIsothermal(rB, M_SUN, 1e4);
    expect(Number.isFinite(u)).toBe(true);
  });
  it('Flow is exactly sonic (M=1) at r_s = r_B/2', () => {
    const cs = 1e4, rB = bondiRadius(M_SUN, cs), rs = SONIC_OVER_BONDI * rB;
    const M = Math.abs(bondiVelocityIsothermal(rs, M_SUN, cs)) / cs;
    expect(Math.abs(M - 1)).toBeLessThan(0.02);
  });
  it('Supersonic inside r_s, subsonic outside (transonic)', () => {
    const cs = 1e4, rB = bondiRadius(M_SUN, cs), rs = SONIC_OVER_BONDI * rB;
    const Min = Math.abs(bondiVelocityIsothermal(0.3 * rs, M_SUN, cs)) / cs;
    const Mout = Math.abs(bondiVelocityIsothermal(3 * rs, M_SUN, cs)) / cs;
    expect(Min).toBeGreaterThan(1);
    expect(Mout).toBeLessThan(1);
  });
});
