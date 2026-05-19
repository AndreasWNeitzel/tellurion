// Stellar habitable-zone invariants, tested directly on sim.js (the same
// closed forms the playground renders). Stefan-Boltzmann energy balance,
// inverse-square-law scalings, and the habitable-zone bounds. Exact, no
// tautologies.

import { describe, it, expect } from 'vitest';
import {
  luminosity, Teq, radiusAtT, hzBounds, inHZ,
  T_SUN_EFF, T_INNER, T_OUTER,
} from './sim.js';

describe('stellar luminosity (solar units)', () => {
  it('L = R^2 (Teff/Tsun)^4; the Sun is exactly 1', () => {
    expect(luminosity(T_SUN_EFF, 1)).toBeCloseTo(1, 12);
    expect(luminosity(T_SUN_EFF, 2)).toBeCloseTo(4, 12);          // R^2
    expect(luminosity(2 * T_SUN_EFF, 1)).toBeCloseTo(16, 12);      // Teff^4
  });
});

describe('equilibrium temperature', () => {
  it('Earth: T_eq(1 AU, Sun, A=0.3) ~ 254 K (energy balance)', () => {
    expect(Teq(1, T_SUN_EFF, 1, 0.3)).toBeCloseTo(254, 0);
  });

  it('inverse-square law: T_eq ~ 1/sqrt(a), so 4x distance halves it', () => {
    const t1 = Teq(1, T_SUN_EFF, 1, 0);
    const t4 = Teq(4, T_SUN_EFF, 1, 0);
    expect(t4).toBeCloseTo(t1 / 2, 9);
  });

  it('albedo: T_eq scales as (1 - A)^{1/4}', () => {
    const t0 = Teq(1, T_SUN_EFF, 1, 0);
    const tA = Teq(1, T_SUN_EFF, 1, 0.75);
    expect(tA).toBeCloseTo(t0 * Math.pow(0.25, 0.25), 9);
  });

  it('hotter or bigger star raises T_eq at fixed orbit', () => {
    const base = Teq(1, T_SUN_EFF, 1, 0.3);
    expect(Teq(1, 1.5 * T_SUN_EFF, 1, 0.3)).toBeGreaterThan(base);
    expect(Teq(1, T_SUN_EFF, 2, 0.3)).toBeGreaterThan(base);
  });
});

describe('habitable zone', () => {
  it('the HZ edges are exactly where T_eq = 273 K and 200 K', () => {
    const { rIn, rOut } = hzBounds(T_SUN_EFF, 1, 0.3);
    expect(Teq(rIn, T_SUN_EFF, 1, 0.3)).toBeCloseTo(T_INNER, 6);
    expect(Teq(rOut, T_SUN_EFF, 1, 0.3)).toBeCloseTo(T_OUTER, 6);
    expect(rIn).toBeLessThan(rOut);
  });

  it('HZ radius scales as sqrt(L): a 4x more luminous star pushes it 2x out', () => {
    const a = hzBounds(T_SUN_EFF, 1, 0).rIn;
    const b = hzBounds(2 * T_SUN_EFF, 1, 0).rIn;   // L x 16 -> sqrt -> x4
    expect(b / a).toBeCloseTo(4, 6);
  });

  it('inHZ is consistent with the bounds and the temperature window', () => {
    const { rIn, rOut } = hzBounds(T_SUN_EFF, 1, 0.3);
    const mid = 0.5 * (rIn + rOut);
    expect(inHZ(mid, T_SUN_EFF, 1, 0.3)).toBe(true);
    expect(inHZ(0.5 * rIn, T_SUN_EFF, 1, 0.3)).toBe(false);
    expect(inHZ(2 * rOut, T_SUN_EFF, 1, 0.3)).toBe(false);
    const Tm = Teq(mid, T_SUN_EFF, 1, 0.3);
    expect(Tm).toBeGreaterThan(T_OUTER);
    expect(Tm).toBeLessThan(T_INNER);
  });
});

describe('determinism', () => {
  it('pure functions reproduce identical outputs', () => {
    expect(Teq(1.7, 4200, 0.6, 0.25)).toBe(Teq(1.7, 4200, 0.6, 0.25));
    expect(radiusAtT(255, 4200, 0.6, 0.25)).toBe(radiusAtT(255, 4200, 0.6, 0.25));
  });
});
