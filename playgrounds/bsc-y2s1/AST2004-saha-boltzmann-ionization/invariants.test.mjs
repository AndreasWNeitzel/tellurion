// Saha equation invariants.
// (a) ionization fraction monotonic in T.
// (b) Fully ionized at very high T (x -> 1).
// (c) Neutral at very low T (x -> 0).
// (d) Quadratic identity: x^2 + R x - R = 0 satisfied exactly.
// (e) Bisection-found T_ion has x ~ 0.5.
// (f) Higher density shifts T_ion upward (more ions to ionize at fixed Saha factor).

import { describe, it, expect } from 'vitest';
import {
  ionizationFraction, ionizationTemp, sahaRatioPerM3,
  CHI_H_EV, KB_EV_K, boltzmannFraction, balmerStrength,
} from './sim.js';

describe('Boltzmann + Balmer', () => {
  it('boltzmannFraction is a normalized distribution and rises with T', () => {
    let s = 0;
    for (let n = 1; n <= 12; n += 1) s += boltzmannFraction(n, 9000);
    expect(s).toBeCloseTo(1, 6);
    expect(boltzmannFraction(2, 6000)).toBeLessThan(boltzmannFraction(2, 12000));
    expect(boltzmannFraction(1, 4000)).toBeGreaterThan(0.99); // ground dominates when cool
  });

  it('Balmer line strength peaks at intermediate (A-star) temperature', () => {
    const n = 1e20;                                  // stellar photosphere-ish
    const peak = balmerStrength(9500, n);
    expect(peak).toBeGreaterThan(balmerStrength(4000, n));
    expect(peak).toBeGreaterThan(balmerStrength(30000, n));
    // Scan: argmax is between 7000 and 13000 K.
    let bT = 0, bV = 0;
    for (let T = 3000; T <= 40000; T += 250) {
      const v = balmerStrength(T, n);
      if (v > bV) { bV = v; bT = T; }
    }
    expect(bT).toBeGreaterThan(7000);
    expect(bT).toBeLessThan(13000);
  });
});

describe('saha-boltzmann-ionization', () => {
  it('ionization fraction is monotonic in T at fixed density', () => {
    const n = 1e22;
    const x1 = ionizationFraction(3000, n);
    const x2 = ionizationFraction(10000, n);
    const x3 = ionizationFraction(50000, n);
    expect(x1).toBeLessThan(x2);
    expect(x2).toBeLessThan(x3);
  });

  it('high temperature gives x ~ 1', () => {
    const x = ionizationFraction(1e6, 1e22);
    expect(x).toBeGreaterThan(0.99);
  });

  it('low temperature gives x ~ 0', () => {
    const x = ionizationFraction(1000, 1e22);
    expect(x).toBeLessThan(1e-3);
  });

  it('quadratic identity x^2 + R x - R = 0 satisfied', () => {
    const T = 8000, n = 1e22;
    const x = ionizationFraction(T, n);
    const R = sahaRatioPerM3(T) / n;
    const residual = x * x + R * x - R;
    expect(Math.abs(residual)).toBeLessThan(1e-12 * Math.max(1, R));
  });

  it('bisection finds T_ion with x ~ 0.5', () => {
    const n = 1e22;
    const Tion = ionizationTemp(n);
    const x = ionizationFraction(Tion, n);
    expect(Math.abs(x - 0.5)).toBeLessThan(0.005);
  });

  it('higher density shifts T_ion upward', () => {
    const T1 = ionizationTemp(1e20);
    const T2 = ionizationTemp(1e25);
    expect(T2).toBeGreaterThan(T1);
  });

  it('Saha ratio grows exponentially with T at fixed density', () => {
    const r1 = sahaRatioPerM3(5000);
    const r2 = sahaRatioPerM3(20000);
    expect(r2 / r1).toBeGreaterThan(1e10);
  });

  it('T_ion at solar photosphere density (~1e23 /m^3) is roughly 8000-20000 K', () => {
    const Tion = ionizationTemp(1e23);
    expect(Tion).toBeGreaterThan(7000);
    expect(Tion).toBeLessThan(20000);
  });
});
