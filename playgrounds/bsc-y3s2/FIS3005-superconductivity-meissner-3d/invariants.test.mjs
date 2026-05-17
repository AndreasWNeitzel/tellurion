// Superconductivity: the Meissner expulsion (B=0 inside, B_r=0 at
// the surface, 3/2 B0 tangential at the equator), the normal-state
// recovery above Bc or Tc, the critical-field parabola, the London
// exponential decay, the flux quantum h/2e, the type-I/II boundary
// kappa = 1/sqrt2, and the Abrikosov vortex count/spacing.

import { describe, it, expect } from 'vitest';
import {
  PHI0, fluxQuantum, criticalField, isSuperconducting, meissnerField,
  surfaceField, londonProfile, glKappa, isTypeII, vortexSpacing,
  vortexCount, Bc1, Bc2, H_PLANCK, E_CHARGE,
} from './sim.js';

const close = (a, b, t) => expect(Math.abs(a - b) / (Math.abs(b) || 1)).toBeLessThan(t);

describe('superconductivity-meissner-3d invariants', () => {
  it('Meissner: B = 0 inside the superconducting sphere', () => {
    const R = 1, B0 = 0.5;
    for (const r of [0.0, 0.3, 0.7, 0.99]) for (const th of [0, 1, 2]) {
      const f = meissnerField(r, th, R, B0, true);
      expect(f.Bmag).toBe(0);
    }
  });

  it('normal-state field penetrates fully (B = B0 uniform)', () => {
    const f = meissnerField(0.4, 0.9, 1, 0.5, false);
    close(Math.hypot(f.Br, f.Bt), 0.5, 1e-12);            // |B| = B0 everywhere
  });

  it('surface: B_r(R) = 0 for all theta; tangential 3/2 B0 at equator', () => {
    const R = 2, B0 = 0.3;
    for (const th of [0.1, 0.6, Math.PI / 2, 2.4, 3.0]) {
      const f = meissnerField(R, th, R, B0, true);
      expect(Math.abs(f.Br)).toBeLessThan(1e-12);          // normal field expelled
      close(Math.abs(f.Bt), surfaceField(th, B0), 1e-12);
    }
    close(surfaceField(Math.PI / 2, B0), 1.5 * B0, 1e-12); // equator enhancement
    close(surfaceField(0, B0), 0, 1e-12);                  // poles
  });

  it('far field tends to the uniform applied field', () => {
    const f = meissnerField(1000, 0.7, 1, 0.4, true);
    close(f.Bmag, 0.4, 1e-3);                               // dipole dies as 1/r^3
  });

  it('critical field Bc(T) = Bc0 (1 - (T/Tc)^2)', () => {
    const Bc0 = 0.08, Tc = 9.2;
    close(criticalField(Bc0, 0, Tc), Bc0, 1e-12);
    expect(criticalField(Bc0, Tc, Tc)).toBe(0);
    close(criticalField(Bc0, Tc / 2, Tc), Bc0 * 0.75, 1e-12);
    expect(criticalField(Bc0, 1.1 * Tc, Tc)).toBe(0);
    expect(isSuperconducting(0.02, Bc0, 4, Tc)).toBe(true);
    expect(isSuperconducting(0.2, Bc0, 4, Tc)).toBe(false);  // B0 > Bc
    expect(isSuperconducting(0.02, Bc0, 10, Tc)).toBe(false); // T > Tc
  });

  it('London profile decays exponentially over lambda', () => {
    const Bs = 1.0, lam = 50e-9;
    close(londonProfile(0, Bs, lam), Bs, 1e-12);
    close(londonProfile(lam, Bs, lam), Bs / Math.E, 1e-12);
    close(londonProfile(3 * lam, Bs, lam), Bs * Math.exp(-3), 1e-12);
    // integral of B dx from 0 to inf = Bs lambda (screening sheet)
    let s = 0; const n = 20000, dx = 12 * lam / n;
    for (let i = 0; i < n; i += 1) s += londonProfile((i + 0.5) * dx, Bs, lam) * dx;
    close(s, Bs * lam, 1e-3);
  });

  it('flux quantum is h / 2e', () => {
    close(fluxQuantum(), H_PLANCK / (2 * E_CHARGE), 1e-15);
    close(PHI0, 2.067833848e-15, 1e-6);
  });

  it('type-I/II boundary at kappa = 1/sqrt2; Bc1 < Bc2 for type II', () => {
    expect(isTypeII(50e-9, 100e-9)).toBe(false);            // kappa = 0.5 < 0.707
    expect(isTypeII(200e-9, 5e-9)).toBe(true);              // kappa = 40 >> 0.707
    close(glKappa(140e-9, 20e-9), 7, 1e-9);
    const lam = 140e-9, xi = 20e-9;
    expect(Bc1(lam, xi)).toBeLessThan(Bc2(xi));             // type II window
    expect(Bc1(lam, xi)).toBeGreaterThan(0);
  });

  it('Abrikosov lattice: one Phi0 per cell, spacing ~ 1/sqrt(B)', () => {
    const a1 = vortexSpacing(0.1), a2 = vortexSpacing(0.4);
    close(a2 / a1, Math.sqrt(0.1 / 0.4), 1e-9);              // a ~ B^{-1/2}
    // one flux quantum per triangular cell of area sqrt3 a^2 / 2
    const B = 0.2, a = vortexSpacing(B);
    close(B * (Math.sqrt(3) / 2) * a * a, PHI0, 1e-9);
    expect(vortexCount(0, 1)).toBe(0);
    expect(vortexCount(1e-3, 1e-6)).toBe(Math.round(1e-3 * 1e-6 / PHI0));
  });
});
