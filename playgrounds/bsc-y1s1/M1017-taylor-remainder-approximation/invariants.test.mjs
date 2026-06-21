// Invariants for Taylor approximation: the polynomial matches f and its
// derivatives at the centre, the remainder converges inside the radius and
// diverges outside, the geometric series has its closed form, and the Lagrange
// bound holds.

import { describe, it, expect } from 'vitest';
import { FUNCS, taylorValue, remainder, lagrangeBound } from './sim.js';

describe('The polynomial matches f and its derivatives at the centre', () => {
  it('P_n(a) = f(a) for every n', () => {
    const fn = FUNCS.exp, a = 0.7;
    for (let n = 0; n <= 8; n += 1) expect(taylorValue(fn, a, n, a)).toBeCloseTo(fn.f(a), 12);
  });
  it('the first coefficients are f(a) and f\'(a)', () => {
    const fn = FUNCS.sin, a = 0.5; const h = 1e-6;
    expect(fn.coeff(a, 0)).toBeCloseTo(fn.f(a), 12);
    expect(fn.coeff(a, 1)).toBeCloseTo((fn.f(a + h) - fn.f(a - h)) / (2 * h), 6);
  });
});

describe('The remainder shrinks with degree inside the radius', () => {
  it('exp: the error at a nearby point falls monotonically with n', () => {
    const fn = FUNCS.exp, a = 0, x = 0.8; let prev = Infinity;
    for (let n = 0; n <= 10; n += 1) { const e = Math.abs(remainder(fn, a, n, x)); expect(e).toBeLessThan(prev + 1e-15); prev = e; }
    expect(prev).toBeLessThan(1e-6);
  });
  it('1/(1-x): diverges outside the radius of convergence', () => {
    const fn = FUNCS.geom, a = 0, x = 1.5; // |x - a| = 1.5 > R = 1
    expect(Math.abs(remainder(fn, a, 4, x))).toBeLessThan(Math.abs(remainder(fn, a, 12, x)));
  });
});

describe('The geometric series has its closed form', () => {
  it('P_n(x) about 0 equals (1 - x^(n+1)) / (1 - x)', () => {
    const fn = FUNCS.geom;
    for (const x of [-0.5, 0.3, 0.7]) for (const n of [2, 5, 9]) {
      expect(taylorValue(fn, 0, n, x)).toBeCloseTo((1 - Math.pow(x, n + 1)) / (1 - x), 10);
    }
  });
});

describe('The Lagrange bound holds', () => {
  it('the actual remainder never exceeds the bound', () => {
    const fn = FUNCS.sin, a = 0;
    for (const x of [0.5, 1.5, 2.5]) for (const n of [1, 3, 5, 7]) {
      expect(Math.abs(remainder(fn, a, n, x))).toBeLessThanOrEqual(lagrangeBound(fn, a, n, x) + 1e-9);
    }
  });
  it('radius of convergence: distance to the singularity', () => {
    expect(FUNCS.log1p.radius(0)).toBeCloseTo(1, 12);
    expect(FUNCS.geom.radius(0)).toBeCloseTo(1, 12);
    expect(FUNCS.log1p.radius(1)).toBeCloseTo(2, 12);
  });
});
