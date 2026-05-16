import { describe, it, expect } from 'vitest';
import { densityAt, phaseAt, energyEV, expectedR, signedAmplitudeAt, phaseFullAt } from './sim.js';

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

describe('hydrogen-orbitals-3d: signed amplitude + full phase', () => {
  it('signedAmplitudeAt^2 equals densityAt (phase-independent magnitude)', () => {
    for (const [r, th, n, l, m] of [[1.2, 0.7, 2, 1, 0], [3.4, 1.9, 3, 2, 1], [2.0, 0.3, 3, 1, 0]]) {
      const a = signedAmplitudeAt(r, th, n, l, m);
      expect(a * a).toBeCloseTo(densityAt(r, th, 0.0, n, l, m), 12);
    }
  });

  it('2p_z (n=2,l=1,m=0) amplitude flips sign across the xy nodal plane', () => {
    const above = signedAmplitudeAt(2, 0.4, 2, 1, 0);          // theta < pi/2
    const below = signedAmplitudeAt(2, Math.PI - 0.4, 2, 1, 0); // theta > pi/2
    expect(Math.sign(above)).toBe(-Math.sign(below));
  });

  it('phaseFullAt is in [0, 2pi) and m!=0 winds with phi while density does not', () => {
    const p0 = phaseFullAt(3, 1.0, 0.2, 3, 2, 1);
    const p1 = phaseFullAt(3, 1.0, 0.2 + 1.3, 3, 2, 1);
    expect(p0).toBeGreaterThanOrEqual(0);
    expect(p0).toBeLessThan(2 * Math.PI + 1e-9);
    expect(Math.abs(p1 - p0)).toBeGreaterThan(1e-3);            // phase winds
    expect(densityAt(3, 1.0, 0.2, 3, 2, 1)).toBeCloseTo(densityAt(3, 1.0, 0.2 + 1.3, 3, 2, 1), 12); // density does not
  });

  it('phaseFullAt offsets by pi across a radial node (m=0 real orbital)', () => {
    // 2s has a radial node near r = 2 a_0; the sign of psi flips there.
    const inner = phaseFullAt(0.8, 0.5, 0.0, 2, 0, 0);
    const outer = phaseFullAt(5.0, 0.5, 0.0, 2, 0, 0);
    expect(Math.abs(Math.abs(inner - outer) - Math.PI)).toBeLessThan(1e-9);
  });
});
