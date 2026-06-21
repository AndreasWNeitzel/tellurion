// Invariants for the Gaia parallax / distance / extinction sim: the likelihood,
// the posterior normalisation, the inversion bias, and the magnitude relations.

import { describe, it, expect } from 'vitest';
import { naiveDistanceKpc, fractionalError, likelihood, posterior, sampleNaive, distanceModulus, absMagG } from './sim.js';
import { GAIA_STARS } from './data-stars.js';

describe('Basic parallax-distance relations', () => {
  it('naive distance is 1/parallax (kpc, mas)', () => {
    expect(naiveDistanceKpc(2)).toBeCloseTo(0.5, 12);
    expect(naiveDistanceKpc(0.5)).toBeCloseTo(2.0, 12);
  });
  it('fractional error is sigma/parallax', () => {
    expect(fractionalError(0.5, 0.1)).toBeCloseTo(0.2, 12);
  });
  it('the likelihood peaks where 1/d equals the measured parallax', () => {
    const plx = 0.8, sig = 0.1, dPeak = 1 / plx;
    expect(likelihood(plx, sig, dPeak)).toBeGreaterThan(likelihood(plx, sig, dPeak * 1.2));
    expect(likelihood(plx, sig, dPeak)).toBeGreaterThan(likelihood(plx, sig, dPeak * 0.8));
  });
});

describe('Posterior is a proper normalised density', () => {
  for (const m of ['edsd', 'flat']) {
    it(`${m} prior: integral of p dd is ~1`, () => {
      const post = posterior(0.5, 0.1, { mode: m, L: 1.35 });
      const dd = post.d[1] - post.d[0];
      const area = post.p.reduce((s, v) => s + v * dd, 0);
      expect(area).toBeCloseTo(1, 1);
    });
  }
  it('the credible interval brackets the median', () => {
    const post = posterior(0.5, 0.1, { mode: 'edsd', L: 1.35 });
    expect(post.lo).toBeLessThan(post.median);
    expect(post.hi).toBeGreaterThan(post.median);
  });
});

describe('The inversion bias and the prior', () => {
  it('the EDSD posterior applies a non-trivial correction to the naive 1/parallax and stays well-behaved', () => {
    // naive distance 2 kpc; the EDSD prior (peaking at d=2L) corrects the estimate
    // (here outward, toward the larger-volume distances) and tames the tail.
    const plx = 0.5, sig = 0.2;     // f = 0.4
    const post = posterior(plx, sig, { mode: 'edsd', L: 1.35 });
    const naive = naiveDistanceKpc(plx);
    expect(Math.abs(post.median - naive) / naive).toBeGreaterThan(0.05);
    expect(post.median).toBeLessThan(post.dMax);
  });
  it('the flat-prior posterior has a heavier far tail than the EDSD posterior', () => {
    const plx = 0.5, sig = 0.2;
    const flat = posterior(plx, sig, { mode: 'flat', L: 1.35 });
    const edsd = posterior(plx, sig, { mode: 'edsd', L: 1.35 });
    expect(flat.hi).toBeGreaterThan(edsd.hi);
  });
  it('the parallax noise pushes more samples through zero as the error grows', () => {
    // deterministic pseudo-random stream
    let s = 12345;
    const u = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s % 1000000 + 1) / 1000001; };
    const nullFrac = (f) => { let n = 0; const N = 4000; for (let i = 0; i < N; i += 1) if (sampleNaive(1, f, u(), u()) === null) n += 1; return n / N; };
    const lowF = nullFrac(0.2), highF = nullFrac(0.7);
    expect(highF).toBeGreaterThan(lowF);
    expect(highF).toBeGreaterThan(0.05);    // Phi(-1/0.7) ~ 0.076
  });
});

describe('Extinction and the distance modulus', () => {
  it('distance modulus is 0 at 10 pc and 10 at 1 kpc', () => {
    expect(distanceModulus(0.01)).toBeCloseTo(0, 9);
    expect(distanceModulus(1.0)).toBeCloseTo(10, 9);
  });
  it('absolute magnitude subtracts the distance modulus and the extinction', () => {
    expect(absMagG(15, 1.0, 0.5)).toBeCloseTo(15 - 10 - 0.5, 9);
  });
});

describe('Real Gaia star data integrity', () => {
  it('every star has finite parallax, error, snr, G; A_G and BP-RP may be null', () => {
    expect(GAIA_STARS.length).toBeGreaterThan(20);
    for (const s of GAIA_STARS) {
      expect(Number.isFinite(s[0]) && s[0] > 0).toBe(true);
      expect(Number.isFinite(s[1]) && s[1] > 0).toBe(true);
      expect(Number.isFinite(s[2])).toBe(true);
      expect(Number.isFinite(s[4])).toBe(true);
      expect(s[3] === null || Number.isFinite(s[3])).toBe(true);
    }
  });
});
