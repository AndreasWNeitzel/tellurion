import { describe, it, expect } from 'vitest';
import { dPdOmega, Ptotal, integratedPower } from './sim.js';
describe('larmor-radiation-pattern', () => {
  it('null at theta = 0 (along acceleration axis)', () => {
    expect(dPdOmega(0, 1e10)).toBeLessThan(1e-50);
  });
  it('maximum at theta = pi/2 (perpendicular)', () => {
    const peak = dPdOmega(Math.PI / 2, 1e10);
    expect(dPdOmega(Math.PI / 3, 1e10)).toBeLessThan(peak);
    expect(dPdOmega(2 * Math.PI / 3, 1e10)).toBeLessThan(peak);
  });
  it('symmetric about theta = pi/2', () => {
    expect(Math.abs(dPdOmega(Math.PI / 4, 1) - dPdOmega(3 * Math.PI / 4, 1))).toBeLessThan(1e-30);
  });
  it('total power matches Larmor formula', () => {
    const a = 1e15;
    const P_num = integratedPower(a);
    const P_an = Ptotal(a);
    expect(Math.abs(P_num - P_an) / P_an).toBeLessThan(0.01);
  });
  it('P scales as a^2', () => {
    expect(Math.abs(Ptotal(2) / Ptotal(1) - 4)).toBeLessThan(1e-12);
  });
});
