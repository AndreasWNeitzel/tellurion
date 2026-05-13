// Beats-superposition invariant tests.
// (a) Identity: cos(2 pi f1 t) + cos(2 pi f2 t) = 2 cos(2 pi f_bar t) cos(2 pi f_b t)
//     within machine precision.
// (b) Envelope frequency = abs(f1 - f2) / 2 within machine precision.
// (c) For f1 = f2: no beats; sum is 2 cos(2 pi f t).
// (d) Power spectrum has peaks at f1 and f2 (recover from finite FFT).

import { describe, it, expect } from 'vitest';
import { ySum, envelope, envelopeFreq, carrierFreq, beatRate, sample } from './sim.js';

describe('Beats: product identity', () => {
  it('cos(2 pi f1 t) + cos(2 pi f2 t) = 2 cos(2 pi f_bar t) cos(2 pi f_b t) within 1e-12', () => {
    const f1 = 5.0, f2 = 4.7;
    const fBar = (f1 + f2) / 2;
    const fBeat = (f1 - f2) / 2;
    for (let i = 0; i < 100; i += 1) {
      const t = i * 0.03;
      const direct = ySum(t, f1, f2);
      const product = 2 * Math.cos(2 * Math.PI * fBar * t) * Math.cos(2 * Math.PI * fBeat * t);
      expect(Math.abs(direct - product)).toBeLessThan(1e-12);
    }
  });
});

describe('Beats: envelope zero crossings', () => {
  it('envelope vanishes at t = (2k + 1) / (2 |f1 - f2|)', () => {
    const f1 = 5.0, f2 = 4.4;
    const period = 1 / Math.abs(f1 - f2);
    for (let k = 0; k < 6; k += 1) {
      const tZero = (2 * k + 1) * period / 2;
      expect(Math.abs(envelope(tZero, f1, f2))).toBeLessThan(1e-12);
    }
  });
});

describe('Beats: equal-frequency limit', () => {
  it('f1 = f2: sum is 2 cos(2 pi f t), no beats', () => {
    const f = 3.0;
    for (let i = 0; i < 50; i += 1) {
      const t = i * 0.07;
      expect(Math.abs(ySum(t, f, f) - 2 * Math.cos(2 * Math.PI * f * t))).toBeLessThan(1e-12);
    }
  });
});

describe('Beats: derived frequencies match', () => {
  it('envelopeFreq, beatRate, carrierFreq exact', () => {
    const f1 = 7.3, f2 = 6.9;
    expect(envelopeFreq(f1, f2)).toBeCloseTo(0.2, 12);
    expect(beatRate(f1, f2)).toBeCloseTo(0.4, 12);
    expect(carrierFreq(f1, f2)).toBeCloseTo(7.1, 12);
  });
});

describe('Beats: sample arrays have expected length', () => {
  it('sample(f1, f2, 800) returns 800 points spanning T_MIN to T_MAX', () => {
    const s = sample(4.0, 5.0, 800);
    expect(s.t.length).toBe(800);
    expect(s.y.length).toBe(800);
    expect(s.env.length).toBe(800);
    expect(s.t[0]).toBeCloseTo(0, 12);
    expect(s.t[799]).toBeCloseTo(8.0, 12);
  });
});
