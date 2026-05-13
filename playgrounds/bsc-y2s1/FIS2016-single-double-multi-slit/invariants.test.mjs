// Multi-slit invariants.
// (a) I >= 0 everywhere.
// (b) I(0) = N^2 (peak intensity grows as N^2).
// (c) N = 1 matches sinc^2 envelope.
// (d) Principal maxima at sin theta = m lambda / d.
// (e) Envelope zeros at single-slit minima.
// (f) N = 8 brighter than N = 2 at first principal max.

import { describe, it, expect } from 'vitest';
import {
  intensity, principalMaxima, envelopeZeros, LAMBDA, A_DEF, D_DEF,
} from './sim.js';

describe('Multi-slit: non-negative', () => {
  it('I >= 0 everywhere for N = 1, 2, 5', () => {
    for (const N of [1, 2, 5]) {
      for (let i = -90; i <= 90; i += 1) {
        const theta = (i * Math.PI) / 180;
        expect(intensity(theta, N)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('Multi-slit: central maximum', () => {
  it('I(0, N) = N^2', () => {
    for (const N of [1, 2, 3, 5]) {
      expect(intensity(0, N)).toBeCloseTo(N * N, 6);
    }
  });
});

describe('Multi-slit: single-slit limit', () => {
  it('N = 1: I matches the sinc^2 envelope', () => {
    for (let i = 0; i < 20; i += 1) {
      const theta = (i - 10) * 0.05;
      const sin_t = Math.sin(theta);
      const beta = Math.PI * A_DEF * sin_t / LAMBDA;
      const expected = Math.abs(beta) < 1e-12 ? 1 : (Math.sin(beta) / beta) ** 2;
      expect(intensity(theta, 1)).toBeCloseTo(expected, 9);
    }
  });
});

describe('Multi-slit: principal maxima', () => {
  it('principalMaxima yields sin(theta) = m lambda / d', () => {
    const peaks = principalMaxima();
    for (const p of peaks) {
      const m = Math.round(D_DEF * Math.sin(p) / LAMBDA);
      expect(D_DEF * Math.sin(p) / LAMBDA).toBeCloseTo(m, 9);
    }
  });
});

describe('Multi-slit: envelope zeros', () => {
  it('envelopeZeros yield zero intensity for N = 1', () => {
    const zeros = envelopeZeros();
    for (const z of zeros) {
      expect(intensity(z, 1)).toBeLessThan(1e-6);
    }
  });
});

describe('Multi-slit: large-N narrowing and brightening', () => {
  it('N = 8 brighter than N = 2 at the first principal maximum', () => {
    const peaks = principalMaxima();
    const m1 = peaks.find(t => Math.abs(t) > 0.01);
    expect(intensity(m1, 8)).toBeGreaterThan(intensity(m1, 2));
  });
});
