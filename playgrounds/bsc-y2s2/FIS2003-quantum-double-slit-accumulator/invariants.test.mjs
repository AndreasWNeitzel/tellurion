// Quantum double slit: fringe spacing lambda L / d, visibility going
// from 1 (no detector) to 0 (full which-path), Born-rule sampling
// converging to P(y), the single-slit envelope zeros, symmetry, and
// seed determinism.

import { describe, it, expect } from 'vitest';
import {
  intensity, fringeSpacing, envelopeFirstMin,
  sampleScreen, histogram, visibility, cdf,
} from './sim.js';

const P = (over = {}) => ({ lambda: 5e-7, L: 2, d: 1e-4, a: 2e-5, gamma: 1, ...over });

describe('quantum-double-slit-accumulator invariants', () => {
  it('fringe spacing equals lambda L / d (within 1%)', () => {
    const p = P();
    const dy = fringeSpacing(p);
    // at gamma = 1 the fringe minima are exact zeros at y = (m+1/2) dy;
    // the envelope cannot move a zero, so consecutive zeros are exactly
    // dy apart (an envelope-bias-free measurement)
    const findMin = (yc) => {
      let best = yc, bv = Infinity;
      for (let y = yc - 0.45 * dy; y <= yc + 0.45 * dy; y += dy / 6000) { const I = intensity(y, p); if (I < bv) { bv = I; best = y; } }
      return best;
    };
    const z0 = findMin(0.5 * dy), z1 = findMin(1.5 * dy), z2 = findMin(2.5 * dy);
    expect(Math.abs((z1 - z0) - dy) / dy).toBeLessThan(0.01);
    expect(Math.abs((z2 - z1) - dy) / dy).toBeLessThan(0.01);
  });

  it('visibility is 1 without a detector and 0 with full which-path', () => {
    expect(visibility(P({ gamma: 1 }))).toBeGreaterThan(0.98);
    expect(visibility(P({ gamma: 0 }))).toBeLessThan(0.02);
    // monotone increasing in gamma, and the cos model gives V ~ gamma
    let prev = -1;
    for (const g of [0, 0.25, 0.5, 0.75, 1]) {
      const V = visibility(P({ gamma: g }));
      expect(V).toBeGreaterThan(prev); prev = V;
      expect(Math.abs(V - g)).toBeLessThan(0.05);
    }
  });

  it('Born sampling converges to P(y) (KS test) and is seed-deterministic', () => {
    const p = P(), Y = 3 * envelopeFirstMin(p);
    const s = sampleScreen(p, 60000, Y, 0xC0FFEE);
    const sorted = Array.from(s).sort((x, y) => x - y);
    // Kolmogorov-Smirnov against the analytic CDF (binning-free)
    let D = 0;
    for (let i = 0; i < sorted.length; i += 80) {
      const F = cdf(sorted[i], p, Y);
      D = Math.max(D, Math.abs(F - i / sorted.length), Math.abs((i + 1) / sorted.length - F));
    }
    expect(D).toBeLessThan(0.02);                          // 1.36/sqrt(N) ~ 0.0056
    const s2 = sampleScreen(p, 5000, Y, 0xC0FFEE), s3 = sampleScreen(p, 5000, Y, 0xC0FFEE);
    expect(Array.from(s2)).toEqual(Array.from(s3));        // deterministic
    const s4 = sampleScreen(p, 5000, Y, 999);
    expect(Array.from(s4)).not.toEqual(Array.from(s2));
    expect(histogram(s2, 10, Y).reduce((a, b) => a + b, 0)).toBe(5000);
  });

  it('single-slit envelope vanishes at y = m lambda L / a', () => {
    const p = P();
    const ym = envelopeFirstMin(p);
    expect(intensity(ym, p)).toBeLessThan(1e-3 * intensity(0, p));
    expect(intensity(2 * ym, p)).toBeLessThan(1e-3 * intensity(0, p));
  });

  it('the pattern is symmetric with a central maximum', () => {
    const p = P();
    for (const y of [3e-4, 7e-4, 1.1e-3]) expect(intensity(y, p)).toBeCloseTo(intensity(-y, p), 9);
    const dy = fringeSpacing(p);
    expect(intensity(0, p)).toBeGreaterThan(intensity(dy / 2, p));   // bright centre
  });

  it('fringe spacing scales correctly with lambda, L and d', () => {
    const base = fringeSpacing(P());
    expect(fringeSpacing(P({ lambda: 1e-6 })) / base).toBeCloseTo(2, 9);
    expect(fringeSpacing(P({ L: 4 })) / base).toBeCloseTo(2, 9);
    expect(fringeSpacing(P({ d: 2e-4 })) / base).toBeCloseTo(0.5, 9);
  });
});
