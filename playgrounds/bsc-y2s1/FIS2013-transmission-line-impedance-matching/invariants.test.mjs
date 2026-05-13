// Transmission-line invariants.
// (a) Matched load (Z_L = Z_0): Gamma = 0, VSWR = 1, full power transfer.
// (b) Open (Z_L -> infinity): Gamma -> 1, VSWR -> infinity, no power transfer.
// (c) Short (Z_L = 0): Gamma = -1, VSWR -> infinity.
// (d) Power delivered + reflected = 1.
// (e) Return-loss infinite at perfect match.

import { describe, it, expect } from 'vitest';
import {
  reflection, vswr, powerDelivered, returnLossDb, isMatched,
} from './sim.js';

describe('transmission-line-impedance-matching', () => {
  it('matched load Z_L = Z_0 gives Gamma = 0', () => {
    expect(Math.abs(reflection(50, 50))).toBeLessThan(1e-15);
  });

  it('open circuit Z_L = inf gives Gamma -> 1', () => {
    const g = reflection(1e9, 50);
    expect(g).toBeGreaterThan(0.999);
  });

  it('short circuit Z_L = 0 gives Gamma = -1', () => {
    expect(Math.abs(reflection(0, 50) + 1)).toBeLessThan(1e-15);
  });

  it('VSWR = 1 at matched load', () => {
    expect(Math.abs(vswr(50, 50) - 1)).toBeLessThan(1e-12);
  });

  it('VSWR for 100 Ohm into 50 Ohm: |Gamma| = 1/3, VSWR = 2', () => {
    const v = vswr(100, 50);
    expect(Math.abs(v - 2)).toBeLessThan(1e-12);
  });

  it('power balance: P_delivered + Gamma^2 = 1', () => {
    for (const ZL of [25, 75, 100, 200, 500]) {
      const g = reflection(ZL, 50);
      const Pd = powerDelivered(ZL, 50);
      expect(Math.abs(Pd + g * g - 1)).toBeLessThan(1e-12);
    }
  });

  it('returnLoss is Infinity at perfect match', () => {
    expect(returnLossDb(50, 50)).toBe(Infinity);
  });

  it('returnLoss for VSWR = 2 is approximately 9.54 dB', () => {
    const rl = returnLossDb(100, 50);
    expect(Math.abs(rl - 9.5424)).toBeLessThan(0.001);
  });

  it('isMatched within 1 percent at small mismatch', () => {
    expect(isMatched(50, 50)).toBe(true);
    expect(isMatched(50.1, 50)).toBe(true);
    expect(isMatched(75, 50)).toBe(false);
  });
});
