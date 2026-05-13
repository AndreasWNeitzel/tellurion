// Catenary invariants.
// (a) y(0, a) = 0 exactly.
// (b) y(x, a) = a cosh(x / a) - a within 1e-12.
// (c) Arc length: s(x, a) = a sinh(x / a).
// (d) Slope dy/dx = sinh(x / a).
// (e) Parabola limit: y(x, a) approaches x^2 / (2 a) as a -> infinity.
// (f) Tension increases linearly with height.

import { describe, it, expect } from 'vitest';
import { y, slope, arclen, tension, parabolaApprox, sampleCurve } from './sim.js';

describe('Catenary: y(0) = 0', () => {
  it('chain passes through origin', () => {
    for (const a of [0.5, 1.0, 2.0, 5.0]) {
      expect(y(0, a)).toBeCloseTo(0, 12);
    }
  });
});

describe('Catenary: cosh formula', () => {
  it('y(x, a) = a cosh(x/a) - a within 1e-12', () => {
    for (const a of [0.5, 1.5]) {
      for (let i = 0; i < 50; i += 1) {
        const x = -1 + 2 * i / 49;
        expect(y(x, a)).toBeCloseTo(a * Math.cosh(x / a) - a, 12);
      }
    }
  });
});

describe('Catenary: arc length', () => {
  it('s(x, a) = a sinh(x / a)', () => {
    for (const a of [0.5, 1.0]) {
      for (let i = 0; i < 20; i += 1) {
        const x = i * 0.05;
        expect(arclen(x, a)).toBeCloseTo(a * Math.sinh(x / a), 12);
      }
    }
  });
});

describe('Catenary: slope', () => {
  it('dy/dx = sinh(x / a) within 1e-6', () => {
    for (const a of [0.7, 2.0]) {
      const dx = 1e-7;
      for (let i = 0; i < 20; i += 1) {
        const x = -0.5 + i * 0.05;
        const numerical = (y(x + dx, a) - y(x - dx, a)) / (2 * dx);
        const analytic = slope(x, a);
        expect(Math.abs(numerical - analytic)).toBeLessThan(1e-6);
      }
    }
  });
});

describe('Catenary: parabola limit', () => {
  it('a large: y(x, a) approaches x^2 / (2 a) within 1 percent of |y|', () => {
    const a = 50;
    for (let i = 0; i < 20; i += 1) {
      const x = -1 + 2 * i / 19;
      const yc = y(x, a);
      const yp = parabolaApprox(x, a);
      if (Math.abs(yc) > 1e-6) {
        expect(Math.abs((yp - yc) / yc)).toBeLessThan(0.01);
      }
    }
  });
});

describe('Catenary: tension increases linearly with height', () => {
  it('T(y) - T(0) = mu g y within 1e-12', () => {
    const a = 0.7, mu = 1.0, g = 9.81;
    const T0 = tension(0, a, mu, g);
    for (let i = 0; i < 20; i += 1) {
      const x = -1 + 2 * i / 19;
      const T = tension(x, a, mu, g);
      const dy = y(x, a);
      expect(Math.abs(T - T0 - mu * g * dy)).toBeLessThan(1e-12);
    }
  });
});

describe('Catenary: sample curve correct', () => {
  it('sampleCurve has 201 points with y >= 0 everywhere', () => {
    const s = sampleCurve(0.5);
    expect(s.xs.length).toBe(201);
    for (let i = 0; i < s.ys.length; i += 1) expect(s.ys[i]).toBeGreaterThanOrEqual(0);
  });
});
