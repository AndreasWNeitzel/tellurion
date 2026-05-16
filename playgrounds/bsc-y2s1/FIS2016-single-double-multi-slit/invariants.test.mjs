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
  slitSources, farFieldFromSources,
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

describe('Multi-slit: Huygens sub-sources match the closed form', () => {
  it('slitSources count is N*M and centred on zero', () => {
    for (const N of [1, 2, 4, 7]) {
      const ys = slitSources(N, A_DEF, D_DEF, 5);
      expect(ys.length).toBe(N * 5);
      const mean = ys.reduce((s, y) => s + y, 0) / ys.length;
      expect(mean).toBeCloseTo(0, 9);
    }
  });

  it('point-source array factor revives to 1 at every principal maximum', () => {
    for (const N of [2, 4, 6]) {
      expect(farFieldFromSources(0, N)).toBeCloseTo(1, 9);
      // M = 1: pure array factor, no single-slit envelope. The grating
      // condition sin theta = m lambda / d is an exact revival to unity.
      const peaks = principalMaxima().filter((t) => Math.abs(t) > 0.01);
      for (const p of peaks) {
        expect(farFieldFromSources(p, N, A_DEF, D_DEF, LAMBDA, 1)).toBeCloseTo(1, 6);
      }
    }
  });

  it('far-field from sources stays within [0, 1]', () => {
    for (let i = -80; i <= 80; i += 1) {
      const th = (i * Math.PI) / 180;
      const v = farFieldFromSources(th, 5);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1 + 1e-9);
    }
  });
});
