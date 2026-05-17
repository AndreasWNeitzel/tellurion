// Cosmic distance ladder: invariants of the four rung relations. These
// are exact closed forms, so the "invariants" are the defining algebraic
// identities and limiting cases of each rung plus ladder monotonicity.

import { describe, it, expect } from 'vitest';
import { dParallax, MVCepheid, dModulus, dHubble, ladder, H0, C_KMS, M_SNIA } from './sim.js';

describe('distance-ladder invariants', () => {
  it('parallax is the exact inverse law: d(1 mas) = 1000 pc and d ~ 1/p', () => {
    expect(dParallax(1)).toBeCloseTo(1000, 9);
    expect(dParallax(10)).toBeCloseTo(100, 9);
    expect(dParallax(2) / dParallax(8)).toBeCloseTo(4, 9);
  });

  it('distance modulus zero gives exactly 10 pc and inverts the magnitude', () => {
    expect(dModulus(5, 5)).toBeCloseTo(10, 9);
    // m - M = 5 log10(d/10): a 5-mag fainter object is 10x farther.
    expect(dModulus(20, 10) / dModulus(15, 10)).toBeCloseTo(10, 9);
  });

  it('Leavitt law has slope -2.78 mag per dex in period', () => {
    const d = MVCepheid(100) - MVCepheid(10);   // one decade in P
    expect(d).toBeCloseTo(-2.78, 9);
    expect(MVCepheid(10)).toBeCloseTo(-4.13, 6);
  });

  it('Hubble flow is linear in z and consistent with v = c z = H0 d', () => {
    expect(dHubble(0.2) / dHubble(0.1)).toBeCloseTo(2, 9);
    const dMpc = dHubble(0.1) / 1e6;
    expect(dMpc).toBeCloseTo(C_KMS * 0.1 / H0, 6);
    expect(dMpc).toBeCloseTo(428.3, 1);
  });

  it('ladder is monotonic: each rung reaches at least as far as the one below', () => {
    const d = ladder({ parallax: 100, cepheidP: 30, snApparent: 16, z: 0.05 });
    for (let i = 1; i < d.length; i += 1) expect(d[i]).toBeGreaterThan(d[i - 1]);
  });

  it('SN Ia is a brighter standard candle than a Cepheid at equal apparent mag', () => {
    const m = 18;
    expect(dModulus(m, M_SNIA)).toBeGreaterThan(dModulus(m, MVCepheid(30)));
  });
});
