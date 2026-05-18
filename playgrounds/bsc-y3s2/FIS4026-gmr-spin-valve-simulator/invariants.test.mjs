import { describe, it, expect } from 'vitest';
import {
  rParallel, rAntiparallel, gmrRatio, channelAsymmetry,
  tmrJulliere, tmrResistances, hysteresisLoop,
} from './sim.js';

describe('gmr-spin-valve-simulator invariants', () => {
  it('parallel resistance is always below antiparallel (two-current AM-HM)', () => {
    for (const [ru, rd] of [[1, 3], [2, 5], [1, 1.001], [0.5, 4], [10, 1]]) {
      expect(rParallel(ru, rd)).toBeLessThan(rAntiparallel(ru, rd));
    }
    // equality only when the channels are symmetric
    expect(rParallel(2, 2)).toBeCloseTo(rAntiparallel(2, 2), 12);
  });

  it('the GMR ratio is non-negative, zero only for symmetric channels, and matches beta^2/(1-beta^2)', () => {
    expect(gmrRatio(3, 3)).toBeCloseTo(0, 12);
    for (const [ru, rd] of [[1, 2], [1, 4], [2, 7]]) {
      const g = gmrRatio(ru, rd);
      expect(g).toBeGreaterThan(0);
      expect(g).toBeCloseTo((ru - rd) ** 2 / (4 * ru * rd), 9);     // closed form
      const beta = channelAsymmetry(ru, rd);
      expect(g).toBeCloseTo(beta * beta / (1 - beta * beta), 9);    // = beta^2/(1-beta^2)
      expect(rAntiparallel(ru, rd) / rParallel(ru, rd)).toBeCloseTo(1 / (1 - beta * beta), 9);
    }
    // GMR grows with channel asymmetry
    expect(gmrRatio(1, 5)).toBeGreaterThan(gmrRatio(1, 2));
  });

  it('Julliere TMR = 2 P1 P2 / (1 - P1 P2), consistent with the resistance ratio (1%)', () => {
    for (const [p1, p2] of [[0.3, 0.3], [0.5, 0.4], [0.7, 0.7], [0.45, 0.6]]) {
      const tmr = tmrJulliere(p1, p2);
      const { rP, rAP } = tmrResistances(p1, p2);
      expect((rAP - rP) / rP).toBeCloseTo(tmr, 9);                   // identity (well within 1%)
      expect(rAP / rP).toBeCloseTo((1 + p1 * p2) / (1 - p1 * p2), 9);
      expect(tmrJulliere(p1, p2)).toBeCloseTo(tmrJulliere(p2, p1), 12); // symmetric
    }
    expect(tmrJulliere(0, 0.8)).toBe(0);                              // no polarization, no TMR
    expect(tmrJulliere(0.6, 0.6)).toBeGreaterThan(tmrJulliere(0.3, 0.3)); // monotone in P
    expect(tmrJulliere(0.99, 0.99)).toBeGreaterThan(50);              // half-metal divergence
  });

  it('the spin-valve loop is hysteretic: two resistance levels, multivalued in field, saturated parallel', () => {
    const N = 4000;
    const { H, R, branch } = hysteresisLoop(N, { hcFree: 0.3, hcPin: 1.2, rP: 1, rAP: 2, Hmax: 1.6 });
    let nLo = 0, nHi = 0;
    for (let i = 0; i <= N; i += 1) {
      expect(R[i] === 1 || R[i] === 2).toBe(true);                   // only R_P or R_AP
      if (R[i] === 1) nLo += 1; else nHi += 1;
    }
    expect(nLo).toBeGreaterThan(0);
    expect(nHi).toBeGreaterThan(0);                                  // an AP plateau exists
    // saturated parallel (low R) at the field extremes
    expect(R[0]).toBe(1);
    expect(R[N]).toBe(1);
    // multivalued: at H ~ +0.6 the descending branch is parallel and
    // the ascending branch is antiparallel (true hysteresis)
    const near = (target, br) => {
      let best = 1e9, idx = 0;
      for (let i = 0; i <= N; i += 1) if (branch[i] === br && Math.abs(H[i] - target) < best) { best = Math.abs(H[i] - target); idx = i; }
      return R[idx];
    };
    expect(near(0.6, -1)).toBe(1);                                   // down-sweep: parallel
    expect(near(0.6, 1)).toBe(2);                                    // up-sweep: antiparallel
  });

  it('the antiparallel window is set by Hc_pin - Hc_free (smaller free coercivity widens it)', () => {
    const apFraction = (hcFree) => {
      const { R } = hysteresisLoop(4000, { hcFree, hcPin: 1.4, rP: 1, rAP: 2, Hmax: 1.8 });
      let ap = 0; for (const r of R) if (r === 2) ap += 1;
      return ap;
    };
    // AP plateau width per branch ~ (Hc_pin - Hc_free): a softer free
    // layer (smaller Hc_free) leaves the junction antiparallel over a
    // wider field range before the pinned layer also switches.
    expect(apFraction(0.15)).toBeGreaterThan(apFraction(0.6));
  });

  it('deterministic: identical inputs reproduce the loop bit-for-bit', () => {
    const a = hysteresisLoop(1500, { hcFree: 0.3, hcPin: 1.2 });
    const b = hysteresisLoop(1500, { hcFree: 0.3, hcPin: 1.2 });
    for (let i = 0; i <= 1500; i += 1) { expect(a.R[i]).toBe(b.R[i]); expect(a.H[i]).toBe(b.H[i]); }
    expect(tmrJulliere(0.5, 0.5)).toBe(tmrJulliere(0.5, 0.5));
  });
});
