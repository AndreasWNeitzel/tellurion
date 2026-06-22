// Invariants for the grating: principal maxima at the grating equation, the N-1
// zeros and N-2 secondary maxima between principals, the 1/N sharpening, and the
// single-slit envelope zeros.

import { describe, it, expect } from 'vitest';
import { envelope, gratingFactor, intensity, orders, resolvingPower } from './sim.js';

describe('Principal maxima', () => {
  it('the grating factor reaches 1 at alpha = m pi (grating equation d sin = m lambda)', () => {
    for (const N of [3, 8, 15]) for (const m of [0, 1, 2, 3]) expect(gratingFactor(m * Math.PI, N)).toBeCloseTo(1, 6);
  });
  it('orders are at s = m lambda / d', () => {
    const o = orders(2, 0.5); // d/lambda = 4 -> orders -4..4
    expect(o.find((q) => q.m === 1).s).toBeCloseTo(0.25, 9);
    expect(o.length).toBe(9);
  });
  it('intensity is 1 at the centre and at most the envelope elsewhere', () => {
    expect(intensity(0, 6, 2, 0.5, 0.5)).toBeCloseTo(1, 6);
    for (const s of [0.1, 0.25, 0.4]) expect(intensity(s, 6, 2, 0.5, 0.5)).toBeLessThanOrEqual(envelope(Math.PI * 0.5 * s / 0.5) + 1e-9);
  });
});

describe('Between principal maxima: N-1 zeros and N-2 secondary maxima', () => {
  it('the grating factor vanishes at alpha = k pi / N (k not a multiple of N)', () => {
    const N = 6; for (let k = 1; k < N; k += 1) expect(gratingFactor(k * Math.PI / N, N)).toBeCloseTo(0, 9);
  });
  it('there are N-2 secondary maxima between the central and first principal', () => {
    const N = 7; let count = 0; const a0 = 0, a1 = Math.PI; const M = 4000;
    let prev = gratingFactor(a0 + (a1 - a0) / M, N), prev2 = gratingFactor(a0, N);
    for (let i = 2; i <= M; i += 1) { const cur = gratingFactor(a0 + (a1 - a0) * i / M, N); if (prev > prev2 && prev > cur) count += 1; prev2 = prev; prev = cur; }
    expect(count).toBe(N - 2);
  });
});

describe('Sharpening and resolving power', () => {
  it('the first zero next to a principal is at alpha = m pi + pi/N (width ~ 1/N)', () => {
    for (const N of [4, 10, 20]) expect(gratingFactor(Math.PI / N, N)).toBeCloseTo(0, 9);
  });
  it('resolving power R = m N', () => {
    expect(resolvingPower(2, 500)).toBe(1000); expect(resolvingPower(1, 10)).toBe(10);
  });
});

describe('Single-slit envelope', () => {
  it('vanishes at beta = k pi (a sin = k lambda)', () => {
    expect(envelope(Math.PI)).toBeCloseTo(0, 9); expect(envelope(2 * Math.PI)).toBeCloseTo(0, 9);
    expect(envelope(0)).toBeCloseTo(1, 9);
  });
});
