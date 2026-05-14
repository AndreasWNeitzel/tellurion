// Fermi surface 2D invariants.
// (a) Dispersion bottom at (0, 0): E = -4 t.
// (b) Dispersion top at (pi, pi): E = +4 t.
// (c) Half-filling Fermi energy ~ 0 (van Hove).
// (d) Empty filling: E_F = -4t (bottom).
// (e) Full filling: E_F = +4t (top).
// (f) Density of states sums to N^2 sites.

import { describe, it, expect } from 'vitest';
import {
  dispersion, fermiEnergyAtFilling, densityOfStates, fermiCircleK,
} from './sim.js';

describe('fermi-surface-2d-square', () => {
  it('dispersion bottom at (0, 0): E = -4 t', () => {
    expect(Math.abs(dispersion(0, 0, 1) + 4)).toBeLessThan(1e-12);
  });

  it('dispersion top at (pi, pi): E = +4 t', () => {
    expect(Math.abs(dispersion(Math.PI, Math.PI, 1) - 4)).toBeLessThan(1e-12);
  });

  it('half-filling Fermi energy is ~ 0 (van Hove)', () => {
    const Ef = fermiEnergyAtFilling(0.5, 1, 100);
    expect(Math.abs(Ef)).toBeLessThan(0.1);
  });

  it('empty filling Fermi energy ~ -4t', () => {
    const Ef = fermiEnergyAtFilling(0.001, 1, 100);
    expect(Ef).toBeLessThan(-3.9);
  });

  it('full filling Fermi energy ~ +4t', () => {
    const Ef = fermiEnergyAtFilling(0.999, 1, 100);
    expect(Ef).toBeGreaterThan(3.9);
  });

  it('DOS histogram sums to total grid points', () => {
    const { bins, total } = densityOfStates(1, 50, 30);
    let sum = 0;
    for (const b of bins) sum += b;
    expect(sum).toBe(total);
  });

  it('continuum fermiCircleK at f = 0.01 is small', () => {
    expect(fermiCircleK(0.01)).toBeLessThan(0.4);
  });

  it('continuum fermiCircleK at f = 0.5 equals sqrt(2 pi)', () => {
    expect(Math.abs(fermiCircleK(0.5) - Math.sqrt(2 * Math.PI))).toBeLessThan(1e-12);
  });
});
