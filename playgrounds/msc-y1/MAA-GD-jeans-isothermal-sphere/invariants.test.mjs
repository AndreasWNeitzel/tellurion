import { describe, it, expect } from 'vitest';
import { density, massEnclosed, vCirc, G_SI } from './sim.js';
describe('jeans-isothermal-sphere', () => {
  it('rho ~ 1/r^2', () => {
    const ratio = density(1, 1e5) / density(2, 1e5);
    expect(Math.abs(ratio - 4)).toBeLessThan(0.01);
  });
  it('Enclosed mass linear in r', () => {
    expect(Math.abs(massEnclosed(2, 1e5) / massEnclosed(1, 1e5) - 2)).toBeLessThan(1e-9);
  });
  it('v_circ constant (flat rotation curve)', () => {
    expect(vCirc(2e5)).toBeCloseTo(Math.sqrt(2) * 2e5, 5);
  });
});
