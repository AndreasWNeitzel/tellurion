// Lissajous-figures invariant tests.
// (a) For integer ratio a : b, the curve closes after period 2 pi / gcd(a, b).
// (b) Boundedness: |x|, |y| <= A, B.
// (c) 1:1 with delta = pi/2 is exactly a circle: x^2 + y^2 = 1.
// (d) 1:1 with delta = 0 is exactly the line y = x.
// (e) Sample arrays have correct length and span.

import { describe, it, expect } from 'vitest';
import { x, y, sampleCurve, period, PRESETS, A, B } from './sim.js';

describe('Lissajous: closure of integer-ratio curves', () => {
  it('1:2 closes at period 2 pi', () => {
    const { a, b, delta } = PRESETS['1:2'];
    const T = period(a, b);
    expect(T).toBeCloseTo(2 * Math.PI, 12);
    // x(0) = sin(delta), x(T) = sin(a T + delta)
    expect(Math.abs(x(0, a, delta) - x(T, a, delta))).toBeLessThan(1e-10);
    expect(Math.abs(y(0, b) - y(T, b))).toBeLessThan(1e-10);
  });
  it('2:3 closes at period 2 pi', () => {
    const { a, b, delta } = PRESETS['2:3'];
    const T = period(a, b);
    expect(T).toBeCloseTo(2 * Math.PI, 12);
    expect(Math.abs(x(0, a, delta) - x(T, a, delta))).toBeLessThan(1e-10);
    expect(Math.abs(y(0, b) - y(T, b))).toBeLessThan(1e-10);
  });
  it('3:5 closes at period 2 pi', () => {
    const { a, b, delta } = PRESETS['3:5'];
    const T = period(a, b);
    expect(T).toBeCloseTo(2 * Math.PI, 12);
    expect(Math.abs(x(0, a, delta) - x(T, a, delta))).toBeLessThan(1e-10);
    expect(Math.abs(y(0, b) - y(T, b))).toBeLessThan(1e-10);
  });
});

describe('Lissajous: bounded', () => {
  it('|x| <= A and |y| <= B', () => {
    const { xs, ys } = sampleCurve(3, 5, Math.PI / 2);
    for (let i = 0; i < xs.length; i += 1) {
      expect(Math.abs(xs[i])).toBeLessThanOrEqual(A + 1e-12);
      expect(Math.abs(ys[i])).toBeLessThanOrEqual(B + 1e-12);
    }
  });
});

describe('Lissajous: 1:1 phase = pi/2 is a circle', () => {
  it('x(t)^2 + y(t)^2 = 1 within 1e-12', () => {
    for (let i = 0; i < 100; i += 1) {
      const t = i * 0.07;
      const xi = x(t, 1, Math.PI / 2);
      const yi = y(t, 1);
      expect(Math.abs(xi * xi + yi * yi - 1)).toBeLessThan(1e-12);
    }
  });
});

describe('Lissajous: 1:1 phase = 0 is the line y = x', () => {
  it('x(t) = y(t) within 1e-12', () => {
    for (let i = 0; i < 100; i += 1) {
      const t = i * 0.07;
      expect(Math.abs(x(t, 1, 0) - y(t, 1))).toBeLessThan(1e-12);
    }
  });
});

describe('Lissajous: sample arrays length and span', () => {
  it('sampleCurve(2, 3, 0, 500) yields 500 points', () => {
    const s = sampleCurve(2, 3, 0, 500);
    expect(s.xs.length).toBe(500);
    expect(s.ys.length).toBe(500);
    expect(s.T).toBeCloseTo(2 * Math.PI, 12);
  });
});
