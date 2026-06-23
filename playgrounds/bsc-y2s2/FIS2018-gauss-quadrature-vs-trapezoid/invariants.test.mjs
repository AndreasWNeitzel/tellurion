// Gauss-Legendre / trapezoid invariants.
// (a) GL nodes are symmetric about 0.
// (b) GL weights sum to 2 (interval length).
// (c) GL is exact for polynomials up to degree 2n - 1.
// (d) GL converges faster than trapezoid on cos.
// (e) GL n = 16 matches sin(2) within 1e-12.
// (f) Trapezoid converges as h^2.

import { describe, it, expect } from 'vitest';
import { gaussLegendre, trapezoid, testFns, GL } from './sim.js';

describe('GL: nodes symmetric', () => {
  it('nodes(n) symmetric about zero', () => {
    for (const n of [2, 4, 6, 8, 10]) {
      const nodes = GL[n].nodes;
      for (let i = 0; i < n; i += 1) {
        expect(nodes[i]).toBeCloseTo(-nodes[n - 1 - i], 12);
      }
    }
  });
});

describe('GL: weights sum to 2', () => {
  it('sum of weights = 2 for all n in [1, 16]', () => {
    for (let n = 1; n <= 16; n += 1) {
      const ws = GL[n].weights;
      let s = 0;
      for (let i = 0; i < ws.length; i += 1) s += ws[i];
      expect(s).toBeCloseTo(2, 9);
    }
  });
});

describe('GL: exact for polynomials up to degree 2n-1', () => {
  it('n = 2: integrates 1, x, x^2, x^3 exactly', () => {
    expect(gaussLegendre(() => 1, 2)).toBeCloseTo(2, 9);
    expect(gaussLegendre((x) => x, 2)).toBeCloseTo(0, 9);
    expect(gaussLegendre((x) => x * x, 2)).toBeCloseTo(2 / 3, 9);
    expect(gaussLegendre((x) => x ** 3, 2)).toBeCloseTo(0, 9);
  });
});

describe('GL: converges faster than trapezoid on cos', () => {
  it('at n = 8: GL error << trapezoid error', () => {
    const { fn, exact } = testFns.cos;
    const eGL = Math.abs(gaussLegendre(fn, 8) - exact);
    const eTr = Math.abs(trapezoid(fn, 8) - exact);
    expect(eGL).toBeLessThan(eTr * 0.001);
  });
});

describe('GL: spectral convergence on cos', () => {
  it('GL n = 16 matches sin(2) within 1e-12', () => {
    const { fn, exact } = testFns.cos;
    expect(Math.abs(gaussLegendre(fn, 16) - exact)).toBeLessThan(1e-12);
  });
});

describe('Trapezoid: h^2 algebraic convergence on cos', () => {
  it('trapezoid error ratio (n=8 / n=16) in [3.5, 4.5]', () => {
    const { fn, exact } = testFns.cos;
    const e8  = Math.abs(trapezoid(fn, 8)  - exact);
    const e16 = Math.abs(trapezoid(fn, 16) - exact);
    const ratio = e8 / e16;
    expect(ratio).toBeGreaterThan(3.5);
    expect(ratio).toBeLessThan(4.5);
  });
});
