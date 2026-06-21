// Invariants for the Riemann sum: convergence to the exact integral, the known
// integrals, and the first- vs second-order convergence rates.

import { describe, it, expect } from 'vitest';
import { FUNCS, RULES, riemannSum, error, convergenceOrder } from './sim.js';

describe('Convergence to the exact integral', () => {
  for (const key of Object.keys(FUNCS)) {
    for (const rule of RULES) {
      it(`${key} / ${rule}: the sum approaches the exact integral`, () => {
        expect(error(FUNCS[key], 2000, rule)).toBeLessThan(1e-2);
      });
    }
  }
});

describe('Known exact integrals', () => {
  it('the midpoint rule with many cells matches the analytic value', () => {
    expect(riemannSum(FUNCS.quad, 5000, 'midpoint')).toBeCloseTo(8 / 3, 4);
    expect(riemannSum(FUNCS.sine, 5000, 'midpoint')).toBeCloseTo(2, 4);
    expect(riemannSum(FUNCS.arctan, 5000, 'midpoint')).toBeCloseTo(2 * Math.atan(2), 4);
  });
});

describe('Convergence order', () => {
  it('endpoint rules are first order, midpoint and trapezoid second order', () => {
    // exp has f(a) != f(b), so the endpoint rules show their genuine first-order
    // error (for sin on [0,pi] the endpoints cancel and they become second order).
    expect(convergenceOrder(FUNCS.exp, 20, 'left')).toBeCloseTo(1, 0);
    expect(convergenceOrder(FUNCS.exp, 20, 'right')).toBeCloseTo(1, 0);
    expect(convergenceOrder(FUNCS.exp, 20, 'midpoint')).toBeCloseTo(2, 0);
    expect(convergenceOrder(FUNCS.exp, 20, 'trapezoid')).toBeCloseTo(2, 0);
  });
  it('at a fixed n the midpoint error is far smaller than the left error', () => {
    const n = 40;
    expect(error(FUNCS.quad, n, 'midpoint')).toBeLessThan(error(FUNCS.quad, n, 'left') / 10);
  });
});
