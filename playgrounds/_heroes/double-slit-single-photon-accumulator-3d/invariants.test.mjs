import { describe, it, expect } from 'vitest';
import { intensity, samplePhoton, fringeSpacing, fringeMaximum } from './sim.js';

function lcg(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
  };
}

describe('double-slit-single-photon-accumulator-3d', () => {
  it('intensity at y=0 equals 1 (central maximum)', () => {
    expect(intensity(0, { d: 0.5, a: 0.1, lambda: 0.4, D: 10 })).toBeCloseTo(1, 9);
  });

  it('intensity at the first interference minimum is 0 (exact angle)', () => {
    // First minimum at d sin(theta) = lambda/2, so sin(theta) = lambda/(2d),
    // and y = D tan(asin(lambda/(2d))).
    const d = 0.5, lambda = 0.4, D = 10;
    const sinT = lambda / (2 * d);
    const y1 = D * sinT / Math.sqrt(1 - sinT * sinT);
    expect(intensity(y1, { d, a: 0.05, lambda, D })).toBeCloseTo(0, 5);
  });

  it('fringeSpacing = lambda * D / d', () => {
    expect(fringeSpacing(0.5, 0.4, 10)).toBeCloseTo(0.4 * 10 / 0.5, 12);
  });

  it('m-th fringe maximum at y = m * lambda * D / d', () => {
    expect(fringeMaximum(2, 0.5, 0.4, 10)).toBeCloseTo(2 * 0.4 * 10 / 0.5, 12);
  });

  it('intensity is symmetric about y=0', () => {
    const opts = { d: 0.7, a: 0.15, lambda: 0.5, D: 12 };
    for (const y of [0.3, 0.8, 1.5]) {
      expect(intensity(y, opts)).toBeCloseTo(intensity(-y, opts), 9);
    }
  });

  it('samplePhoton returns y within [-yRange, yRange]', () => {
    const rng = lcg(0xC0FFEE);
    for (let i = 0; i < 200; i += 1) {
      const y = samplePhoton(rng, { d: 0.5, a: 0.1, lambda: 0.4, D: 10, yRange: 4 });
      expect(y).toBeGreaterThanOrEqual(-4);
      expect(y).toBeLessThanOrEqual(4);
    }
  });

  it('5000-sample histogram has a peak at y=0 (central maximum)', () => {
    const rng = lcg(0xC0FFEE);
    const NBINS = 80;
    const hist = new Uint32Array(NBINS);
    const opts = { d: 0.5, a: 0.1, lambda: 0.4, D: 10, yRange: 4 };
    for (let i = 0; i < 5000; i += 1) {
      const y = samplePhoton(rng, opts);
      const bin = Math.floor((y / 4 + 1) * 0.5 * NBINS);
      if (bin >= 0 && bin < NBINS) hist[bin] += 1;
    }
    // Find bin of maximum and assert it's near the center (bin 40 = y=0)
    let maxBin = 0, maxC = 0;
    for (let k = 0; k < NBINS; k += 1) if (hist[k] > maxC) { maxC = hist[k]; maxBin = k; }
    expect(Math.abs(maxBin - 40)).toBeLessThanOrEqual(2);
  });

  it('larger d gives narrower fringe spacing', () => {
    const s1 = fringeSpacing(0.3, 0.4, 10);
    const s2 = fringeSpacing(0.8, 0.4, 10);
    expect(s2).toBeLessThan(s1);
  });

  it('larger lambda gives wider fringe spacing', () => {
    const s1 = fringeSpacing(0.5, 0.3, 10);
    const s2 = fringeSpacing(0.5, 0.7, 10);
    expect(s2).toBeGreaterThan(s1);
  });

  it('intensity never exceeds 1 (envelope * fringes max = 1*1)', () => {
    for (let i = 0; i < 200; i += 1) {
      const y = (i - 100) * 0.05;
      const I = intensity(y, { d: 0.5, a: 0.1, lambda: 0.4, D: 10 });
      expect(I).toBeLessThanOrEqual(1.0001);
    }
  });
});
