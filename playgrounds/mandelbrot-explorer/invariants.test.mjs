// Mandelbrot Set invariant tests. Deterministic; no RNG.

import { describe, it, expect } from 'vitest';
import {
  escapeIterations, escapeTime, DEFAULT_MAX_ITER,
  ZOOM_TARGETS, maxIterForWidth,
} from './sim.js';

describe('mandelbrot-explorer: membership invariants', () => {
  it('c = 0 stays bounded (orbit fixed at 0)', () => {
    expect(escapeIterations(0, 0)).toBe(DEFAULT_MAX_ITER);
  });

  it('c = -1 stays bounded (period-2 orbit 0 to -1 to 0)', () => {
    expect(escapeIterations(-1, 0)).toBe(DEFAULT_MAX_ITER);
  });

  it('c = -1.75 stays bounded (period-3 bulb on the real axis)', () => {
    expect(escapeIterations(-1.75, 0)).toBe(DEFAULT_MAX_ITER);
  });

  it('c = 1 escapes within 4 iterations', () => {
    expect(escapeIterations(1, 0)).toBeLessThan(5);
  });

  it('c = 1 + i escapes within 4 iterations', () => {
    expect(escapeIterations(1, 1)).toBeLessThan(5);
  });

  it('c with |c| > 2 escapes within 2 iterations', () => {
    expect(escapeIterations(3, 0)).toBeLessThan(2);
    expect(escapeIterations(0, 3)).toBeLessThan(2);
    expect(escapeIterations(-3, 1)).toBeLessThan(2);
  });
});

describe('mandelbrot-explorer: cardioid and bulb shortcut', () => {
  it('main cardioid points reach maxIter without iterating', () => {
    // c = -0.25 + 0.1 i sits inside the cardioid.
    expect(escapeIterations(-0.25, 0.1)).toBe(DEFAULT_MAX_ITER);
    // c = 0.2 + 0.1 i also inside (right-of-origin cardioid lobe).
    expect(escapeIterations(0.2, 0.1)).toBe(DEFAULT_MAX_ITER);
  });

  it('period-2 bulb points (centred at -1) reach maxIter', () => {
    // |c - (-1)| < 0.25 -> inside bulb. (-1.1, 0.05) qualifies.
    expect(escapeIterations(-1.1, 0.05)).toBe(DEFAULT_MAX_ITER);
  });
});

describe('mandelbrot-explorer: smooth escape time', () => {
  it('escapeTime returns mu close to iter+1 for fast escapes', () => {
    const r = escapeTime(2.5, 0);
    expect(r.iter).toBeLessThan(2);
    expect(r.mu).toBeGreaterThan(0);
    expect(r.mu).toBeLessThan(r.iter + 1.5);
  });

  it('escapeTime mu equals maxIter for set members', () => {
    const r = escapeTime(0, 0);
    expect(r.mu).toBe(DEFAULT_MAX_ITER);
  });
});

describe('mandelbrot-explorer: zoom targets and adaptive iter', () => {
  it('all preset zoom targets are inside or near the set boundary', () => {
    for (const [key, target] of Object.entries(ZOOM_TARGETS)) {
      const r = escapeTime(target.cx, target.cy, 2000);
      // either in the set (mu == maxIter) or with mu > 15 (boundary-adjacent)
      const ok = r.mu === 2000 || r.mu > 15;
      if (!ok) throw new Error(`${key} mu = ${r.mu}, iter = ${r.iter}`);
      expect(ok).toBe(true);
    }
  });

  it('maxIterForWidth scales sensibly with zoom depth', () => {
    expect(maxIterForWidth(3.5)).toBe(256);
    expect(maxIterForWidth(0.35)).toBeGreaterThan(420);
    expect(maxIterForWidth(3.5e-9)).toBeGreaterThanOrEqual(1500);
    // capped at 1500 to keep deep-zoom frames interactive
    expect(maxIterForWidth(3.5e-13)).toBeLessThanOrEqual(1500);
  });
});

describe('mandelbrot-explorer: reproducibility', () => {
  it('escape time is deterministic on identical inputs', () => {
    const a = escapeIterations(-0.7269, 0.1889);
    const b = escapeIterations(-0.7269, 0.1889);
    expect(a).toBe(b);
  });

  it('escapeTime returns the same mu twice', () => {
    const a = escapeTime(-0.745428, 0.113009, 800);
    const b = escapeTime(-0.745428, 0.113009, 800);
    expect(a.iter).toBe(b.iter);
    expect(a.mu).toBe(b.mu);
  });
});
