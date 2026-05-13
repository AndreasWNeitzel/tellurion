// Drake equation invariants.
// (a) Default Drake yields N ~ 30 (loose).
// (b) Any factor zero -> N zero.
// (c) Doubling L doubles N.
// (d) Monte Carlo returns a positive-valued array of correct length.

import { describe, it, expect } from 'vitest';
import { drakeN, monteCarlo, DEFAULTS, DRAKE_LABELS } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

describe('drake-equation-explorer', () => {
  it('canonical N ~ 30 (Carroll-Ostlie type)', () => {
    const N = drakeN(DEFAULTS);
    // 1.5 * 1 * 0.4 * 0.5 * 0.1 * 0.1 * 1e4 = 30
    expect(Math.abs(N - 30)).toBeLessThan(1e-6);
  });

  it('any single factor zero yields N = 0', () => {
    for (const k of Object.keys(DEFAULTS)) {
      const params = { ...DEFAULTS, [k]: 0 };
      expect(drakeN(params)).toBe(0);
    }
  });

  it('doubling L doubles N', () => {
    const N0 = drakeN(DEFAULTS);
    const N1 = drakeN({ ...DEFAULTS, L: DEFAULTS.L * 2 });
    expect(Math.abs(N1 - 2 * N0) / N0).toBeLessThan(1e-12);
  });

  it('Monte Carlo returns positive array of correct length', () => {
    const rng = makeRng(DEFAULT_SEED);
    const N = 100;
    const samples = monteCarlo(rng, {
      R_star: [0.5, 3], f_p: [0.5, 1], n_e: [0.1, 1],
      f_l: [0.01, 1], f_i: [0.01, 1], f_c: [0.01, 1],
      L: [1e3, 1e6],
    }, N);
    expect(samples.length).toBe(N);
    for (let i = 0; i < N; i += 1) expect(samples[i]).toBeGreaterThan(0);
  });

  it('DRAKE_LABELS has all 7 factors', () => {
    expect(DRAKE_LABELS.length).toBe(7);
    const keys = DRAKE_LABELS.map(d => d.key);
    for (const k of ['R_star', 'f_p', 'n_e', 'f_l', 'f_i', 'f_c', 'L']) {
      expect(keys).toContain(k);
    }
  });

  it('DEFAULTS gives a positive N', () => {
    expect(drakeN(DEFAULTS)).toBeGreaterThan(0);
  });

  it('Monte Carlo samples span multiple decades when ranges are wide', () => {
    const rng = makeRng(DEFAULT_SEED);
    const samples = monteCarlo(rng, {
      R_star: [0.5, 3], f_p: [0.5, 1], n_e: [0.1, 1],
      f_l: [0.01, 1], f_i: [0.01, 1], f_c: [0.01, 1],
      L: [1e2, 1e9],
    }, 1000);
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    expect(max / min).toBeGreaterThan(1e3);
  });
});
