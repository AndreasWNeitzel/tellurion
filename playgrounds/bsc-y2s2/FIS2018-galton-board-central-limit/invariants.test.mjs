// Invariants for the Galton board: the binomial mass normalizes with the right mean and
// variance, symmetry at p=1/2, the Gaussian limit, the bounded landing bin, and the
// empirical histogram converging to the binomial (small total-variation) over many drops.

import { describe, it, expect } from 'vitest';
import { binomialPMF, binomialMean, binomialVariance, gaussianPDF, dropBall, totalVariation, binomialCoeff } from './sim.js';
import { makeRng } from '../../../shared/js/render/rng.js';

describe('Binomial mass', () => {
  it('normalizes to 1 with mean Rp and variance Rp(1-p)', () => {
    const R = 16, p = 0.4;
    let s = 0, m = 0, v = 0;
    for (let k = 0; k <= R; k += 1) { const f = binomialPMF(k, R, p); s += f; m += k * f; }
    for (let k = 0; k <= R; k += 1) v += (k - m) * (k - m) * binomialPMF(k, R, p);
    expect(s).toBeCloseTo(1, 9);
    expect(m).toBeCloseTo(binomialMean(R, p), 9);
    expect(v).toBeCloseTo(binomialVariance(R, p), 9);
  });
  it('is symmetric at p = 1/2', () => {
    const R = 12;
    for (let k = 0; k <= R; k += 1) expect(binomialPMF(k, R, 0.5)).toBeCloseTo(binomialPMF(R - k, R, 0.5), 12);
  });
  it('has the correct end coefficients', () => {
    expect(binomialCoeff(10, 0)).toBe(1);
    expect(binomialCoeff(10, 1)).toBe(10);
    expect(binomialCoeff(10, 5)).toBe(252);
  });
});

describe('Gaussian limit', () => {
  it('the normal density integrates to 1', () => {
    let s = 0; const dx = 0.01; for (let x = -10; x <= 26; x += dx) s += gaussianPDF(x, 8, 4) * dx;
    expect(s).toBeCloseTo(1, 3);
  });
});

describe('Dropping balls', () => {
  it('lands within [0, R]', () => {
    const rng = makeRng(0xC0FFEE);
    for (let i = 0; i < 1000; i += 1) { const k = dropBall(20, 0.5, rng); expect(k).toBeGreaterThanOrEqual(0); expect(k).toBeLessThanOrEqual(20); }
  });
  it('the empirical histogram converges to the binomial (small total variation)', () => {
    const R = 14, p = 0.5, rng = makeRng(0xC0FFEE);
    const counts = new Array(R + 1).fill(0);
    for (let i = 0; i < 60000; i += 1) counts[dropBall(R, p, rng)] += 1;
    expect(totalVariation(counts, R, p)).toBeLessThan(0.03);
  });
});
