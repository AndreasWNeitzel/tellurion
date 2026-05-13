// BSC capacity invariants.
// (a) H(0) = H(1) = 0; H(0.5) = 1.
// (b) C(0) = C(1) = 1; C(0.5) = 0.
// (c) Symmetry C(p) = C(1 - p).
// (d) Repetition-3 error formula 3 p^2 - 2 p^3.
// (e) Repetition error decreases with n at p < 0.5.
// (f) Simulation matches p over 100k bits.

import { describe, it, expect } from 'vitest';
import {
  binaryEntropy, capacityBSC, repetitionCodeError, simulateBSC,
} from './sim.js';

describe('BSC: binary entropy boundary values', () => {
  it('H(0) = 0, H(1) = 0, H(0.5) = 1', () => {
    expect(binaryEntropy(0)).toBeCloseTo(0, 12);
    expect(binaryEntropy(1)).toBeCloseTo(0, 12);
    expect(binaryEntropy(0.5)).toBeCloseTo(1, 12);
  });
});

describe('BSC: capacity boundary values', () => {
  it('C(0) = 1, C(0.5) = 0, C(1) = 1', () => {
    expect(capacityBSC(0)).toBeCloseTo(1, 12);
    expect(capacityBSC(0.5)).toBeCloseTo(0, 12);
    expect(capacityBSC(1)).toBeCloseTo(1, 12);
  });
});

describe('BSC: capacity symmetry', () => {
  it('C(p) = C(1 - p)', () => {
    for (const p of [0.05, 0.1, 0.2, 0.3, 0.4]) {
      expect(capacityBSC(p)).toBeCloseTo(capacityBSC(1 - p), 12);
    }
  });
});

describe('BSC: repetition-3 formula', () => {
  it('repetitionCodeError(3, p) = 3 p^2 - 2 p^3', () => {
    for (const p of [0.05, 0.1, 0.2, 0.3]) {
      const expected = 3 * p * p - 2 * p * p * p;
      expect(repetitionCodeError(3, p)).toBeCloseTo(expected, 9);
    }
  });
});

describe('BSC: repetition error decreases with n', () => {
  it('for p = 0.1, error(n) decreases monotonically through n = 11', () => {
    const p = 0.1;
    let prev = 1;
    for (const n of [3, 5, 7, 9, 11]) {
      const e = repetitionCodeError(n, p);
      expect(e).toBeLessThan(prev);
      prev = e;
    }
  });
});

describe('BSC: simulation matches empirical p', () => {
  it('simulateBSC at p = 0.2 over 100k bits gives BER within 0.02', () => {
    const r = simulateBSC({ N: 100_000, p: 0.2, seed: 0xC0FFEE });
    expect(Math.abs(r.ber - 0.2)).toBeLessThan(0.02);
  }, 30_000);
});
