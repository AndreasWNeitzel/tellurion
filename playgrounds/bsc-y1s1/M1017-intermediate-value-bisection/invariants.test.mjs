// Invariants for bisection: the sign change is preserved, the bracket halves each
// step, the iterate converges to the true root, and the error obeys the
// (b0 - a0)/2^k bound.

import { describe, it, expect } from 'vitest';
import { FUNCS, bracketsRoot, width, midpoint, bisectStep, run } from './sim.js';

describe('The initial brackets contain a sign change', () => {
  for (const k of Object.keys(FUNCS)) {
    it(`${k}: f(a0) and f(b0) have opposite signs`, () => {
      expect(bracketsRoot(FUNCS[k], FUNCS[k].a0, FUNCS[k].b0)).toBe(true);
    });
  }
});

describe('Bisection preserves the bracket and halves it', () => {
  it('every step keeps the sign change', () => {
    const fn = FUNCS.cubic; let s = { a: fn.a0, b: fn.b0 };
    for (let i = 0; i < 25; i += 1) { s = bisectStep(fn, s); expect(fn.f(s.a) * fn.f(s.b)).toBeLessThanOrEqual(1e-12); }
  });
  it('the width halves exactly each step', () => {
    const fn = FUNCS.sqrt2; let s = { a: fn.a0, b: fn.b0 }; let w = width(s);
    for (let i = 0; i < 20; i += 1) { s = bisectStep(fn, s); expect(width(s)).toBeCloseTo(w / 2, 12); w = width(s); }
  });
});

describe('The iterate converges to the true root', () => {
  for (const k of Object.keys(FUNCS)) {
    it(`${k}: the result matches the known root`, () => {
      const fn = FUNCS[k]; const r = run(fn, fn.a0, fn.b0, 1e-10, 80);
      expect(r.root).toBeCloseTo(fn.root, 7);
    });
  }
  it('sqrt2 recovers the square root of two', () => {
    const r = run(FUNCS.sqrt2, FUNCS.sqrt2.a0, FUNCS.sqrt2.b0, 1e-12, 80);
    expect(r.root).toBeCloseTo(Math.SQRT2, 10);
  });
});

describe('The error obeys the halving bound', () => {
  it('|m_k - root| <= (b0 - a0) / 2^k', () => {
    const fn = FUNCS.cubic; let s = { a: fn.a0, b: fn.b0 }; const w0 = width(s);
    for (let k = 1; k <= 20; k += 1) { s = bisectStep(fn, s); expect(Math.abs(midpoint(s) - fn.root)).toBeLessThanOrEqual(w0 / Math.pow(2, k) + 1e-12); }
  });
});
