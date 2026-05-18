import { describe, it, expect } from 'vitest';
import {
  HBAR, C, casimirPressure, casimirEnergyPerArea, forcePerArea,
  modeWavenumber, modeWavelength, modeFits, modeCountBelow, pressureCurve,
} from './sim.js';

describe('casimir-effect-zero-point-energy invariants', () => {
  it('the Casimir pressure is 1.3e-3 Pa at 1 micron (1%)', () => {
    const P = casimirPressure(1e-6);
    expect(P).toBeGreaterThan(1.30e-3 * 0.99);
    expect(P).toBeLessThan(1.30e-3 * 1.01);
    expect(P).toBeCloseTo(Math.PI ** 2 * HBAR * C / (240 * 1e-24), 12); // closed form
  });

  it('the pressure scales as d^-4 to 0.1% (log-log slope -4)', () => {
    expect(casimirPressure(1e-6) / casimirPressure(2e-6)).toBeCloseTo(16, 6);   // 2^4
    for (const [d1, d2] of [[0.5e-6, 1e-6], [1e-6, 3e-6], [2e-6, 5e-6]]) {
      const ratio = casimirPressure(d1) / casimirPressure(d2);
      expect(ratio).toBeCloseTo((d2 / d1) ** 4, 6);
    }
    const c = pressureCurve(1e-7, 1e-5, 50);
    const slope = (Math.log(c.P[40]) - Math.log(c.P[10]))
      / (Math.log(c.d[40]) - Math.log(c.d[10]));
    expect(slope).toBeCloseTo(-4, 3);
  });

  it('the energy per area is negative and scales as d^-3', () => {
    expect(casimirEnergyPerArea(1e-6)).toBeLessThan(0);                  // binding
    expect(Math.abs(casimirEnergyPerArea(1e-6)) / Math.abs(casimirEnergyPerArea(2e-6)))
      .toBeCloseTo(8, 6);                                                // 2^3
    expect(casimirEnergyPerArea(1e-6)).toBeCloseTo(-(Math.PI ** 2) * HBAR * C / (720 * 1e-18), 12);
  });

  it('the force is attractive and equals -dE/dd in magnitude', () => {
    for (const d of [0.3e-6, 1e-6, 4e-6]) {
      const F = forcePerArea(d);
      expect(F).toBeLessThan(0);                                         // attractive
      expect(Math.abs(F) / casimirPressure(d)).toBeCloseTo(1, 4);        // F = -dE/dd
    }
  });

  it('only k_n = n pi / d modes are allowed; a mode fits iff lambda <= 2 d', () => {
    expect(modeWavenumber(1, 1e-6)).toBeCloseTo(Math.PI / 1e-6, 6);
    expect(modeWavenumber(3, 1e-6) / modeWavenumber(1, 1e-6)).toBeCloseTo(3, 12);
    expect(modeWavelength(1, 1e-6)).toBeCloseTo(2e-6, 12);               // n=1: lambda = 2d
    expect(modeFits(1.9e-6, 1e-6)).toBe(true);                           // 1.9 <= 2
    expect(modeFits(2.1e-6, 1e-6)).toBe(false);                          // excluded (red)
    // more modes fit in a wider gap (count ~ proportional to d)
    expect(modeCountBelow(1e8, 2e-6)).toBeGreaterThan(modeCountBelow(1e8, 1e-6));
    expect(modeCountBelow(1e8, 2e-6) / modeCountBelow(1e8, 1e-6)).toBeCloseTo(2, 1);
  });

  it('squeezing the plates raises the pressure steeply (vacuum push)', () => {
    expect(casimirPressure(0.5e-6)).toBeGreaterThan(casimirPressure(1e-6));
    expect(casimirPressure(0.1e-6) / casimirPressure(1e-6)).toBeCloseTo(1e4, 0); // 10^4
  });

  it('deterministic: identical inputs reproduce the pressure and curve', () => {
    expect(casimirPressure(1.234e-6)).toBe(casimirPressure(1.234e-6));
    const a = pressureCurve(1e-7, 1e-5, 40), b = pressureCurve(1e-7, 1e-5, 40);
    for (let i = 0; i <= 40; i += 1) expect(a.P[i]).toBe(b.P[i]);
  });
});
