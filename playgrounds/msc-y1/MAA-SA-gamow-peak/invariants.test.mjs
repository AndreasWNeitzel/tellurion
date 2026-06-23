// Gamow peak invariant tests. Each asserts a strong-form physical
// property of the closed-form integrand and the integrated rate.

import { describe, it, expect } from 'vitest';
import {
  gamowEnergy, kT_keV, integrand, peakEnergy, peakWidth, peakValue,
  rate, reducedMass, REACTIONS,
} from './sim.js';

// Numerically locate the argmax of I(E) on a fine grid.
function numericArgmax(E_G, kT) {
  const E0 = peakEnergy(E_G, kT);
  const Emax = E0 + 8 * peakWidth(E0, kT);
  let bestE = 0, bestV = -Infinity;
  for (let i = 1; i <= 20000; i += 1) {
    const E = (Emax * i) / 20000, v = integrand(E, kT, E_G);
    if (v > bestV) { bestV = v; bestE = E; }
  }
  return bestE;
}

describe('Gamow peak invariants', () => {
  it('analytic E0 matches the numeric argmax to < 0.5 percent for every reaction', () => {
    for (const r of REACTIONS) {
      const kT = kT_keV(Math.pow(10, r.defLogT));
      const E_G = gamowEnergy(r.Z1, r.Z2, r.A1, r.A2);
      const E0 = peakEnergy(E_G, kT);
      const num = numericArgmax(E_G, kT);
      expect(Math.abs(num - E0) / E0).toBeLessThan(5e-3);
    }
  });

  it('integrated rate increases monotonically with temperature', () => {
    const r = REACTIONS[0];
    const E_G = gamowEnergy(r.Z1, r.Z2, r.A1, r.A2);
    let prev = -Infinity;
    for (let lt = 6.8; lt <= 9.0; lt += 0.1) {
      const R = rate(kT_keV(Math.pow(10, lt)), E_G);
      expect(R).toBeGreaterThan(prev);
      prev = R;
    }
  });

  it('peak value equals exp(-3 E0/kT) (the analytic peak height)', () => {
    for (const r of REACTIONS) {
      const kT = kT_keV(Math.pow(10, r.defLogT));
      const E_G = gamowEnergy(r.Z1, r.Z2, r.A1, r.A2);
      const E0 = peakEnergy(E_G, kT);
      const expected = Math.exp(-3 * E0 / kT);
      const got = peakValue(E_G, kT);
      expect(Math.abs(Math.log(got) - Math.log(expected))).toBeLessThan(1e-9);
    }
  });

  it('higher nuclear charge raises the Gamow energy', () => {
    const pp = gamowEnergy(1, 1, 1, 1);
    const cc = gamowEnergy(6, 6, 12, 12);
    expect(cc).toBeGreaterThan(pp);
  });

  it('reduced mass is symmetric and below the lighter partner', () => {
    expect(reducedMass(1, 14)).toBeCloseTo(reducedMass(14, 1), 12);
    expect(reducedMass(4, 12)).toBeLessThan(4);
  });

  it('the p + p Gamow peak in the Sun is near 5.9 keV, width near 6 keV', () => {
    const kT = kT_keV(1.5e7);
    const E_G = gamowEnergy(1, 1, 1, 1);
    const E0 = peakEnergy(E_G, kT);
    const dE = peakWidth(E0, kT);
    expect(E0).toBeGreaterThan(5.0);
    expect(E0).toBeLessThan(6.8);
    expect(dE).toBeGreaterThan(5.0);
    expect(dE).toBeLessThan(7.5);
  });

  it('every reported quantity stays finite across the control range', () => {
    for (const r of REACTIONS) {
      const E_G = gamowEnergy(r.Z1, r.Z2, r.A1, r.A2);
      for (let lt = 6.6; lt <= 9.2; lt += 0.2) {
        const kT = kT_keV(Math.pow(10, lt));
        expect(Number.isFinite(peakEnergy(E_G, kT))).toBe(true);
        expect(Number.isFinite(peakWidth(peakEnergy(E_G, kT), kT))).toBe(true);
        expect(Number.isFinite(rate(kT, E_G))).toBe(true);
      }
    }
  });
});
