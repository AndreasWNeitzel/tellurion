// Invariants for lattice specific heat: the Dulong-Petit high-temperature limit, the
// Debye T^3 low-temperature law, the exponential suppression of the Einstein model at
// low T relative to Debye, monotonic increase, and the [0,1] bound in units of 3Nk.

import { describe, it, expect } from 'vitest';
import { einsteinC, debyeC, debyeT3, debyeIntegrand } from './sim.js';

describe('Dulong-Petit limit', () => {
  it('both models approach 1 (3Nk) at high temperature', () => {
    expect(debyeC(20 * 300, 300)).toBeCloseTo(1, 2);
    expect(einsteinC(20 * 300, 300)).toBeCloseTo(1, 2);
  });
});

describe('Debye T^3 law', () => {
  it('debyeC matches (4/5) pi^4 (T/TD)^3 at low T', () => {
    const TD = 400;
    for (const T of [TD / 30, TD / 20, TD / 15]) expect(debyeC(T, TD) / debyeT3(T, TD)).toBeCloseTo(1, 2);
  });
});

describe('Einstein falls faster than Debye at low T', () => {
  it('einsteinC << debyeC for T << TE = TD', () => {
    const T = 400 / 15;
    expect(einsteinC(T, 400)).toBeLessThan(0.2 * debyeC(T, 400));
  });
});

describe('Bounds and monotonicity', () => {
  it('both stay in [0,1] and increase with temperature', () => {
    let pd = 0, pe = 0;
    for (let T = 10; T <= 1500; T += 25) {
      const d = debyeC(T, 400), e = einsteinC(T, 320);
      expect(d).toBeGreaterThanOrEqual(-1e-9); expect(d).toBeLessThanOrEqual(1 + 1e-6);
      expect(e).toBeGreaterThanOrEqual(-1e-9); expect(e).toBeLessThanOrEqual(1 + 1e-6);
      expect(d).toBeGreaterThanOrEqual(pd - 1e-9); expect(e).toBeGreaterThanOrEqual(pe - 1e-9);
      pd = d; pe = e;
    }
  });
});

describe('Debye integrand', () => {
  it('is positive and vanishes at the origin', () => {
    expect(debyeIntegrand(0)).toBeCloseTo(0, 9);
    for (const x of [0.5, 2, 5, 10]) expect(debyeIntegrand(x)).toBeGreaterThan(0);
  });
});
