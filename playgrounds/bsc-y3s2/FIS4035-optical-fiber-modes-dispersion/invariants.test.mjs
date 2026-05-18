import { describe, it, expect } from 'vitest';
import {
  besselJ0, besselJ1, besselK0, besselK1, firstZeroJ0,
  solveLP, guidedModeCount, modeIntensity, dispersionLength, pulseWidth,
} from './sim.js';

describe('optical-fiber-modes-dispersion invariants', () => {
  it('Bessel approximations match standard values', () => {
    expect(besselJ0(0)).toBeCloseTo(1, 6);
    expect(besselJ1(0)).toBeCloseTo(0, 6);
    expect(besselJ0(1)).toBeCloseTo(0.7651976866, 4);
    expect(besselJ1(1)).toBeCloseTo(0.4400505857, 4);
    expect(besselJ0(5)).toBeCloseTo(-0.1775967713, 4);     // x > 3 branch
    expect(besselK0(1)).toBeCloseTo(0.4210244382, 4);
    expect(besselK1(1)).toBeCloseTo(0.6019072302, 4);
    expect(besselK0(3)).toBeCloseTo(0.0347395044, 4);      // x > 2 branch
  });

  it('the LP11 / single-mode cutoff is the first zero of J0, V = 2.40483 (0.1%)', () => {
    const Vc = firstZeroJ0();
    expect(Vc).toBeCloseTo(2.404826, 3);
    expect(Math.abs(Vc - 2.404826) / 2.404826).toBeLessThan(1e-3);
    expect(besselJ0(Vc)).toBeCloseTo(0, 5);
    // LP11 is guided just above the cutoff and not below it
    expect(solveLP(2.404826 + 0.05, 1, 1)).not.toBeNull();
    expect(solveLP(2.404826 - 0.05, 1, 1)).toBeNull();
  });

  it('the fibre is single-mode for V < 2.405 and multimode above', () => {
    expect(guidedModeCount(1.5)).toBe(1);                  // LP01 only
    expect(guidedModeCount(2.30)).toBe(1);
    expect(guidedModeCount(2.404826 + 0.1)).toBeGreaterThanOrEqual(2); // LP11 appears
    expect(guidedModeCount(5.0)).toBeGreaterThan(2);
  });

  it('LP01 has no cutoff and every solved mode satisfies V^2 = U^2 + W^2', () => {
    for (const V of [0.6, 1.2, 2.0, 3.5, 6.0]) {
      const m01 = solveLP(V, 0, 1);
      expect(m01).not.toBeNull();
      expect(m01.U * m01.U + m01.W * m01.W).toBeCloseTo(V * V, 6);
      expect(m01.b).toBeGreaterThan(0);
      expect(m01.b).toBeLessThan(1);
    }
  });

  it('the normalised index b rises monotonically with V toward 1 (well guided)', () => {
    let prev = -1;
    for (let i = 1; i <= 30; i += 1) {
      const V = 0.5 + 0.25 * i;
      const b = solveLP(V, 0, 1).b;
      expect(b).toBeGreaterThan(prev);                     // monotone increasing
      prev = b;
    }
    expect(solveLP(18, 0, 1).b).toBeGreaterThan(0.93);     // -> 1 at large V
  });

  it('the mode intensity is peak-normalised, continuous at the core boundary and decays in the cladding', () => {
    const mode = solveLP(3.0, 0, 1);
    expect(modeIntensity(0, mode)).toBeGreaterThan(0.99);  // LP01 peak at r=0
    const inEdge = modeIntensity(0.999, mode), outEdge = modeIntensity(1.001, mode);
    expect(Math.abs(inEdge - outEdge)).toBeLessThan(0.02); // continuous at r=a
    expect(modeIntensity(3, mode)).toBeLessThan(modeIntensity(1, mode)); // evanescent tail
    expect(modeIntensity(6, mode)).toBeLessThan(modeIntensity(3, mode));
  });

  it('Gaussian GVD broadening follows T(z) = T0 sqrt(1 + (z/L_D)^2)', () => {
    const T0 = 5, beta2 = -20;                             // ps, ps^2/km units
    const LD = dispersionLength(T0, beta2);
    expect(LD).toBeCloseTo(T0 * T0 / Math.abs(beta2), 9);
    expect(pulseWidth(0, T0, beta2)).toBeCloseTo(T0, 9);
    expect(pulseWidth(LD, T0, beta2)).toBeCloseTo(T0 * Math.SQRT2, 9);
    expect(pulseWidth(2 * LD, T0, beta2)).toBeCloseTo(T0 * Math.sqrt(5), 9);
    // asymptotically linear in z (group-delay spread)
    const big = pulseWidth(500 * LD, T0, beta2);
    expect(big / (T0 * 500)).toBeCloseTo(1, 3);
    // sign of beta2 does not change the broadening magnitude
    expect(pulseWidth(LD, T0, 20)).toBeCloseTo(pulseWidth(LD, T0, -20), 12);
  });

  it('deterministic: identical inputs reproduce the solver bit-for-bit', () => {
    const a = solveLP(4.2, 1, 1), b = solveLP(4.2, 1, 1);
    expect(a.U).toBe(b.U); expect(a.b).toBe(b.b);
    expect(pulseWidth(7.3, 4, -12)).toBe(pulseWidth(7.3, 4, -12));
  });
});
