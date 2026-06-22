// Invariants for Maxwell-Boltzmann: normalization, the ordering and ratios of the
// three speeds, the most-probable speed as the peak, the sampler reproducing the
// moments, and the temperature/mass scaling.

import { describe, it, expect } from 'vitest';
import { mbPdf, vMostProbable, vMean, vRms, speedScale, sampleSpeed, integrate, makeRng } from './sim.js';

describe('Normalization and moments', () => {
  it('the distribution integrates to 1', () => {
    for (const [T, m] of [[1, 1], [2, 1], [1, 3]]) expect(integrate(T, m, () => 1)).toBeCloseTo(1, 3);
  });
  it('the mean and rms speeds match the closed forms', () => {
    const T = 1.7, m = 0.8;
    expect(integrate(T, m, (v) => v)).toBeCloseTo(vMean(T, m), 2);
    expect(Math.sqrt(integrate(T, m, (v) => v * v))).toBeCloseTo(vRms(T, m), 2);
  });
});

describe('The three speeds are ordered with fixed ratios', () => {
  it('v_p < v_avg < v_rms', () => {
    const T = 1.3, m = 1; expect(vMostProbable(T, m)).toBeLessThan(vMean(T, m)); expect(vMean(T, m)).toBeLessThan(vRms(T, m));
  });
  it('the ratios are sqrt(2) : sqrt(8/pi) : sqrt(3)', () => {
    const a = speedScale(2, 1);
    expect(vMostProbable(2, 1) / a).toBeCloseTo(Math.SQRT2, 9);
    expect(vMean(2, 1) / a).toBeCloseTo(Math.sqrt(8 / Math.PI), 9);
    expect(vRms(2, 1) / a).toBeCloseTo(Math.sqrt(3), 9);
  });
  it('the most probable speed is the peak of f(v)', () => {
    const T = 1.5, m = 1.1, vp = vMostProbable(T, m), h = 1e-4;
    expect(mbPdf(vp, T, m)).toBeGreaterThan(mbPdf(vp - 5 * h, T, m));
    expect(mbPdf(vp, T, m)).toBeGreaterThan(mbPdf(vp + 5 * h, T, m));
  });
});

describe('The sampler reproduces the distribution', () => {
  it('the sampled mean and rms match the analytic values', () => {
    const T = 2, m = 1; const rng = makeRng(0xC0FFEE); let s = 0, s2 = 0, N = 40000;
    for (let i = 0; i < N; i += 1) { const v = sampleSpeed(T, m, rng); s += v; s2 += v * v; }
    expect(s / N).toBeCloseTo(vMean(T, m), 1);
    expect(Math.sqrt(s2 / N)).toBeCloseTo(vRms(T, m), 1);
  });
});

describe('Temperature and mass scaling', () => {
  it('the most probable speed grows as sqrt(T) and falls as 1/sqrt(m)', () => {
    expect(vMostProbable(4, 1)).toBeCloseTo(2 * vMostProbable(1, 1), 9);
    expect(vMostProbable(1, 4)).toBeCloseTo(vMostProbable(1, 1) / 2, 9);
  });
});
