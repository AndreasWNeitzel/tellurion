// SEMF invariants.
// (a) Peak of B/A is around A ~ 56-62 at ~8.5-8.8 MeV.
// (b) U-238 binding per nucleon ~ 7.57 MeV.
// (c) Fe-56 binding per nucleon ~ 8.6 MeV.
// (d) Optimal Z follows the valley of stability: Z ~ A/2 for light, less for heavy.

import { describe, it, expect } from 'vitest';
import {
  bindingEnergyMeV, bindingPerNucleon, optimalZ, bindingProfile, pairing, COEFFS,
} from './sim.js';

describe('semi-empirical-mass-formula', () => {
  it('peak of B/A is in the A = 50-80 range', () => {
    const profile = bindingProfile();
    let maxA = 0, maxBperA = 0;
    for (const p of profile) {
      if (p.BperA > maxBperA) { maxBperA = p.BperA; maxA = p.A; }
    }
    expect(maxA).toBeGreaterThan(50);
    expect(maxA).toBeLessThan(80);
    expect(maxBperA).toBeGreaterThan(8.4);
    expect(maxBperA).toBeLessThan(9.0);
  });

  it('Fe-56 (A = 56, Z = 26) binding per nucleon ~ 8.6 MeV', () => {
    const BperA = bindingPerNucleon(56, 26);
    expect(BperA).toBeGreaterThan(8.4);
    expect(BperA).toBeLessThan(8.9);
  });

  it('U-238 (A = 238, Z = 92) binding per nucleon ~ 7.5 MeV', () => {
    const BperA = bindingPerNucleon(238, 92);
    expect(BperA).toBeGreaterThan(7.3);
    expect(BperA).toBeLessThan(7.8);
  });

  it('Pb-208 (A = 208, Z = 82) binding per nucleon ~ 7.87 MeV', () => {
    const BperA = bindingPerNucleon(208, 82);
    expect(BperA).toBeGreaterThan(7.7);
    expect(BperA).toBeLessThan(8.1);
  });

  it('pairing: even-even positive, odd-odd negative, odd A zero', () => {
    expect(pairing(56, 26)).toBeGreaterThan(0); // Fe-56 even-even
    expect(pairing(14, 7)).toBeLessThan(0);     // N-14 odd-odd
    expect(pairing(13, 6)).toBe(0);              // C-13 odd-A
  });

  it('optimal Z scales as A/(2 + a_C A^(2/3) / 2 a_A)', () => {
    const A = 100;
    const denom = 2 + 0.5 * COEFFS.aC * Math.pow(A, 2 / 3) / COEFFS.aA;
    expect(Math.abs(optimalZ(A) - A / denom)).toBeLessThan(1e-12);
  });

  it('optimal Z is less than A/2 for heavy nuclei (valley curves down)', () => {
    expect(optimalZ(238)).toBeLessThan(238 / 2);
  });

  it('volume term dominates for large A; surface ~ A^2/3', () => {
    const A = 100;
    const vol = COEFFS.aV * A;
    const surf = COEFFS.aS * Math.pow(A, 2 / 3);
    expect(vol / surf).toBeGreaterThan(3); // about 4.0 at A = 100
  });
});
