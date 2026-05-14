import { describe, it, expect } from 'vitest';
import { densityAt, phaseAt, energyEV, expectedR } from './sim.js';

describe('hydrogen-orbitals-3d', () => {
  it('energy E_n = -13.6 eV / n^2', () => {
    expect(Math.abs(energyEV(1) + 13.6057)).toBeLessThan(0.01);
    expect(Math.abs(energyEV(2) + 3.4014)).toBeLessThan(0.01);
  });
  it('1s density peaks at r=0', () => {
    expect(densityAt(0.1, 0, 0, 1, 0, 0)).toBeGreaterThan(densityAt(5, 0, 0, 1, 0, 0));
  });
  it('2p_z (m=0) vanishes in xy-plane (theta = pi/2)', () => {
    expect(densityAt(2, Math.PI / 2, 0, 2, 1, 0)).toBeLessThan(1e-3);
  });
  it('2p density nonzero along z-axis (theta = 0)', () => {
    expect(densityAt(2, 0, 0, 2, 1, 0)).toBeGreaterThan(0);
  });
  it('phase m=2 advances 4pi around the orbital', () => {
    expect(Math.abs(phaseAt(2 * Math.PI, 2) - 4 * Math.PI)).toBeLessThan(1e-12);
  });
  it('expected r for 1s is 1.5 a_0', () => {
    expect(expectedR(1, 0)).toBe(1.5);
  });
  it('expected r for 2p is 5 a_0', () => {
    expect(expectedR(2, 1)).toBe(5);
  });
});
