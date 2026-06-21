// Floating-point pitfalls invariants.
// (a) At x = 1, naive and stable formulae agree closely.
// (b) At x = 1e-8, naive loses ~half the digits; stable stays accurate.
// (c) At x = 1e-15, naive returns 0; stable returns ~5e-31.
// (d) Quadratic naive vs stable differ on ill-conditioned input.
// (e) logspace returns exact endpoints.

import { describe, it, expect } from 'vitest';
import {
  oneMinusCosNaive, oneMinusCosStable,
  quadraticNaive, quadraticStable,
  relErr, logspace,
  ERR_PER_TICK_S, clockError, gateDisplacementMeters,
} from './sim.js';

describe('floating-point-precision-pitfalls', () => {
  it('1 - cos(1) naive and stable agree closely', () => {
    const naive = oneMinusCosNaive(1);
    const stable = oneMinusCosStable(1);
    expect(relErr(naive, stable)).toBeLessThan(1e-14);
  });

  it('1 - cos(1e-8) naive loses precision; stable stays accurate', () => {
    const x = 1e-8;
    const exact = x * x / 2; // leading Taylor term
    const naive = oneMinusCosNaive(x);
    const stable = oneMinusCosStable(x);
    expect(relErr(stable, exact)).toBeLessThan(1e-12);
    // naive is order ~1 wrong by the time we hit 1e-8
    expect(relErr(naive, exact)).toBeGreaterThan(1e-3);
  });

  it('1 - cos(1e-15) naive returns 0; stable returns positive', () => {
    const x = 1e-15;
    const naive = oneMinusCosNaive(x);
    const stable = oneMinusCosStable(x);
    expect(naive).toBe(0);
    expect(stable).toBeGreaterThan(0);
    expect(stable).toBeLessThan(1e-29);
  });

  it('quadratic with a=1, b=1e8, c=1: roots differ by sign for naive vs stable on the small root', () => {
    // Small root is ~ -1e-8; the naive (-b + sqrt) branch cancels almost completely.
    const a = 1, b = 1e8, c = 1;
    const naive = quadraticNaive(a, b, c);
    const stable = quadraticStable(a, b, c);
    const exactSmall = -c / b; // first-order Vieta
    expect(relErr(stable.rootPlus, exactSmall)).toBeLessThan(1e-10);
    // naive small root is off by tens of percent due to cancellation
    expect(relErr(naive.rootPlus, exactSmall)).toBeGreaterThan(1e-4);
  });

  it('quadratic agrees on the well-conditioned root', () => {
    const a = 1, b = 1e8, c = 1;
    const naive = quadraticNaive(a, b, c);
    const stable = quadraticStable(a, b, c);
    expect(relErr(naive.rootMinus, stable.rootMinus)).toBeLessThan(1e-12);
  });

  it('logspace returns exact endpoints', () => {
    const xs = logspace(-3, 0, 5);
    expect(xs[0]).toBeCloseTo(1e-3, 12);
    expect(xs[4]).toBeCloseTo(1e0, 12);
  });

  it('1 - cos(0) is exactly 0 in both formulae', () => {
    expect(oneMinusCosNaive(0)).toBe(0);
    expect(oneMinusCosStable(0)).toBe(0);
  });
});

describe('accumulating clock-drift model', () => {
  it('per-tick chop error is ~9.5e-8 s', () => {
    // 0.1 (inexact double) minus 209715/2097152 (exact dyadic) is the
    // truncation a 24-bit fixed-point register makes; about 9.5e-8 s per
    // 0.1 s tick.
    expect(ERR_PER_TICK_S).toBeGreaterThan(9.5e-8);
    expect(ERR_PER_TICK_S).toBeLessThan(9.6e-8);
    expect(ERR_PER_TICK_S).toBeCloseTo(9.5367e-8, 11);
  });

  it('error is zero at zero uptime and grows linearly', () => {
    expect(clockError(0)).toBe(0);
    expect(clockError(50)).toBeCloseTo(clockError(100) / 2, 12);
    expect(clockError(1) * 100).toBeCloseTo(clockError(100), 9);
  });

  it('clock error is ~0.34 s after 100 h of uptime', () => {
    expect(clockError(100)).toBeGreaterThan(0.34);
    expect(clockError(100)).toBeLessThan(0.345);
  });

  it('gate displacement at 100 h and high object speed is several hundred metres', () => {
    const m = gateDisplacementMeters(100, 1676);
    expect(m).toBeGreaterThan(500);
    expect(m).toBeLessThan(650);
  });

  it('patched software removes the drift entirely', () => {
    expect(clockError(100, true)).toBe(0);
    expect(gateDisplacementMeters(100, 1676, true)).toBe(0);
  });
});
