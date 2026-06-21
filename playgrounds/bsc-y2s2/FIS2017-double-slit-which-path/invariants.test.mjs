// Invariants for the double slit: the visibility-distinguishability relation, the
// fringe positions, the washout with which-path information, and the convergence
// of sampled detections to the intensity.

import { describe, it, expect } from 'vitest';
import { intensity, visibility, fringeSpacing, alphaPhase, sampleDetection } from './sim.js';

describe('Complementarity', () => {
  it('V^2 + D^2 = 1', () => {
    for (const D of [0, 0.3, 0.6, 0.8, 1]) expect(visibility(D) ** 2 + D * D).toBeCloseTo(1, 9);
  });
  it('D = 0 gives full visibility, D = 1 gives none', () => {
    expect(visibility(0)).toBeCloseTo(1, 9);
    expect(visibility(1)).toBeCloseTo(0, 9);
  });
});

describe('Fringes', () => {
  it('with full visibility the bright fringes are at alpha = k pi (cos^2 = 1)', () => {
    const d = 4e-6, a = 1e-6, lam = 5e-7;
    // central maximum at theta = 0
    expect(intensity(d, a, lam, 0, 0)).toBeCloseTo(1, 9);
    // first dark fringe where alpha = pi/2 -> sin theta = lam/(2d)
    const thDark = Math.asin(lam / (2 * d));
    expect(intensity(d, a, lam, thDark, 0)).toBeLessThan(1e-6);
  });
  it('fringe spacing is lambda L / d', () => {
    expect(fringeSpacing(2e-5, 5e-7, 1)).toBeCloseTo(5e-7 * 1 / 2e-5, 12);
    expect(alphaPhase(2e-5, 5e-7, 0)).toBe(0);
  });
});

describe('Which-path washes out the fringes', () => {
  it('with full which-path information the pattern is the smooth envelope (no zeros between fringes)', () => {
    const d = 4e-6, a = 1e-6, lam = 5e-7;
    const thDark = Math.asin(lam / (2 * d));
    // at the would-be dark fringe, D=1 gives half the envelope, not zero
    expect(intensity(d, a, lam, thDark, 1)).toBeGreaterThan(0.1);
    // partial which-path is in between
    expect(intensity(d, a, lam, thDark, 0.6)).toBeGreaterThan(intensity(d, a, lam, thDark, 0));
    expect(intensity(d, a, lam, thDark, 0.6)).toBeLessThan(intensity(d, a, lam, thDark, 1));
  });
});

describe('Sampled detections follow the intensity', () => {
  it('the histogram of samples peaks at the central maximum', () => {
    let s = 12345; const rng = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s % 1000000) / 1000000; };
    const d = 4e-6, a = 1e-6, lam = 5e-7, thMax = 0.4;
    const bins = new Array(21).fill(0);
    for (let i = 0; i < 20000; i += 1) { const th = sampleDetection(d, a, lam, 0, thMax, rng); const b = Math.floor((th + thMax) / (2 * thMax) * 21); if (b >= 0 && b < 21) bins[b] += 1; }
    // the central bin (index 10) should be among the most populated
    const maxBin = Math.max(...bins);
    expect(bins[10]).toBeGreaterThan(0.5 * maxBin);
  });
});
