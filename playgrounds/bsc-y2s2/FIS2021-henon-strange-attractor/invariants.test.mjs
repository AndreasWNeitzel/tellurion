import { describe, it, expect } from 'vitest';
import { henonStep, henonTrail, henonMaxLyapunov, DEFAULT_PARAMS } from './sim.js';

describe('henon-strange-attractor: classical invariants', () => {
  it('max-Lyapunov at (a=1.4, b=0.3) is in [0.35, 0.50]', () => {
    const lam = henonMaxLyapunov(0.1, 0.1, 8000, DEFAULT_PARAMS, 100, 1000);
    expect(lam).toBeGreaterThan(0.35);
    expect(lam).toBeLessThan(0.50);
  });

  it('trail stays inside the bounding box [-1.5, 1.5] x [-0.45, 0.45]', () => {
    const { xs, ys } = henonTrail(0.1, 0.1, 50_000, DEFAULT_PARAMS);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    // skip the first 200 transient points
    for (let i = 200; i < xs.length; i += 1) {
      if (xs[i] < minX) minX = xs[i];
      if (xs[i] > maxX) maxX = xs[i];
      if (ys[i] < minY) minY = ys[i];
      if (ys[i] > maxY) maxY = ys[i];
    }
    expect(minX).toBeGreaterThan(-1.5);
    expect(maxX).toBeLessThan(1.5);
    expect(minY).toBeGreaterThan(-0.45);
    expect(maxY).toBeLessThan(0.45);
  });
});

describe('henon-strange-attractor: limiting cases', () => {
  it('b = 0 reduces to the logistic-like 1D map x_{n+1} = 1 - a x_n^2', () => {
    const params = { a: 1.4, b: 0 };
    const { xs, ys } = henonTrail(0.1, 0, 20, params);
    for (let i = 0; i < ys.length; i += 1) expect(Math.abs(ys[i])).toBe(0);
    // 1D map asymptotically chaotic too
    expect(Math.abs(xs[19])).toBeLessThan(2);
  });

  it('a = 0, b = 0 collapses to the fixed point (1, 0)', () => {
    const params = { a: 0, b: 0 };
    let s = { x: 0.1, y: 0.1 };
    for (let i = 0; i < 10; i += 1) s = henonStep(s, params);
    expect(s.x).toBeCloseTo(1, 6);
    expect(s.y).toBeCloseTo(0, 6);
  });
});

describe('henon-strange-attractor: reproducibility', () => {
  it('two trails from the same IC are bit-identical', () => {
    const a = henonTrail(0.1, 0.1, 1000, DEFAULT_PARAMS);
    const b = henonTrail(0.1, 0.1, 1000, DEFAULT_PARAMS);
    for (let i = 0; i < a.xs.length; i += 1) {
      expect(a.xs[i]).toBe(b.xs[i]);
      expect(a.ys[i]).toBe(b.ys[i]);
    }
  });
});
