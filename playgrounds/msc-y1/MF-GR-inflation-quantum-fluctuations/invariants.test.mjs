import { describe, it, expect } from 'vitest';
import {
  POTENTIALS, epsilon, eta, nsOf, rOf, ntOf, phiEnd,
  eFolds, phiAtN, scalarAmplitude, powerSpectrum, modeHistory,
} from './sim.js';

describe('inflation-quantum-fluctuations invariants', () => {
  it('inflation ends at epsilon = 1; quadratic phi_end = sqrt(2)', () => {
    expect(epsilon(phiEnd('quadratic'), 'quadratic')).toBeCloseTo(1, 4);
    expect(phiEnd('quadratic')).toBeCloseTo(Math.SQRT2, 3);
    expect(epsilon(phiEnd('starobinsky'), 'starobinsky')).toBeCloseTo(1, 4);
  });

  it('the scalar spectral index is ~0.965 (Planck) to 1% at N ~ 57 e-folds', () => {
    for (const pot of ['quadratic', 'starobinsky']) {
      const p = phiAtN(57, pot);
      const ns = nsOf(p, pot);
      expect(Math.abs(ns - 0.965) / 0.965).toBeLessThan(0.01);          // within 1% of 0.965
      expect(ns).toBeLessThan(1);                                       // red tilt
      expect(ns).toBeGreaterThan(0.95);
    }
  });

  it('the spectrum is near scale invariant: |n_s - 1| < 0.05 over N = 50-60', () => {
    for (const pot of ['quadratic', 'starobinsky']) {
      for (const N of [50, 55, 60]) {
        expect(Math.abs(nsOf(phiAtN(N, pot), pot) - 1)).toBeLessThan(0.05);
      }
    }
    // P_s(k) ~ A_s (k/k0)^{n_s-1}: nearly flat, slightly red
    const ns = nsOf(phiAtN(57, 'starobinsky'), 'starobinsky');
    const As = scalarAmplitude(phiAtN(57, 'starobinsky'), 'starobinsky');
    expect(powerSpectrum(2, 1, ns, As) / As).toBeCloseTo(Math.pow(2, ns - 1), 9);
    expect(powerSpectrum(10, 1, ns, As)).toBeLessThan(As);              // red: drops with k
    expect(powerSpectrum(1, 1, ns, As)).toBeCloseTo(As, 9);             // pivot
  });

  it('Starobinsky predicts a far smaller tensor-to-scalar ratio than quadratic', () => {
    const rQ = rOf(phiAtN(57, 'quadratic'), 'quadratic');
    const rS = rOf(phiAtN(57, 'starobinsky'), 'starobinsky');
    expect(rQ).toBeGreaterThan(0.1);                                    // m^2 phi^2 ~ 0.14
    expect(rS).toBeLessThan(0.01);                                      // plateau: tiny
    expect(rS).toBeLessThan(rQ / 10);
  });

  it('the single-field consistency relation r = -8 n_t holds exactly', () => {
    for (const pot of ['quadratic', 'starobinsky']) {
      for (const N of [40, 57, 70]) {
        const p = phiAtN(N, pot);
        expect(rOf(p, pot)).toBeCloseTo(-8 * ntOf(p, pot), 12);
      }
    }
  });

  it('the e-fold count is consistent and slow roll holds well before the end', () => {
    for (const pot of ['quadratic', 'starobinsky']) {
      expect(eFolds(phiEnd(pot) + 1e-6, pot)).toBeLessThan(0.05);       // ~0 at the end
      const p57 = phiAtN(57, pot);
      expect(eFolds(p57, pot)).toBeCloseTo(57, 0);                      // round-trips
      expect(epsilon(p57, pot)).toBeLessThan(0.05);                     // slow roll
      expect(Math.abs(eta(p57, pot))).toBeLessThan(0.05);
    }
  });

  it('a fluctuation is stretched exponentially past the ~constant horizon and freezes', () => {
    const mh = modeHistory(1e-3, 'starobinsky', 60);
    const n = mh.lamPhys.length;
    expect(mh.lamPhys[n - 1] / mh.lamPhys[0]).toBeGreaterThan(1e20);    // ~ e^60
    // horizon stays within a small factor while lambda grows 20+ decades
    expect(mh.horizon[n - 1] / mh.horizon[0]).toBeLessThan(5);
    let exit = -1;
    for (let i = 0; i < n; i += 1) if (mh.lamPhys[i] > mh.horizon[i]) { exit = i; break; }
    expect(exit).toBeGreaterThan(0);                                    // starts subhorizon, exits
    for (let i = exit; i < n; i += 1) expect(mh.lamPhys[i]).toBeGreaterThan(mh.horizon[i]); // stays super
  });

  it('deterministic: identical inputs reproduce n_s, r and the mode history', () => {
    expect(nsOf(phiAtN(57, 'quadratic'), 'quadratic')).toBe(nsOf(phiAtN(57, 'quadratic'), 'quadratic'));
    expect(rOf(phiAtN(57, 'starobinsky'), 'starobinsky')).toBe(rOf(phiAtN(57, 'starobinsky'), 'starobinsky'));
    const a = modeHistory(2e-3, 'quadratic', 55), b = modeHistory(2e-3, 'quadratic', 55);
    expect(a.lamPhys[a.lamPhys.length - 1]).toBe(b.lamPhys[b.lamPhys.length - 1]);
  });
});
