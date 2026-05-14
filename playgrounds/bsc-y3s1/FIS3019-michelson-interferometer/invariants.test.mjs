// Michelson invariants.
// (a) V(0) = 1 (perfect coherence at zero delay).
// (b) V(L_c) = 1/e (the e-folding definition).
// (c) Fringe period = lambda.
// (d) Bandwidth grows when coherence length shrinks (Heisenberg-like).

import { describe, it, expect } from 'vitest';
import {
  visibilityGaussian, intensity,
  bandwidthFromCoherence, fringesPerMicron,
} from './sim.js';

describe('michelson-interferometer', () => {
  it('V(0) = 1', () => {
    expect(Math.abs(visibilityGaussian(0, 1000) - 1)).toBeLessThan(1e-15);
  });

  it('V(L_c) = 1/e', () => {
    const Lc = 500;
    expect(Math.abs(visibilityGaussian(Lc, Lc) - 1 / Math.E)).toBeLessThan(1e-12);
  });

  it('V -> 0 for L >> L_c', () => {
    expect(visibilityGaussian(1000, 100)).toBeLessThan(1e-40);
  });

  it('intensity at L = 0: I = 1 (full coherence + on-fringe)', () => {
    expect(Math.abs(intensity(0, 500, 1000) - 1)).toBeLessThan(1e-15);
  });

  it('fringe period equals lambda in intensity', () => {
    const lam = 500;
    const I0 = intensity(0, lam, 1e9);
    const I1 = intensity(lam, lam, 1e9);
    expect(Math.abs(I0 - I1)).toBeLessThan(1e-12);
  });

  it('intensity half-fringe gives minimum', () => {
    const lam = 500;
    const I = intensity(lam / 2, lam, 1e9);
    expect(I).toBeLessThan(1e-12);
  });

  it('bandwidth grows when coherence shrinks', () => {
    expect(bandwidthFromCoherence(100)).toBeGreaterThan(bandwidthFromCoherence(1000));
  });

  it('fringesPerMicron equals 2000 / lambda_nm', () => {
    expect(fringesPerMicron(500)).toBeCloseTo(4, 12);
  });
});
