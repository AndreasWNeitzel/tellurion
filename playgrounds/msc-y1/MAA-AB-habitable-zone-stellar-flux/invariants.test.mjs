// Habitable-zone invariants.
// (a) Sun: L_star matches L_sun within 1 percent.
// (b) Earth at 1 AU receives ~1361 W/m^2.
// (c) Earth at 1 AU is in the Sun's HZ.
// (d) HZ shrinks with cooler / smaller stars.
// (e) Habitable bounds: inner < outer.

import { describe, it, expect } from 'vitest';
import {
  stellarLuminosity, fluxAt, asSEff,
  habitableInnerAu, habitableOuterAu, inHabitableZone,
  L_SUN, R_SUN, AU, T_SUN, S_SUN_W_PER_M2,
} from './sim.js';

describe('habitable-zone-stellar-flux', () => {
  it('Sun luminosity from R_sun + T_sun ~ L_sun', () => {
    const L = stellarLuminosity(R_SUN, T_SUN);
    expect(Math.abs(L - L_SUN) / L_SUN).toBeLessThan(0.01);
  });

  it('Earth at 1 AU receives ~1361 W/m^2', () => {
    const L = stellarLuminosity(R_SUN, T_SUN);
    const S = fluxAt(L, AU);
    expect(Math.abs(S - S_SUN_W_PER_M2) / S_SUN_W_PER_M2).toBeLessThan(0.01);
  });

  it('asSEff at 1 AU = 1 (modulo solar-constant rounding)', () => {
    const L = stellarLuminosity(R_SUN, T_SUN);
    const S = fluxAt(L, AU);
    expect(Math.abs(asSEff(S) - 1)).toBeLessThan(0.01);
  });

  it('Sun HZ: inner ~ 0.85 AU, outer ~ 1.68 AU (Kasting recent)', () => {
    const L = stellarLuminosity(R_SUN, T_SUN);
    expect(habitableInnerAu(L)).toBeGreaterThan(0.8);
    expect(habitableInnerAu(L)).toBeLessThan(0.9);
    expect(habitableOuterAu(L)).toBeGreaterThan(1.6);
    expect(habitableOuterAu(L)).toBeLessThan(1.8);
  });

  it('Earth at 1 AU is inside Sun HZ', () => {
    const L = stellarLuminosity(R_SUN, T_SUN);
    expect(inHabitableZone(L, 1.0)).toBe(true);
  });

  it('Mercury at 0.387 AU is inside Sun HZ? (Should be NOT)', () => {
    const L = stellarLuminosity(R_SUN, T_SUN);
    expect(inHabitableZone(L, 0.387)).toBe(false);
  });

  it('HZ shrinks for M-dwarf (T = 3000 K, R = 0.3 R_sun)', () => {
    const L_M = stellarLuminosity(0.3 * R_SUN, 3000);
    const L_sun = stellarLuminosity(R_SUN, T_SUN);
    expect(habitableOuterAu(L_M)).toBeLessThan(habitableInnerAu(L_sun));
  });

  it('inner < outer always', () => {
    for (const T of [3000, 5778, 10000]) {
      const L = stellarLuminosity(R_SUN, T);
      expect(habitableInnerAu(L)).toBeLessThan(habitableOuterAu(L));
    }
  });
});
