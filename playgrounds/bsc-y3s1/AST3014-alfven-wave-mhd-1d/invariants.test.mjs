import { describe, it, expect } from 'vitest';
import { alfvenSpeedMS, bField, vField, MU0 } from './sim.js';
describe('alfven-wave-mhd-1d', () => {
  it('solar wind Alfven speed: 5e-9 T, 5 amu/cm^3 ~ 50 km/s', () => {
    const rho = 5 * 1.66e-27 * 1e6;
    const vA = alfvenSpeedMS(5e-9, rho);
    expect(vA).toBeGreaterThan(3e4); expect(vA).toBeLessThan(8e4);
  });
  it('quadrupling B doubles vA', () => {
    expect(Math.abs(alfvenSpeedMS(2, 1) / alfvenSpeedMS(1, 1) - 2)).toBeLessThan(1e-12);
  });
  it('halving rho gives vA * sqrt(2)', () => {
    expect(Math.abs(alfvenSpeedMS(1, 0.5) / alfvenSpeedMS(1, 1) - Math.SQRT2)).toBeLessThan(1e-9);
  });
  it('b_y phase shifts to right at later t for dir=+1', () => {
    const b1 = bField(0, 0, 1, 1, 1, 1);
    const b2 = bField(0.1, 0.1, 1, 1, 1, 1);
    expect(Math.abs(b1 - b2)).toBeLessThan(1e-9);
  });
  it('Alfven relation: v_y/b_y constant magnitude', () => {
    const ratio = vField(0.2, 0.3, 1, 0.1, 1, 1, 1) / bField(0.2, 0.3, 1, 0.1, 1);
    expect(Math.abs(Math.abs(ratio) - 1 / Math.sqrt(MU0))).toBeLessThan(0.1);
  });
});
