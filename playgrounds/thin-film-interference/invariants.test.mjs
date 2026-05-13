// Thin-film invariants.
// (a) Reflectance in [0, 1].
// (b) Constructive maxima at predicted wavelengths.
// (c) Zero thickness reduces to single-interface reflectance.
// (d) Periodic in film thickness with period lambda / (2 n_film).
// (e) Constructive-lambda formula.

import { describe, it, expect } from 'vitest';
import { reflectance, constructiveLambda } from './sim.js';

describe('Thin film: reflectance bounded', () => {
  it('R in [0, 1] over visible range, various d', () => {
    for (const d of [100, 200, 500, 1000]) {
      for (let lambda = 380; lambda <= 780; lambda += 10) {
        const R = reflectance(lambda, 1.33, d, 1.0, 1.5);
        expect(R).toBeGreaterThanOrEqual(0);
        expect(R).toBeLessThanOrEqual(1.0001);
      }
    }
  });
});

describe('Thin film: constructive maxima (low-high-high)', () => {
  it('at predicted lambda, R is close to a local max', () => {
    const n_film = 1.33, d = 500;
    for (let m = 3; m <= 5; m += 1) {
      const lambda = constructiveLambda(n_film, d, m, 1.0, 1.5);
      if (lambda < 380 || lambda > 780) continue;
      const R0 = reflectance(lambda, n_film, d, 1.0, 1.5);
      const Rm = reflectance(lambda - 20, n_film, d, 1.0, 1.5);
      const Rp = reflectance(lambda + 20, n_film, d, 1.0, 1.5);
      expect(R0).toBeGreaterThan(Rm * 0.99);
      expect(R0).toBeGreaterThan(Rp * 0.99);
    }
  });
});

describe('Thin film: zero thickness single-interface', () => {
  it('R(d = 0) = ((r12 + r23) / (1 + r12 r23))^2 at all wavelengths', () => {
    const n_film = 1.33, n_sub = 1.5;
    const r12 = (1 - n_film) / (1 + n_film);
    const r23 = (n_film - n_sub) / (n_film + n_sub);
    const expected = ((r12 + r23) / (1 + r12 * r23)) ** 2;
    for (const lambda of [400, 500, 600, 700]) {
      expect(reflectance(lambda, n_film, 0, 1.0, n_sub)).toBeCloseTo(expected, 6);
    }
  });
});

describe('Thin film: periodic in d', () => {
  it('reflectance(lambda, n, d) = reflectance(lambda, n, d + lambda / (2 n))', () => {
    const lambda = 550, n = 1.33;
    const period = lambda / (2 * n);
    for (const d of [100, 250, 400]) {
      const R1 = reflectance(lambda, n, d, 1.0, 1.5);
      const R2 = reflectance(lambda, n, d + period, 1.0, 1.5);
      expect(Math.abs(R1 - R2)).toBeLessThan(1e-9);
    }
  });
});

describe('Thin film: constructive formula', () => {
  it('low-high-high returns 2 n d / m', () => {
    expect(constructiveLambda(1.33, 500, 3, 1.0, 1.5)).toBeCloseTo(2 * 1.33 * 500 / 3, 9);
  });
});
