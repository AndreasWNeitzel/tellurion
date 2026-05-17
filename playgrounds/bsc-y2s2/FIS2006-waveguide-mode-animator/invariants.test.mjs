// Rectangular waveguide: the cutoff formula, TE10 as the dominant
// mode, propagating-vs-evanescent behaviour about the cutoff, the
// TE/TM existence rules, and the guide-wavelength divergence at
// cutoff.

import { describe, it, expect } from 'vitest';
import {
  C, cutoffFreq, modeExists, propagation, dominantMode, fieldAt, modeSpectrum,
} from './sim.js';

const A = 0.02286, B = 0.01016;                 // WR-90 X-band guide (m)

describe('waveguide-mode-animator invariants', () => {
  it('cutoff frequency matches (c/2) sqrt((m/a)^2+(n/b)^2) within 0.1%', () => {
    expect(cutoffFreq(1, 0, A, B)).toBeCloseTo(C / (2 * A), 3);
    const f21 = (C / 2) * Math.sqrt((2 / A) ** 2 + (1 / B) ** 2);
    expect(Math.abs(cutoffFreq(2, 1, A, B) - f21) / f21).toBeLessThan(1e-3);
    expect(cutoffFreq(1, 0, A, B) / 1e9).toBeCloseTo(6.557, 1);   // WR-90 ~6.557 GHz
  });

  it('TE10 is the dominant (lowest-cutoff) mode for a > b', () => {
    const d = dominantMode(A, B, 'TE');
    expect([d.m, d.n]).toEqual([1, 0]);
    const f10 = cutoffFreq(1, 0, A, B);
    for (const [m, n] of [[0, 1], [2, 0], [1, 1], [2, 1]]) {
      expect(cutoffFreq(m, n, A, B)).toBeGreaterThan(f10);
    }
    expect(cutoffFreq(2, 0, A, B) / cutoffFreq(1, 0, A, B)).toBeCloseTo(2, 9);
  });

  it('propagating above cutoff, evanescent below, beta=0 at cutoff', () => {
    const fc = cutoffFreq(1, 0, A, B);
    const above = propagation(1.5 * fc, 1, 0, A, B);
    expect(above.propagating).toBe(true);
    expect(above.beta).toBeGreaterThan(0);
    expect(above.alpha).toBe(0);
    const below = propagation(0.6 * fc, 1, 0, A, B);
    expect(below.propagating).toBe(false);
    expect(below.beta).toBe(0);
    expect(below.alpha).toBeGreaterThan(0);
    expect(propagation(0.3 * fc, 1, 0, A, B).alpha).toBeGreaterThan(below.alpha);
    expect(propagation(fc * (1 + 1e-6), 1, 0, A, B).beta).toBeLessThan(propagation(1.01 * fc, 1, 0, A, B).beta);
  });

  it('guide wavelength exceeds free space and diverges at cutoff', () => {
    const fc = cutoffFreq(1, 0, A, B);
    for (const r of [1.2, 2, 4]) {
      const f = r * fc, p = propagation(f, 1, 0, A, B);
      expect(p.lambdaG).toBeGreaterThan(C / f);
    }
    expect(propagation(1.001 * fc, 1, 0, A, B).lambdaG)
      .toBeGreaterThan(propagation(2 * fc, 1, 0, A, B).lambdaG);
    expect(propagation(0.9 * fc, 1, 0, A, B).lambdaG).toBe(Infinity);
  });

  it('TE/TM existence: TM needs m,n >= 1; TE excludes (0,0)', () => {
    expect(modeExists('TE', 0, 0)).toBe(false);
    expect(modeExists('TE', 1, 0)).toBe(true);
    expect(modeExists('TE', 0, 1)).toBe(true);
    expect(modeExists('TM', 1, 0)).toBe(false);
    expect(modeExists('TM', 0, 1)).toBe(false);
    expect(modeExists('TM', 1, 1)).toBe(true);
    const spec = modeSpectrum(A, B);
    const firstTM = spec.find(s => s.type === 'TM');
    expect([firstTM.m, firstTM.n]).toEqual([1, 1]);
    expect(spec[0].type).toBe('TE');
    expect([spec[0].m, spec[0].n]).toEqual([1, 0]);
  });

  it('mode fields vanish on the conducting walls', () => {
    for (const [x, y] of [[0, B / 2], [A, B / 2], [A / 2, 0], [A / 2, B]]) {
      expect(Math.abs(fieldAt('TM', 1, 1, x, y, A, B))).toBeLessThan(1e-12);
    }
    expect(Math.abs(fieldAt('TM', 1, 1, A / 2, B / 2, A, B))).toBeGreaterThan(0.5);
    expect(Math.abs(fieldAt('TE', 1, 0, 0, B / 2, A, B))).toBeLessThan(1e-12);
    expect(Math.abs(fieldAt('TE', 1, 0, A, B / 2, A, B))).toBeLessThan(1e-12);
    expect(Math.abs(fieldAt('TE', 1, 0, A / 2, B / 2, A, B))).toBeCloseTo(1, 9);
  });

  it('cutoff scales inversely with guide size; square guide degenerate', () => {
    expect(cutoffFreq(1, 0, 2 * A, B) / cutoffFreq(1, 0, A, B)).toBeCloseTo(0.5, 9);
    expect(cutoffFreq(1, 0, A, A)).toBeCloseTo(cutoffFreq(0, 1, A, A), 6);
  });
});
